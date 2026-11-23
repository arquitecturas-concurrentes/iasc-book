var e=`<div class="sect1">
<h2 id="_interleaving_y_netsplits_conceptos_generales_y_erlangotp"><a class="anchor" href="#_interleaving_y_netsplits_conceptos_generales_y_erlangotp"></a>Interleaving y netsplits: conceptos generales y Erlang/OTP</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema concurrente, varias operaciones pueden avanzar al mismo tiempo y sus pasos se alternan. En un sistema distribuido, además, cada nodo decide con la información que ha recibido hasta ese momento. Un <strong>interleaving</strong> (intercalado) es uno de los órdenes posibles en que se ejecutan esos pasos. No requiere que haya una partición de red: puede aparecer siempre que operaciones concurrentes compartan o modifiquen estado.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, dos operaciones intentan incrementar un contador que inicialmente vale <code>0</code>. Si ambas leen el valor antes de que ninguna escriba, las dos calculan <code>1</code>; al final el contador queda en <code>1</code> aunque se solicitaron dos incrementos:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">Operación A                 Estado                 Operación B
    |                         0                         |
    |------ lee 0 -----------&gt;|&lt;--------- lee 0 --------|
    |                         |                         |
    |------ escribe 1 -------&gt;|                         |
    |                         |&lt;-------- escribe 1 ------|
                              1</code></pre>
</div>
</div>
<div class="paragraph">
<p>El problema no es que las operaciones se hayan ejecutado exactamente a la vez, sino que el orden intercalado permitió una actualización perdida. En otros ejemplos, un interleaving puede ser seguro; lo importante es verificar si los órdenes posibles preservan las reglas e invariantes de la aplicación.</p>
</div>
<div class="sect2">
<h3 id="_cómo_controlar_los_interleavings"><a class="anchor" href="#_cómo_controlar_los_interleavings"></a>¿Cómo controlar los interleavings?</h3>
<div class="paragraph">
<p>La estrategia depende de la propiedad que se quiere conservar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Ordenar o serializar las operaciones.</strong> Un único escritor, un lock o una transacción serializable puede impedir que dos actualizaciones incompatibles se confirmen como si fueran independientes. En un sistema distribuido, ese mecanismo debe coordinarse entre nodos; un lock local en cada máquina no alcanza.</p>
</li>
<li>
<p><strong>Coordinar mediante consenso o quórums.</strong> Para un estado replicado, un protocolo puede acordar un orden común de las operaciones. Esto suele requerir que una mayoría o una autoridad pueda comunicarse; una partición puede impedir que el lado sin quórum siga escribiendo.</p>
</li>
<li>
<p><strong>Diseñar operaciones que puedan combinarse.</strong> Si las operaciones son conmutativas o el estado admite una estructura de datos replicada apropiada, algunas actualizaciones pueden reconciliarse sin elegir arbitrariamente un ganador. Esto no funciona automáticamente para cualquier regla de negocio: vender la última unidad de un producto no es una operación que se pueda duplicar y luego fusionar sin consecuencias.</p>
</li>
<li>
<p><strong>Validar y compensar.</strong> Si se permiten cambios concurrentes, la aplicación puede detectar conflictos al reconciliarlos y definir acciones explícitas, como rechazar una operación, devolver un pago o solicitar intervención.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Cuando se pierde una respuesta, el cliente puede reintentar la solicitud, pero el reintento por sí solo no evita que el efecto se aplique dos veces. Para eso, la operación debe ser idempotente o el sistema debe deduplicar solicitudes, por ejemplo, mediante un identificador de operación. Estas técnicas tampoco ordenan operaciones distintas ni resuelven conflictos entre ellas.</p>
</div>
</div>
<div class="sect2">
<h3 id="_heartbeat_una_señal_periódica_de_actividad"><a class="anchor" href="#_heartbeat_una_señal_periódica_de_actividad"></a>Heartbeat: una señal periódica de actividad</h3>
<div class="paragraph">
<p>Un <strong>heartbeat</strong> (o <strong>latido</strong>) es una señal que un proceso, nodo o servicio envía periódicamente para indicar que sigue activo y puede comunicarse. El receptor observa si esa señal llega dentro de un intervalo esperado. En algunos protocolos, un nodo envía un mensaje y espera una respuesta; en otros, cada lado publica latidos por separado. También puede bastar el tráfico normal: si siguen llegando mensajes, no hace falta enviar una señal redundante.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">Nodo A                                      Nodo B
  |                                            |
  |-------------- heartbeat -----------------&gt;|
  |&lt;---------------- respuesta ---------------|
  |    reinicia el temporizador                |
  |                                            |
  |       (no llega una señal a tiempo)         |
  |    vence el timeout: B queda sospechoso     |</code></pre>
</div>
</div>
<div class="paragraph">
<p>El timeout convierte la ausencia de mensajes en una <strong>sospecha</strong>, no en una prueba de que el otro proceso terminó. Una pausa del sistema operativo, saturación, recolección de basura, congestión o partición de red pueden demorar la señal aunque el proceso siga funcionando. En una red asíncrona no hay un límite de espera que permita distinguir perfectamente una falla de una demora arbitrariamente larga. Los detectores de fallas distribuidos formalizan estas limitaciones y los compromisos entre detectar fallas y evitar sospechas erróneas <a href="#ChandraToueg1996" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ChandraToueg1996]</a>.</p>
</div>
<div class="paragraph">
<p>Un intervalo corto permite reaccionar rápido, pero aumenta los falsos positivos; uno largo reduce sospechas prematuras, pero demora la recuperación. La señal también importa: un proceso puede seguir enviando heartbeats aunque una dependencia crítica esté fallando. Por ejemplo, un servidor puede emitir latidos desde un temporizador mientras su conexión a la base de datos está bloqueada; el proceso está vivo, pero no puede completar una compra. Para comprobar que una operación puede atenderse hace falta además una verificación de salud que pruebe el camino relevante, con límites de tiempo y sin provocar efectos no deseados.</p>
</div>
<div class="paragraph">
<p>Los heartbeats permiten observar actividad o sospechar que un nodo no responde; no distribuyen por sí solos esa observación al resto del sistema. Para profundizar en el diseño de heartbeats y en cómo <strong>gossip</strong> propaga sospechas y cambios de membresía entre nodos, véase la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/heartbeat_gossip/">heartbeats y gossip</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_netsplit_cuando_los_nodos_dejan_de_comunicarse"><a class="anchor" href="#_netsplit_cuando_los_nodos_dejan_de_comunicarse"></a>Netsplit: cuando los nodos dejan de comunicarse</h3>
<div class="paragraph">
<p>Un <strong>netsplit</strong> o <strong>partición de red</strong> ocurre cuando algunos nodos dejan de poder intercambiar mensajes con otros. La comunicación entre grupos se interrumpe, aunque los nodos de cada lado puedan seguir ejecutándose y atendiendo solicitudes. Un timeout puede llevar a un nodo a sospechar que el otro cayó; no revela si el problema es una caída, una sobrecarga o una partición.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/interleaving/0.png" alt="Topología inicial de nodos y usuarios antes de la partición de red">
</div>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/interleaving/1.png" alt="Ilustración de una conexión interrumpida entre nodos">
</div>
</div>
<div class="paragraph">
<p>Consideremos una tienda que tiene una sola unidad de un producto y atiende desde dos nodos. Durante la partición, ambos reciben una compra y consultan su copia local, que todavía indica que hay una unidad disponible. Si los dos autorizan la venta sin coordinarse, se comprometen dos compras para el mismo producto. Al restablecerse la comunicación, no basta con copiar los datos de un nodo sobre el otro: hay que resolver dos compromisos que parecían válidos para sus respectivos clientes.</p>
</div>
<div class="paragraph">
<p>El <strong>interleaving</strong> describe el orden de los pasos concurrentes; el <strong>netsplit</strong> explica por qué los nodos pueden no conocer a tiempo los pasos realizados por los demás. Son fenómenos relacionados, pero no sinónimos: puede haber interleavings sin partición, y una partición no produce necesariamente escrituras en conflicto si la aplicación no permite que ambos lados modifiquen el mismo estado.</p>
</div>
</div>
<div class="sect2">
<h3 id="_elegir_qué_hacer_durante_una_partición"><a class="anchor" href="#_elegir_qué_hacer_durante_una_partición"></a>Elegir qué hacer durante una partición</h3>
<div class="paragraph">
<p>Ante una partición, un servicio que necesita mantener una única decisión consistente puede rechazar o aplazar ciertas operaciones hasta recuperar comunicación o alcanzar un quórum. Esto reduce la disponibilidad de las operaciones afectadas, pero evita confirmar resultados incompatibles. No necesariamente obliga a apagar todo el sistema: la respuesta depende de qué datos y operaciones puedan resolverse de forma segura.</p>
</div>
<div class="paragraph">
<p>Otra opción es seguir aceptando escrituras en ambos lados y reconciliarlas después. Esto mantiene más operaciones disponibles, pero exige una política de resolución adecuada al dominio. «Gana la última escritura» puede ser determinista, aunque no necesariamente correcta: por ejemplo, puede ocultar una compra que ya se confirmó a un cliente. Un orden de llegada o una marca de tiempo, por sí solos, no restituyen una unidad de inventario que se vendió dos veces.</p>
</div>
<div class="paragraph">
<p>Algunas aplicaciones reducen el conflicto con un único escritor por recurso, reservas asignadas previamente a cada nodo u operaciones que puedan combinarse de forma segura. La técnica apropiada depende de las garantías que necesita el negocio; no existe una regla universal que permita escribir en todos los lados y mantener siempre un único estado consistente.</p>
</div>
</div>
<div class="sect2">
<h3 id="_recuperarse_y_reconciliar_el_estado"><a class="anchor" href="#_recuperarse_y_reconciliar_el_estado"></a>Recuperarse y reconciliar el estado</h3>
<div class="paragraph">
<p>Cuando vuelve la comunicación, los nodos pueden intercambiar cambios, pero la reconciliación debe seguir reglas explícitas. Ayuda identificar cada operación, evitar procesarla dos veces y distinguir una solicitud recibida de una operación efectivamente confirmada. Si hubo decisiones incompatibles, la aplicación puede necesitar compensar una operación, contactar a las personas afectadas o derivar el caso para resolución; sincronizar las bases de datos no decide por sí mismo cuál resultado es correcto.</p>
</div>
<div class="paragraph">
<p>Por eso conviene diseñar tanto el comportamiento durante la partición como la recuperación posterior. Los tiempos de espera permiten reaccionar ante la falta de mensajes, pero no eliminan la incertidumbre sobre lo que ocurrió en el otro lado.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_erlangotp_ante_los_netsplits"><a class="anchor" href="#_erlangotp_ante_los_netsplits"></a>Erlang/OTP ante los netsplits</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Los conceptos anteriores se aplican a cualquier sistema distribuido. Erlang/OTP ofrece mecanismos concretos para supervisar conexiones entre nodos y notificar a las aplicaciones, pero esos mecanismos no resuelven automáticamente los conflictos de negocio.</p>
</div>
<div class="sect2">
<h3 id="_internals_del_heartbeat_de_distribución"><a class="anchor" href="#_internals_del_heartbeat_de_distribución"></a>Internals del heartbeat de distribución</h3>
<div class="paragraph">
<p>La distribución de Erlang/OTP supervisa las conexiones entre nodos mediante <strong>net ticks</strong>. Hay un proceso <code>net_ticker</code> asociado a cada conexión de distribución. Cuando no se ha enviado otro dato durante el intervalo correspondiente, ese proceso envía un paquete pequeño (<strong>tick</strong>) por la conexión. Si ya hubo tráfico, no hace falta agregar un tick: cualquier paquete recibido cuenta como señal de actividad para esa conexión.</p>
</div>
<div class="paragraph">
<p>El intervalo y el tiempo aproximado para declarar inalcanzable al otro nodo se configuran con <code>net_ticktime</code> y <code>net_tickintensity</code>. El intervalo entre ticks es:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">TickInterval = net_ticktime / net_tickintensity</code></pre>
</div>
</div>
<div class="paragraph">
<p>Con los valores predeterminados documentados (<code>net_ticktime = 60</code> segundos y <code>net_tickintensity = 4</code>), el intervalo es de 15 segundos. Si durante cuatro intervalos consecutivos no se recibe ni un tick ni datos de la conexión, el nodo remoto se considera caído y la conexión se cierra. Como la comprobación ocurre en esos intervalos, la detección no es instantánea: con esos valores, el tiempo observado puede variar aproximadamente entre 45 y 75 segundos. Erlang/OTP suele detectar antes una terminación normal cuando el propio transporte, como TCP, informa que la conexión se cerró.</p>
</div>
<div class="paragraph">
<p>Los nodos que se comunican deben usar los mismos valores de <code>net_ticktime</code> y <code>net_tickintensity</code>. Reducir el tiempo puede acelerar la detección, pero también aumenta la sensibilidad a pausas, sobrecarga y demoras transitorias; no convierte el detector en una prueba de que el proceso remoto murió. Estos ticks supervisan la <strong>conexión de distribución</strong>, no si una aplicación remota está procesando correctamente una solicitud ni si un servicio específico sigue sano.</p>
</div>
<div class="paragraph">
<p>La documentación oficial describe estos parámetros en las secciones de <a href="https://www.erlang.org/doc/apps/kernel/kernel_app.html#net_ticktime">configuración de <code>net_ticktime</code> y <code>net_tickintensity</code></a> y de <a href="https://www.erlang.org/doc/apps/kernel/net_kernel.html"><code>net_kernel</code></a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_ve_la_aplicación_cuando_un_nodo_deja_de_responder"><a class="anchor" href="#_qué_ve_la_aplicación_cuando_un_nodo_deja_de_responder"></a>Qué ve la aplicación cuando un nodo deja de responder</h3>
<div class="paragraph">
<p>La aplicación puede suscribirse a cambios en la conectividad y recibir notificaciones como <code>nodedown</code> y <code>nodeup</code>. Para observar un nodo particular puede usar <code>erlang:monitor_node/2</code>; para recibir eventos de varios nodos, <code>net_kernel:monitor_nodes/1</code>. Un evento <code>nodedown</code> indica que la conexión de distribución con ese nodo se perdió o que se lo considera inalcanzable. <strong>No demuestra que el proceso remoto haya terminado</strong>: el nodo puede continuar ejecutándose detrás de una partición. Si la conexión se restablece, puede recibirse <code>nodeup</code>.</p>
</div>
<div class="paragraph">
<p>Estos eventos informan a la aplicación; no deciden qué hacer con las operaciones que estaban en curso. El sistema puede dejar de aceptar ciertas escrituras, redirigirlas a un líder o quórum disponible, o aceptar cambios locales y reconciliarlos luego. Conviene diseñar para reinicios y reconexiones: no asumir que un evento llega una sola vez ni que, después de <code>nodeup</code>, los datos locales ya estén sincronizados.</p>
</div>
</div>
<div class="sect2">
<h3 id="_el_papel_de_global_y_los_límites_de_la_plataforma"><a class="anchor" href="#_el_papel_de_global_y_los_límites_de_la_plataforma"></a>El papel de <code>global</code> y los límites de la plataforma</h3>
<div class="paragraph">
<p>El módulo <code>global</code> de Erlang/OTP mantiene servicios como nombres y locks globales, y ayuda a mantener una red completamente conectada. Desde OTP 25, por defecto intenta prevenir particiones superpuestas: si un nodo informa que perdió conexión con otros, <code>global</code> puede desconectar nodos para formar componentes separados y evitar que el sistema quede en una topología solapada. Esta protección debe estar habilitada en <strong>todos</strong> los nodos y depende también de la configuración de conexiones, como <code>connect_all</code>.</p>
</div>
<div class="paragraph">
<p>Esto ayuda a proteger las garantías de los servicios de <code>global</code>, pero no reconcilia automáticamente los datos propios de la aplicación ni resuelve, por ejemplo, qué compra debe prevalecer si dos servicios ya aceptaron la misma unidad de inventario. La aplicación sigue siendo responsable de definir su política de disponibilidad, consistencia y recuperación. La documentación oficial detalla el comportamiento de <a href="https://www.erlang.org/doc/apps/kernel/global.html#prevent_overlapping_partitions"><code>global</code> ante particiones</a> y las APIs de <a href="https://www.erlang.org/doc/apps/erts/erlang.html#monitor_node/2"><code>erlang:monitor_node/2</code></a> y <a href="https://www.erlang.org/doc/apps/kernel/net_kernel.html#monitor_nodes/1"><code>net_kernel:monitor_nodes/1</code></a>.</p>
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
<p><a id="ChandraToueg1996"></a>[ChandraToueg1996] CHANDRA, Tushar D. y TOUEG, Sam. «Unreliable Failure Detectors for Reliable Distributed Systems». <strong>Journal of the ACM</strong>, 43(2), pp. 225–267, 1996. <a href="https://doi.org/10.1145/226643.226647">DOI</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};