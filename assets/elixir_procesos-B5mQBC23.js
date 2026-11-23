var e=`<div class="sect1">
<h2 id="_procesos_y_mensajes_en_elixir"><a class="anchor" href="#_procesos_y_mensajes_en_elixir"></a>Procesos y mensajes en Elixir</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Elixir es un lenguaje funcional, dinámico y de propósito general que corre sobre la máquina virtual BEAM de Erlang. Favorece la composición de funciones y el uso de datos inmutables: una operación produce un nuevo valor en vez de modificar la estructura que recibió. A lo largo de los ejemplos veremos el <strong>pattern matching</strong>: comparar la forma de un valor con un patrón y, si coinciden, extraer sus partes. Los ejemplos prácticos de esta página están basados en el <a href="https://github.com/arquitecturas-concurrentes/iasc-actors-intro-elixir">repositorio introductorio de actores y Elixir</a> de la materia.</p>
</div>
<div class="paragraph">
<p>En Elixir, el código se ejecuta dentro de <strong>procesos de BEAM</strong>. Cada proceso tiene su propio contexto de ejecución, un identificador llamado <strong>PID</strong> (process identifier) y un buzón donde se guardan los mensajes recibidos. Los procesos están aislados: no comparten directamente sus variables ni su estado; para comunicarse, se envían mensajes. No son procesos del sistema operativo ni equivalen a un hilo por proceso.</p>
</div>
<div class="sect2">
<h3 id="_quién_administra_los_procesos"><a class="anchor" href="#_quién_administra_los_procesos"></a>¿Quién administra los procesos?</h3>
<div class="paragraph">
<p>Los administra el runtime de Erlang/Elixir, llamado ERTS (Erlang Run-Time System), que ejecuta el código de BEAM. El runtime crea y destruye los procesos, mantiene sus buzones y los planifica para que puedan avanzar. Cada proceso de BEAM es una estructura gestionada por la máquina virtual, no un hilo nativo reservado permanentemente para ese proceso.</p>
</div>
<div class="paragraph">
<p>El planificador de BEAM (<strong>scheduler</strong>) elige qué proceso listo ejecutar y le da tiempo de ejecución. Por defecto, ERTS suele iniciar un scheduler normal por cada procesador lógico disponible; esa configuración puede cambiarse. Cada scheduler normal se ejecuta sobre un hilo del sistema operativo; luego, el planificador del sistema operativo decide cuándo ese hilo obtiene tiempo de CPU. Así, la VM puede alternar entre muchos procesos BEAM usando una cantidad mucho menor de hilos nativos. Si hay varios núcleos disponibles, varios schedulers pueden ejecutar procesos distintos en paralelo.</p>
</div>
<div class="paragraph">
<p>La VM mantiene procesos listos para ejecutarse en colas de planificación; cada scheduler toma de ellas el próximo proceso que puede avanzar. Un scheduler ejecuta un proceso por vez y, periódicamente, le da la oportunidad a otros procesos listos. La planificación de BEAM se basa en <strong>reductions</strong>, una unidad aproximada de trabajo contabilizada durante la ejecución de funciones y operaciones de Erlang. No equivale a una cantidad fija de milisegundos ni a una instrucción individual de máquina. Cuando el proceso agota su presupuesto de reductions, el scheduler puede pausarlo y darle turno a otro proceso listo. Esto evita que un proceso que calcula durante mucho tiempo monopolice indefinidamente un scheduler. No es una promesa de orden estricto ni de que todos los procesos reciban exactamente el mismo tiempo.</p>
</div>
<div class="paragraph">
<p>Un proceso que espera en <code>receive</code> no ocupa continuamente un scheduler: queda bloqueado hasta que llega un mensaje que puede procesar y entonces vuelve a estar listo. De forma similar, cuando un proceso termina, el runtime libera sus recursos. Este modelo permite tener muchos procesos que esperan sin mantener un hilo nativo dedicado a cada uno. Algunas operaciones nativas largas usan schedulers dedicados del runtime, pero eso no cambia la idea básica: los schedulers de BEAM distribuyen el trabajo de los procesos sobre los hilos de la VM, y el sistema operativo planifica esos hilos sobre los núcleos disponibles.</p>
</div>
<div class="paragraph">
<p>En IEx se puede consultar cuántos schedulers están en línea y observar el contador de reductions de un proceso. <code>self/0</code> devuelve el PID del proceso actual; en este caso, el de la consola:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">:erlang.system_info(:schedulers_online)
Process.info(self(), :reductions)</code></pre>
</div>
</div>
<div class="paragraph">
<p>En Elixir, los módulos de Erlang se escriben con dos puntos delante del nombre: <code>:erlang</code> es el módulo que contiene <code>system_info/1</code>, una función que recibe un argumento. <code>:schedulers_online</code> es un átomo, es decir, una etiqueta constante que indica qué dato consultar. <code>Process.info/2</code> consulta información del proceso: <code>Process</code> es el módulo y <code>info/2</code> la función, que recibe dos argumentos. El número de schedulers devuelto indica cuántos schedulers normales están habilitados; no es la cantidad de procesos ni garantiza que todos estén ocupados. <code>:reductions</code> es otra etiqueta constante, y su valor es una medida acumulada aproximada del trabajo del proceso, no un reloj ni una medida directa de segundos.</p>
</div>
<div class="paragraph">
<p>Por eso, concurrencia y paralelismo no son sinónimos: con un scheduler, varios procesos pueden progresar intercalados; con más de un scheduler y núcleos disponibles, algunos también pueden ejecutarse literalmente al mismo tiempo.</p>
</div>
<div class="sect3">
<h4 id="_anatomía_de_un_proceso_beam"><a class="anchor" href="#_anatomía_de_un_proceso_beam"></a>Anatomía de un proceso BEAM</h4>
<div class="paragraph">
<p>De forma conceptual, cada proceso mantiene memoria de ejecución propia y metadatos que el runtime necesita para administrarlo. El diagrama resume los componentes principales:</p>
</div>
<div class="imageblock">
<div class="content">
<img src="/iasc-book/img/erl_process.png" alt="Componentes conceptuales de un proceso de BEAM" width="700">
</div>
</div>
<div class="ulist">
<ul>
<li>
<p>El <strong>stack</strong> ayuda a mantener la información necesaria durante las llamadas a funciones y para continuar la ejecución.</p>
</li>
<li>
<p>El <strong>heap</strong> contiene datos construidos por el proceso, por ejemplo, tuplas y listas. La memoria y la recolección de basura son principalmente locales al proceso.</p>
</li>
<li>
<p>El <strong>mailbox</strong> almacena los mensajes que el proceso recibió y todavía no procesó. El proceso puede esperar en <code>receive</code> hasta encontrar un mensaje que coincida con algún patrón.</p>
</li>
<li>
<p>Los metadatos de control del proceso incluyen información que BEAM necesita para planificarlo y mantener relaciones como links. El PID permite identificar y referirse al proceso, pero no es el proceso en sí.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La ilustración es un esquema conceptual, no un plano exacto de memoria ni una equivalencia con el <strong>Process Control Block</strong> de un proceso del sistema operativo. Los detalles internos y su representación pueden variar entre versiones de la VM.</p>
</div>
<div class="paragraph">
<p>Un proceso no permanece vivo por el solo hecho de haber sido creado: termina cuando termina la función que está ejecutando. Para que pueda atender varios mensajes a lo largo del tiempo, su comportamiento debe esperar mensajes y continuar luego de procesarlos. Vamos a construir esa idea paso a paso: primero veremos un proceso que termina enseguida; después, quiénes son el emisor y el receptor, qué pasa con los mensajes y, por último, cómo un proceso puede quedarse esperando nuevas acciones.</p>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_abrir_iex_con_el_proyecto"><a class="anchor" href="#_abrir_iex_con_el_proyecto"></a>Abrir IEx con el proyecto</h3>
<div class="paragraph">
<p>Desde una terminal, ubicándose en el directorio <code>intro_actors</code> del repositorio de la clase, se puede iniciar el intérprete cargando el proyecto Mix:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-console" data-lang="console">iex -S mix</code></pre>
</div>
</div>
<div class="paragraph">
<p>IEx permite evaluar expresiones, llamar funciones y observar sus resultados. <code>mix</code> compila y carga el código del proyecto para que los módulos estén disponibles. Si se abre IEx sin <code>-S mix</code>, siguen disponibles las funciones del lenguaje y del runtime, pero no necesariamente los módulos del proyecto.</p>
</div>
<div class="sect3">
<h4 id="_módulos_y_funciones"><a class="anchor" href="#_módulos_y_funciones"></a>Módulos y funciones</h4>
<div class="paragraph">
<p>En Elixir, un <strong>módulo</strong> agrupa funciones relacionadas bajo un nombre. Por ejemplo, <code>Process.alive?(pid)</code> llama a la función <code>alive?/1</code> del módulo <code>Process</code>; el punto separa el módulo de la función. <code>alive?/1</code> recibe un argumento, el PID, y el <code>?</code> es parte de su nombre. La notación <code>/1</code> indica que la función recibe un argumento.</p>
</div>
<div class="paragraph">
<p>Un módulo propio se define con <code>defmodule</code>, y las funciones públicas que contiene se definen con <code>def</code>. Por ejemplo, este módulo agrupa una función que imprime un saludo con <code>IO.puts/1</code>:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule Saludo do
  def decir_hola do
    IO.puts("Hola")
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>Una función del módulo se invoca escribiendo el nombre del módulo, un punto y el nombre de la función: <code>Saludo.decir_hola()</code>. Los paréntesis vacíos <code>()</code> indican que no se pasan argumentos; por eso también se la puede describir como <code>decir_hola/0</code>. Algunas funciones básicas, como <code>spawn/1</code>, <code>send/2</code> y <code>self/0</code>, se pueden llamar sin escribir el nombre de un módulo porque Elixir las importa por defecto. Los módulos organizan código, pero no son procesos: un proceso es una ejecución activa en BEAM. Al invocar una función, esta se ejecuta dentro del proceso que hizo la llamada, salvo que explícitamente se cree otro proceso, por ejemplo, con <code>spawn/1</code>.</p>
</div>
<div class="paragraph">
<p>El proyecto carga el módulo <code>IntroActors</code>, definido con <code>defmodule IntroActors do &#8230;&#8203; end</code>. Sus funciones <code>start/0</code> y <code>loop/0</code> son parte del código del módulo; cuando se llama a <code>IntroActors.start()</code>, esa función crea otro proceso y devuelve su PID. Más adelante veremos qué hace ese proceso.</p>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_crear_procesos_y_observar_su_vida"><a class="anchor" href="#_crear_procesos_y_observar_su_vida"></a>Crear procesos y observar su vida</h3>
<div class="paragraph">
<p>Empecemos con la operación más sencilla: darle una función a <code>spawn/1</code>. El runtime crea un proceso nuevo, comienza a ejecutar la función en él y nos devuelve su PID:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">succ = fn -&gt; 1 + 1 end
pid = spawn(succ)
Process.alive?(pid)
# Puede dar false: la función ya terminó.</code></pre>
</div>
</div>
<div class="paragraph">
<p>En <code>succ = &#8230;&#8203;</code>, el signo <code>=</code> vincula el nombre <code>succ</code> con el valor de la derecha; las variables de Elixir no se modifican luego en el lugar. <code>fn &#8594; 1 + 1 end</code> crea una función anónima (sin nombre propio) y la guarda en esa variable. No recibe argumentos, calcula <code>1 + 1</code> y devuelve el resultado. <code>spawn/1</code> recibe esa función, crea un proceso nuevo para ejecutarla y devuelve su PID, que queda vinculado al nombre <code>pid</code>. <code>Process.alive?/1</code> consulta si ese proceso sigue activo.</p>
</div>
<div class="paragraph">
<p>Como el cálculo termina enseguida, el proceso también termina. Por eso <code>Process.alive?(pid)</code> puede devolver <code>true</code> o <code>false</code> según si el proceso alcanzó a terminar antes de la consulta; normalmente ya habrá terminado. El PID sirve para identificar al proceso, pero no lo mantiene vivo. Esto nos deja una pregunta para el siguiente paso: ¿qué proceso está ejecutando las expresiones que escribimos en IEx?</p>
</div>
<div class="paragraph">
<p><code>self/0</code> devuelve el PID del proceso que ejecuta la expresión. El <code>/0</code> indica que la función no recibe argumentos. IEx también corre dentro de un proceso de BEAM, así que la consola puede observar su propio PID:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">self()
Process.alive?(self())</code></pre>
</div>
</div>
<div class="paragraph">
<p>La expresión <code>Process.alive?(self())</code> pregunta si el PID de la consola corresponde a un proceso que sigue activo. <code>Process</code> es un módulo de la biblioteca estándar de Elixir. Las funciones cuyo nombre termina en <code>?</code> suelen responder <code>true</code> o <code>false</code>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_enviar_mensajes_y_revisar_el_buzón"><a class="anchor" href="#_enviar_mensajes_y_revisar_el_buzón"></a>Enviar mensajes y revisar el buzón</h3>
<div class="paragraph">
<p>Todo proceso tiene su propio buzón. Para verlo en acción, enviemos un mensaje a la propia consola. <code>send/2</code> recibe dos argumentos: el destinatario y el contenido del mensaje. Lo coloca en el buzón de ese destinatario y devuelve el mensaje enviado; ese valor de retorno no confirma que otro proceso ya lo haya recibido o procesado. <code>:hola</code> es un átomo: un valor constante que usamos aquí como etiqueta del mensaje.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">send(self(), :hola)
flush()</code></pre>
</div>
</div>
<div class="paragraph">
<p><code>flush/0</code> es una comodidad provista por la consola IEx para mostrar y retirar los mensajes pendientes del buzón de la propia consola. No es una función general del lenguaje disponible para cualquier proceso de una aplicación. En el código de los procesos, la recepción y el manejo de mensajes se hacen explícitamente con <code>receive</code>, que recorre el buzón y procesa el primer mensaje que coincide con alguna cláusula; los mensajes que no coinciden quedan pendientes. <code>receive</code> puede esperar si todavía no hay una coincidencia, y el bloque <code>after</code> permite ponerle un límite a esa espera. En el siguiente ejemplo, <code>{&#8230;&#8203;}</code> forma una tupla que agrupa la etiqueta y el contenido del mensaje. <code>message</code> es un nombre nuevo que queda vinculado al segundo elemento cuando se recibe una tupla que coincide:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">send(self(), {:hello, "world"})

receive do
  {:hello, message} -&gt; message
  {:world, _message} -&gt; "no coincide"
after
  1_000 -&gt; "No llegó un mensaje coincidente en un segundo"
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>En cada cláusula, <code>:hello</code> o <code>:world</code> identifica qué mensaje se espera. En la primera, <code>message</code> se vincula al texto recibido. En la segunda, <code>_message</code> indica que hay un segundo elemento, pero no se va a usar; el guion bajo inicial sirve para señalarlo. Si no llega un mensaje coincidente en un segundo, se ejecuta la cláusula <code>after</code>.</p>
</div>
<div class="paragraph">
<p>El timeout no significa que el buzón se haya vaciado: los mensajes que no coincidieron pueden permanecer allí. Ya tenemos las piezas principales del intercambio —un buzón y un proceso que elige qué mensajes procesar—; ahora hagamos que intervengan dos procesos.</p>
</div>
</div>
<div class="sect2">
<h3 id="_comunicación_entre_dos_procesos"><a class="anchor" href="#_comunicación_entre_dos_procesos"></a>Comunicación entre dos procesos</h3>
<div class="paragraph">
<p>En este ejemplo IEx será el receptor y un proceso nuevo será el emisor. <code>parent = self()</code> guarda en la variable <code>parent</code> el PID de IEx; esa variable queda disponible dentro de la función anónima que ejecuta el proceso hijo. <code>spawn/1</code> devuelve el PID del hijo. El proceso nuevo le envía al padre un mensaje con su propio PID:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">parent = self()

child = spawn(fn -&gt;
  send(parent, {:hola, self()})
end)

receive do
  {:hola, child_pid} -&gt;
    "Recibí un mensaje de #{inspect(child_pid)}"
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>El proceso hijo envía <code>{:hola, su_pid}</code> al proceso que guardó el PID del padre. La tupla tiene dos elementos: el átomo <code>:hola</code> y el PID del hijo. Dentro de la función anónima, <code>parent</code> sigue refiriéndose al PID que guardamos antes de crear al hijo; las funciones anónimas pueden usar valores definidos en el lugar donde se crean. <code>self()</code> dentro de esa función devuelve el PID del proceso hijo. En el patrón <code>{:hola, child_pid}</code>, el padre busca una tupla cuyo primer elemento sea el átomo <code>:hola</code> y vincula el segundo elemento al nombre <code>child_pid</code>. <code>child</code> contiene el PID que devolvió <code>spawn/1</code>; en este ejemplo no hace falta usarlo porque el padre reconoce el mensaje por su contenido. Además, el proceso hijo termina al terminar su función: hizo un trabajo puntual, no quedó funcionando como receptor.</p>
</div>
</div>
<div class="sect2">
<h3 id="_concurrencia_y_orden_de_ejecución"><a class="anchor" href="#_concurrencia_y_orden_de_ejecución"></a>Concurrencia y orden de ejecución</h3>
<div class="paragraph">
<p>Ahora iniciemos varios procesos que hacen el mismo trabajo:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">report = fn number -&gt;
  Process.sleep(50)
  IO.puts(number)
end

for number &lt;- 1..10 do
  spawn(fn -&gt; report.(number) end)
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>El <code>for number &#8592; 1..10 do &#8230;&#8203; end</code> repite el bloque una vez por cada número del rango <code>1..10</code>, vinculando ese número a <code>number</code> en cada repetición. Así inicia diez procesos independientes. Cada uno queda listo para que un scheduler de BEAM lo ejecute; no hay una correspondencia fija entre cada proceso creado y un scheduler particular. Como la planificación y el tiempo de ejecución de cada uno no están sincronizados, el orden de las líneas impresas puede variar. <code>Process.sleep/1</code> pausa ese proceso durante el tiempo indicado en milisegundos; mientras tanto, el scheduler puede ejecutar otros procesos. La pausa no establece un orden garantizado. Este ejemplo nos deja ver concurrencia y scheduling, pero todavía son diez tareas puntuales, no un actor que atiende pedidos durante toda su vida.</p>
</div>
<div class="paragraph">
<p>Si el orden importa, el programa tiene que expresarlo mediante un protocolo, por ejemplo, esperando una respuesta antes de iniciar el siguiente trabajo. No conviene inferir un orden de ejecución por el orden en que se llamó a <code>spawn/1</code>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_inspeccionar_procesos_y_sus_relaciones"><a class="anchor" href="#_inspeccionar_procesos_y_sus_relaciones"></a>Inspeccionar procesos y sus relaciones</h3>
<div class="paragraph">
<p>Antes de construir ese actor, podemos inspeccionar qué está haciendo un proceso. <code>Process.info/2</code> permite consultar, entre otras cosas, el estado, la longitud de su buzón, la función actual, los procesos vinculados y las reductions acumuladas:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">Process.info(self(), [:status, :message_queue_len, :current_function, :links, :reductions])</code></pre>
</div>
</div>
<div class="paragraph">
<p>La función <code>:shell_default.i()</code> que aparece en algunos ejemplos de la clase lista procesos en la shell Erlang; su salida y disponibilidad dependen de la versión y de la shell utilizada. Para inspección visual también se puede iniciar Observer con <code>:observer.start()</code> cuando el entorno gráfico está disponible. <code>inspect/1</code>, que usamos en el ejemplo siguiente, convierte valores como un PID a una representación legible para imprimir.</p>
</div>
<div class="paragraph">
<p>Un proceso creado con <code>spawn/1</code> no queda vinculado al proceso que lo creó. Si falla, el padre no recibe automáticamente la excepción como si fuera una llamada ordinaria. <code>spawn_link/1</code> crea el proceso y un <strong>link</strong> entre ambos: las señales de salida se propagan de acuerdo con las reglas de links. Si uno termina por una falla, la señal puede terminar también al otro proceso, salvo que este esté configurado para atrapar señales de salida. El manejo explícito de esas señales se verá más adelante.</p>
</div>
</div>
<div class="sect2">
<h3 id="_módulo_introactors_recepción_continua_de_mensajes"><a class="anchor" href="#_módulo_introactors_recepción_continua_de_mensajes"></a>Módulo <code>IntroActors</code>: recepción continua de mensajes</h3>
<div class="paragraph">
<p>Hasta acá creamos procesos para hacer un cálculo y terminar, enviamos mensajes a la consola, y vimos un proceso hijo que envía una sola notificación y finaliza. Ahora queremos algo distinto: un proceso que siga disponible para atender varias acciones. El módulo <code>IntroActors</code> del repositorio de la clase implementa ese ciclo. Veamos el código:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule IntroActors do
  def start do
    spawn(fn -&gt; loop() end)
  end

  def start_link do
    spawn_link(fn -&gt; loop() end)
  end

  def loop do
    receive do
      {_from, :camina} -&gt;
        IO.puts("Jose empieza a caminar. Proceso #{inspect(self())}")

      {_from, :corre} -&gt;
        IO.puts("Ni ahi. Proceso #{inspect(self())}")

      {pid, _} -&gt;
        send(pid, {:error, "Accion Invalida de #{inspect(pid)}"})

      _ -&gt;
        IO.puts("Accion Invalida...")
    end

    loop()
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p><code>start/0</code> crea un proceso sin vincularlo al proceso que lo inicia; <code>start_link/0</code> hace lo mismo, pero establece un link. Ambas funciones ejecutan <code>loop/0</code> dentro del proceso nuevo y devuelven el PID que permite enviarle mensajes. Fijate en la distinción: <code>IntroActors</code> es el módulo que contiene las definiciones de funciones; el proceso es la ejecución que se crea al llamar a <code>start/0</code> o <code>start_link/0</code>. Si el proceso termina por un error, el link creado por <code>start_link/0</code> afecta cómo se propaga la señal de salida al proceso vinculado.</p>
</div>
<div class="paragraph">
<p><code>loop/0</code> queda esperando en <code>receive</code>. Las primeras cláusulas reconocen tuplas de dos elementos cuyo segundo elemento es <code>:camina</code> o <code>:corre</code>; <code><em>from</code> indica que hay un primer valor —en este protocolo, el PID del remitente—, pero que esas cláusulas no lo usan. La tercera cláusula acepta cualquier otra tupla de dos elementos, toma el primer elemento como destinatario de una respuesta de error y asume que es un PID válido. La cláusula final, <code></em></code>, es un comodín que acepta cualquier mensaje con otra forma. En un programa más robusto convendría validar el mensaje y definir qué hacer si el supuesto PID no es válido.</p>
</div>
<div class="paragraph">
<p><code>IO.puts/1</code> imprime una línea en la consola. La expresión <code><mark>{&#8230;&#8203;}</code> inserta el resultado de una expresión dentro del texto; por eso <code></mark>{inspect(self())}</code> muestra el PID del proceso actor. En los patrones, <code><em>from</code> significa que hay un valor en esa posición, pero que no se va a usar. En cambio, <code></em></code> solo es un comodín: acepta cualquier valor sin asignarlo a un nombre. Al terminar la cláusula, la recursión vuelve a ejecutar <code>loop/0</code> y el proceso espera otro mensaje. Como la llamada recursiva es la última operación de la función, BEAM puede reutilizar el contexto en vez de acumular una llamada nueva por cada mensaje.</p>
</div>
<div class="paragraph">
<p>Para probar el módulo, iniciamos el actor y usamos el mismo PID para enviarle distintas acciones:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">pid = IntroActors.start()
send(pid, {self(), :camina})</code></pre>
</div>
</div>
<div class="paragraph">
<p>El mensaje contiene el PID del emisor (<code>self()</code>) y la acción solicitada (<code>:camina</code>). El proceso imprime la acción y vuelve a esperar. Podemos probar otra acción sobre el mismo PID:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">send(pid, {self(), :corre})</code></pre>
</div>
</div>
<div class="paragraph">
<p>El proceso no crea un hilo propio ni necesita que el emisor espere a que termine el trabajo. El scheduler de BEAM lo ejecuta cuando está listo; mientras espera en <code>receive</code>, no consume continuamente tiempo de scheduler. Así construimos una unidad concurrente que tiene identidad, recibe mensajes, decide cómo procesarlos y conserva su comportamiento entre mensajes: un proceso con el comportamiento de un actor.</p>
</div>
<div class="paragraph">
<p>El material completo de los ejemplos interactivos está en el <a href="https://github.com/arquitecturas-concurrentes/iasc-actors-intro-elixir/blob/master/intro_actors/lib/intro_consola._ex">archivo intro_consola._ex</a>.</p>
</div>
</div>
</div>
</div>`;export{e as default};