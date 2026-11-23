var e=`<div class="sect1">
<h2 id="_introducción_a_otp"><a class="anchor" href="#_introducción_a_otp"></a>Introducción a OTP</h2>
<div class="sectionbody">
<div class="paragraph">
<p>OTP (Open Telecom Platform) es el conjunto de bibliotecas, herramientas y principios de diseño que acompaña a Erlang/BEAM y que también se usa desde Elixir. No es otro lenguaje ni un único framework: ofrece comportamientos y convenciones para implementar procesos, componer aplicaciones y definir qué hacer cuando un proceso termina de forma inesperada. Por ejemplo, al usar <code>GenServer</code> se escriben los callbacks que describen el comportamiento del servidor y OTP se ocupa del bucle de recepción y de la interacción estándar con ese proceso.</p>
</div>
<div class="paragraph">
<p>El modelo de actores ayuda a entender la idea central: procesos aislados que colaboran mediante mensajes. OTP no cambia esa forma de comunicación; ofrece piezas para no tener que resolver desde cero tareas comunes como mantener estado (<code>Agent</code>), atender solicitudes (<code>GenServer</code>), ejecutar un trabajo acotado (<code>Task</code>), iniciar procesos (<code>Application</code>), supervisar su ciclo de vida (<code>Supervisor</code>) o encontrarlos por un nombre (<code>Registry</code>). Estas piezas tienen funciones distintas y suelen combinarse: una aplicación inicia un árbol de supervisión, el supervisor inicia los procesos de trabajo y un registro permite localizarlos cuando no se quiere depender de conocer directamente su PID.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_una_aplicación_otp_como_árbol_de_procesos"><a class="anchor" href="#_una_aplicación_otp_como_árbol_de_procesos"></a>Una aplicación OTP como árbol de procesos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La arquitectura típica de una aplicación OTP se puede leer como una cadena de responsabilidades:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p><strong>Application</strong> es el punto de entrada del ciclo de vida de la aplicación.</p>
</li>
<li>
<p>La aplicación inicia un supervisor raíz.</p>
</li>
<li>
<p>El supervisor inicia procesos hijos, como servidores, agentes, tareas o incluso otros supervisores.</p>
</li>
<li>
<p>Los procesos de trabajo implementan la lógica y se comunican mediante mensajes; si un proceso termina, el supervisor aplica la política de reinicio declarada para ese hijo.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>Esta estructura se llama <strong>árbol de supervisión</strong>. Es importante porque el modo de iniciar un proceso queda declarado junto con el resto de la arquitectura, en vez de dispersarse en llamadas manuales por el código. Los comportamientos de OTP definen contratos de callbacks: el programador escribe las funciones que describen la lógica de la aplicación y el runtime ejecuta el ciclo de vida común alrededor de ellas. Este diseño y sus principios se explican en la guía de <a href="https://www.erlang.org/doc/system/design_principles.html">principios de diseño de OTP</a> <a href="#OTPDesignPrinciples" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OTPDesignPrinciples]</a>.</p>
</div>
<div class="paragraph">
<p>Supervisar no significa que OTP pueda corregir cualquier error ni que los procesos no fallen. El supervisor decide cómo continuar cuando un hijo termina; la aplicación debe definir qué fallas ameritan reinicio, qué estado puede reconstruirse y qué efectos externos podrían repetirse. Reiniciar un proceso no revierte operaciones ya realizadas ni vuelve persistente su estado en memoria.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_genserver"><a class="anchor" href="#_genserver"></a>GenServer</h2>
<div class="sectionbody">
<div class="paragraph">
<p><code>GenServer</code> es un comportamiento de OTP para implementar un proceso servidor. El módulo define su estado inicial y callbacks que procesan solicitudes; OTP implementa el ciclo de vida y el bucle que recibe mensajes. Por convención, se separa la API pública del módulo —las funciones que usan sus clientes— de los callbacks que ejecuta el proceso servidor.</p>
</div>
<div class="paragraph">
<p>La llamada subyacente entre procesos sigue siendo por mensajes. <code>GenServer.call/3</code> implementa un intercambio de solicitud y respuesta: el cliente espera la respuesta o un timeout, mientras el servidor procesa la solicitud en <code>handle_call/3</code>. En cambio, <code>GenServer.cast/2</code> envía una solicitud asincrónica sin esperar una respuesta; el cliente no obtiene confirmación de que la operación se haya procesado.</p>
</div>
<div class="paragraph">
<p>Por eso, se elige <code>call</code> cuando el cliente necesita una respuesta para continuar; <code>cast</code> sirve cuando no necesita respuesta inmediata y el protocolo puede tolerar que el emisor no sepa si el servidor procesó el mensaje. Un timeout de <code>call</code> indica que no se recibió la respuesta a tiempo, pero no demuestra que la operación no se haya ejecutado: el servidor podría haberla procesado y la respuesta haberse demorado. Las llamadas y los casts se procesan en el orden en que llegan al servidor, pero no establecen un orden global respecto de mensajes enviados por otros procesos.</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>handle_call/3</code> devuelve una tupla como <code>{:reply, respuesta, nuevo_estado}</code>.</p>
</li>
<li>
<p><code>handle_cast/2</code> devuelve, por ejemplo, <code>{:noreply, nuevo_estado}</code>.</p>
</li>
<li>
<p><code>handle_info/2</code> procesa otros mensajes recibidos por el proceso, por ejemplo los enviados con <code>send/2</code>.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>En cada callback se devuelve el estado con el que continuará el servidor. Como un proceso maneja sus callbacks de forma secuencial, el estado no se modifica directamente desde el cliente.</p>
</div>
<div class="sect2">
<h3 id="_ejemplo_contador_de_likes"><a class="anchor" href="#_ejemplo_contador_de_likes"></a>Ejemplo: contador de likes</h3>
<div class="paragraph">
<p>Este ejemplo sigue el <code>Post</code> que usamos en la clase. El servidor mantiene el número de likes; los clientes pueden incrementarlo sin esperar una respuesta y consultar el valor mediante una llamada:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule Post do
  use GenServer

  def start_link(initial_likes) do
    GenServer.start_link(__MODULE__, initial_likes, name: __MODULE__)
  end

  @impl true
  def init(initial_likes), do: {:ok, initial_likes}

  def like, do: GenServer.cast(__MODULE__, :like)
  def likes, do: GenServer.call(__MODULE__, :get)

  @impl true
  def handle_cast(:like, likes) do
    {:noreply, likes + 1}
  end

  @impl true
  def handle_call(:get, _from, likes) do
    {:reply, likes, likes}
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p><code>start_link/1</code> inicia el proceso vinculado al proceso que lo inicia y lo registra localmente con el nombre <code>Post</code>. <code>init/1</code> establece el estado inicial. <code>like/0</code> envía un cast y retorna sin esperar que el contador se actualice; <code>likes/0</code> hace un call y devuelve el valor procesado por el servidor. En una aplicación, normalmente el proceso se inicia como hijo de un supervisor.</p>
</div>
<div class="paragraph">
<p>Más información: <a href="https://hexdocs.pm/elixir/GenServer.html">documentación de GenServer</a> y <a href="https://elixir-lang.org/getting-started/mix-otp/genserver.html">guía de GenServer</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_agent"><a class="anchor" href="#_agent"></a>Agent</h2>
<div class="sectionbody">
<div class="paragraph">
<p><code>Agent</code> es una abstracción más directa para un proceso cuyo propósito principal es mantener estado. El estado permanece encapsulado en el proceso y se consulta o actualiza mediante funciones como <code>Agent.get/3</code> y <code>Agent.update/3</code>. Conviene cuando la lógica de transición es sencilla; si el proceso necesita un protocolo más elaborado, callbacks específicos o manejar varios tipos de mensajes, <code>GenServer</code> suele ser más apropiado.</p>
</div>
<div class="paragraph">
<p>Este ejemplo modela un mapa en memoria y está basado en el <code>KV.Agent</code> de la clase:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule KV.Agent do
  def start_link do
    Agent.start_link(fn -&gt; %{} end)
  end

  def get(agent, key) do
    Agent.get(agent, &amp;Map.get(&amp;1, key))
  end

  def put(agent, key, value) do
    Agent.update(agent, &amp;Map.put(&amp;1, key, value))
  end
end

{:ok, pid} = KV.Agent.start_link()
KV.Agent.put(pid, :hello, :world)
KV.Agent.get(pid, :hello)
# :world</code></pre>
</div>
</div>
<div class="paragraph">
<p>El estado de un <code>Agent</code> vive en memoria: no se persiste automáticamente en disco. Si el proceso termina y se reinicia, vuelve al estado que indique su inicialización, salvo que la aplicación recupere el estado desde otro lugar. Un Agent también puede ser iniciado y supervisado como hijo de un supervisor.</p>
</div>
<div class="paragraph">
<p>Más información: <a href="https://hexdocs.pm/elixir/Agent.html">documentación de Agent</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_task"><a class="anchor" href="#_task"></a>Task</h2>
<div class="sectionbody">
<div class="paragraph">
<p><code>Task</code> representa trabajo que se ejecuta concurrentemente y tiene un principio y un fin; no es una abstracción para almacenar estado de largo plazo. Para obtener un resultado, <code>Task.async/1</code> inicia una tarea vinculada al proceso que la crea y devuelve una referencia; <code>Task.await/2</code> espera su respuesta:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">task = Task.async(fn -&gt; Enum.sum(1..10) end)
Task.await(task)
# 55</code></pre>
</div>
</div>
<div class="paragraph">
<p>La espera de <code>await</code> ocurre en el proceso cliente; la tarea corre en otro proceso. Si la tarea falla, <code>await</code> vuelve a levantar la excepción en quien espera. <code>Task.start/1</code> inicia trabajo asincrónico sin recolectar un resultado mediante <code>await</code>. Cuando una tarea debe formar parte del ciclo de vida de una aplicación, <code>Task.start_link/1</code> o una especificación de hijo de <code>Task</code> permiten vincularla al proceso iniciador o iniciarla bajo supervisión, según el caso. Las tareas vinculadas propagan señales de salida de acuerdo con las reglas de links; para aislar y controlar fallas en aplicaciones, se debe elegir conscientemente la estrategia de inicio y supervisión.</p>
</div>
<div class="paragraph">
<p>En el proyecto de la clase, <code>IASC.WriteHaiku</code> usa una tarea para escribir o leer un archivo. Es un trabajo finito: una vez terminada la operación, el proceso de la tarea termina. El ejemplo puede consultarse en el <a href="https://github.com/arquitecturas-concurrentes/iasc-actors-intro-elixir/blob/master/intro_actors/lib/intro_task.ex">código de Task</a>.</p>
</div>
<div class="paragraph">
<p>Más información: <a href="https://hexdocs.pm/elixir/Task.html">documentación de Task</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_application_registry_y_ets"><a class="anchor" href="#_application_registry_y_ets"></a>Application, Registry y ETS</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_application"><a class="anchor" href="#_application"></a>Application</h3>
<div class="paragraph">
<p>En Elixir, una <strong>aplicación OTP</strong> es una unidad de software con configuración, dependencias y un ciclo de vida definido. No debe confundirse con un proceso: una aplicación puede iniciar y coordinar muchos procesos.</p>
</div>
<div class="paragraph">
<p>El comportamiento <code>Application</code> proporciona el punto de entrada de ese ciclo de vida. Al arrancar la aplicación, OTP llama a <code>start/2</code> del módulo configurado para ella. Habitualmente, ese callback inicia y devuelve el supervisor raíz; el supervisor, a su vez, inicia los procesos que la aplicación necesita. Así, al iniciar una aplicación con Mix, no hace falta crear manualmente cada proceso desde la consola: el árbol de supervisión describe qué debe arrancar. Al detener la aplicación, OTP también coordina el cierre de esos procesos.</p>
</div>
<div class="paragraph">
<p>La configuración de Mix indica qué módulo implementa el callback de inicio y qué otras aplicaciones son dependencias. OTP inicia primero las dependencias y luego llama a <code>start/2</code>; al apagar, detiene la aplicación y sus procesos de forma coordinada. En proyectos reales, el árbol raíz suele incluir componentes compartidos por toda la aplicación, como un <code>Registry</code>, un <code>DynamicSupervisor</code> y servidores de larga duración. El callback de <code>Application</code> normalmente se limita a construir y arrancar ese árbol.</p>
</div>
<div class="paragraph">
<p>Una aplicación pequeña puede empezar con un módulo que implemente <code>Application</code> y un supervisor. Para que el ejemplo sea autocontenido, el supervisor inicia un <code>Agent</code> que mantiene un mapa en memoria:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule MiApp.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Agent, fn -&gt; %{} end}
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: MiApp.Supervisor)
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>En este ejemplo, <code>start/2</code> no crea directamente el proceso con <code>Agent.start_link/1</code>: declara una especificación de hijo para que el supervisor lo inicie y gestione. La aplicación y el supervisor cumplen roles distintos: <code>Application</code> conecta el arranque de la aplicación con su supervisor raíz; <code>Supervisor</code> administra los procesos hijos. En una aplicación real, un módulo propio puede envolver ese Agent y ofrecer una API con nombre para consultarlo.</p>
</div>
<div class="paragraph">
<p>Más información: <a href="https://hexdocs.pm/elixir/Application.html">documentación de Application</a> y <a href="https://elixir-lang.org/getting-started/mix-otp/supervisor-and-application.html">guía de aplicaciones y supervisores</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_registry"><a class="anchor" href="#_registry"></a>Registry</h3>
<div class="paragraph">
<p><code>Registry</code> asocia claves locales a procesos para que los clientes puedan encontrarlos sin guardar directamente sus PID. Las claves pueden ser <code>:unique</code> o <code>:duplicate</code>; la primera opción sirve para nombres de servidor y la segunda permite patrones como suscripciones. Un Registry no almacena el estado de negocio ni persiste sus entradas. En una aplicación suele iniciarse bajo supervisión y antes que los procesos que se registran en él.</p>
</div>
<div class="paragraph">
<p>Para una explicación detallada de <code>:via</code>, claves únicas y duplicadas, despacho, supervisión dinámica y comportamiento ante fallas, véase <a href="https://arquitecturas-concurrentes.github.io/iasc-book/registry_elixir">Registry en Elixir: nombres y localización de procesos</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_ets"><a class="anchor" href="#_ets"></a>ETS</h3>
<div class="paragraph">
<p>ETS (Erlang Term Storage) ofrece tablas en memoria para almacenar y consultar datos desde procesos. A diferencia de <code>Agent</code>, que presenta una interfaz de proceso para leer o actualizar un estado, ETS ofrece operaciones directas sobre una tabla y permite distintos patrones de acceso concurrente. La tabla y sus datos siguen siendo volátiles: su ciclo de vida está asociado a quien la posee y no se persisten automáticamente en disco.</p>
</div>
<div class="paragraph">
<p>Más información: <a href="https://elixir-lang.org/getting-started/mix-otp/ets.html">guía de ETS</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_supervisores"><a class="anchor" href="#_supervisores"></a>Supervisores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un supervisor es un proceso OTP que inicia y supervisa procesos hijos de acuerdo con sus especificaciones. Los supervisores pueden organizarse en árboles: la aplicación inicia un supervisor raíz, que a su vez puede iniciar otros supervisores y procesos de trabajo. Así se declara cómo se inician, se detienen y se reinician los componentes cuando fallan.</p>
</div>
<div class="paragraph">
<p>Cada hijo tiene una especificación (child spec) que describe cómo iniciarlo y qué política de reinicio y apagado aplicar. La estrategia determina qué hijos reiniciar ante una falla. Por ejemplo, <code>:one_for_one</code> reinicia solo al hijo que falló; <code>:one_for_all</code> reinicia a todos los hijos del supervisor; y <code>:rest_for_one</code> reinicia al hijo fallido y a los que fueron iniciados después de él. El orden de los hijos, por lo tanto, importa en las dos últimas estrategias: al iniciar, se recorren en orden; al apagar, se detienen en orden inverso.</p>
</div>
<div class="paragraph">
<p>La política <code>:permanent</code> intenta reiniciar el hijo ante cualquier terminación, <code>:temporary</code> no lo reinicia y <code>:transient</code> lo reinicia solo si terminó por una razón anormal. Además, el supervisor limita la cantidad de reinicios dentro de una ventana de tiempo; si se supera el límite, el propio supervisor termina para que el fallo no genere un ciclo de reinicios ilimitado. Un <code>DynamicSupervisor</code> permite iniciar hijos dinámicamente después de que el supervisor ya está en marcha; para hijos conocidos al iniciar, se declaran especificaciones en el supervisor habitual.</p>
</div>
<div class="paragraph">
<p>La supervisión no restaura automáticamente el estado que tenía un proceso antes de terminar. Si se reinicia un <code>GenServer</code> o un <code>Agent</code>, este se inicializa de nuevo; si el estado debe sobrevivir a una falla, hay que persistirlo o reconstruirlo explícitamente. Por eso, la política de reinicio y la recuperación del estado son decisiones distintas.</p>
</div>
<div class="paragraph">
<p>Más información: <a href="https://hexdocs.pm/elixir/Supervisor.html">Supervisor</a> y <a href="https://hexdocs.pm/elixir/DynamicSupervisor.html">DynamicSupervisor</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="OTPDesignPrinciples"></a>[OTPDesignPrinciples] ERLANG/OTP. <a href="https://www.erlang.org/doc/system/design_principles.html"><em>Design Principles</em></a> — principios y estructura de aplicaciones OTP, árboles de supervisión y recuperación ante fallas.</p>
</li>
<li>
<p><a id="ElixirGenServer"></a>[ElixirGenServer] ELIXIR. <a href="https://hexdocs.pm/elixir/GenServer.html">Documentación de <code>GenServer</code></a>.</p>
</li>
<li>
<p><a id="ElixirAgent"></a>[ElixirAgent] ELIXIR. <a href="https://hexdocs.pm/elixir/Agent.html">Documentación de <code>Agent</code></a>.</p>
</li>
<li>
<p><a id="ElixirTask"></a>[ElixirTask] ELIXIR. <a href="https://hexdocs.pm/elixir/Task.html">Documentación de <code>Task</code></a>.</p>
</li>
<li>
<p><a id="ElixirApplication"></a>[ElixirApplication] ELIXIR. <a href="https://hexdocs.pm/elixir/Application.html">Documentación de <code>Application</code></a>.</p>
</li>
<li>
<p><a id="ElixirSupervisor"></a>[ElixirSupervisor] ELIXIR. <a href="https://hexdocs.pm/elixir/Supervisor.html">Documentación de <code>Supervisor</code></a>.</p>
</li>
<li>
<p><a id="ElixirDynamicSupervisor"></a>[ElixirDynamicSupervisor] ELIXIR. <a href="https://hexdocs.pm/elixir/DynamicSupervisor.html">Documentación de <code>DynamicSupervisor</code></a>.</p>
</li>
<li>
<p><a id="ElixirRegistry"></a>[ElixirRegistry] ELIXIR. <a href="https://hexdocs.pm/elixir/Registry.html">Documentación de <code>Registry</code></a>.</p>
</li>
<li>
<p><a id="ElixirMixOTP"></a>[ElixirMixOTP] ELIXIR. <a href="https://elixir-lang.org/getting-started/mix-otp/supervisor-and-application.html">Getting Started: Supervisor and Application</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};