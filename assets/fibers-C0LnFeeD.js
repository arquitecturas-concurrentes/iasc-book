const e=`<div class="sect1">
<h2 id="_fibers_on_ruby"><a class="anchor" href="#_fibers_on_ruby"></a>Fibers on Ruby</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Las fibras son estructuras que implementan un mecanismo de concurrencia cooperativa y liviana en Ruby. Básicamente, son un medio para crear bloques de código que se pueden pausar y reanudar, al igual que los hilos. La principal diferencia es que nunca se planifican implicitamente y que la planificación debe realizarla el programador y no la VM.</p>
</div>
<div class="paragraph">
<p>O sea que en el caso de los <code>threads</code>, el scheduler se encarga de la planificacion y del manejo del ciclo de vida de esta abstracción. En el caso de los <code>fibers</code>, esta en nuestras manos la planificación, con lo cual en el código vamos a tener que también tener codigo en cuanto a manejo de los fibers que estamos usando, es decir vamos a tener que explícitamente manejar la planificación. Podemos armar algunas abstracciones pero no suele ser una tarea trivial.</p>
</div>
<div class="paragraph">
<p>A diferencia de otros modelos de concurrencia ligeros sin stack, cada <code>fiber</code> viene con un stack. Esto permite que el fiber se pause desde llamadas de función anidadas dentro del bloque del <code>Fiber</code>.</p>
</div>
<div class="paragraph">
<p>Al ser un esquema colaborativo, nos da un mayor control de la ejecución, y es mas, proporcionan un control total al programador sore su ejecucion como mencionamos antes. Veamos un ejemplo de comparacion en cuanto a los tiempos..</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/fibers/fiversvsthreads.png" alt="fiversvsthreads">
</div>
</div>
<div class="paragraph">
<p>Dos threads que se ejecutan, uno se bloquea por 40ms con una llamada de IO, y después toma unos 10ms mas, el procesamiento de estos datos retornados de la llamada. Después hay un segundo thread, que necesita 50ms, de solo tiempo de CPU. El escenario es el mismo tanto con threads, como con fibers y su planificacion cooperativa.</p>
</div>
<div class="paragraph">
<p>Por defecto, MRI usa un <code>fair scheduler</code> (<a href="https://es.wikipedia.org/wiki/Planificador_Completamente_Justo">mas aqui</a>), que significa que cada thread recibe un mismo tiempo para ejecutar, con quantums de 10ms, antes que se suspendan y que el proximo thread se ponga bajo control. Si uno de los threads esta dentro de una llamada bloquante dentro de esos 10ms, se lo debe tomar como tiempo malgastado, es tiempo en el que seguramente todos los threads estan descansando, por estar bloqueados o esperando I/O.
Por el otro lado, los Fibers, al ser scheduleados explicitamente por el programador, o sea nosotros, nos da una flexibilidad a la hora de determinar cuando debemos parar la ejecucion de nuestro fiber y cuando retomarlo. Esto trae, como desventaja, que tenemos ahora un codigo mas complejo, pero a su vez nos ayudan, en que en un caso casi ideal, no necesitemos casi el uso de locks.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Nota: Desde Ruby 3.0, el concepto de los <code>non-blocking fibers</code> fue introducido. Todos los fibers ya son por defecto no bloqueantes. Mas sobre esto en la seccion de Ruby 3.</p>
</div>
</blockquote>
</div>
<div class="sect2">
<h3 id="_diferencias_que_vemos_entre_los_threads_y_fibers"><a class="anchor" href="#_diferencias_que_vemos_entre_los_threads_y_fibers"></a>Diferencias que vemos entre los threads y fibers</h3>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>TL;DR..</p>
</div>
</blockquote>
</div>
<div class="ulist">
<ul>
<li>
<p>Los Fibers son ligeros en cuanto a la memoria que consumen y los tiempos del ciclo de vida</p>
</li>
<li>
<p>Tenemos el control de los Fibers, de manera explicita, o sea que tenemos el control absoluto de su ciclo de vida y planificacion.</p>
</li>
<li>
<p>Si bien con los threads tenemos al scheduler que decide cuando un thread se pausa o reanuda, en el caso de los Fibers es variable. O sea, al tener el control nosotros de la planificacion, tenemos que especificar cuando iniciar y parar la ejecucion de un Fiber.</p>
</li>
<li>
<p>Los Fibers, son maneras de escribir bloques de codigo, que pueden ser pausados o resumidos, bastante parecidos a los threads, pero con la diferencia de la planificacion de nuestro lado.</p>
</li>
<li>
<p>Los <code>Threads</code> se ejecutan en un segundo plano, especialmente cuando hay una interrupcion. En el caso de los Fibers, se convierten en el programa principal, cuando se ejecutan, hasta que uno los para.</p>
</li>
</ul>
</div>
</div>
<div class="sect2">
<h3 id="_uso_y_estados_de_los_fibers"><a class="anchor" href="#_uso_y_estados_de_los_fibers"></a>Uso y estados de los Fibers</h3>
<div class="paragraph">
<p>Para invocar un fiber, basta con hacer algo como lo siguiente</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">f = Fiber.new { puts 'blah' }

f.resume
blah
=&gt; nil</code></pre>
</div>
</div>
<div class="paragraph">
<p>Algo interesante para mostrar es que un Fiber no se ejecuta automaticamente, luego de su creacion, sino que necesita que se llame primero a <code>Fiber#resume</code> antes. Y seguira en el estado de <code>FIBER_RESUMED</code>, hasta que se pare su ejecucion o que termine de ejecutar todo el codigo que contiene en su bloque.</p>
</div>
<div class="paragraph">
<p>Como se para un fiber?? por medio de <code>Fiber#yield</code>. se puede ver este ejemplo en el <a href="https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/examples/fibers_1.rb">fiber_1</a></p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">fiber = Fiber.new do
  puts 'hola 1'
  Fiber.yield
  puts 'hola 2'
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>en el momento que se ejecuta por primera vez <code>fiber.resume</code>, solo se ejecutara el primer puts, y cuando se llame a yield, el fiber actual se para y pasa su estado a <code>FIBER_SUSPENDED</code>. Solo una vez que se llame de nuevo a <code>fiber.resume</code>, se ejecutara el resto del codigo. Una pregunta valida puede ser, que pasa si una vez que corre todo el codigo del bloque que contiene el fiber, se llama de nuevo a <code>fiber.resume</code>??</p>
</div>
<div class="paragraph">
<p>Es una buena pregunta y es que una vez que termina, pasa su estado a <code>FIBER_TERMINATED</code>. Con lo cual nos va a dar un error:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">[5] pry(main)&gt; fiber.resume
FiberError: dead fiber called
from (pry):9:in \`resume'</code></pre>
</div>
</div>
<div class="paragraph">
<p>Para siempre chequear este estado tenemos un metodo que es <code>Fiber#alive?</code>, que nos devuelve un booleano, de si un fiber esta vivo o no. Sobre nuestro ejemplo anterior:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">[6] pry(main)&gt; fiber.alive?
=&gt; false</code></pre>
</div>
</div>
<div class="paragraph">
<p>Un diagrama de transicion de los estados de un Fiber se puede ver a continuacion.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/fibers/fiber_status.png" alt="fiber status">
</div>
</div>
<div class="sect3">
<h4 id="_para_que_sirven_los_fibers"><a class="anchor" href="#_para_que_sirven_los_fibers"></a>Para que sirven los fibers?</h4>
<div class="paragraph">
<p>Este tipo de abstracciones que modelan un contexto de ejecución, no se usan normalmente, sino que es algo que en general se utiliza en una libreria, implementando otras abstracciones sobre y que usen los fibers, para manejar bien los eventos, cuando parar un fiber y reanudarlo, y despues que nuestro codigo de aplicacion use a esta libreria, sin saber los detalles y que no tenga que operar usando fibers directamente.</p>
</div>
<div class="paragraph">
<p>Un ejemplo de esto, puede verse, si implementamos un <code>reactor</code>, que es un <a href="https://en.wikipedia.org/wiki/Reactor_pattern#:~:text=The%20reactor%20design%20pattern%20is,to%20the%20associated%20request%20handlers.">patron de diseno</a> que nos va a permitir manejar eventos. Hay muchas manera de implementar un reactor. Vimos hace poco que el <code>event loop</code> usa <a href="https://man7.org/linux/man-pages/man2/epoll_wait.2.html">epoll</a> para saber de nuevos eventos disponibles, que le llegan a un puerto. Otra manera, aunque no tan efectiva, pero mas sencilla de lograr, puede ser mediante <a href="https://man7.org/linux/man-pages/man2/select.2.html">select</a>.</p>
</div>
<div class="paragraph">
<p>Con <code>select</code>, que esta presente en Ruby, mediante un wrapper en <code>IO</code>, podemos implementar un <code>reactor</code> simple. Un ejemplo de la cátedra, que usa una implementación mas completa con <code>timers</code> y otras abstracciones se puede ver en este <a href="https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby">repositorio</a>.</p>
</div>
<div class="paragraph">
<p>De una manera mucho mas simple, podemos tener una clase <code>Reactor</code>, que tenga dos mapas para eventos de escritura o lectura.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">class Reactor
  def initialize
    @readable = {}
    @writable = {}
  end
  #...
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>y que tenga un ciclo de corridas en el que se esperan a que los eventos que esten encolados, la parte interesante de este codigo:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">class Reactor
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
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>esta en la línea del select</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">readable, writable = IO.select(@readable.keys, @writable.keys, _error_events)</code></pre>
</div>
</div>
<div class="paragraph">
<p>donde se esperan a que los eventos que tienen una llamada de IO pendiente terminen.</p>
</div>
<div class="paragraph">
<p>Sobre el Reactor se pueden armar otras abstracicones, tales como un servidor de TCP</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">server = TCPServer.new('localhost', port)
puts "Listening on 127.0.0.1:#{port}"
reactor = Reactor.new</code></pre>
</div>
</div>
<div class="paragraph">
<p>y que use en un loop la aceptación de la conexión</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">loop do
  client = reactor.wait_readable(server) { server.accept }
  # ....
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>despues hay que esperar desde el servidor a que termine el handshake contra el cliente, por lo que eso es otra llamada, y por lo tanto otro evento&#8230;&#8203;</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">reactor.wait_readable(client) { client.gets })</code></pre>
</div>
</div>
<div class="paragraph">
<p>Como unimos estos eventos en el reactor? Mediante alguna abstracción, o contexto de ejecución, que pueda bueno&#8230;&#8203; ejecutarlas. Aquí es donde entran los Fibers..</p>
</div>
<div class="paragraph">
<p>El loop queda entonces, como</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">loop do
    client = reactor.wait_readable(server) { server.accept }

    Fiber.new do
      while (_buffer = reactor.wait_readable(client) { client.gets })
        reactor.wait_writable(client)
        client.puts("Pong!")
      end

      client.close
    end.resume
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>Despues hay que wrapear el loop en un ctx similar general, que es otro fiber y listo..</p>
</div>
<div class="paragraph">
<p>El reactor toma los bloques de los eventos de io server y client como bloques que se ejecutaran como otros <code>fibers</code>.</p>
</div>
<div class="paragraph">
<p>El ejemplo esta en este <a href="https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/examples/socket/tcp_reactor.rb">archivo</a></p>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_fibers_en_ruby_3_0"><a class="anchor" href="#_fibers_en_ruby_3_0"></a>Fibers en Ruby 3.0</h3>
<div class="paragraph">
<p>Entre otras cosas Ruby 3, introduce el concepto de <code>fibers</code> no bloqueantes. Ahora cuando hacemos un <code>Fiber.new() do ... end</code>, se le puede pasar un flag booleano llamado <code>blocking</code>. Por defecto el valor de este booleano es <code>false</code></p>
</div>
<div class="paragraph">
<p>Cuando se le pasa el valor <code>blocking: true</code>, el <code>Fiber</code> se va a comportar como lo hacia en Ruby 2.x.</p>
</div>
<div class="paragraph">
<p>Lo interesante es cuando no se le pasa este flag o el valor es <code>blocking: false</code>. Esto permite que el Fiber sea <code>no bloqueante</code>.</p>
</div>
<div class="paragraph">
<p>Los <code>fibers no bloqueantes</code>, cuando llegan en el codigo que ejecutan, a una zona que es potencialmente bloqueante (sleep, esperar otro proceso, esperar datos de I/O, etc), en vez de congelarse y parar toda la ejecucion del thread, hace un <code>yield</code> implicito, y permite que otros fibers tomen el control. Esto si se maneja mendiante un scheduler, permite que se pueda manejar bien a que fiber se le puede dar prioridad</p>
</div>
<div class="paragraph">
<p>Que es el <code>scheduler</code>?? En realidad la pregunta correcta sería, como nos damos cuenta ahora con un esquema <code>no bloquante</code> cuando tenemos una respuesta con la cual nos va a surgir una nueva duda. Cómo podemos seguir con la ejecución de nuestro fiber? Esto surge porque aun tenemos que planificar a los fibers.</p>
</div>
<div class="paragraph">
<p>Para poder saber y manejar cuando tenemos una respuesta, tendremos un <code>scheduler</code>, y en si es una clase que simula algo similar a un <code>event loop</code>. Nos va a permitir:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Rastrear y saber el estado de los fibers, y en caso que esten realizando alguna operación <code>bloqueante</code>, cual es.</p>
</li>
<li>
<p>Permitir reanudar la ejecucion de los fibers que hicieron una operación bloqueante, y se les retorno un resultado.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Ruby por default no provee una clase <code>scheduler</code>, pero si una interfaz que debe cumplir, y se espera que sea implementado por el usuario, siguiendo, como se menciono la interfaz descrita en <a href="https://ruby-doc.org/core-3.0.0/Fiber/SchedulerInterface.html">Fiber::SchedulerInterface</a>.</p>
</div>
<div class="paragraph">
<p>Entonces para implementar un <code>scheduler</code>, tenemos que implementar los siguientes metodos:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>io_wait. Se llama ante eventos del tipo <code>IO#wait, IO#wait_readable, IO#wait_writeable</code></p>
</li>
<li>
<p>process_wait. Se llama ante eventos de <code>Kernel#sleep, Mutex#sleep</code></p>
</li>
<li>
<p>kernel_sleep. Se llama ante eventos de <code>Process::Status.wait</code></p>
</li>
<li>
<p>block. Se llama ante eventos de <code>Thread#join, Mutex</code></p>
</li>
<li>
<p>unblock. Se llama cuando se desbloquea un fiber por alguno de los eventos antes mencionados</p>
</li>
<li>
<p>close. Se llama cuando el thread donde corren los fibers recibe una señal de salida</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>por lo que un esqueleto de un scheduler es algo como</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">class Scheduler
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
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>un ejemplo de un scheduler esta en la parte de <a href="https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/examples/simple_scheduler.rb">ejemplos</a>. Un poco basado en el reactor que implementamos en este <a href="https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby">repositorio</a>. En este repo, en <a href="https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby/blob/master/src/reactor.rb#L117">cada ciclo de nuestro reactor implementado</a>, hace un chequeo de <a href="https://github.com/arquitecturas-concurrentes/iasc-event-loop-reactor-ruby/blob/master/src/reactor.rb#L122">los eventos cada un quantum de tiempo determinado</a>.</p>
</div>
<div class="sect4">
<h5 id="_como_usamos_nuestro_scheduler_una_vez_que_lo_tenemos"><a class="anchor" href="#_como_usamos_nuestro_scheduler_una_vez_que_lo_tenemos"></a>Como usamos nuestro scheduler una vez que lo tenemos?</h5>
<div class="paragraph">
<p>Basta con hacer algo como</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">require 'my_scheduler'


Fiber.set_scheduler(MyScheduler.new)</code></pre>
</div>
</div>
<div class="paragraph">
<p>después de eso, podemos seguir usando los fibers, como antes en Ruby 2.x</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby"># now using a non-blocking schema through a SimpleScheduler that does not block the Fibers
Fiber.new do
  puts 'Fiber 1: sleep for 2s'
  sleep(2)
  puts 'Fiber 1: wake up'
end.resume

Fiber.new do
  puts 'Fiber 2: sleep for 3s'
  sleep(3)
  puts 'Fiber 2: wake up'
end.resume</code></pre>
</div>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_que_son_los_fibers_por_atras"><a class="anchor" href="#_que_son_los_fibers_por_atras"></a>Que son los Fibers por atras??</h3>
<div class="paragraph">
<p>En realidad los Fibers, en su implementación al menos en MRI, son en suma &#8230;&#8203;.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/fibers/secret.jpg" alt="secret">
</div>
</div>
<div class="paragraph">
<p>corutinas, simples corutinas.</p>
</div>
<div class="paragraph">
<p>Incluso las mejoras que se introdujeron en Ruby 2.6, son en base a soluciones en C, que ayudaron a mejorar la performance de <code>yield/resume</code>, en gran medida, usando <code>libcoro</code>. Se pueden ver mas detalles de esto <a href="https://bugs.ruby-lang.org/issues/14739">aqui</a>, y una primera implementacion de esta propuesta se puede ver <a href="https://github.com/ioquatix/ruby/commit/4a9c12d94aae1cf3a52ca5f026432cd03e9817bc">aqui</a></p>
</div>
<div class="paragraph">
<p>Un ejemplo de como mejoraron los tiempos en su momento puede verse haciendo un simple benchmark, que <a href="https://github.com/arquitecturas-concurrentes/ruby-fibers/tree/main/extras/fibers_benchie.rb">usamos</a> y que comparan una version &lt; 2.6 y una en Ruby 3</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby"> Using /home/ernesto/.rvm/gems/ruby-2.5.1
 altair.λ:~/utn/iasc/fibers-ruby/lib$ ruby fibers_benchie.rb
 1220634.1484423832/s
 Using /home/ernesto/.rvm/gems/ruby-3.0.0-preview1
 altair.λ:~/utn/iasc/fibers-ruby/lib$ ruby fibers_benchie.rb
 4197152.191945104/s</code></pre>
</div>
</div>
<div class="paragraph">
<p>Esta es una librería de <a href="http://software.schmorp.de/pkg/libcoro.html">corutinas en C</a>, que tiene la implementacion de lo que seria el <code>"context switch"</code> entre fibers, que es la parte que en general se va a a estar ejecutando muy a menudo, en <a href="http://cvs.schmorp.de/libcoro/coro.c?revision=1.73&amp;view=markup#l223">assembler</a>.</p>
</div>
<div class="paragraph">
<p>Hoy en dia, ya no se delega el mecanismo de las corutinas en <code>libcoro</code>, y se lo trata nativamente, pero con los mismos conceptos. Incluso concepto de que la parte del cambio de contexto de los <code>fibers</code> se hace, dependiendo de la arquitectura, con codigo en assembler. <a href="https://github.com/ruby/ruby/blob/0ead818d81c975275238878c81f300dd404e0722/coroutine/x86/Context.S#L16">Ejemplo de x86 ec</a>, este context switch se llama desde la implementacion nativa de MRI de fibers en C en esta seccion de la funcion <a href="https://github.com/ruby/ruby/blob/3d32c217586a48c709b762865a8abc46f9098455/cont.c#L1376">fiber_setcontext</a></p>
</div>
</div>
</div>
</div>
<div class="sect1 appendix">
<h2 id="_notas_adicionales"><a class="anchor" href="#_notas_adicionales"></a>Apendice A: Notas adicionales</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_sobre_el_tamaño_del_stack_de_threads_y_fibers"><a class="anchor" href="#_sobre_el_tamaño_del_stack_de_threads_y_fibers"></a>Sobre el tamaño del stack de Threads y Fibers</h3>
<div class="paragraph">
<p>El tamaño del stack puede incluso limitar la cantidad de Threads y Fibers que podemos instanciar en una instancia de MRI.</p>
</div>
<div class="dlist">
<dl>
<dt class="hdlist1">Podemos comprobar rápidamente el tamaño de la pila para un <code>Thread</code> y para las<code> Fibers</code> en ruby ​​comprobando \`RubyVM </dt>
<dd>
<p>DEFAULT_PARAMS\` en la consola irb o pry:</p>
</dd>
</dl>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">pry(main)&gt; RubyVM::DEFAULT_PARAMS
=&gt; {:thread_vm_stack_size=&gt;1048576,
 :thread_machine_stack_size=&gt;1048576,
 :fiber_vm_stack_size=&gt;131072,
 :fiber_machine_stack_size=&gt;524288}</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Esto solo es valido para versiones de Ruby &gt;= 2.0.0</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Ahora podemos comprobar rápidamente el tamaño de la pila de los <code>hilos</code> tal como están</p>
</div>
<div class="paragraph">
<p>Esto muestra claramente que el tamaño de la pila para los subprocesos en ruby ​​es solo de 1 MB, mientras que el tamaño de la pila para las fibras es de solo 512k. Podemos cambiar esto haciendo una exportación de cada una de las variables, como por ejemplo:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-dotenv" data-lang="dotenv">export RUBY_FIBER_VM_STACK_SIZE=2097152
export RUBY_THREAD_VM_STACK_SIZE=2097152</code></pre>
</div>
</div>
<div class="paragraph">
<p>Esto aumentará el tamaño de la pila y las veces que podemos llamar a una pila anidada.</p>
</div>
<div class="paragraph">
<p>Con stack size de 1MB</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">$ ruby stack_size.rb
Max Stack Level: 10079</code></pre>
</div>
</div>
<div class="paragraph">
<p>Con un stack de 2MB</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">altair.λ:~/utn/iasc/fibers-ruby/extras$ ruby stack_size.rb
Max Stack Level: 20161</code></pre>
</div>
</div>
<div class="paragraph">
<p>Podemos ver que es casi linea la cantidad de veces que podemos llamar al stack con el stack size que tenemos.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Esto puede variar dependiendo de la información y de los datos que guardemos en el stack.</p>
</div>
</blockquote>
</div>
</div>
</div>
</div>`;export{e as default};
