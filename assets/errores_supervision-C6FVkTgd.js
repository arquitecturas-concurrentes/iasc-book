var e=`<div class="sect1">
<h2 id="_fallas_y_supervisión_en_erlangelixir"><a class="anchor" href="#_fallas_y_supervisión_en_erlangelixir"></a>Fallas y supervisión en Erlang/Elixir</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En un programa secuencial, una excepción no capturada se propaga por la pila de llamadas hasta que algún método la maneja o termina el flujo de ejecución. En un sistema basado en procesos, el código que atiende una solicitud suele ejecutarse en un proceso distinto del que la envió. Por eso, una excepción dentro del proceso servidor no se propaga por la pila del cliente: termina el proceso que la produjo. El cliente puede recibir una respuesta de error o un timeout; si esperaba una llamada síncrona a un proceso que termina, la llamada puede terminar con un <code>exit</code> cuya razón corresponde a esa terminación.</p>
</div>
<div class="paragraph">
<p>Esta diferencia es central para razonar sobre fallas. El fallo de un proceso no implica necesariamente que termine toda la aplicación, pero sí puede dejar una función del sistema indisponible. OTP permite definir cómo se inician y relacionan los procesos y qué acción tomar cuando alguno termina. Una parte importante de esa respuesta es la <strong>supervisión</strong>: un proceso supervisor observa a sus hijos y aplica una política de reinicio declarada.</p>
</div>
<div class="sect2">
<h3 id="_errores_locales_y_fallas_de_proceso"><a class="anchor" href="#_errores_locales_y_fallas_de_proceso"></a>Errores locales y fallas de proceso</h3>
<div class="paragraph">
<p>Elixir ofrece varias formas de representar o señalar que una operación no pudo completarse. No son mecanismos equivalentes y conviene elegirlos según quién puede tomar una decisión útil:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Retornos explícitos</strong>: una función devuelve un resultado que el llamador debe inspeccionar. Es habitual devolver <code>{:ok, valor}</code> o <code>{:error, razon}</code>. Se usan cuando el fallo es esperado y forma parte del contrato de la función, por ejemplo, que una clave no exista o que una entrada no sea válida.</p>
</li>
<li>
<p><strong>Excepciones</strong>: <code>raise</code> indica una condición excepcional para el flujo actual. Si no se captura, el proceso que ejecutaba ese código termina. Son apropiadas para fallos que el código local no puede o no debe tratar como un resultado ordinario.</p>
</li>
<li>
<p><strong>Terminaciones de proceso</strong>: un proceso puede detenerse con una razón de salida como <code>:normal</code>, <code>:shutdown</code> o <code>{:shutdown, razon}</code>, o terminar por una excepción no capturada. Las señales forman parte del ciclo de vida de procesos y pueden ser observadas o propagadas a procesos vinculados.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>En Erlang/Elixir se distinguen las clases <code>:error</code>, <code>:exit</code> y <code>:throw</code>. En Elixir, <code>raise</code> produce una excepción de clase <code>:error</code>; <code>exit/1</code> termina el proceso con una razón de salida; <code>throw/1</code> produce un valor para una salida no local del flujo de ejecución que debe capturarse explícitamente. <code>try/rescue</code> se usa para rescatar errores; <code>try/catch</code> puede capturar exits y throws. <code>throw</code> no suele ser el mecanismo para informar errores de dominio: en código ordinario es más claro devolver <code>{:error, razon}</code> cuando el fallo es esperado. Si una excepción deja al proceso en un estado inválido, no siempre conviene capturarla; dejar que termine permite que actúe la política de supervisión.</p>
</div>
<div class="paragraph">
<p>En una llamada <code>GenServer.call/3</code>, por ejemplo, el servidor puede responder <code>{:error, razon}</code> sin terminar. Si una excepción no capturada ocurre dentro de un callback, en cambio, el servidor termina; el cliente que esperaba una respuesta no recibe esa excepción a través de la pila de llamadas como ocurriría en una llamada a una función local. Las APIs de <code>GenServer</code> documentan el protocolo de llamada, el timeout y las señales de salida <a href="#ElixirGenServer" class="biblioref">[ElixirGenServer]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_por_qué_existe_la_supervisión"><a class="anchor" href="#_por_qué_existe_la_supervisión"></a>Por qué existe la supervisión</h3>
<div class="paragraph">
<p>Un proceso BEAM tiene estado y buzón propios. Si termina, desaparecen su estado en memoria y los mensajes que aún estaban en su buzón; los demás procesos no obtienen automáticamente una copia de ese estado. La supervisión no deshace la falla ni restaura los datos perdidos: declara una política para recuperar la <strong>disponibilidad</strong> de un componente reiniciando procesos relacionados o dejando que el fallo escale a un supervisor superior. Más adelante, el ejemplo de <code>Contador</code> muestra qué implica esto para el estado de un <code>GenServer</code>.</p>
</div>
<div class="paragraph">
<p>Un supervisor es un proceso OTP que inicia a sus procesos hijos, conoce sus especificaciones y recibe notificaciones de su terminación. Normalmente los hijos se enlazan con el supervisor: el link permite que el supervisor reciba la señal de salida y gestione el ciclo de vida del hijo. El supervisor, que está preparado para manejar salidas de sus hijos, puede aplicar la política de reinicio definida. Esto forma una estructura separada de la lógica funcional: los servidores realizan el trabajo de la aplicación; los supervisores organizan su inicio, apagado y recuperación.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/supervisores/error_1.png" alt="error 1">
</div>
</div>
<div class="paragraph">
<p>La idea suele resumirse como <strong>«dejar que el proceso falle»</strong> (let it crash), pero no significa ignorar errores ni reiniciar indiscriminadamente. El proceso que quedó en un estado inválido puede terminar para que no siga produciendo resultados incorrectos; el supervisor decide si reiniciarlo, y el diseño de la aplicación determina cómo reconstruir el estado necesario. Reiniciar repetidamente un proceso que falla de forma determinista tampoco resuelve la causa: OTP limita los reinicios para evitar ciclos infinitos y escala la falla cuando se supera el límite.</p>
</div>
<div class="paragraph">
<p>La supervisión es local al árbol de procesos de un nodo BEAM. No es, por sí sola, replicación, persistencia, recuperación de una base de datos ni supervisión de procesos arbitrarios de otras máquinas. En sistemas distribuidos hay que tratar además particiones de red, pérdida de conectividad y consistencia de los datos.</p>
</div>
</div>
<div class="sect2">
<h3 id="_árbol_de_supervisión"><a class="anchor" href="#_árbol_de_supervisión"></a>Árbol de supervisión</h3>
<div class="paragraph">
<p>Los supervisores pueden supervisar otros supervisores. La jerarquía resultante se denomina <strong>árbol de supervisión</strong>. En una aplicación OTP, el módulo de <code>Application</code> suele iniciar un supervisor raíz. Este arranca componentes compartidos y supervisores subordinados, que a su vez gestionan grupos de servidores o tareas.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/supervisores/error_2.png" alt="error 2">
</div>
</div>
<div class="paragraph">
<p>Cada supervisor aplica su estrategia a sus hijos directos. Si un hijo es a su vez un supervisor y este termina, el supervisor padre puede reiniciarlo según su propia política. Así, la respuesta a una falla se compone por niveles: un supervisor local intenta recuperar su grupo y, si ya no puede continuar, su terminación puede ser tratada por el nivel superior.</p>
</div>
<div class="paragraph">
<p>Este árbol expresa dependencias y límites de recuperación. Por ejemplo, si un proceso requiere que otro esté disponible antes de iniciar, el orden de los hijos debe reflejarlo. También conviene agrupar procesos que deben recuperarse juntos bajo un supervisor común, en vez de construir un árbol plano sin considerar sus relaciones.</p>
</div>
</div>
<div class="sect2">
<h3 id="_especificaciones_de_hijos_y_configuración"><a class="anchor" href="#_especificaciones_de_hijos_y_configuración"></a>Especificaciones de hijos y configuración</h3>
<div class="paragraph">
<p>Para iniciar un hijo, un supervisor recibe una lista de <strong>especificaciones de hijos</strong> (child specifications). Cada especificación describe cómo iniciar el proceso y cómo tratar su terminación. Los módulos que usan comportamientos OTP, como <code>GenServer</code>, suelen generar una especificación predeterminada a partir de <code>start_link/1</code>. También se puede escribir una especificación explícita cuando hace falta ajustar sus propiedades.</p>
</div>
<div class="paragraph">
<p>Una especificación incluye, conceptualmente:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>:id</code>: identificador único dentro de ese supervisor.</p>
</li>
<li>
<p><code>:start</code>: módulo, función y argumentos con que se inicia el hijo.</p>
</li>
<li>
<p><code>:restart</code>: cuándo intentar reiniciarlo (<code>:permanent</code>, <code>:transient</code> o <code>:temporary</code>).</p>
</li>
<li>
<p><code>:shutdown</code>: cuánto esperar para que el hijo termine de forma ordenada antes de forzarlo a salir.</p>
</li>
<li>
<p><code>:type</code>: si se trata de un <code>:worker</code> o de un <code>:supervisor</code>; ayuda al supervisor a decidir cómo apagarlo.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La función <code>start_link/1</code> enlaza el hijo con quien lo inicia. Al arrancarlo como hijo de un supervisor, ese enlace es parte del protocolo de supervisión. Los servidores OTP suelen exponer su función <code>start_link</code> y dejar que el supervisor los inicie, en vez de crearlos desde código de negocio mediante <code>spawn/1</code>.</p>
</div>
<div class="paragraph">
<p>El siguiente ejemplo es autocontenido. El trabajador es un <code>GenServer</code> con una operación que incrementa un contador y otra que provoca intencionalmente una excepción. El supervisor lo inicia como hijo permanente con estrategia <code>:one_for_one</code>:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule Contador do
  use GenServer

  def start_link(initial_value \\\\ 0) do
    GenServer.start_link(__MODULE__, initial_value, name: __MODULE__)
  end

  @impl true
  def init(initial_value), do: {:ok, initial_value}

  def incrementar, do: GenServer.call(__MODULE__, :incrementar)
  def valor, do: GenServer.call(__MODULE__, :valor)
  def fallar, do: GenServer.call(__MODULE__, :fallar)

  @impl true
  def handle_call(:incrementar, _from, value) do
    {:reply, value + 1, value + 1}
  end

  def handle_call(:valor, _from, value) do
    {:reply, value, value}
  end

  def handle_call(:fallar, _from, _value) do
    raise "falla intencional para la demostración"
  end
end

defmodule Contador.Supervisor do
  use Supervisor

  def start_link(_options) do
    Supervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @impl true
  def init(:ok) do
    children = [
      {Contador, 0}
    ]

    Supervisor.init(children,
      strategy: :one_for_one,
      max_restarts: 3,
      max_seconds: 5
    )
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>En una sesión de IEx, una vez definidos los módulos, se puede iniciar el supervisor y probar la operación normal:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">{:ok, supervisor} = Contador.Supervisor.start_link([])
Contador.incrementar()
# 1
Contador.valor()
# 1</code></pre>
</div>
</div>
<div class="paragraph">
<p>Si se invoca <code>Contador.fallar/0</code>, el callback lanza una excepción y ese proceso <code>Contador</code> termina. La llamada que esperaba una respuesta también observa la terminación, por lo que IEx puede mostrar una salida de error; no debe interpretarse como una excepción propagada por la pila del supervisor. El supervisor detecta la terminación y, al ser un hijo <code>:permanent</code>, inicia una nueva instancia. <code>supervisor</code> conserva el PID del supervisor, no el del trabajador.</p>
</div>
<div class="paragraph">
<p>El proceso nuevo tiene un PID distinto del que terminó, aunque use el mismo módulo y reciba los mismos argumentos de inicio. El supervisor no conserva una copia del estado anterior ni transfiere automáticamente al nuevo proceso los mensajes que estaban en el buzón del anterior. En este ejemplo, el estado <code>1</code> se pierde y <code>init/1</code> crea el contador con <code>0</code>. Los mensajes que otros procesos ya habían enviado al PID anterior tampoco se redirigen al nuevo PID.</p>
</div>
<div class="paragraph">
<p>Por eso, hay que distinguir entre <strong>reiniciar el proceso</strong> y <strong>recuperar su estado</strong>. Si el estado solo sirve mientras vive el proceso, volver al valor inicial puede ser correcto. Si debe sobrevivir a una falla, se puede persistir fuera del proceso (por ejemplo, en una base de datos), reconstruirlo a partir de una fuente de verdad o mantenerlo en otro componente cuyo ciclo de vida sea independiente. El reinicio tampoco deshace efectos externos realizados antes de fallar; los reintentos pueden duplicarlos, de modo que el sistema debe definir garantías de idempotencia y tratamiento de operaciones parciales.</p>
</div>
<div class="sect3">
<h4 id="_estrategias_de_reinicio"><a class="anchor" href="#_estrategias_de_reinicio"></a>Estrategias de reinicio</h4>
<div class="paragraph">
<p>La estrategia especificada al iniciar un supervisor determina qué grupo de hijos reinicia cuando, de acuerdo con su política, un hijo debe reiniciarse:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>:one_for_one</code>: reinicia solo al hijo cuya política requiere reinicio. Es una opción común cuando los hijos son independientes.</p>
</li>
<li>
<p><code>:one_for_all</code>: cuando un hijo debe reiniciarse, detiene a todos los hijos del supervisor y reinicia el grupo. Es adecuada cuando el grupo debe comenzar y recuperarse como una unidad.</p>
</li>
<li>
<p><code>:rest_for_one</code>: cuando un hijo debe reiniciarse, reinicia ese hijo y los hijos iniciados después de él en la lista. Sirve cuando los hijos posteriores dependen de los anteriores.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>En las dos últimas estrategias el orden de la lista expresa dependencias: los hijos se inician en orden y se detienen en orden inverso. La estrategia de reinicio no reemplaza el diseño de los protocolos entre procesos; expresa el alcance de una recuperación dentro de ese supervisor.</p>
</div>
</div>
<div class="sect3">
<h4 id="_política_de_reinicio_y_apagado"><a class="anchor" href="#_política_de_reinicio_y_apagado"></a>Política de reinicio y apagado</h4>
<div class="paragraph">
<p>La estrategia del supervisor responde a «¿qué grupo de hijos se reinicia?». La opción <code>:restart</code> de cada hijo responde a «¿se reinicia este hijo cuando termina?».</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>:permanent</code>: se intenta reiniciar el hijo ante cualquier terminación, incluso una terminación normal.</p>
</li>
<li>
<p><code>:temporary</code>: no se reinicia, aunque termine de forma anormal.</p>
</li>
<li>
<p><code>:transient</code>: se reinicia si termina de forma anormal, pero no si termina normalmente ni con una razón de apagado (<code>:shutdown</code> o <code>{:shutdown, termino}</code>).</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Un servidor de larga duración suele ser <code>:permanent</code>; una tarea finita puede tener otra política, según si completar su trabajo es lo esperado y qué debe pasar si falla. La política debe corresponder al ciclo de vida del proceso, no aplicarse por defecto sin considerar su propósito.</p>
</div>
<div class="paragraph">
<p>Al apagar un hijo, el supervisor primero intenta darle tiempo para detenerse ordenadamente. <code>:shutdown</code> define ese período; si se vence, el proceso se termina forzosamente. El apagado ordenado permite cerrar recursos o terminar trabajo en curso, pero no debería depender de esperar indefinidamente.</p>
</div>
</div>
<div class="sect3">
<h4 id="_detener_un_hijo_intencionalmente"><a class="anchor" href="#_detener_un_hijo_intencionalmente"></a>Detener un hijo intencionalmente</h4>
<div class="paragraph">
<p>Que un proceso termine «normalmente» no siempre significa que el supervisor lo deje detenido: la política del hijo sigue aplicándose. Si se llama a <code>GenServer.stop(server, :normal)</code> o el callback devuelve <code>{:stop, :normal, nuevo_estado}</code>, un hijo <code>:permanent</code> se reinicia incluso después de una terminación normal. Con <code>:transient</code>, una terminación normal no provoca reinicio; <code>:temporary</code> tampoco se reinicia, aunque falle.</p>
</div>
<div class="paragraph">
<p>Si la intención es retirar explícitamente un proceso supervisado, es preferible hacerlo a través del supervisor:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">DynamicSupervisor.terminate_child(MiApp.Sesiones, session_pid)</code></pre>
</div>
</div>
<div class="paragraph">
<p><code>DynamicSupervisor.terminate_child/2</code> detiene ese hijo y lo quita del conjunto dinámico, por lo que no vuelve a iniciarse automáticamente. En un <code>Supervisor</code> estático, <code>Supervisor.terminate_child/2</code> detiene al hijo pero conserva su especificación si no es <code>:temporary</code>: puede iniciarse de nuevo explícitamente con <code>Supervisor.restart_child/2</code>. La especificación <code>:temporary</code> se elimina al terminar; para quitar una especificación conservada se usa <code>Supervisor.delete_child/2</code>. <code>GenServer.stop/3</code>, en cambio, detiene el servidor con una razón indicada y ejecuta su callback <code>terminate/2</code> si está definido; si el servidor sigue registrado como hijo activo, la decisión de reiniciarlo depende de la política configurada. La documentación de <a href="https://hexdocs.pm/elixir/GenServer.html#stop/3"><code>GenServer.stop/3</code></a>, <a href="https://hexdocs.pm/elixir/Supervisor.html#terminate_child/2"><code>Supervisor.terminate_child/2</code></a> y <a href="https://hexdocs.pm/elixir/DynamicSupervisor.html#terminate_child/2"><code>DynamicSupervisor.terminate_child/2</code></a> detalla estas diferencias.</p>
</div>
</div>
<div class="sect3">
<h4 id="_intensidad_de_reinicio"><a class="anchor" href="#_intensidad_de_reinicio"></a>Intensidad de reinicio</h4>
<div class="paragraph">
<p>Un supervisor limita cuántas veces reinicia hijos dentro de un intervalo. <code>:max_restarts</code> determina el máximo de reinicios y <code>:max_seconds</code> la ventana de tiempo. Si se supera el límite, el supervisor termina en lugar de continuar reiniciando un proceso que falla en un bucle. Su supervisor padre puede entonces intentar recuperarlo; si la falla se propaga hasta la raíz, puede terminar el árbol de la aplicación y OTP reportará que la aplicación no pudo mantenerse en ejecución.</p>
</div>
<div class="paragraph">
<p>Estos límites no son una política de reintentos para una operación de negocio ni una garantía de disponibilidad. Son una protección ante fallas repetidas del árbol. Los valores predeterminados son adecuados para muchos casos, pero los límites se pueden configurar cuando la aplicación tiene una razón concreta para hacerlo.</p>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_tipos_de_supervisores"><a class="anchor" href="#_tipos_de_supervisores"></a>Tipos de supervisores</h3>
<div class="paragraph">
<p>Los nombres describen responsabilidades diferentes, no estrategias de reinicio intercambiables:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>Supervisor</code> administra un conjunto de hijos declarado al iniciar. Es la opción habitual para componentes estables cuya cantidad y relación se conocen al arrancar la aplicación.</p>
</li>
<li>
<p><code>DynamicSupervisor</code> administra hijos que se agregan y quitan durante la ejecución. Es útil para instancias creadas bajo demanda, como sesiones o workers por cliente.</p>
</li>
<li>
<p><code>Task.Supervisor</code> administra procesos de tipo tarea, es decir, trabajos finitos. Ofrece operaciones para iniciar tareas dinámicamente y elegir si el solicitante recibe un resultado, queda enlazado o solo observa la tarea.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Los tres forman parte del árbol de supervisión de la aplicación y pueden ser hijos de otro supervisor. La estrategia <code>:one_for_one</code>, <code>:one_for_all</code> o <code>:rest_for_one</code> describe cómo responde un supervisor a la terminación de sus hijos; no determina si ese supervisor es estático, dinámico o especializado en tareas.</p>
</div>
</div>
<div class="sect2">
<h3 id="_supervisores_dinámicos"><a class="anchor" href="#_supervisores_dinámicos"></a>Supervisores dinámicos</h3>
<div class="paragraph">
<p>Un <code>Supervisor</code> tradicional recibe una lista fija de hijos al iniciar. Es apropiado para procesos conocidos de antemano y que forman parte estable de la aplicación: por ejemplo, un registro, un servidor de configuración o un supervisor de tareas.</p>
</div>
<div class="paragraph">
<p>Cuando los procesos se crean y terminan durante la ejecución —por ejemplo, un servidor por sesión, conexión o documento abierto— no resulta práctico declarar de antemano un hijo por instancia. <code>DynamicSupervisor</code> supervisa un conjunto variable de hijos: se inicia como un proceso de la aplicación y luego el código solicita dinámicamente iniciar o terminar hijos mediante su API. Cada hijo sigue teniendo su especificación y política de reinicio, pero no todos deben estar presentes desde el arranque.</p>
</div>
<div class="paragraph">
<p>Ejemplo mínimo de un supervisor dinámico y un trabajador que puede iniciarse varias veces:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">defmodule Sesion do
  use GenServer

  def start_link(session_id) do
    GenServer.start_link(__MODULE__, session_id)
  end

  @impl true
  def init(session_id), do: {:ok, session_id}
end

defmodule Sesiones.Supervisor do
  use DynamicSupervisor

  def start_link(_options) do
    DynamicSupervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @impl true
  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def iniciar(session_id) do
    DynamicSupervisor.start_child(__MODULE__, {Sesion, session_id})
  end
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>El supervisor dinámico también debe iniciarse, normalmente como hijo del supervisor raíz:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">children = [
  {Sesiones.Supervisor, []}
]

Supervisor.start_link(children, strategy: :one_for_one)

{:ok, pid} = Sesiones.Supervisor.iniciar("sesion-123")</code></pre>
</div>
</div>
<div class="paragraph">
<p>Cada llamada a <code>iniciar/1</code> agrega un proceso administrado por <code>Sesiones.Supervisor</code>; el PID devuelto identifica esa instancia. Si se necesita localizar las instancias por una clave de negocio en lugar de pasar PID, <code>DynamicSupervisor</code> puede combinarse con <code>Registry</code>: el primero administra el ciclo de vida y el segundo resuelve nombres. El Registry debe estar iniciado antes que los procesos que se registran en él.</p>
</div>
<div class="paragraph">
<p>Esta combinación tiene consecuencias ante las fallas: al reiniciar un proceso hijo, vuelve a ejecutar <code>start_link/1</code> y puede registrar de nuevo su nombre, pero su estado se reconstruye desde la inicialización, no desde el Registry. Si falla el Registry o el supervisor dinámico, la recuperación depende del árbol, del orden de inicio y de cómo la aplicación reconstruya sus asociaciones e instancias. La explicación detallada y el ejemplo completo están en <a href="https://arquitecturas-concurrentes.github.io/iasc-book/registry_elixir">Registry en Elixir: nombres y localización de procesos</a>.</p>
</div>
<div class="paragraph">
<p><code>DynamicSupervisor</code> no significa que el proceso sea efímero o que deba reiniciarse en cada circunstancia. La política de reinicio sigue siendo parte de la especificación del hijo. Si una instancia dinámica es <code>:permanent</code>, el supervisor intentará reiniciarla luego de una falla; para procesos de corta duración que representan una sesión ya finalizada, probablemente se deba definir una política y un apagado explícitos acordes al caso.</p>
</div>
<div class="paragraph">
<p>Para trabajos finitos que devuelven un resultado, OTP también ofrece <code>Task.Supervisor</code>, que administra tareas dinámicas. Según la API elegida, el proceso que solicita la tarea puede quedar enlazado a ella o puede observarla sin ese vínculo; por ejemplo, las variantes <code>async</code> y <code>async_nolink</code> expresan decisiones distintas sobre el ciclo de vida y la propagación de fallas. Una tarea supervisada no es lo mismo que un servidor de estado de larga duración: la abstracción y la política deben corresponder al tipo de trabajo.</p>
</div>
</div>
<div class="sect2">
<h3 id="_links_y_monitores"><a class="anchor" href="#_links_y_monitores"></a>Links y monitores</h3>
<div class="paragraph">
<p>Los <strong>links</strong> y los <strong>monitores</strong> permiten observar terminaciones, pero tienen semánticas distintas y no reemplazan a los supervisores.</p>
</div>
<div class="paragraph">
<p>Un link es una relación bidireccional de propagación de señales de salida. Si un proceso enlazado termina de forma anormal, la señal puede terminar también al otro proceso. Una terminación normal se trata de manera especial y normalmente no derriba al proceso enlazado. Un proceso puede activar <code>Process.flag(:trap_exit, true)</code> para recibir señales de salida como mensajes <code>{:EXIT, pid, razon}</code>, en vez de que una señal no normal lo termine directamente. La señal <code>:kill</code> no puede atraparse. Los supervisores usan este tipo de mecanismo internamente para administrar hijos; para código de aplicación, no conviene crear links indiscriminadamente porque puede acoplar la disponibilidad de procesos que deberían fallar de manera independiente.</p>
</div>
<div class="paragraph">
<p>Un monitor es unidireccional y no propagador: un proceso observa a otro sin crear una dependencia de terminación. <code>Process.monitor/1</code> devuelve una referencia; cuando el proceso observado termina, el observador recibe un mensaje <code>{:DOWN, referencia, :process, objeto, razon}</code>. El monitor no reinicia al proceso observado ni provoca la terminación del observador. Se puede cancelar con <code>Process.demonitor/2</code>. La documentación de <code>Process</code> describe los links, las señales y los monitores <a href="#ElixirProcess" class="biblioref">[ElixirProcess]</a>.</p>
</div>
<div class="paragraph">
<p>Ejemplo de un monitor desde IEx:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">pid = spawn(fn -&gt; receive do :stop -&gt; :ok end end)
reference = Process.monitor(pid)
Process.exit(pid, :shutdown)

receive do
  {:DOWN, ^reference, :process, ^pid, reason} -&gt;
    reason
end
# :shutdown</code></pre>
</div>
</div>
<div class="paragraph">
<p>El <code>^</code> en el patrón exige que <code>reference</code> y <code>pid</code> coincidan con los valores que ya estaban enlazados a esas variables. El mensaje <code>:DOWN</code> informa que el proceso terminó; no implica que el observador tenga que reiniciarlo. Si se necesita una política de reinicio, un supervisor es normalmente la abstracción correcta. Si solo se necesita enterarse de que un proceso terminó, un monitor es más apropiado.</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="33.3333%">
<col width="33.3333%">
<col width="33.3334%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Mecanismo</th>
<th class="tableblock halign-left valign-top">Efecto principal</th>
<th class="tableblock halign-left valign-top">Uso habitual</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Link</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Propaga señales de salida entre procesos enlazados.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Vincular ciclos de vida que deben fallar juntos; lo usan los supervisores con sus hijos.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Monitor</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Notifica al proceso observador mediante un mensaje <code>:DOWN</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Observar la terminación sin propagarla ni reiniciar al proceso.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Supervisor</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Inicia hijos, observa sus terminaciones y aplica estrategias y políticas de reinicio.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Administrar de forma declarativa un conjunto de procesos y sus relaciones de recuperación.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>En resumen: un monitor <strong>detecta e informa</strong> una terminación; un link <strong>propaga señales</strong> según las reglas de salida; un supervisor <strong>administra el ciclo de vida</strong> de los procesos hijos y decide qué reiniciar. En una aplicación OTP, la supervisión suele ser la herramienta de recuperación, mientras que los monitores son útiles cuando un proceso necesita reaccionar a la terminación de otro sin asumir su gestión.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="OTPDesignPrinciples"></a>[OTPDesignPrinciples] ERLANG/OTP. <a href="https://www.erlang.org/doc/system/design_principles.html"><em>Design Principles</em></a>. Principios de diseño, aplicaciones OTP y árboles de supervisión.</p>
</li>
<li>
<p><a id="ElixirGettingStarted"></a>[ElixirGettingStarted] ELIXIR. <a href="https://elixir-lang.org/getting-started/mix-otp/supervisor-and-application.html"><em>Getting Started: Supervisor and Application</em></a>. Introducción guiada a aplicaciones y supervisores.</p>
</li>
<li>
<p><a id="ElixirSupervisor"></a>[ElixirSupervisor] ELIXIR. <a href="https://hexdocs.pm/elixir/Supervisor.html">Documentación de <code>Supervisor</code></a>. Estrategias, especificaciones de hijos y límites de reinicio.</p>
</li>
<li>
<p><a id="ElixirDynamicSupervisor"></a>[ElixirDynamicSupervisor] ELIXIR. <a href="https://hexdocs.pm/elixir/DynamicSupervisor.html">Documentación de <code>DynamicSupervisor</code></a>.</p>
</li>
<li>
<p><a id="ElixirTaskSupervisor"></a>[ElixirTaskSupervisor] ELIXIR. <a href="https://hexdocs.pm/elixir/Task.Supervisor.html">Documentación de <code>Task.Supervisor</code></a>.</p>
</li>
<li>
<p><a id="ElixirGenServer"></a>[ElixirGenServer] ELIXIR. <a href="https://hexdocs.pm/elixir/GenServer.html">Documentación de <code>GenServer</code></a>.</p>
</li>
<li>
<p><a id="ElixirProcess"></a>[ElixirProcess] ELIXIR. <a href="https://hexdocs.pm/elixir/Process.html">Documentación de <code>Process</code></a>. Links, monitores, señales y mensajes <code>:DOWN</code>.</p>
</li>
<li>
<p><a id="ElixirGenServerStop"></a>[ElixirGenServerStop] ELIXIR. <a href="https://hexdocs.pm/elixir/GenServer.html#stop/3">Documentación de <code>GenServer.stop/3</code></a>.</p>
</li>
<li>
<p><a id="ElixirSupervisorTerminateChild"></a>[ElixirSupervisorTerminateChild] ELIXIR. <a href="https://hexdocs.pm/elixir/Supervisor.html#terminate_child/2">Documentación de <code>Supervisor.terminate_child/2</code></a>.</p>
</li>
<li>
<p><a id="ElixirDynamicSupervisorTerminateChild"></a>[ElixirDynamicSupervisorTerminateChild] ELIXIR. <a href="https://hexdocs.pm/elixir/DynamicSupervisor.html#terminate_child/2">Documentación de <code>DynamicSupervisor.terminate_child/2</code></a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};