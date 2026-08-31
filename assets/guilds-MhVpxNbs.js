const e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>Como vimos en las clases anteriores, Ruby MRI posee "algunos problemas" en cuanto a como maneja el procesamiento en paralelo en múltiples procesadores. Si bien vimos que la concurrencia es algo que perfectamente puede darse sin necesidad de contextos de ejecución que se ejecuten al mismo tiempo<sup class="footnote" id="_footnote_1">[<a id="_footnoteref_1" class="footnote" href="#_footnotedef_1" title="View footnote.">1</a>]</sup>, vamos a ver en esta sección, nuevos y existentes mecanismos para tratar de resolver este problema latente en MRI desde sus comienzos.</p>
</div>
<div class="paragraph center iasc-image">
<p><span class="image"><img src="/iasc-book//img/guilds/pisa_tower.jpeg" alt="pisa tower"></span></p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_un_poco_de_historia"><a class="anchor" href="#_un_poco_de_historia"></a>Un poco de historia&#8230;&#8203;</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Ruby puede implementar mecanismos concurrentes pero no paralelos debido al GVL a.k.a GIL (Global VM Lock o Giant VM Lock), que es un bloqueo de exclusión mutua, en suma, un mutex. Este bloqueo lo mantiene el subproceso del intérprete y lo usa para evitar compartir código que no es seguro para subprocesos con otros subprocesos. Todos los hilos de intérpretes tienen su propio GIL. Debido a dicho GIL, si un programa Ruby tiene múltiples hilos, no pueden ejecutarse al mismo tiempo, porque GIL solo permitirá que se ejecute un subproceso al mismo tiempo. Antes de Ruby 1.9, solo había un hilo del sistema operativo para todos los hilos de sistema de MRI que podemos crear mediante la librería standard de Ruby<sup class="footnote" id="_footnote_2">[<a id="_footnoteref_2" class="footnote" href="#_footnotedef_2" title="View footnote.">2</a>]</sup>.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/xruby-gil-jvm.png" alt="xruby gil jvm">
</div>
</div>
<div class="dlist">
<dl>
<dt class="hdlist1">:</dt>
<dd>
<p>warning
<em>Extra</em>: El mecanismo de como se adquiere y libera el GVL se puede ver <a href="https://github.com/ruby/ruby/blob/a8714b83c40c8736b4ddafef08fa5f0091c9b101/thread_pthread.c#L314">aqui</a> y <a href="https://github.com/ruby/ruby/blob/a8714b83c40c8736b4ddafef08fa5f0091c9b101/thread_pthread.c#L236">aqui</a> se puede ver la lógica del timeslice donde se ejecuta el thread que pudo adquirir el GVL.</p>
<div class="dlist">
<dl>
<dt class="hdlist1">:</dt>
<dd>
<p>Como vemos en la foto, después de Ruby 1.9, podemos tener varios hilos del sistema operativo y estos se relacionan 1:1 contra nuestros hilos de usuario, pero debido al GVL, como se menciono antes, <em>solo y solo un hilo</em>, de todos los hilos del sistema operativo creados pueden ejecutarse al mismo tiempo, descartando la posibilidad de soporte SMP.</p>
</dd>
</dl>
</div>
</dd>
</dl>
</div>
<div class="imageblock center iasc-image center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/in_rod_we_trust.png" alt="in rod we trust">
</div>
</div>
<div class="paragraph">
<p>La inerte barra de carbono representa el GVL siendo tomado por un hilo..</p>
</div>
<div class="paragraph">
<p>Este tipo de mecanismos son algo visto no solo en MRI sino también en CPython<sup class="footnote" id="_footnote_3">[<a id="_footnoteref_3" class="footnote" href="#_footnotedef_3" title="View footnote.">3</a>]</sup>, y ambas máquinas virtuales sufren de los mismos problemas.</p>
</div>
<div class="paragraph">
<p>En Java también se puede definir múltiples subprocesos,pero la diferencia es que en la JVM,se puede mapear cada hilo de la JVM a uno del sistema operativo. Esto permite aprovechar la arquitectura multinúcleo. En este caso cuando usamos JRuby, la librería de <code>threads</code> de Ruby, es en realidad un wrapper de los hilos de la JVM, por esta razón, vamos a poder tener exactamente el mismo código y vamos a poder tener soporte SMP.</p>
</div>
<div class="sect2">
<h3 id="_status_quo_workers"><a class="anchor" href="#_status_quo_workers"></a>Status Quo: Workers</h3>
<div class="paragraph">
<p>Una manera de poder aprovechar la ejecución de múltiples procesadores, es algo que vimos en Puma<sup class="footnote" id="_footnote_5">[<a id="_footnoteref_4" class="footnote" href="#_footnotedef_4" title="View footnote.">4</a>]</sup>, es que se pueda trabajar como si fuese un <code>'cluster'</code>, en donde el proceso principal inicializa la aplicación, y luego se usa el syscall <a href="https://man7.org/linux/man-pages/man2/fork.2.html"><code>fork()</code></a> para crear 1 o más procesos hijos. Estos procesos hijos, en el caso de Puma por ejemplo, escuchan al mismo socket que el proceso padre, y este último deja de escuchar al socket, para solo ser relegado para escuchar a señales de UNIX y posiblemente para matar/iniciar los procesos hijos.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/puma-general-arch.png" alt="puma general arch">
</div>
</div>
<div class="paragraph">
<p>Este mecanismo, si bien es simple, puede dar la sensación de que si bien empieza cada proceso hijo, con poca memoria, gradualmente ira creciendo hasta ser tan grande como el proceso padre. Incluso en grandes entornos de producción, esto puede significar una gran cantidad de memoria, y crear un problema de falta de memoria si tenemos muchos <em>workers/procesos hijos</em>.</p>
</div>
<div class="paragraph">
<p>Sin embargo, los sistemas operativos modernos, tienen manejo de memoria virtual, que proveen de un mecanismo llamado _copy on write_<sup class="footnote" id="_footnote_4">[<a id="_footnoteref_5" class="footnote" href="#_footnotedef_5" title="View footnote.">5</a>]</sup>, que previene del escenario que describimos antes. La memoria virtual de un proceso, esta separado en bloques de 4k, llamadas paginas. Cuando un proceso padre, crea un proceso hijo; el hijo inicialmente comparte todas las paginas de memoria con el padre. Solo cuando el proceso hijo empieza a modificar una o varias de estas paginas, el kernel se encargara de copiar las paginas de memoria modificadas, y de reasignarlo al nuevo proceso.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/child-processes.svg" alt="child processes">
</div>
</div>
<div class="paragraph">
<p>El diagrama visto más arriba, muestra un poco como van cambiando, y copiandose las paginas a medida que pasa el tiempo. El mecanismo de como MRI aloca memoria puede verse muy bien explicado en<sup class="footnote" id="_footnote_6">[<a id="_footnoteref_6" class="footnote" href="#_footnotedef_6" title="View footnote.">6</a>]</sup>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_la_propuesta_guilds"><a class="anchor" href="#_la_propuesta_guilds"></a>La propuesta: Guilds</h3>
<div class="paragraph">
<p>Si bien tener múltiples procesos hijos permite de alguna manera saltear y poder aprovechar más procesadores, existen varias desventajas por lo que no es a veces una solución óptima.</p>
</div>
<div class="paragraph">
<p>Una de ellas es que tengamos que realizar un offloading que no tengo demasiado estado, y por consiguiente, tengamos contextos de ejecución algo "pesados", y que consume más memoria de lo que realmente necesita o se justifica. En caso de que tengamos que trabajar con algún tipo de hardware que no posee tantos recursos, por ejemplo hardware embebido, tal vez necesitemos hacer un mejor uso de la memoria existente, con lo cual tener múltiples procesos puede llegar a ser muy costoso. Otra razón es que el uso de un <code>fork()</code>, implica que hay que recurrir a una solución, que esta por afuera en parte de las abstracciones que maneja o soporta MRI.</p>
</div>
<div class="paragraph">
<p>Estas razones, hicieron que en parte se busque por una solución parcial o definitiva, sin tener que recurrir a algo tan extremo, como el de eliminar por completo el GVL, debido a que se necesiten realizar cambios muchos más drásticos, a nivel de manejo de memoria y GC.</p>
</div>
<div class="paragraph">
<p>El origen de Ractor se remonta a 2016 cuando Koichi Sasada (diseñador de la máquina virtual Ruby y recolección de basura) presentó su propuesta sobre un nuevo modelo de concurrencia para Ruby. Antes de dicha propuesta, solo podíamos aprovechar múltiples procesadores mediante subprocesos hijos.</p>
</div>
<div class="paragraph">
<p>En 2016, Koichi habló sobre los problemas de la programación de subprocesos múltiples en su presentación en Ruby Kaigi<sup class="footnote" id="_footnote_7">[<a id="_footnoteref_7" class="footnote" href="#_footnotedef_7" title="View footnote.">7</a>]</sup>, así como sobre algunas formas comunes de resolverlos. Junto con eso, también presentó su concepto de <code>Guilds</code> por primera vez. Antes de pasar a Ractors, tomemos un momento para comprender los aspectos básicos de Ractors: <code>Guilds</code>.</p>
</div>
<div class="sect3">
<h4 id="_que_es_un_guild"><a class="anchor" href="#_que_es_un_guild"></a>Que es un Guild?</h4>
<div class="dlist">
<dl>
<dt class="hdlist1">:</dt>
<dd>
<p>warning
Las imágenes a continuación fueron tomadas de la presentación de Koichi Sasada<sup class="footnoteref">[<a class="footnote" href="#_footnotedef_7" title="View footnote.">7</a>]</sup></p>
<div class="dlist">
<dl>
<dt class="hdlist1">:</dt>
<dd>
<p>Un Guild, fue propuesto, como una una nueva abstracción de concurrencia para Ruby. Donde cada uno de estos <code>Guilds</code>, tendría uno o más hilos, y cada uno de estos, a su vez, albergaría una o más "fibers"/corutinas.</p>
</dd>
</dl>
</div>
</dd>
</dl>
</div>
<div class="imageblock center iasc-image center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_0.png" alt="guilds 0">
</div>
</div>
<div class="paragraph">
<p>Los hijos de dos <code>Guilds</code>, podrían ejecutarse en paralelo, pero los hijos que estan enmarcados dentro de un mismo <code>Guild</code> no. Esto se garantizaría a través de un nuevo lock llamado GGL, que solo permite ejecutar en primer plano a un hilo a la vez.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_1.png" alt="guilds 1">
</div>
</div>
<div class="paragraph">
<p>Además, todos los Guilds tendrían su propio conjunto de objetos mutables, y un <code>Guild</code> no podría modificar los objetos de otro <code>Guild</code>. Esto se propuso para evitar problemas de inconsistencia de datos debido al acceso concurrente.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_2.png" alt="guilds 2">
</div>
</div>
<div class="paragraph">
<p>Sin embargo, los <code>Guilds</code> aún podrían usar la interfaz <code>Guild::Channel</code> para facilitar la copia o el movimiento de objetos entre ellos. El método <code>transfer(object)</code> se propuso para permitir enviar una copia profunda del objeto al <code>Guild</code> objetivo, y <code>transfer_membership(object)</code> se propuso para permitir mover un objeto de un <code>Guild</code> a otro por completo.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_3.png" alt="guilds 3">
</div>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_4.png" alt="guilds 4">
</div>
</div>
<div class="paragraph">
<p>Pero todo esto fue solo para objetos mutables, ya que los objetos inmutables no representan un riesgo de inconsistencia de datos. Esto es así porque una vez que se asigna un valor a los objetos inmutables, este no cambia durante la ejecución del programa, por lo que cualquier <code>Guild</code> que intente acceder a los datos de un objeto inmutable siempre recibirá el mismo valor consistente. Los objetos inmutables se podrían compartir en todos los <code>Guilds</code> para operaciones de lectura.</p>
</div>
<div class="paragraph">
<p>Los objetos inmutables en Ruby consisten en:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Integers, <code>true</code>, <code>false</code>, <code>nil</code> (a.k.a. <a href="https://github.com/ruby/ruby/blob/d92f09a5eea009fa28cd046e9d0eb698e3d94c5c/include/ruby/internal/special_consts.h#L179">SPECIAL_CONST_P()</a>)</p>
</li>
<li>
<p>Todos los símbolos</p>
</li>
<li>
<p>Strings u objetos 'frizados'. Ej: <code>s = "str".freeze</code>, donde <code>s</code> es inmutable.</p>
</li>
<li>
<p>Objetos numericos: Float, Complex, Rational, big integers (<a href="https://github.com/ruby/ruby/blob/62bc4a9420fa5786d49391a713bd38b09b8db0ff/include/ruby/internal/value_type.h#L123">T_BIGNUM in internal</a>)</p>
</li>
<li>
<p>objetos como clases o modulos  (T_CLASS, T_MODULE and T_ICLASS en internal).</p>
</li>
<li>
<p>Ractor y otros objetos especiales usados para sincronización</p>
</li>
</ul>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_5.png" alt="guilds 5">
</div>
</div>
<div class="sect4">
<h5 id="_uso_propuesto_de_los_guilds"><a class="anchor" href="#_uso_propuesto_de_los_guilds"></a>Uso propuesto de los Guilds</h5>
<div class="paragraph">
<p>Koichi habla en su presentación del uso de este nuevo tipo de abstracción<sup class="footnoteref">[<a class="footnote" href="#_footnotedef_7" title="View footnote.">7</a>]</sup>, y que separa en distintos casos de uso</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Caso de Uso 1: Maestro - Worker</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La idea de este caso de uso es que exista un <code>Guild</code> maestro, que inicialice la ejecución, y después existan, uno o más <code>Guilds</code> que realizaran el procesamiento (workers). Este modelo se basa en delegación de tareas repetitivas o conocidas por los <code>Guilds</code> workers, y el maestro, solo se encargará de enviar por medio de un channel, el dato de entrada para ser procesado por un worker y tratar de esperar por una respuesta a continuación. El código de ejemplo fue el cálculo de fibonacci, que se muestra a continuación:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">def fib(n) ... end

