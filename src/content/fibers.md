# Fibers on Ruby

Las fibras son estructuras que implementan un mecanismo de concurrencia cooperativa y liviana en Ruby. Básicamente, son un medio para crear bloques de código que se pueden pausar y reanudar, al igual que los hilos. La principal diferencia es que nunca se planifican implicitamente y que la planificación debe realizarla el programador y no la VM. 

O sea que en el caso de los `threads`, el scheduler se encarga de la planificacion y del manejo del ciclo de vida de esta abstracción. En el caso de los `fibers`, esta en nuestras manos la planificación, con lo cual en el código vamos a tener que también tener codigo en cuanto a manejo de los fibers que estamos usando, es decir vamos a tener que explícitamente manejar la planificación. Podemos armar algunas abstracciones pero no suele ser una tarea trivial. 

A diferencia de otros modelos de concurrencia ligeros sin stack, cada `fiber` viene con un stack. Esto permite que el fiber se pause desde llamadas de función anidadas dentro del bloque del `Fiber`.

Al ser un esquema colaborativo, nos da un mayor control de la ejecución, y es mas, proporcionan un control total al programador sore su ejecucion como mencionamos antes. Veamos un ejemplo de comparacion en cuanto a los tiempos..

<img src="~@/images/fibers/fiversvsthreads.png" class='center'>

Dos threads que se ejecutan, uno se bloquea por 40ms con una llamada de IO, y después toma unos 10ms mas, el procesamiento de estos datos retornados de la llamada. Después hay un segundo thread, que necesita 50ms, de solo tiempo de CPU. El escenario es el mismo tanto con threads, como con fibers y su planificacion cooperativa.

