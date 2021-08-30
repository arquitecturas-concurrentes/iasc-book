# Guild wars (?)

*[GVL]: Global VM Lock
*[GIL]: Global Interpreter Lock
*[SMP]: Symmetric Multi-Processor
*[GGL]: Giant Guild Lock, no Good Game Lock

Como vimos en las clases anteriores, Ruby MRI posee "algunos problemas" en cuanto a como maneja el procesamiento en paralelo en multiples procesadores. Si bien vimos que la concurrencia es algo que perfectamente puede darse sin necesidad de contextos de ejecucion que se ejecuten al mismo tiempo[^1], vamos a ver en esta seccion, nuevos y existentes mecanismos para tratar de resolver este problema latente en MRI desde sus comienzos.

<img style="width: 200px;" src="~@/images/guilds/pisa_tower.jpeg" class='center'>
</br>

### Un poco de historia...

Ruby puede implementar mecanismos concurrentes pero paralelos debido al GVL a.k.a GIL (Global VM Lock or Giant VM Lock), que es un bloqueo de exclusión mutua, en suma, un mutex. Este bloqueo lo mantiene el subproceso del intérprete y lo usa para evitar compartir código que no es seguro para subprocesos con otros subprocesos. Todos los hilos de intérpretes tienen su propio GIL. Debido a este GIL, si un programa Ruby tiene multiples hilos, no pueden ejecutarse al mismo tiempo, porque GIL solo permitirá que se ejecute un subproceso al mismo tiempo. Antes de Ruby 1.9, solo había un hilo del sistema operativo para todos los hilos de sistema de MRI que podiamos crear mediante la libreria standard de Ruby[^2].

<img src="~@/images/guilds/xruby-gil-jvm.png" class='center iasc-image'>

Como vemos en la foto, después de Ruby 1.9, podemos tener varios subprocesos del sistema operativo, por lo que ahora podemos usar más de un núcleo de procesador. Todavía hay un inconveniente: seguiremos usando un hilo a la vez y nuevamente sin aprovechar la arquitectura multinúcleo. El manejador de hilos (scheduler), al planificar y ejecutar el hilo que pasaria a ejecutarse  libera GVL. Si ejecuta hilo intente bloquear la operación, este hilo debe liberar GVL y otro hilo puede continuar este flujo. Después de bloquear la operación, el hilo debe comprobar la interrupción (RUBY_VM_CHECK_INTS). 