g_fib = Guild.new(script: %q{
  ch = Guild.default_channel
  while n, return_ch = ch.receive
    return_ch.transfer fib(n)
  end
})

ch = Guild::Channel.new

g_fib.transfer([3, ch])

puts ch.receive</code></pre>
</div>
</div>
<div class="paragraph">
<p>En el ejemplo, solo se realiza el calculo de un solo valor, aunque puede llamarse múltiples veces a <code>g_fib</code>, para que se creen nuevos <code>guilds</code>, y puedan procesar en paralelo.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_6.png" alt="guilds 6">
</div>
</div>
<div class="ulist">
<ul>
<li>
<p>Caso de Uso 2: Pipeline</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>El segundo caso es el de un pipeline, en donde una serie de procesos, se separan en varios pasos, y en cada uno de estos segmentos, se trata en un <code>Guild</code> distinto. Una vez que termina el procesamiento de uno, el dato resultante se transfiere al siguiente <code>Guild</code>.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">result_ch = Guild::Channel.new

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

obj = result_ch.receive</code></pre>
</div>
</div>
<div class="paragraph">
<p>Aqui se muestra como la arquitectura se veria conceptualmente:</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_7.png" alt="guilds 7">
</div>
</div>
<div class="ulist">
<ul>
<li>
<p>Caso de Uso 3: Datos sensibles. Ej cuentas bancarias</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Este es un caso de uso tradicional, donde tenemos datos que pueden mutar y que son sensibles. En este caso, es de alguna manera similar al caso 1, donde hay un <code>Guild</code> "maestro", que es el que posee los datos sensibles, y el estado que puede mutar. De esta manera permite aislar el estado y que solo el cambio del estado se genere con condiciones que sean controlables en un solo lugar. También permite que se puedan implementar sobre el Guild "maestro", mecanismos de seguridad y de transaccionalidad, donde se puede loggear todos los movimientos y en caso de que se tenga que volver para atrás se puede hacer, solo en un solo lugar.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">g_bank = Guild.new(script: %q{
   while account_from, account_to, amount,
     ch = Guild.default_channel.receive
     if (Bank[account_from].balance &lt; amount)
       ch.transfer :NOPE
     else
       Bank[account_to].balance += amount
       Bank[account_from].balance -= amount
       ch.transfer :YEP
     end
  end
})
…</code></pre>
</div>
</div>
<div class="paragraph">
<p>Si se observa el diagrama conceptual para esta arquitectura, se dará cuenta de que es lo mismo que el concepto que el <code>caso 1</code>, pero el único cambio clave es que los datos, recursos, etc., pertenecen únicamente al <code>guild</code> maestro.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/guilds_8.png" alt="guilds 8">
</div>
</div>
</div>
</div>
<div class="sect3">
<h4 id="_ractors_la_implementación_de_guilds"><a class="anchor" href="#_ractors_la_implementación_de_guilds"></a>Ractors, la implementación de Guilds</h4>
<div class="paragraph">
<p>Ractors, fue lanzado como experimental en <a href="https://www.ruby-lang.org/en/news/2020/12/25/ruby-3-0-0-released/">Ruby 3.0.0</a>, y es la implementación, por el momento mas estable de la idea conceptual de Guilds.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/guilds/homer-grill.gif" alt="homer grill">
</div>
</div>
<div class="paragraph">
<p>La idea por atrás es la misma, un <code>ractor</code> tiene uno o más hilos, y cada uno de estos, a su vez, alberga una o más "fibers"/corutinas. y dos <code>ractors</code>, pueden ejecutarse potencialmente en paralelo, siempre y cuando el procesamiento que haya que realizar en estos sea bastante intensivo.</p>
</div>
<div class="paragraph">
<p>La idea de aislamiento de variables o datos mutables es la misma que la planteada en los <code>Guilds</code>. Un <code>ractor</code> no puede acceder a los datos de otro, a menos que se transfiera o copie el mismo, pero esto solo aplica a los datos mutables. Con respecto a las variables/datos inmutables, estos se pueden acceder sin problemas, entre los <code>ractors</code> que existan en el sistema.</p>
</div>
<div class="paragraph">
<p>La mayor diferencia viene, en cuanto a la comunicación entre los <code>ractors</code>. Estos a diferencia de los <code>Guilds</code>, se comunican por medio de simples pasos de mensajes, en vez de <code>channels</code>. La idea final es que dicho modelo sea similar al de actores. Pero lo es realmente? Esto lo veremos después. Veamos las 'ventajas'.</p>
</div>
<div class="sect4">
<h5 id="_ventajas"><a class="anchor" href="#_ventajas"></a>Ventajas??</h5>
<div class="paragraph">
<p>Con respecto a las ventajas, las mismas son obvias en cuanto a lo que apuntan a resolver. Permitir la ejecución, en múltiples procesadores/cores, permite de alguna manera una mejor performance, reduciendo el tiempo promedio de ejecución de tareas que lo son, y que no generan ningún tipo de relación directa. Veamos el ejemplo mostrado en el realease de Ruby 3.0.0, donde se ejecuta el algoritmo <code>tak\`<sup class="footnote" id="_footnote_8">[<a id="_footnoteref_8" class="footnote" href="#_footnotedef_8" title="View footnote.">8</a>]</sup> <sup class="footnote" id="_footnote_9">[<a id="_footnoteref_9" class="footnote" href="#_footnotedef_9" title="View footnote.">9</a>]</sup> secuencialmente y usando \`ractors</code> 4 veces.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">def tarai(x, y, z) =
  x &lt;= y ? y : tarai(tarai(x-1, y, z),
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
    end.each(&amp;:take)
  }
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>Los resultados muestran las ventajas..</p>
</div>
<div class="listingblock">
<div class="content">
<pre>Benchmark result:
          user     system      total        real
seq  64.560736   0.001101  64.561837 ( 64.562194)
par  66.422010   0.015999  66.438009 ( 16.685797)</pre>
</div>
</div>
<div class="paragraph">
<p>El codigo esta disponible también <a href="https://github.com/bossiernesto/tarai">aqui</a></p>
</div>
<div class="paragraph">
<p>Esta ventaja es facil de ver, aunque lo mas interesante en realidad, es la creación de una abstracción que permita que pueda convivir de alguna manera código que soporte SMP y parte que no, sin tener que recurrir a eliminar definitivamente el GVL.</p>
</div>
</div>
<div class="sect4">
<h5 id="_problemas_latentes"><a class="anchor" href="#_problemas_latentes"></a>Problemas latentes</h5>
<div class="paragraph">
<p>Si bien se habla que en los Ractors son thread-safe dentro de su contexto, gracias (o no..) al GGL; en realidad no son completamente <code>thread-safe</code>, ya que la interfaz que poseen todavía puede generar casos de deadlock o livelock incluso, si es que no se tiene cuidado.</p>
</div>
<div class="paragraph">
<p>Esta estructura, tiene que ser siempre usada de una manera correcta (tanto como el resto), ya que un uso poco cuidadoso, usando módulos/clases entre varios Ractors<sup class="footnote" id="_footnote_10">[<a id="_footnoteref_10" class="footnote" href="#_footnotedef_10" title="View footnote.">10</a>]</sup>, puede introducir race conditions. También otra cosa a tener en cuenta, es que el envio de mensajes entre ractors(send, yield, take, etc), es el mismo que hay entre objetos, por lo que es siempre bloqueante. Si estos se usan incorrectamente pueden resultar en <code>dead-locks</code> o <code>live-locks</code> como se menciono antes.</p>
</div>
<div class="paragraph">
<p>Por el momento, esta implementacion es experimental, por lo que pueden existir incluso bugs, tanto en el ciclo de vida, como en el manejo interno de estos en memoria (por ej. a nivel del GC de MRI aka gc.c).</p>
</div>
</div>
</div>
<div class="sect3">
<h4 id="_uso_actual_de_ractors"><a class="anchor" href="#_uso_actual_de_ractors"></a>Uso actual de Ractors</h4>
<div class="dlist">
<dl>
<dt class="hdlist1">:</dt>
<dd>
<p>warning
Esta sección puede cambiar a lo largo del tiempo, ya que el código actual de Ractors es experimental y puede deprecarse rápidamente. Puede verse mas en la doc oficial de <a href="https://docs.ruby-lang.org/en/3.0.0/doc/ractor_md.html">ractors.md</a></p>
<div class="dlist">
<dl>
<dt class="hdlist1">:</dt>
<dd>
<div class="ulist">
<ul>
<li>
<p><code>Ractor.new{expr}</code> crea un nuevo Ractor y <code>expr</code> se ejecuta en paralelo en otro procesador.</p>
</li>
<li>
<p>El intérprete invoca con el primer Ractor (llamado Ractor principal).</p>
</li>
<li>
<p>Si el Ractor principal finaliza, todos los Ractores reciben una solicitud de finalización como hilos (si el hilo principal (el primer hilo invocado), el intérprete de Ruby envía todos los hilos en ejecución para finalizar la ejecución).</p>
</li>
<li>
<p>Cada Ractor tiene 1 o más hilos.</p>
</li>
<li>
<p>Los subprocesos en un Ractor comparten un bloqueo global en todo el Ractor, similar al GIL (GVL en terminología de MRI), por lo que no pueden ejecutarse en paralelo (sin liberar GVL explícitamente en el nivel C). Los hilos en diferentes ractores se ejecutan en paralelo.</p>
</li>
<li>
<p>La sobrecarga de crear un Ractor es similar a la sobrecarga de la creación de un hilo usuario y el hilo de OS asociado.</p>
</li>
</ul>
</div>
</dd>
</dl>
</div>
</dd>
</dl>
</div>
<div class="sect4">
<h5 id="_paso_de_mensajes"><a class="anchor" href="#_paso_de_mensajes"></a>Paso de mensajes</h5>
<div class="ulist">
<ul>
<li>
<p>Paso de mensaje de tipo push: <code>Ractor#send(obj</code>) y <code>Ractor.receive()</code>.</p>
<div class="ulist">
<ul>
<li>
<p>El ractor remitente pasa el obj al ractor r mediante <code>r.send(obj)</code> y el ractor receptor recibe el mensaje con Ractor.receive.</p>
</li>
<li>
<p>El remitente conoce el Ractor de destino r y el receptor no conoce al remitente (acepte todos los mensajes de cualquier ractor).</p>
</li>
<li>
<p>El receptor tiene una cola infinita y el remitente pone en cola el mensaje. El remitente no bloquea para poner el mensaje en esta cola.</p>
</li>
<li>
<p>Este tipo de intercambio de mensajes se emplea en muchos otros lenguajes basados ​​en actores.</p>
</li>
</ul>
</div>
</li>
<li>
<p>Comunicación de tipo pull: <code>Ractor.yield(obj)</code> y <code>Ractor#take()</code>.</p>
<div class="ulist">
<ul>
<li>
<p>El emisor ractor declara ceder el obj por <code>Ractor.yield(obj)</code> y el receptor Ractor lo toma con r.take.</p>
</li>
<li>
<p>El remitente no conoce un Ractor de destino y el receptor conoce el Ractor r del remitente.</p>
</li>
<li>
<p>El remitente o el receptor se bloquearán si no hay otro lado.</p>
</li>
</ul>
</div>
</li>
</ul>
</div>
</div>
</div>
<div class="sect3">
<h4 id="_ciclo_de_vida"><a class="anchor" href="#_ciclo_de_vida"></a>Ciclo de Vida</h4>
<div class="paragraph">
<p>Puede verse un resumen del ciclo de vida de un ractor en el siguiente <a href="https://github.com/ruby/ruby/blob/83a744dd8c0d6e769258b734b9f6861a22eeb554/ractor.c#L1449">diagrama</a>:</p>
</div>
<div class="listingblock">
<div class="content">
<pre> created
   | ready to run
 ====================== inserted to vm-&gt;ractor
   v
 blocking &lt;---+ all threads are blocking
   |          |
   v          |
 running -----+
   | all threads are terminated.
 ====================== removed from vm-&gt;ractor
   v
 terminated

 status is protected by VM lock (global state)</pre>
</div>
</div>
<div class="paragraph">
<p>El ciclo de vida empieza con <code>Ractor.new</code> donde una vez que se registra el mismo en <code>vm-&gt;ractor</code>, esto sucede una vez que puede tomarse control del GVL, para proceder a la creación e inicialización de memoria del contexto. Una vez que el ractor está creado, siempre tendrá como mínimo un hilo, y en caso de que el mismo pueda ejecutarse, pasara a estado <code>running</code>. En caso de que se envíe un mensaje o se espere alguna acción se pasará a tener otro hilo planificado en primer plano del ractor, en caso de que todos los hilos se bloqueen, el estado pasa a <code>bloqueado</code>. Cuando todos los hilos han finalizado, el ractor pasa a <code>terminated</code>.</p>
</div>
<div class="paragraph">
<p>Todos los cambios de estado implican un cambio del estado del ractor, y el mismo está protegido por el GVL de la VM.</p>
</div>
</div>
</div>
</div>
</div>
<div id="footnotes">
<hr>
<div class="footnote" id="_footnotedef_1">
<a href="#_footnoteref_1">1</a>. IASC UTN FRBA. (2020) .Concurrencia y Paralelismo. <a href="https://arquitecturas-concurrentes.github.io/iasc-book/concurrencia_paralelismo" class="bare">arquitecturas-concurrentes.github.io/iasc-book/concurrencia_paralelismo</a>
</div>
<div class="footnote" id="_footnotedef_2">
<a href="#_footnoteref_2">2</a>. Ruby Doc. Retrieved 30 August 2021. Thread standard library. <a href="https://ruby-doc.org/core-3.0.2/Thread.html" class="bare">ruby-doc.org/core-3.0.2/Thread.html</a>
</div>
<div class="footnote" id="_footnotedef_3">
<a href="#_footnoteref_3">3</a>. Python Moin. Retrieved 30 November 2015. GlobalInterpreterLock. <a href="https://wiki.python.org/moin/GlobalInterpreterLock" class="bare">wiki.python.org/moin/GlobalInterpreterLock</a>
</div>
<div class="footnote" id="_footnotedef_4">
<a href="#_footnoteref_4">4</a>. Puma Doc. Architecture Overview. <a href="https://puma.io/puma/file.architecture.html" class="bare">puma.io/puma/file.architecture.html</a>
</div>
<div class="footnote" id="_footnotedef_5">
<a href="#_footnoteref_5">5</a>. Javier, Francisco &amp; Guttman, Joshua. (1995). Copy on Write. <a href="http://citeseerx.ist.psu.edu/viewdoc/download;jsessionid=C97A7B66D788B7E4F6D6BF5FDD8EC451?doi=10.1.1.33.3144&amp;rep=rep1&amp;type=pdf" class="bare">citeseerx.ist.psu.edu/viewdoc/download;jsessionid=C97A7B66D788B7E4F6D6BF5FDD8EC451?doi=10.1.1.33.3144&amp;rep=rep1&amp;type=pdf</a>
</div>
<div class="footnote" id="_footnotedef_6">
<a href="#_footnoteref_6">6</a>. Brandur. (2017). The Limits of Copy-on-write: How Ruby Allocates Memory. <a href="https://brandur.org/ruby-memory" class="bare">brandur.org/ruby-memory</a>
</div>
<div class="footnote" id="_footnotedef_7">
<a href="#_footnoteref_7">7</a>. Sasada, Koichi. (2016). A proposal of new concurrency model for Ruby 3 (RubyKaigi2016). <a href="http://www.atdot.net/~ko1/activities/2016_rubykaigi.pdf" class="bare">www.atdot.net/~ko1/activities/2016_rubykaigi.pdf</a>
</div>
<div class="footnote" id="_footnotedef_8">
<a href="#_footnoteref_8">8</a>. Vardi, I. The Running Time of TAK. Ch. 9 in Computational Recreations in Mathematica. Redwood City, CA: Addison-Wesley, pp. 179-199, 1991. <a href="https://www.amazon.com/exec/obidos/ISBN%3D0685479412/ericstreasuretroA/" class="bare">www.amazon.com/exec/obidos/ISBN%3D0685479412/ericstreasuretroA/</a>
</div>
<div class="footnote" id="_footnotedef_9">
<a href="#_footnoteref_9">9</a>. Testing the Tak. Acorn User. pp. 197, 199. <a href="https://archive.org/details/AcornUser052-Nov86/page/n198/mode/1up" class="bare">archive.org/details/AcornUser052-Nov86/page/n198/mode/1up</a>
</div>
<div class="footnote" id="_footnotedef_10">
<a href="#_footnoteref_10">10</a>. Ruby Lang. (2021). Ractor documentation. Thread-safety. <a href="https://docs.ruby-lang.org/en/3.0.0/doc/ractor_md.html#label-Thread-safety" class="bare">docs.ruby-lang.org/en/3.0.0/doc/ractor_md.html#label-Thread-safety</a>
</div>
</div>`;export{e as default};