Por defecto, MRI usa un `fair scheduler` ([mas aqui](https://es.wikipedia.org/wiki/Planificador_Completamente_Justo)), que significa que cada thread recibe un mismo tiempo para ejecutar, con quantums de 10ms, antes que se suspendan y que el proximo thread se ponga bajo control. Si uno de los threads esta dentro de una llamada bloquante dentro de esos 10ms, se lo debe tomar como tiempo malgastado, es tiempo en el que seguramente todos los threads estan descansando, por estar bloqueados o esperando I/O. 
Por el otro lado, los Fibers, al ser scheduleados explicitamente por el programador, o sea nosotros, nos da una flexibilidad a la hora de determinar cuando debemos parar la ejecucion de nuestro fiber y cuando retomarlo. Esto trae, como desventaja, que tenemos ahora un codigo mas complejo, pero a su vez nos ayudan, en que en un caso casi ideal, no necesitemos casi el uso de locks.

> Nota: Desde Ruby 3.0, el concepto de los `non-blocking fibers` fue introducido. Todos los fibers ya son por defecto no bloqueantes. Mas sobre esto en la seccion de Ruby 3.

### Diferencias que vemos entre los threads y fibers

> TL;DR.. 

- Los Fibers son ligeros en cuanto a la memoria que consumen y los tiempos del ciclo de vida
- Tenemos el control de los Fibers, de manera explicita, o sea que tenemos el control absoluto de su ciclo de vida y planificacion.
- Si bien con los threads tenemos al scheduler que decide cuando un thread se pausa o reanuda, en el caso de los Fibers es variable. O sea, al tener el control nosotros de la planificacion, tenemos que especificar cuando iniciar y parar la ejecucion de un Fiber.
- Los Fibers, son maneras de escribir bloques de codigo, que pueden ser pausados o resumidos, bastante parecidos a los threads, pero con la diferencia de la planificacion de nuestro lado.
- Los `Threads` se ejecutan en un segundo plano, especialmente cuando hay una interrupcion. En el caso de los Fibers, se convierten en el programa principal, cuando se ejecutan, hasta que uno los para. 

### Uso y estados de los Fibers

Para invocar un fiber, basta con hacer algo como lo siguiente

```ruby
f = Fiber.new { puts 'blah' }

f.resume 
blah
=> nil
```

Algo interesante para mostrar es que un Fiber no se ejecuta automaticamente, luego de su creacion, sino que necesita que se llame primero a `Fiber#resume` antes. Y seguira en el estado de `FIBER_RESUMED`, hasta que se pare su ejecucion o que termine de ejecutar todo el codigo que contiene en su bloque.

Como se para un fiber?? por medio de `Fiber#yield`. se puede ver este ejemplo en el [fiber_1](https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/examples/fibers_1.rb)

```ruby
fiber = Fiber.new do
  puts 'hola 1'
  Fiber.yield
  puts 'hola 2'
end
```

en el momento que se ejecuta por primera vez `fiber.resume`, solo se ejecutara el primer puts, y cuando se llame a yield, el fiber actual se para y pasa su estado a `FIBER_SUSPENDED`. Solo una vez que se llame de nuevo a `fiber.resume`, se ejecutara el resto del codigo. Una pregunta valida puede ser, que pasa si una vez que corre todo el codigo del bloque que contiene el fiber, se llama de nuevo a `fiber.resume`??

Es una buena pregunta y es que una vez que termina, pasa su estado a `FIBER_TERMINATED`. Con lo cual nos va a dar un error:

```ruby
[5] pry(main)> fiber.resume
FiberError: dead fiber called
from (pry):9:in `resume'
```

Para siempre chequear este estado tenemos un metodo que es `Fiber#alive?`, que nos devuelve un booleano, de si un fiber esta vivo o no. Sobre nuestro ejemplo anterior:

```ruby
[6] pry(main)> fiber.alive?
=> false
```

Un diagrama de transicion de los estados de un Fiber se puede ver a continuacion.

<img src="~@/images/fibers/fiber_status.png" class='center'>

#### Para que sirven los fibers?

Este tipo de abstracciones que modelan un contexto de ejecución, no se usan normalmente, sino que es algo que en general se utiliza en una libreria, implementando otras abstracciones sobre y que usen los fibers, para manejar bien los eventos, cuando parar un fiber y reanudarlo, y despues que nuestro codigo de aplicacion use a esta libreria, sin saber los detalles y que no tenga que operar usando fibers directamente. 

Un ejemplo de esto, puede verse, si implementamos un `reactor`, que es un [patron de diseno](https://en.wikipedia.org/wiki/Reactor_pattern#:~:text=The%20reactor%20design%20pattern%20is,to%20the%20associated%20request%20handlers.) que nos va a permitir manejar eventos. Hay muchas manera de implementar un reactor. Vimos hace poco que el `event loop` usa [epoll](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) para saber de nuevos eventos disponibles, que le llegan a un puerto. Otra manera, aunque no tan efectiva, pero mas sencilla de lograr, puede ser mediante [select](https://man7.org/linux/man-pages/man2/select.2.html).

Con `select`, que esta presente en Ruby, mediante un wrapper en `IO`, podemos implementar un `reactor` simple. Un ejemplo de la cátedra, que usa una implementación mas completa con `timers` y otras abstracciones se puede ver en este [repositorio](https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby).

De una manera mucho mas simple, podemos tener una clase `Reactor`, que tenga dos mapas para eventos de escritura o lectura.

```ruby
class Reactor
  def initialize
    @readable = {}
    @writable = {}
  end
  #...
end
```

y que tenga un ciclo de corridas en el que se esperan a que los eventos que esten encolados, la parte interesante de este codigo:

```ruby
class Reactor
  def initialize
    @readable = {}
    @writable = {}
  end

  def run
    _error_events = [] # unused for now...
    while @readable.any? || @writable.any?
      readable, writable = IO.select(@readable.keys, @writable.keys, _error_events)

      readable.each do |io|
        @readable[io].resume
      end

      writable.each do |io|
        @writable[io].resume
      end
    end
  end
end
```

esta en la línea del select 

```ruby
readable, writable = IO.select(@readable.keys, @writable.keys, _error_events)
```

donde se esperan a que los eventos que tienen una llamada de IO pendiente terminen.

Sobre el Reactor se pueden armar otras abstracicones, tales como un servidor de TCP

```ruby
server = TCPServer.new('localhost', port)
puts "Listening on 127.0.0.1:#{port}"
reactor = Reactor.new
```

y que use en un loop la aceptación de la conexión

```ruby
loop do
  client = reactor.wait_readable(server) { server.accept } 
  # ....
end
```

despues hay que esperar desde el servidor a que termine el handshake contra el cliente, por lo que eso es otra llamada, y por lo tanto otro evento...

```ruby
reactor.wait_readable(client) { client.gets })
```

Como unimos estos eventos en el reactor? Mediante alguna abstracción, o contexto de ejecución, que pueda bueno... ejecutarlas. Aquí es donde entran los Fibers..

El loop queda entonces, como 

```ruby
loop do
    client = reactor.wait_readable(server) { server.accept }

    Fiber.new do
      while (_buffer = reactor.wait_readable(client) { client.gets })
        reactor.wait_writable(client)
        client.puts("Pong!")
      end

      client.close
    end.resume 
end
```

Despues hay que wrapear el loop en un ctx similar general, que es otro fiber y listo..

El reactor toma los bloques de los eventos de io server y client como bloques que se ejecutaran como otros `fibers`.

El ejemplo esta en este [archivo](https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/examples/socket/tcp_reactor.rb)

### Fibers en Ruby 3.0

Entre otras cosas Ruby 3, introduce el concepto de `fibers` no bloqueantes. Ahora cuando hacemos un `Fiber.new() do ... end`, se le puede pasar un flag booleano llamado `blocking`. Por defecto el valor de este booleano es `false`

Cuando se le pasa el valor `blocking: true`, el `Fiber` se va a comportar como lo hacia en Ruby 2.x.

Lo interesante es cuando no se le pasa este flag o el valor es `blocking: false`. Esto permite que el Fiber sea `no bloqueante`.

Los `fibers no bloqueantes`, cuando llegan en el codigo que ejecutan, a una zona que es potencialmente bloqueante (sleep, esperar otro proceso, esperar datos de I/O, etc), en vez de congelarse y parar toda la ejecucion del thread, hace un `yield` implicito, y permite que otros fibers tomen el control. Esto si se maneja mendiante un scheduler, permite que se pueda manejar bien a que fiber se le puede dar prioridad

Que es el `scheduler`?? En realidad la pregunta correcta sería, como nos damos cuenta ahora con un esquema `no bloquante` cuando tenemos una respuesta con la cual nos va a surgir una nueva duda. Cómo podemos seguir con la ejecución de nuestro fiber? Esto surge porque aun tenemos que planificar a los fibers. 

Para poder saber y manejar cuando tenemos una respuesta, tendremos un `scheduler`, y en si es una clase que simula algo similar a un `event loop`. Nos va a permitir:

- Rastrear y saber el estado de los fibers, y en caso que esten realizando alguna operación `bloqueante`, cual es.
- Permitir reanudar la ejecucion de los fibers que hicieron una operación bloqueante, y se les retorno un resultado.

Ruby por default no provee una clase `scheduler`, pero si una interfaz que debe cumplir, y se espera que sea implementado por el usuario, siguiendo, como se menciono la interfaz descrita en [Fiber::SchedulerInterface](https://ruby-doc.org/core-3.0.0/Fiber/SchedulerInterface.html).

Entonces para implementar un `scheduler`, tenemos que implementar los siguientes metodos:

- io_wait. Se llama ante eventos del tipo `IO#wait, IO#wait_readable, IO#wait_writeable`
- process_wait. Se llama ante eventos de `Kernel#sleep, Mutex#sleep`
- kernel_sleep. Se llama ante eventos de `Process::Status.wait`
- block. Se llama ante eventos de `Thread#join, Mutex` 
- unblock. Se llama cuando se desbloquea un fiber por alguno de los eventos antes mencionados
- close. Se llama cuando el thread donde corren los fibers recibe una señal de salida 

por lo que un esqueleto de un scheduler es algo como

```ruby
class Scheduler
  # trigger by events: IO#wait, IO#wait_readable, IO#wait_writeable
  def io_wait(io, events, timeout)
  end

  # trigger by events: Kernel#sleep, Mutex#sleep
  def kernel_sleep(duration = nil)
  end

  # trigger by events: Process::Status.wait
  def process_wait(pid, flags)
  end

  # trigger by events: Thread#join, Mutex
  def block(blocker, timeout = nil)
  end

  # trigger when a previous block called is unblock
  def unblock(blocker, fiber)
  end
  
  # Called when current thread exits
  def close
  end
end
```

un ejemplo de un scheduler esta en la parte de [ejemplos](https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/examples/simple_scheduler.rb). Un poco basado en el reactor que implementamos en este [repositorio](https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby). En este repo, en [cada ciclo de nuestro reactor implementado](https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby/blob/master/src/reactor.rb#L117), hace un chequeo de [los eventos cada un quantum de tiempo determinado](https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby/blob/master/src/reactor.rb#L122).

##### Como usamos nuestro scheduler una vez que lo tenemos? 

Basta con hacer algo como

```ruby
require 'my_scheduler'


Fiber.set_scheduler(MyScheduler.new)
```

después de eso, podemos seguir usando los fibers, como antes en Ruby 2.x

```ruby
# now using a non-blocking schema through a SimpleScheduler that does not block the Fibers
Fiber.new do
  puts 'Fiber 1: sleep for 2s'
  sleep(2)
  puts 'Fiber 1: wake up'
end.resume

Fiber.new do
  puts 'Fiber 2: sleep for 3s'
  sleep(3)
  puts 'Fiber 2: wake up'
end.resume
```

### Que son los Fibers por atras??

En realidad los Fibers, en su implementación al menos en MRI, son en suma ....

<img src="~@/images/fibers/secret.jpg" class='center'>

corutinas, simples corutinas.

Incluso las mejoras que se introdujeron en Ruby 2.6, son en base a soluciones en C, que ayudaron a mejorar la performance de `yield/resume`, en gran medida, usando `libcoro`. Se pueden ver mas detalles de esto [aqui](https://bugs.ruby-lang.org/issues/14739), y una primera implementacion de esta propuesta se puede ver [aqui](https://github.com/ioquatix/ruby/commit/4a9c12d94aae1cf3a52ca5f026432cd03e9817bc)

Un ejemplo de como mejoraron los tiempos en su momento puede verse haciendo un simple benchmark, que [usamos](https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/extras/fibers_benchie.rb) y que comparan una version < 2.6 y una en Ruby 3

```ruby
 Using /home/ernesto/.rvm/gems/ruby-2.5.1
 altair.λ:~/utn/iasc/fibers-ruby/lib$ ruby fibers_benchie.rb
 1220634.1484423832/s
 Using /home/ernesto/.rvm/gems/ruby-3.0.0-preview1
 altair.λ:~/utn/iasc/fibers-ruby/lib$ ruby fibers_benchie.rb
 4197152.191945104/s
```

Esta es una librería de [corutinas en C](http://software.schmorp.de/pkg/libcoro.html), que tiene la implementacion de lo que seria el `"context switch"` entre fibers, que es la parte que en general se va a a estar ejecutando muy a menudo, en [assembler](http://cvs.schmorp.de/libcoro/coro.c?revision=1.73&view=markup#l223).

Hoy en dia, ya no se delega el mecanismo de las corutinas en `libcoro`, y se lo trata nativamente, pero con los mismos conceptos. Incluso concepto de que la parte del cambio de contexto de los `fibers` se hace, dependiendo de la arquitectura, con codigo en assembler. [Ejemplo de x86 ec](https://github.com/ruby/ruby/blob/0ead818d81c975275238878c81f300dd404e0722/coroutine/x86/Context.S#L16), este context switch se llama desde la implementacion nativa de MRI de fibers en C en esta seccion de la funcion [fiber_setcontext](https://github.com/ruby/ruby/blob/3d32c217586a48c709b762865a8abc46f9098455/cont.c#L1376)


## Anexo

### Sobre el tamaño del stack de Threads y Fibers

El tamaño del stack puede incluso limitar la cantidad de Threads y Fibers que podemos instanciar en una instancia de MRI.

Podemos comprobar rápidamente el tamaño de la pila para un `Thread` y para las` Fibers` en ruby ​​comprobando `RubyVM :: DEFAULT_PARAMS` en la consola irb o pry:

```ruby
pry(main)> RubyVM::DEFAULT_PARAMS
=> {:thread_vm_stack_size=>1048576,
 :thread_machine_stack_size=>1048576,
 :fiber_vm_stack_size=>131072,
 :fiber_machine_stack_size=>524288}
```

> Esto solo es valido para versiones de Ruby >= 2.0.0

Ahora podemos comprobar rápidamente el tamaño de la pila de los `hilos` tal como están

Esto muestra claramente que el tamaño de la pila para los subprocesos en ruby ​​es solo de 1 MB, mientras que el tamaño de la pila para las fibras es de solo 512k. Podemos cambiar esto haciendo una exportación de cada una de las variables, como por ejemplo:


```dotenv
export RUBY_FIBER_VM_STACK_SIZE=2097152
export RUBY_THREAD_VM_STACK_SIZE=2097152
```

Esto aumentará el tamaño de la pila y las veces que podemos llamar a una pila anidada.

Con stack size de 1MB

```ruby
$ ruby stack_size.rb 
Max Stack Level: 10079
```

Con un stack de 2MB

```ruby
altair.λ:~/utn/iasc/fibers-ruby/extras$ ruby stack_size.rb 
Max Stack Level: 20161
```

Podemos ver que es casi linea la cantidad de veces que podemos llamar al stack con el stack size que tenemos.

> Esto puede variar dependiendo de la información y de los datos que guardemos en el stack.