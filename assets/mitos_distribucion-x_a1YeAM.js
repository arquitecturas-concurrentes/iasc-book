var e=`<div class="sect1">
<h2 id="_mitos_de_la_distribución"><a class="anchor" href="#_mitos_de_la_distribución"></a>Mitos de la distribución</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Las <strong>ocho falacias de la computación distribuida</strong> son supuestos que suelen parecer válidos mientras la red y los componentes funcionan con normalidad: que la red es confiable, que la latencia es cero, que el ancho de banda es infinito, que la red es segura, que la topología no cambia, que existe un solo administrador, que el costo de transporte es cero y que la red es homogénea. Suelen atribuirse a Peter Deutsch, de Sun Microsystems <a href="#RotemGalOzFallacies" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[RotemGalOzFallacies]</a>. No son un teorema ni una lista exhaustiva: son una herramienta para descubrir supuestos ocultos en el diseño.</p>
</div>
<div class="paragraph">
<p>Su idea central es que una interacción remota no equivale a una llamada local. Entre el emisor y el receptor hay una red, protocolos, colas, límites administrativos y posibles fallas. El trabajo de Waldo y sus coautores es una referencia clásica para entender por qué la distribución cambia las propiedades de los programas y no es simplemente una implementación más lenta de la comunicación local <a href="#Waldo1997" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Waldo1997]</a>.</p>
</div>
<div class="sect2">
<h3 id="_1_la_red_es_confiable"><a class="anchor" href="#_1_la_red_es_confiable"></a>1. La red es confiable</h3>
<div class="paragraph">
<p>Una conexión puede interrumpirse; un mensaje puede perderse, duplicarse o llegar tarde. También puede perderse la respuesta aunque el servidor haya ejecutado la operación. Por eso, ante un timeout, el cliente no sabe necesariamente si la operación no ocurrió o si ocurrió y solo se perdió la respuesta.</p>
</div>
<div class="paragraph">
<p>Supongamos que un cliente solicita cobrar una compra y no recibe respuesta. Si reintenta el pedido sin protección, el cobro podría ejecutarse más de una vez: no hace falta que la red duplique el mensaje, basta con que se pierda la respuesta de una operación ya ejecutada. Una estrategia habitual es asignar un identificador estable a cada operación y usarlo para reconocer los reintentos. Para que la deduplicación sea efectiva, el registro de ese identificador y el efecto de la operación deben coordinarse de forma atómica; si el cobro lo realiza otro servicio, ese servicio debe aceptar la misma clave de idempotencia o participar en un protocolo que permita resolver el resultado sin ambigüedades. La idempotencia ayuda cuando repetir una operación debe tener el mismo efecto que ejecutarla una vez. Ninguna de estas medidas hace confiable a la red: permite definir resultados seguros a pesar de la incertidumbre.</p>
</div>
<div class="paragraph">
<p>Los timeouts expresan cuánto se está dispuesto a esperar, no prueban que el componente remoto haya fallado. Los detectores de fallas estudian formalmente cómo tomar decisiones útiles aun cuando puedan sospechar incorrectamente que un proceso cayó <a href="#ChandraToueg1996" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ChandraToueg1996]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_2_la_latencia_es_cero"><a class="anchor" href="#_2_la_latencia_es_cero"></a>2. La latencia es cero</h3>
<div class="paragraph">
<p>Toda comunicación tiene demora y esa demora varía. Depende de la distancia, las rutas, la congestión, las colas, la carga de los extremos y otros factores. Aunque una llamada remota normalmente responda rápido, no es seguro diseñar suponiendo que siempre lo hará.</p>
</div>
<div class="paragraph">
<p>Una operación que realiza muchas llamadas remotas consecutivas acumula sus demoras: si cada paso espera al anterior, la latencia total puede ser mucho mayor que la de cada llamada individual. Las colas y las demoras ocasionales también afectan los tiempos de respuesta extremos, aunque el promedio parezca aceptable. Por eso conviene reducir interacciones innecesarias, fijar plazos de extremo a extremo y medir percentiles de latencia además de promedios.</p>
</div>
<div class="paragraph">
<p>La asincronía permite que un proceso continúe con otro trabajo mientras espera un mensaje, pero no elimina el tiempo de comunicación. Si una operación depende del resultado remoto, en algún momento debe esperar, manejar la demora o aceptar que el resultado todavía no se conoce.</p>
</div>
<div class="paragraph">
<p>Los relojes físicos de dos máquinas tampoco ofrecen, por sí solos, un orden exacto de los eventos: pueden diferir o ajustarse de manera distinta. Cuando importa razonar sobre causalidad, los relojes lógicos permiten representar relaciones de orden entre eventos, aunque no miden cuánto tiempo real transcurrió <a href="#Lamport1978" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Lamport1978]</a>. La página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/relojes/">relojes físicos y lógicos</a> desarrolla la sincronización de relojes, NTP y los relojes de Lamport y vectoriales.</p>
</div>
</div>
<div class="sect2">
<h3 id="_3_el_ancho_de_banda_es_infinito"><a class="anchor" href="#_3_el_ancho_de_banda_es_infinito"></a>3. El ancho de banda es infinito</h3>
<div class="paragraph">
<p>La red tiene capacidad finita y suele ser compartida por múltiples flujos. El tráfico excesivo genera competencia por ancho de banda, colas y demoras; los mensajes grandes también requieren memoria y trabajo de serialización en los extremos. Cuando crece el volumen de datos, un sistema que funcionaba en una prueba pequeña puede saturarse o aumentar mucho su latencia.</p>
</div>
<div class="paragraph">
<p>Para controlar ese costo se pueden limitar tamaños y tasas, aplicar contrapresión (<strong>backpressure</strong>), transferir solo los datos necesarios y medir el comportamiento bajo carga realista. Agrupar mensajes puede reducir viajes de red, pero también aumentar el tiempo antes de enviar el lote y la memoria necesaria. La optimización es un compromiso que debe medirse, no una regla universal.</p>
</div>
</div>
<div class="sect2">
<h3 id="_4_la_red_es_segura"><a class="anchor" href="#_4_la_red_es_segura"></a>4. La red es segura</h3>
<div class="paragraph">
<p>Una red interna no constituye por sí sola una frontera de seguridad. Las máquinas pueden estar mal configuradas, las credenciales filtrarse y los servicios quedar expuestos por errores de infraestructura. Además, cifrar el canal no resuelve automáticamente quién puede realizar cada operación.</p>
</div>
<div class="paragraph">
<p>El diseño debe contemplar autenticación de las partes, autorización por operación, protección de secretos, cifrado cuando corresponda y validación de entradas. TLS protege el canal y, en su configuración habitual, permite al cliente verificar la identidad del servidor; si se configura autenticación mutua, el servidor también puede verificar la identidad del cliente. TLS no reemplaza los controles de acceso de la aplicación ni la gestión segura de credenciales. La seguridad debe aplicarse de extremo a extremo allí donde se necesita la garantía, no suponerse por la ubicación de los servidores <a href="#Saltzer1984" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Saltzer1984]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_5_la_topología_no_cambia"><a class="anchor" href="#_5_la_topología_no_cambia"></a>5. La topología no cambia</h3>
<div class="paragraph">
<p>Los nodos se agregan, retiran, reinician o reubican. Cambian direcciones, zonas, rutas, balanceadores y dependencias debido a despliegues, escalado, mantenimiento o fallas. Una lista fija de máquinas o una dirección almacenada para siempre puede dejar de representar la infraestructura real.</p>
</div>
<div class="paragraph">
<p>Un sistema necesita mecanismos para resolver nombres y descubrir servicios, actualizar la membresía cuando corresponda y recuperarse cuando los nodos cambian. El descubrimiento no garantiza que un servicio esté listo para atender: la salud y la disponibilidad deben comprobarse por separado. También hay que diseñar la transición entre configuraciones; cambiar la lista de miembros sin coordinarlo puede dejar a distintos nodos tomando decisiones incompatibles.</p>
</div>
</div>
<div class="sect2">
<h3 id="_6_solo_hay_un_administrador"><a class="anchor" href="#_6_solo_hay_un_administrador"></a>6. Solo hay un administrador</h3>
<div class="paragraph">
<p>Los servicios distribuidos suelen atravesar equipos, organizaciones y proveedores con objetivos, permisos y ciclos de cambio diferentes. Un equipo puede desplegar una versión mientras otro modifica una dependencia; una política de seguridad o una interrupción de un proveedor puede afectar componentes que la aplicación no administra.</p>
</div>
<div class="paragraph">
<p>Por eso, además del código, hacen falta acuerdos sobre contratos, versiones, responsables, ventanas de mantenimiento y manejo de incidentes. La observabilidad debe permitir determinar qué componente falló y qué operaciones quedaron inciertas. La automatización de reinicios ayuda a recuperar procesos, pero no sustituye la coordinación operativa ni garantiza que los datos y las dependencias externas estén sanos.</p>
</div>
</div>
<div class="sect2">
<h3 id="_7_el_costo_de_transporte_es_cero"><a class="anchor" href="#_7_el_costo_de_transporte_es_cero"></a>7. El costo de transporte es cero</h3>
<div class="paragraph">
<p>Enviar un mensaje tiene costos de serialización, copia, transmisión, recepción, validación y procesamiento. También puede implicar almacenamiento, transferencia entre regiones, uso de servicios administrados y trabajo de operación. Incluso si el costo monetario por mensaje es bajo, una comunicación adicional puede aumentar la latencia o la carga.</p>
</div>
<div class="paragraph">
<p>Conviene evaluar el costo completo de una interacción: cuántos viajes requiere, cuánto dato mueve y qué ocurre cuando se reintenta o se acumulan mensajes. Reducir llamadas puede mejorar el rendimiento, pero enviar lotes enormes puede elevar la memoria, la latencia y el impacto de una falla. La elección depende del patrón de uso y debe confirmarse con mediciones.</p>
</div>
</div>
<div class="sect2">
<h3 id="_8_la_red_es_homogénea"><a class="anchor" href="#_8_la_red_es_homogénea"></a>8. La red es homogénea</h3>
<div class="paragraph">
<p>Los participantes pueden usar lenguajes, sistemas operativos, arquitecturas, versiones y representaciones de datos diferentes. Incluso cuando dos servicios aceptan el mismo formato, pueden interpretar de forma distinta un campo, una zona horaria, una unidad o un valor ausente.</p>
</div>
<div class="paragraph">
<p>La interoperabilidad exige contratos explícitos: definir esquemas, unidades, codificación, errores y reglas de compatibilidad; versionar los cambios; y probar que productores y consumidores puedan evolucionar sin romperse entre sí. No alcanza con serializar una estructura interna ni con elegir JSON, XML u otro formato: el significado y las reglas de evolución también forman parte del protocolo.</p>
</div>
</div>
<div class="sect2">
<h3 id="_cómo_usar_estas_falacias_al_diseñar"><a class="anchor" href="#_cómo_usar_estas_falacias_al_diseñar"></a>Cómo usar estas falacias al diseñar</h3>
<div class="paragraph">
<p>Las falacias no se “resuelven” con una biblioteca única. Para cada interacción remota conviene preguntar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>¿Qué sabe el cliente si vence el timeout: que la operación falló o solo que no recibió respuesta?</p>
</li>
<li>
<p>¿Cómo se manejan los reintentos, los mensajes duplicados y las respuestas tardías?</p>
</li>
<li>
<p>¿Qué ocurre si la latencia o la carga superan los valores habituales?</p>
</li>
<li>
<p>¿Qué garantías de consistencia se mantienen durante una partición y cuáles operaciones dejan de estar disponibles?</p>
</li>
<li>
<p>¿Cómo se autentican los participantes y se autorizan sus acciones?</p>
</li>
<li>
<p>¿Cómo se descubren los servicios, se cambian las configuraciones y se recupera el sistema?</p>
</li>
<li>
<p>¿Qué contratos permiten que componentes distintos evolucionen de forma compatible?</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Para un servicio de lectura y escritura que requiere respuestas a todas las solicitudes y una visión linealizable del estado, una partición de red impide garantizar ambas propiedades a la vez: el servicio debe rechazar o aplazar algunas operaciones, o responder con el riesgo de que los resultados no formen una única historia consistente. Este es el compromiso formal estudiado por Gilbert y Lynch; no significa simplemente escoger dos de tres etiquetas <a href="#GilbertLynch2002" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GilbertLynch2002]</a>. Pensar en estas preguntas desde el diseño hace visibles los compromisos y evita que condiciones normales de la red se conviertan en supuestos invisibles.</p>
</div>
</div>
<div class="sect2">
<h3 id="_erlangotp_como_ejemplo_no_como_excepción"><a class="anchor" href="#_erlangotp_como_ejemplo_no_como_excepción"></a>Erlang/OTP como ejemplo, no como excepción</h3>
<div class="paragraph">
<p>Erlang/OTP ofrece herramientas para comunicación, supervisión y detección de pérdida de conectividad, pero no elimina las falacias. Por ejemplo, sus <strong>net ticks</strong> supervisan conexiones de distribución; no certifican que la lógica de negocio del nodo remoto esté sana. La distribución nativa también tiene requisitos de compatibilidad y seguridad, y debe configurarse de acuerdo con el entorno. Las referencias oficiales describen esos mecanismos y sus límites <a href="#ErlangDistributed" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangDistributed]</a>, <a href="#ErlangTLS" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangTLS]</a>, <a href="#ErlangKernel" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangKernel]</a>.</p>
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
<p><a id="Waldo1997"></a>[Waldo1997] WALDO, Jim; WYANT, Geoff; WOLLRATH, Ann; y KENDALL, Sam. «A Note on Distributed Computing». En: <strong>Mobile Object Systems: Towards the Programmable Internet</strong>. Lecture Notes in Computer Science, vol. 1222. Springer, 1997, pp. 49–64. <a href="https://doi.org/10.1007/3-540-62852-5_6">DOI</a>.</p>
</li>
<li>
<p><a id="GilbertLynch2002"></a>[GilbertLynch2002] GILBERT, Seth y LYNCH, Nancy. «Brewer&#8217;s Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services». <strong>ACM SIGACT News</strong>, 33(2), 2002, pp. 51–59. <a href="https://doi.org/10.1145/564585.564601">DOI</a>.</p>
</li>
<li>
<p><a id="ChandraToueg1996"></a>[ChandraToueg1996] CHANDRA, Tushar D. y TOUEG, Sam. «Unreliable Failure Detectors for Reliable Distributed Systems». <strong>Journal of the ACM</strong>, 43(2), 1996, pp. 225–267. <a href="https://doi.org/10.1145/226643.226647">DOI</a>.</p>
</li>
<li>
<p><a id="Saltzer1984"></a>[Saltzer1984] SALTZER, Jerome H.; REED, David P.; y CLARK, David D. «End-to-End Arguments in System Design». <strong>ACM Transactions on Computer Systems</strong>, 2(4), 1984, pp. 277–288. <a href="https://doi.org/10.1145/357401.357402">DOI</a>.</p>
</li>
<li>
<p><a id="Lamport1978"></a>[Lamport1978] LAMPORT, Leslie. «Time, Clocks, and the Ordering of Events in a Distributed System». <strong>Communications of the ACM</strong>, 21(7), 1978, pp. 558–565. <a href="https://doi.org/10.1145/359545.359563">DOI</a>.</p>
</li>
<li>
<p><a id="RotemGalOzFallacies"></a>[RotemGalOzFallacies] ROTEM-GAL-OZ, Arnon. «Fallacies of Distributed Computing Explained». <a href="https://www.researchgate.net/publication/322500050_Fallacies_of_Distributed_Computing_Explained">ResearchGate</a>.</p>
</li>
<li>
<p><a id="ErlangDistributed"></a>[ErlangDistributed] Erlang/OTP. <em>Distributed Erlang</em>. <a href="https://www.erlang.org/doc/system/distributed.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ErlangTLS"></a>[ErlangTLS] Erlang/OTP. <em>Using SSL for Erlang Distribution</em>. <a href="https://www.erlang.org/doc/apps/ssl/ssl_distribution.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ErlangKernel"></a>[ErlangKernel] Erlang/OTP. <em>Kernel Application</em>. Parámetros de conexiones y <code>net_ticktime</code>. <a href="https://www.erlang.org/doc/apps/kernel/kernel_app.html">Documentación oficial</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};