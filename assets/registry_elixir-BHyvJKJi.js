var e=`<div class="sect1">
<h2 id="_registry_en_elixir_nombres_y_localización_de_procesos"><a class="anchor" href="#_registry_en_elixir_nombres_y_localización_de_procesos"></a>Registry en Elixir: nombres y localización de procesos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Cuando una aplicación inicia procesos, sus clientes necesitan alguna forma de encontrarlos. Se puede pasar el PID explícitamente, pero eso acopla al cliente con quien creó el proceso y obliga a distribuir ese identificador. <code>Registry</code> ofrece otra posibilidad: asociar una clave con el proceso que la registró y resolver esa clave cuando se necesita comunicarse con él.</p>
</div>
<div class="paragraph">
<p><code>Registry</code> es una estructura local a un nodo BEAM y sus entradas viven en memoria. No es una base de datos, no almacena el estado de los procesos y no permite localizar automáticamente procesos de otros nodos. Su responsabilidad es relacionar claves con procesos activos. Si el proceso termina, su entrada se elimina; si el Registry termina, la información de sus entradas también se pierde.</p>
</div>
<div class="paragraph">
<p>Esta página explica el uso de <code>Registry</code> con procesos nombrados, sus variantes de claves y cómo combinarlo con supervisores. Para el contexto de recuperación ante fallas, véase también <a href="https://arquitecturas-concurrentes.github.io/iasc-book/errores_supervision">Fallas y supervisión en Erlang/Elixir</a>.</p>
</div>
<div class="sect2">
<h3 id="_claves_únicas_y_duplicadas"><a class="anchor" href="#_claves_únicas_y_duplicadas"></a>Claves únicas y duplicadas</h3>
<div class="paragraph">
<p>El Registry se inicia con una política de claves:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>keys: :unique</code> permite asociar cada clave con un solo proceso. Es la opción apropiada para nombrar un servidor, por ejemplo, el proceso que administra una sesión o un recurso.</p>
</li>
<li>
<p><code>keys: :duplicate</code> permite que varios procesos se registren bajo la misma clave. Es útil para suscripciones o difusión local; la aplicación puede consultar o despachar a los procesos asociados.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Una instancia debe iniciarse normalmente como hijo de un supervisor. El ejemplo mínimo inicia un Registry de claves únicas:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">children = [
  {Registry, keys: :unique, name: MiApp.Registry}
]

Supervisor.start_link(children, strategy: :one_for_one)</code></pre>
</div>
</div>
<div class="paragraph">
<p>El nombre <code>MiApp.Registry</code> identifica al proceso que administra el registro. Las claves (<code>{:sesion, id}</code> en los ejemplos siguientes) son valores de Elixir y no tienen que coincidir con nombres de módulos.</p>
</div>
</div>
<div class="sect2">
<h3 id="_registrar_un_proceso_con_un_nombre_via"><a class="anchor" href="#_registrar_un_proceso_con_un_nombre_via"></a>Registrar un proceso con un nombre <code>:via</code></h3>
<div class="paragraph">
<p>Los comportamientos como <code>GenServer</code> aceptan nombres mediante el protocolo <code>:via</code>. La tupla <code>{:via, Registry, {nombre_del_registry, clave}}</code> indica que las operaciones al servidor deben resolver esa clave en el Registry:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule Sesion do
  use GenServer

  def start_link(session_id) do
    GenServer.start_link(__MODULE__, session_id,
      name: {:via, Registry, {MiApp.Registry, {:sesion, session_id}}}
    )
  end

  @impl true
  def init(session_id) do
    {:ok, %{id: session_id, datos: %{}}}
  end

  def id(session_id) do
    GenServer.call(
      {:via, Registry, {MiApp.Registry, {:sesion, session_id}}},
      :id
    )
  end

  @impl true
  def handle_call(:id, _from, state) do
    {:reply, state.id, state}
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>Al iniciar <code>Sesion</code> con un <code>session_id</code>, el proceso registra su propia clave. Los clientes pueden llamar a <code>Sesion.id/1</code> usando el identificador de sesión sin conocer ni guardar el PID. Si ya hay un proceso registrado con esa misma clave en un Registry <code>:unique</code>, el nuevo inicio falla con <code>{:error, {:already_started, pid}}</code>.</p>
</div>
<div class="paragraph">
<p>El registro no reenvía mensajes ni actúa como proxy: la función que usa el nombre resuelve el proceso y la comunicación ocurre con ese proceso. El Registry tampoco guarda el contenido del estado <code>%{id: &#8230;&#8203;, datos: &#8230;&#8203;}</code>; ese estado pertenece al <code>GenServer</code>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_procesos_dinámicos_registry_y_dynamicsupervisor"><a class="anchor" href="#_procesos_dinámicos_registry_y_dynamicsupervisor"></a>Procesos dinámicos: Registry y DynamicSupervisor</h3>
<div class="paragraph">
<p>Un supervisor estático es apropiado para los componentes que se conocen al iniciar la aplicación. Para crear procesos a demanda, como una instancia por sesión, se combina <code>Registry</code> con <code>DynamicSupervisor</code>: el supervisor dinámico administra el ciclo de vida de las instancias; el Registry permite encontrarlas por clave.</p>
</div>
<div class="paragraph">
<p>El orden de inicio importa: el Registry debe estar disponible antes de iniciar procesos que se registran en él. Un supervisor raíz puede iniciar ambos componentes en ese orden:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule MiApp.Supervisor do
  use Supervisor

  def start_link(_options) do
    Supervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @impl true
  def init(:ok) do
    children = [
      {Registry, keys: :unique, name: MiApp.Registry},
      {DynamicSupervisor, strategy: :one_for_one, name: MiApp.Sesiones}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>Con el árbol iniciado, se puede crear dinámicamente una sesión y dirigirse a ella por su nombre:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">{:ok, _root} = MiApp.Supervisor.start_link([])

{:ok, session_pid} =
  DynamicSupervisor.start_child(MiApp.Sesiones, {Sesion, "sesion-123"})

Sesion.id("sesion-123")
# "sesion-123"</code></pre>
</div>
</div>
<div class="paragraph">
<p>El PID devuelto puede ser útil para administrar esa instancia, por ejemplo, para detenerla con <code>DynamicSupervisor.terminate_child/2</code>. Para enviar solicitudes cotidianas, el cliente puede usar la clave y no depender de ese PID.</p>
</div>
</div>
<div class="sect2">
<h3 id="_claves_duplicadas_y_despacho"><a class="anchor" href="#_claves_duplicadas_y_despacho"></a>Claves duplicadas y despacho</h3>
<div class="paragraph">
<p>Con <code>keys: :duplicate</code>, varios procesos pueden registrar la misma clave. Esto puede servir para que procesos se suscriban a un tema. <code>Registry.dispatch/3</code> ejecuta un callback en el proceso que hace el despacho y le entrega las entradas asociadas; la función de callback decide qué hacer, por ejemplo, enviar un mensaje a cada PID:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">Registry.dispatch(MiApp.Eventos, :actualizaciones, fn entries -&gt;
  for {pid, _value} &lt;- entries do
    send(pid, {:actualizacion, :nueva})
  end
end)</code></pre>
</div>
</div>
<div class="paragraph">
<p>El Registry no entrega los mensajes por sí solo ni convierte el despacho en un protocolo confiable de publicación y suscripción. <code>send/2</code> es asincrónico y el emisor no obtiene confirmación de que el receptor procese el mensaje. Si se requiere confirmación, persistencia o reintentos, la aplicación debe implementar esas garantías aparte.</p>
</div>
</div>
<div class="sect2">
<h3 id="_ciclo_de_vida_y_fallas"><a class="anchor" href="#_ciclo_de_vida_y_fallas"></a>Ciclo de vida y fallas</h3>
<div class="paragraph">
<p>Las entradas están ligadas al proceso que las registró y Registry las elimina cuando este termina. La limpieza puede propagarse de forma diferida, por lo que algunas operaciones podrían encontrar brevemente un PID que ya está muerto; además, cualquier proceso puede terminar entre la búsqueda y el envío. Resolver un nombre no congela el estado del proceso ni garantiza que siga vivo para siempre.</p>
</div>
<div class="paragraph">
<p>Al registrarse, el proceso queda enlazado al proceso propietario de la partición del Registry. Si esa partición termina de forma anormal, la señal de salida también puede afectar a los procesos registrados, salvo que estos atrapen señales de salida. En la configuración común, donde el Registry y un <code>DynamicSupervisor</code> son hijos del mismo supervisor raíz, el supervisor dinámico observa la terminación de sus hijos permanentes y puede reiniciarlos; al ejecutar de nuevo <code>start_link/1</code>, estos se registran otra vez.</p>
</div>
<div class="paragraph">
<p>Este comportamiento recupera procesos y asociaciones, no necesariamente el estado de negocio: cada proceso reiniciado ejecuta <code>init/1</code> con los datos iniciales definidos por su especificación. Si el estado debe sobrevivir, se necesita persistirlo o reconstruirlo desde una fuente externa.</p>
</div>
<div class="paragraph">
<p>También importa qué componente falló y cómo está organizado el árbol. Si termina el Registry, sus tablas de asociaciones se pierden; un proceso que no termina junto con la partición puede quedar vivo pero ya no ser localizable por el nombre anterior. Si termina un <code>DynamicSupervisor</code>, sus hijos dinámicos no se guardan en una lista durable que permita recrearlos automáticamente al reiniciar el supervisor. En ambos casos, reiniciar infraestructura no basta para reconstruir cualquier estado o conjunto de procesos: la aplicación debe definir qué instancias deben existir, cómo recuperarlas y en qué orden registrar sus nombres.</p>
</div>
<div class="paragraph">
<p>En suma, <code>Registry</code> resuelve <strong>cómo encontrar</strong> un proceso; <code>Supervisor</code> o <code>DynamicSupervisor</code> resuelven <strong>cómo iniciar, detener y recuperar</strong> procesos. Ninguno proporciona por sí mismo persistencia de estado.</p>
</div>
</div>
<div class="sect2">
<h3 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h3>
<div class="ulist">
<ul>
<li>
<p>ELIXIR. <a href="https://hexdocs.pm/elixir/Registry.html">Documentación de <code>Registry</code></a>. Claves únicas y duplicadas, registros <code>:via</code> y despacho.</p>
</li>
<li>
<p>ELIXIR. <a href="https://hexdocs.pm/elixir/DynamicSupervisor.html">Documentación de <code>DynamicSupervisor</code></a>.</p>
</li>
<li>
<p>ELIXIR. <a href="https://hexdocs.pm/elixir/Supervisor.html">Documentación de <code>Supervisor</code></a>.</p>
</li>
<li>
<p>ELIXIR. <a href="https://hexdocs.pm/elixir/GenServer.html">Documentación de <code>GenServer</code></a>.</p>
</li>
</ul>
</div>
</div>
</div>
</div>`;export{e as default};