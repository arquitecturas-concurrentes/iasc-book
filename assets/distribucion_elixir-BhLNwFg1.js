var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>La distribución de Erlang permite que varias instancias de la máquina virtual BEAM se comuniquen mediante mensajes. Elixir utiliza este mecanismo de Erlang/OTP: no crea una red de actores diferente, sino que ofrece acceso a procesos y herramientas que se ejecutan sobre la misma plataforma.</p>
</div>
<div class="paragraph">
<p>Esta capacidad proporciona mecanismos de comunicación y detección de cambios en las conexiones, pero no convierte un conjunto de nodos en una aplicación distribuida completa. La aplicación todavía debe definir qué significan los timeouts, cómo se recupera el estado, qué operaciones pueden reintentarse y cómo se mantienen consistentes los datos.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_nodo_una_instancia_nombrada_de_beam"><a class="anchor" href="#_nodo_una_instancia_nombrada_de_beam"></a>Nodo: una instancia nombrada de BEAM</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un <strong>nodo</strong> es una instancia en ejecución del sistema Erlang/BEAM que se inició con un nombre de distribución. El nombre tiene la forma <code>nombre@host</code>; por ejemplo, <code>catalogo@servidor-1.ejemplo.net</code>. El nombre identifica al nodo en la red de distribución y no debe confundirse con el nombre de una aplicación o de un proceso.</p>
</div>
<div class="paragraph">
<p>En Elixir, un nodo se puede iniciar con un nombre largo:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-bash" data-lang="bash">elixir --name catalogo@servidor-1.ejemplo.net</code></pre>
</div>
</div>
<div class="paragraph">
<p>o con un nombre corto:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-bash" data-lang="bash">elixir --sname catalogo</code></pre>
</div>
</div>
<div class="paragraph">
<p>Los nombres largos usan el nombre de host completo; los cortos, una forma abreviada apropiada para redes locales o entornos de desarrollo. Los dos tipos no se pueden mezclar en una conexión: todos los nodos que se comunican deben usar el mismo dominio de nombres y poder resolver las direcciones correspondientes. La elección concreta depende del DNS, la red y el despliegue <a href="#ErlangDistributedSystem" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangDistributedSystem]</a>.</p>
</div>
<div class="paragraph">
<p>Cada nodo tiene su propio espacio de procesos, heaps, tablas ETS y estado en memoria. <strong>ETS</strong> (Erlang Term Storage) es un mecanismo de almacenamiento en memoria que permite a procesos de una misma VM consultar y modificar tablas de términos Erlang. Según el tipo de tabla, los datos pueden organizarse como pares clave-valor (<code>set</code>), claves ordenadas (<code>ordered_set</code>) o colecciones con claves repetidas (<code>bag</code> y <code>duplicate_bag</code>). Los permisos también varían: una tabla <code>protected</code>, por ejemplo, permite lecturas a otros procesos locales, pero reserva las escrituras a su proceso propietario <a href="#ErlangETS" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangETS]</a>.</p>
</div>
<div class="paragraph">
<p>ETS no es memoria compartida entre nodos ni una base de datos distribuida: cada tabla pertenece a una VM, normalmente desaparece cuando termina su propietario y no se replica automáticamente. Para usar datos de otro nodo hay que enviar mensajes o elegir un mecanismo de persistencia o replicación apropiado. Conectar VMs no convierte sus heaps, tablas ETS o procesos en un único espacio de memoria.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_descubrimiento_y_establecimiento_de_conexiones"><a class="anchor" href="#_descubrimiento_y_establecimiento_de_conexiones"></a>Descubrimiento y establecimiento de conexiones</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En la distribución TCP/IP clásica, cada host que aloja nodos usa el <strong>Erlang Port Mapper Daemon</strong> (EPMD), un servicio de descubrimiento de nombres. Al iniciar, un nodo registra en el EPMD local su nombre y el puerto TCP donde acepta conexiones de distribución. Cuando otro nodo quiere conectarse, consulta el EPMD del host de destino para resolver el nombre al puerto correspondiente. El puerto usual de EPMD es <code>4369</code>; el puerto de distribución del nodo es otro y puede asignarse desde un rango configurable <a href="#ErlangEPMD" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangEPMD]</a>.</p>
</div>
<div class="paragraph">
<p>EPMD no es un directorio global del cluster: cada instancia conoce los nodos registrados en su host. Tampoco transporta mensajes, replica datos ni detecta si una aplicación está sana. Su papel se limita a ayudar a establecer conexiones nuevas. Una vez establecida la conexión entre nodos, los mensajes circulan directamente por esa conexión de distribución, no a través de EPMD. Por eso, una configuración de red debe contemplar tanto el descubrimiento como los puertos de distribución.</p>
</div>
<div class="paragraph">
<p>Una vez ubicado el nodo, las instancias establecen una conexión de distribución. En la configuración predeterminada, las conexiones visibles se propagan de manera transitiva: si A conecta con B y B conoce a C, A también intenta conectarse con C. Por eso el anillo no es una topología estándar que deba suponerse para Erlang/OTP. El comportamiento puede limitarse con opciones como <code>-connect_all false</code>; también existen nodos ocultos para conexiones explícitas que no participan de la conectividad visible general <a href="#ErlangDistributedSystem" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangDistributedSystem]</a> <a href="#ErlangKernel" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangKernel]</a>.</p>
</div>
<div class="imageblock center">
<div class="content">
<img src="/iasc-book/img/distribucion/distribucion-beam.svg" alt="Descubrimiento de nodos mediante EPMD y conexiones transitivas entre instancias BEAM" width="760">
</div>
</div>
<div class="paragraph">
<p>En un despliegue real, la resolución de nombres, el acceso a EPMD y los puertos de distribución deben ser compatibles con DNS, firewalls, contenedores y reglas de red. Los puertos concretos pueden configurarse; no se debe asumir que habilitar un único puerto conocido basta para todos los nodos.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_envío_de_mensajes_entre_nodos"><a class="anchor" href="#_envío_de_mensajes_entre_nodos"></a>Envío de mensajes entre nodos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una vez conectados, los procesos pueden intercambiar mensajes a través de la distribución. Un PID remoto puede identificar al proceso destinatario y la VM serializa el término para transportarlo por la conexión. La sintaxis puede parecerse a la mensajería local:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">worker = :"worker@servidor-2.ejemplo.net"
Node.connect(worker)
send({:procesador, worker}, {:procesar, tarea})</code></pre>
</div>
</div>
<div class="paragraph">
<p>En este ejemplo, <code>:procesador</code> es un nombre registrado en el nodo remoto. Los nombres registrados comunes pertenecen al nodo donde se registraron; para enviar a uno remoto se indica también el nodo, como en la tupla <code>{nombre, nodo}</code>. Un PID, por su parte, puede referirse a un proceso de otro nodo. La documentación describe la transparencia de la mensajería, los links y los monitors entre nodos, pero esa semejanza sintáctica no elimina los efectos de la red <a href="#ErlangDistributedSystem" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangDistributedSystem]</a>.</p>
</div>
<div class="paragraph">
<p>Una operación remota puede demorarse, fallar o quedar sin una respuesta observable. Si el emisor recibe un timeout, no siempre puede saber si el destinatario no recibió la solicitud, si la procesó pero se perdió la respuesta o si sigue trabajando. Por eso reintentar una operación no la vuelve automáticamente idempotente ni garantiza ejecución exactamente una vez. Las llamadas remotas, incluidos <code>GenServer.call/3</code>, necesitan timeouts y una política de recuperación adecuada al dominio.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_conexiones_y_fallas"><a class="anchor" href="#_conexiones_y_fallas"></a>Conexiones y fallas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La distribución puede informar que una conexión se estableció o se perdió; también permite que procesos monitoricen nodos y reciban notificaciones de caída de nodo. Esa notificación describe la conectividad observada por la VM, no demuestra que la máquina remota se haya apagado. Una partición de red puede separar dos nodos que siguen ejecutándose.</p>
</div>
<div class="paragraph">
<p>De la misma manera, que el nodo vuelva a conectarse no significa que su estado de aplicación esté sincronizado. Los mensajes que estaban en tránsito, el estado persistido y las operaciones interrumpidas requieren una política propia de recuperación. Para profundizar en timeouts, notificaciones <code>nodeup</code> y <code>nodedown</code>, y netsplits, véase <a href="https://arquitecturas-concurrentes.github.io/iasc-book/interleaving/">Interleaving y netsplits</a>.</p>
</div>
<div class="paragraph">
<p>Los <strong>links</strong> y <strong>monitors</strong> remotos permiten propagar señales de ciclo de vida entre procesos distribuidos, pero no reemplazan la supervisión ni constituyen replicación. Un supervisor OTP reinicia procesos de acuerdo con su estrategia y su ámbito de ejecución; por sí solo no conserva el estado perdido ni garantiza que un proceso remoto, un nodo o una operación distribuida se recupere correctamente. Véanse también <a href="https://arquitecturas-concurrentes.github.io/iasc-book/otp/">Elixir/Erlang OTP</a> y <a href="https://arquitecturas-concurrentes.github.io/iasc-book/heartbeat_gossip/">Heartbeats y gossip</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_topología_y_escala"><a class="anchor" href="#_topología_y_escala"></a>Topología y escala</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una topología especifica qué pares de nodos mantienen conexiones directas y cómo se incorporan o retiran miembros. En una <strong>malla completa</strong>, cada nodo tiene una conexión con cada otro nodo. Para <code>n</code> nodos, esto implica hasta <code>n(n-1)/2</code> conexiones de pares; la comunicación directa es sencilla, pero crecen el consumo de sockets, memoria y trabajo de supervisión. La conectividad transitiva predeterminada de Erlang/OTP resulta conveniente en grupos acotados, pero no debe confundirse con una estrategia automática de escalado a miles de nodos.</p>
</div>
<div class="paragraph">
<p>Otras topologías cambian el costo y la responsabilidad de enrutamiento:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>En una <strong>estrella</strong>, un nodo central conecta con los demás. Reduce conexiones entre pares, pero concentra tráfico y crea un posible cuello de botella o punto único de falla, a menos que se agregue redundancia.</p>
</li>
<li>
<p>En un <strong>anillo</strong>, cada nodo tiene pocos vecinos. El número de conexiones puede ser lineal, pero una comunicación entre nodos no vecinos requiere que la aplicación la reenvíe por nodos intermedios. Erlang Distribution no convierte automáticamente cualquier anillo configurado en un sistema de enrutamiento multip salto.</p>
</li>
<li>
<p>En una <strong>jerarquía o grupos</strong>, los nodos se organizan por dominios o regiones. Puede limitar el alcance de conexiones y facilitar la administración, pero la comunicación entre grupos necesita gateways, puentes o protocolos de aplicación explícitos.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La distribución incorporada de Erlang/OTP no impone por sí sola una estrella, un anillo o una jerarquía. Si se desactiva la conexión automática, la aplicación o las herramientas de operación deben establecer los enlaces necesarios. Además, cambiar la topología puede afectar servicios que dependen de la membresía visible, como <code>global</code>; la conectividad, la membresía y la replicación de datos son problemas relacionados, pero distintos.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cuándo_usar_la_distribución_de_beam"><a class="anchor" href="#_cuándo_usar_la_distribución_de_beam"></a>Cuándo usar la distribución de BEAM</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La distribución de BEAM es adecuada cuando una aplicación necesita que procesos en varias VMs se envíen mensajes, supervisen conectividad o colaboren usando abstracciones propias del ecosistema Erlang/OTP. Su mensajería transparente permite reutilizar patrones de actores y herramientas OTP, siempre que el sistema se despliegue en una red controlada y la aplicación trate explícitamente los fallos remotos.</p>
</div>
<div class="paragraph">
<p>No reemplaza una base de datos, un broker de mensajes, un protocolo de consenso ni una arquitectura de servicios. ETS permanece local a cada nodo; los mensajes remotos no garantizan ejecución exactamente una vez; y una conexión visible no prueba que una aplicación esté sana. Si se necesita persistencia, replicación, reintentos durables, aislamiento entre organizaciones o una topología con muchos nodos, esas propiedades deben agregarse mediante componentes y protocolos diseñados para ellas.</p>
</div>
<div class="paragraph">
<p>La elección resulta más razonable cuando el conjunto de nodos es acotado y administrado como una unidad, los servicios necesitan interacciones directas entre procesos, y el equipo puede operar nombres, conexiones y seguridad de distribución. Para despliegues con membresía muy dinámica, redes no confiables, comunicaciones entre dominios administrativos o requisitos fuertes de aislamiento, conviene evaluar alternativas como gateways, colas, APIs explícitas o un sistema de mensajería dedicado.</p>
</div>
<div class="paragraph">
<p>La seguridad de nodos, cookies, puertos y TLS se trata por separado en la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/seguridad_beam/">seguridad de BEAM y la distribución de Elixir</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="ErlangDistributedSystem"></a>[ErlangDistributedSystem] ERLANG/OTP. «Distributed Erlang System». <strong>Erlang/OTP System Documentation</strong>. <a href="https://www.erlang.org/doc/system/distributed.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ErlangEPMD"></a>[ErlangEPMD] ERLANG/OTP. «Erlang Port Mapper Daemon». <strong>Erlang/OTP ERTS User&#8217;s Guide</strong>. <a href="https://www.erlang.org/doc/apps/erts/epmd_cmd.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ErlangETS"></a>[ErlangETS] ERLANG/OTP. «ETS». <strong>Erlang/OTP Standard Library Reference</strong>. <a href="https://www.erlang.org/doc/apps/stdlib/ets.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ErlangKernel"></a>[ErlangKernel] ERLANG/OTP. «Kernel Application». <strong>Erlang/OTP Kernel Reference</strong>. <a href="https://www.erlang.org/doc/apps/kernel/kernel_app.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ElixirNode"></a>[ElixirNode] ELIXIR. «Node». <strong>Elixir v1.18 Documentation</strong>. <a href="https://hexdocs.pm/elixir/Node.html">Documentación oficial</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};