::: warning
*Extra*: El mecanismo de como se adquiere y libera el GVL se puede ver [aqui](https://github.com/ruby/ruby/blob/a8714b83c40c8736b4ddafef08fa5f0091c9b101/thread_pthread.c#L314) y [aqui](https://github.com/ruby/ruby/blob/a8714b83c40c8736b4ddafef08fa5f0091c9b101/thread_pthread.c#L236) se puede ver la logica del timeslice donde se ejecuta el thread que pudo adquirir el GVL.
:::

Con lo cual *solo y solo un hilo* puede ejecutarse al mismo tiempo, aun si tenemos multiples hilos del sistema operativo. ESto vendria a ser muy similar a que en un momento x, el hilo posee la posta de la ejecucion en primer plano, y no existe al menos a nivel de hilo de usuario, otro que se este ejecutando en paralelo.

<img src="~@/images/guilds/in_rod_we_trust.png" class='center iasc-image'>
<p style="text-align: center; font-size: 13px;">La inerte barra de carbono representa el GVL siendo tomado por un hilo..</p>

Este tipo de mecanismos son algo visto no solo en MRI sino tambien en CPython[^3], y ambas maquinas virtuales sufren de los mismos problemas.

En Java puede definir múltiples subprocesos, la diferencia es que en la JVM, puede mapear cada hilo de la JVM a uno del sistema operativo, esto aprovechará la arquitectura multinúcleo. En este caso cuando usamos JRuby, la libreria de `threads` de Ruby, es en realidad un wrapper de los hilos de la JVM, por esta razon, vamos a poder tener exactamente el mismo codigo y vamos a poder tener soporte SMP.

### Status Quo: Workers

Una manera de poder aprovechar la ejecucion de multiples procesadores, es algo que vimos en Puma[^5], es que se pueda trabajar como si fuese un `'cluster'`, en donde el proceso principal inicializa la aplicacion, y luego se usa el syscall [`fork()`](https://man7.org/linux/man-pages/man2/fork.2.html) para crear 1 o más procesos hijos. Estos procesos hijos, en el caso de Puma por ejemplo, escuchan al mismo socket que el proceso padre, y este ultimo deja de escuchar al socket, para solo ser relegado para escuchar a seniales de UNIX y posiblemente para matar/iniciar los procesos hijos.

<img src="~@/images/guilds/puma-general-arch.png" class='center iasc-image'>

Este mecanismo, si bien es simple, puede dar la sensacion de que si bien empieza cada proceso hijo, con poca memoria, gradualmente ira creciendo hasta ser tan grande como el proceso padre. Incluso en grandes entornos de produccion, esto puede significar una gran cantidad de memoria, y crear un problema de falta de memoria si tenemos muchos *workers/procesos hijos*.

Sin embargo, los sistemas operativos modernos, tienen manejo de memoria virtual, que proveen de un mecanismo llamado *copy on write*[^4], que previene del escenario que describimos antes. La memoria virtual de un proceso, esta separado en bloques de 4k, llamadas paginas. Cuando un proceso padre, crea un proceso hijo; el hijo inicialmente comparte todas las paginas de memoria con el padre. Solo cuando el proceso hijo empieza a modificar una o varias de estas paginas, el kernel se encargara de copiar las paginas de memoria modificadas, y de reasignarlo al nuevo proceso.

<img src="~@/images/guilds/child-processes.svg" class='center iasc-image'>

El diagrama visto más arriba, muestra un poco como van cambiando, y copiandose las paginas a medida que pasa el tiempo. El mecanismo de como MRI aloca memoria puede verse muy bien explicado en[^6].

### La propuesta: Guilds

El origen de Ractor se remonta a 2016 cuando Koichi Sasada (diseñador de la máquina virtual Ruby y recolección de basura) presentó su propuesta sobre un nuevo modelo de concurrencia para Ruby. Antes de dicha propuesta, solo podiamos aprovechar multiples procesadores mediante subprocesos hijos.

En 2016, Koichi habló sobre los problemas de la programación de subprocesos múltiples en su presentación en Ruby Kaigi[^7], así como sobre algunas formas comunes de resolverlos. Junto con eso, también presentó su concepto de `Guilds` por primera vez. Antes de pasar a Ractors, tomemos un momento para comprender los aspectos básicos de Ractors: `Guilds`.

#### Que es un Guild?

::: warning
Las imagenes a continuación fueron tomadas de la presentación de Koichi Sasada[^7]
:::

Un Guild, fue propuesto, como una una nueva abstracción de concurrencia para Ruby. Donde cada uno de estos `Guilds`, tendria uno o más hilos, y cada uno de estos, a su vez, albergaría una o más "fibers"/corutinas. 

<img src="~@/images/guilds/guilds_0.png" class='center iasc-image'>

Los hijos de dos `Guilds`, podrian ejecutarse en paralelo, pero los hijos que estan enmarcados dentro de un mismo `Guild` no. Esto se garantizaría a través de un nuevo lock llamado GGL, que solo permite ejecutar en primer plano a un hilo a la vez.

<img src="~@/images/guilds/guilds_1.png" class='center iasc-image'>

Además, todos los Guilds tendrían su propio conjunto de objetos mutables, y un `Guild` no podría modificar los objetos de otro `Guild`. Esto se propuso para evitar problemas de inconsistencia de datos debido al acceso concurrente.

<img src="~@/images/guilds/guilds_2.png" class='center iasc-image'>

Sin embargo, los `Guilds` aún podrían usar la interfaz `Guild::Channel` para facilitar la copia o el movimiento de objetos entre ellos. El metodo `transfer(object)` se propuso para permitir enviar una copia profunda del objeto al `Guild` objetivo, y `transfer_membership(object)` se propuso para permitir mover un objeto de un `Guild` a otro por completo.

<img src="~@/images/guilds/guilds_3.png" class='center iasc-image'>

<img src="~@/images/guilds/guilds_4.png" class='center iasc-image'>

Pero todo esto fue solo para objetos mutables, ya que los objetos inmutables no representan un riesgo de inconsistencia de datos. Esto es así porque una vez que se asigna un valor a los objetos inmutables, este no cambia durante la ejecución del programa, por lo que cualquier `Guild` que intente acceder a los datos de un objeto inmutable siempre recibirá el mismo valor consistente. Los objetos inmutables se podrían compartir en todos los `Guilds` para operaciones de lectura.

Los objetos inmutables en Ruby consisten en:

- Integers, `true`, `false`, `nil` (a.k.a. [SPECIAL_CONST_P()](https://github.com/ruby/ruby/blob/d92f09a5eea009fa28cd046e9d0eb698e3d94c5c/include/ruby/internal/special_consts.h#L179))
- Todos los simbolos
- Strings u objetos 'frizados'. Ej: `s = "str".freeze`, donde `s` es inmutable.
- Objetos numericos: Float, Complex, Rational, big integers ([T_BIGNUM in internal](https://github.com/ruby/ruby/blob/62bc4a9420fa5786d49391a713bd38b09b8db0ff/include/ruby/internal/value_type.h#L123))
- objetos como clases o modulos  (T_CLASS, T_MODULE and T_ICLASS en internal).
- Ractor y otros objetos especiales usados para sincronización

<img src="~@/images/guilds/guilds_5.png" class='center iasc-image'>

##### Uso propuesto de los Guilds

Koichi habla en su presentación del uso de este nuevo tipo de abstracción[^7], y que separa en distintos casos de uso

- Caso de Uso 1: Maestro - Worker

La idea de este caso de uso es que exista un `Guild` maestro, que inicialice la ejecucion, y despues existan, uno o mas `Guilds` que realizaran el procesamiento (workers). Este modelo se basa en delegación de tareas repetitivas o conocidas por los `Guilds` workers, y el maestro, solo se encargara de enviar por medio de un channel, el dato de entrada para ser procesado por un worker y tratar de esperar por una respuesta a continuación. El código de ejemplo fue el calculo de fibonacci, que se muesta a continuación:

```ruby
def fib(n) ... end

g_fib = Guild.new(script: %q{
  ch = Guild.default_channel
  while n, return_ch = ch.receive
    return_ch.transfer fib(n)
  end
})

ch = Guild::Channel.new

g_fib.transfer([3, ch])

puts ch.receive
```

En el ejemplo, solo se realiza el calculo de un solo valor, aunque puede llamarse multiples veces a `g_fib`, para que se creen nuevos `guilds`, y puedan procesar en paralelo.

<img src="~@/images/guilds/guilds_6.png" class='center iasc-image'>


- Caso de Uso 2: Pipeline

El segundo caso es el de un pipeline, en donde una serie de procesos, se separan en varios pasos, y en cada uno de estos segmentos, se trata en un `Guild` distinto. Una vez que termina el procesamiento de uno, el dato resultante se transfiere al siguiente `Guild`.

```ruby
result_ch = Guild::Channel.new

g_pipe3 = Guild.new(script: %q{
  while obj = Guild.default_channel.receive
    obj = modify_obj3(obj)
    Guild.argv[0].transfer_membership(obj)
  end
}, argv: [result_ch])

g_pipe2 = Guild.new(script: %q{
  while obj = Guild.default_channel.receive
    obj = modify_obj2(obj)
    Guild.argv[0].transfer_membership(obj)
  end
}, argv: [g_pipe3])

g_pipe1 = Guild.new(script: %q{
   while obj = Guild.default_channel.receive
   obj = modify_obj1(obj)
   Guild.argv[0].transfer_membership(obj)
   end
}, argv: [g_pipe2])

obj = SomeClass.new

g_pipe1.transfer_membership(obj)

obj = result_ch.receive
```

Aqui se muestra como la arquitectura se veria conceptualmente:

<img src="~@/images/guilds/guilds_7.png" class='center iasc-image'>

- Caso de Uso 3: Datos sensibles. Ej cuentas bancarias

Este es un caso de uso tradicional, donde tenemos datos que pueden mutar y que son sensibles. En este caso, es de alguna manera similar al caso 1, donde hay un `Guild` "maestro", que es el que posee los datos sensibles, y el estado que puede mutar. De esta manera permite aislar el estado y que solo el cambio del estado se genere con condiciones que sean controlables en un solo lugar. Tambien permite que se puedan implementar sobre el Guild "maestro", mecanismos de seguridad y de transaccionabilidad, donde se puede loggear todos los movimientos y en caso de que se tenga que volver para atras se puede hacer, solo en un solo lugar.

```ruby
g_bank = Guild.new(script: %q{
   while account_from, account_to, amount,
     ch = Guild.default_channel.receive
     if (Bank[account_from].balance < amount)
       ch.transfer :NOPE
     else
       Bank[account_to].balance += amount
       Bank[account_from].balance -= amount
       ch.transfer :YEP
     end
  end
})
…
```

Si se observa el diagrama conceptual para esta arquitectura, se dará cuenta de que es lo mismo que el concepto que el `caso 1`, pero el único cambio clave es que los datos, recursos, etc., pertenecen únicamente al `guild` maestro.

<img src="~@/images/guilds/guilds_8.png" class='center iasc-image'>

#### Ractors, la implementación de Guilds

Ractors, fue lanzado como experimental en [Ruby 3.0.0](https://www.ruby-lang.org/en/news/2020/12/25/ruby-3-0-0-released/), y es la implementación, por el momento mas estable de la idea conceptual de Guilds.

<img src="~@/images/guilds/homer-grill.gif" class='center iasc-image'>

La idea por atras es la misma, un `ractor` tiene uno o más hilos, y cada uno de estos, a su vez, alberga una o más "fibers"/corutinas. y dos `ractors`, pueden ejecutarse potencialmente en paralelo, siempre y cuando el procesamiento que haya que realizar en estos sea bastante intensivo. 

La idea de aislamiento de variables o datos mutables es la misma que la planteada en los `Guilds`. Un `ractor` no puede acceder a los datos de otro, a menos que se transfiera o copie el mismo, pero esto solo aplica a los datos mutables. Con respecto a las variales/datos inmutables, estos se pueden acceder sin problemas, entre los `ractors` que existan en el sistema.

La mayor diferencia viene, en cuanto a la comunicación entre los `ractors`. Estos a diferencia de los `Guilds`, se comunican por medio de simples pasos de mensajes, en vez de `channels`. La idea final es que dicho modelo sea similar al de actores. Pero lo es realmente? Esto lo veremos despues. Veamos las 'ventajas'.

##### Ventajas??

Con respecto a las ventajas, las mismas son obvias en cuanto a lo que apuntan a resolver. Permitir la ejecución, en multiples procesadores/cores, permite de alguna manera una mejorar la performance, reduciendo el tiempo promedio de ejecución de tareas que lo son, y que no generan ningun tipo de relación directa. Veamos el ejemplo mostrado en el realease de Ruby 3.0.0, donde se ejecuta el algoritmo `tak`[^8] [^9] secuencialmente y usando `ractors` 4 veces.

```ruby
def tarai(x, y, z) =
  x <= y ? y : tarai(tarai(x-1, y, z),
                     tarai(y-1, z, x),
                     tarai(z-1, x, y))
require 'benchmark'
Benchmark.bm do |x|
  # sequential version
  x.report('seq'){ 4.times{ tarai(14, 7, 0) } }

  # parallel version
  x.report('par'){
    4.times.map do
      Ractor.new { tarai(14, 7, 0) }
    end.each(&:take)
  }
end
```

Los resultados muestran las ventajas.. 

```
Benchmark result:
          user     system      total        real
seq  64.560736   0.001101  64.561837 ( 64.562194)
par  66.422010   0.015999  66.438009 ( 16.685797)
```

El codigo esta disponible tambien [aqui](https://github.com/bossiernesto/tarai)

Esta ventaja es facil de ver, aunque lo mas interesante en realidad, es la creación de una abstracción que permita que pueda convivir de alguna manera código que soporte SMP y parte que no, sin tener que recurrir a eliminar definitivamente el GVL.

##### Problemas latentes

Si bien se habla que en los Ractors son thread-safe dentro de su contexto, gracias (o no..) al GGL; en realidad no son completamente `thread-safe`, ya que la interfaz que poseen todavia puede generar casos de deadlock o livelock incluso, si es que no se tiene cuidado.

Esta estructura, tiene que ser siempre usada de una manera correcta (tanto como el resto), ya que un uso poco cuidadoso, usando modulos/clases entre varios Ractors[^10], puede intrducir race conditions. Tambien otra cosa a tener en cuenta, es que el envio de mensajes por el momento es siempre bloqueante, por naturaleza del envio de mensajes los mismos son siempre bvloqueantes (send, yield, take, etc). Si estos se usan incorrectamente pueden resultar en `dead-locks` o `live-locks` como se menciono antes. 

Por el momento, esta implementacion es experimental, por lo que pueden existir incluso bugs, tanto en el ciclo de vida, como en el manejo interno de estos en memoria (por ej. a nivel del GC de MRI aka gc.c).

#### Uso actual de Ractors

::: warning
Esta sección puede cambiar a lo largo del tiempo, ya que el código actual de Ractors es experimental y puede deprecarse rapidamente. Puede verse mas en la doc oficial de [ractors.md](https://docs.ruby-lang.org/en/3.0.0/doc/ractor_md.html)
:::

- `Ractor.new{expr}` crea un nuevo Ractor y `expr` se ejecuta en paralelo en otro procesador.

- El intérprete invoca con el primer Ractor (llamado Ractor principal).

- Si el Ractor principal finaliza, todos los Ractores reciben una solicitud de finalización como hilos (si el hilo principal (el primer hilo invocado), el intérprete de Ruby envía todos los hilos en ejecución para finalizar la ejecución).

- Cada Ractor tiene 1 o más hilos.

- Los subprocesos en un Ractor comparten un bloqueo global en todo el Ractor, similar al GIL (GVL en terminología de MRI), por lo que no pueden ejecutarse en paralelo (sin liberar GVL explícitamente en el nivel C). Los hilos en diferentes ractores se ejecutan en paralelo.

- La sobrecarga de crear un Ractor es similar a la sobrecarga de la creación de un hilo usuario y el hilo de OS asociado.

##### Paso de mensajes

- Paso de mensaje de tipo push: `Ractor#send(obj`) y `Ractor.receive()`.
  - El ractor remitente pasa el obj al ractor r mediante `r.send(obj)` y el ractor receptor recibe el mensaje con Ractor.receive.
  - El remitente conoce el Ractor de destino r y el receptor no conoce al remitente (acepte todos los mensajes de cualquier ractor).
  - El receptor tiene una cola infinita y el remitente pone en cola el mensaje. El remitente no bloquea para poner el mensaje en esta cola.
  - Este tipo de intercambio de mensajes se emplea en muchos otros lenguajes basados ​​en actores.

- Comunicación de tipo pull: `Ractor.yield(obj)` y `Ractor#take()`.
  - El emisor ractor declara ceder el obj por `Ractor.yield(obj)` y el receptor Ractor lo toma con r.take.
  - El remitente no conoce un Ractor de destino y el receptor conoce el Ractor r del remitente.
  - El remitente o el receptor se bloquearán si no hay otro lado.

##### Ciclo de Vida

Puede verse un resumen del ciclo de vida de un ractor en el siguiente [diagrama](https://github.com/ruby/ruby/blob/83a744dd8c0d6e769258b734b9f6861a22eeb554/ractor.c#L1449):

```
 created
   | ready to run
 ====================== inserted to vm->ractor
   v
 blocking <---+ all threads are blocking
   |          |
   v          |
 running -----+
   | all threads are terminated.
 ====================== removed from vm->ractor
   v
 terminated

 status is protected by VM lock (global state)
```

El ciclo de vida empieza con `Ractor.new` donde una vez que se registra el mismo en `vm->ractor`, esto sucede una vez que puede tomarse control del GVL, para proceder a la creación e inicialización de memoria del contexto. Una vez que el ractor esta creado, siempre tendra como minimo un hilo, y en caso de que el mismo pueda ejecutarse, pasara a estado `running`. En caso de que se envie un mensaje o se espere alguna acción se pasara a tener otro hilo planificado en primer plano del ractor, en caso de que todos los hilos se bloqueen, el estado pasa a `bloqueado`. Cuando todos los hilos han finalizado, el ractor pasa a `terminated`. 

Todos los cambios de estado implican un cambio del estado del ractor, y el mismo esta protegido por el GVL de la VM.


[^1]: [IASC UTN FRBA. (2020) .Concurrencia y Paralelismo](https://arquitecturas-concurrentes.github.io/iasc-book/concurrencia_paralelismo)
[^2]: [Ruby Doc. Retrieved 30 August 2021. Thread standard library](https://ruby-doc.org/core-3.0.2/Thread.html)
[^3]: [Python Moin. Retrieved 30 November 2015. GlobalInterpreterLock](https://wiki.python.org/moin/GlobalInterpreterLock)
[^4]: [Javier, Francisco & Guttman, Joshua. (1995). Copy on Write.](http://citeseerx.ist.psu.edu/viewdoc/download;jsessionid=C97A7B66D788B7E4F6D6BF5FDD8EC451?doi=10.1.1.33.3144&rep=rep1&type=pdf)
[^5]: [Puma Doc. Architecture Overview](https://puma.io/puma/file.architecture.html)
[^6]: [Brandur. (2017). The Limits of Copy-on-write: How Ruby Allocates Memory](https://brandur.org/ruby-memory)
[^7]: [Sasada, Koichi. (2016). A proposal of new concurrency model for Ruby 3 (RubyKaigi2016)](http://www.atdot.net/~ko1/activities/2016_rubykaigi.pdf)
[^8]: [Vardi, I. The Running Time of TAK. Ch. 9 in Computational Recreations in Mathematica. Redwood City, CA: Addison-Wesley, pp. 179-199, 1991.](https://www.amazon.com/exec/obidos/ISBN%3D0685479412/ericstreasuretroA/)
[^9]: [Testing the Tak. Acorn User. pp. 197, 199.](https://archive.org/details/AcornUser052-Nov86/page/n198/mode/1up)
[^10]: [Ruby Lang. (2021). Ractor documentation. Thread-safety.](https://docs.ruby-lang.org/en/3.0.0/doc/ractor_md.html#label-Thread-safety)