var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema distribuido, cada nodo observa solo una parte del sistema y la comunicación puede demorarse o interrumpirse. Aun así, muchas decisiones dependen de saber qué nodos parecen activos, qué miembros pertenecen al grupo y cómo hacer circular cambios. Los <strong>heartbeats</strong> y los protocolos de <strong>gossip</strong> ayudan con estos problemas, pero no convierten una observación incierta en una verdad absoluta ni reemplazan la coordinación cuando se necesita una decisión consistente. Esta página desarrolla primero la detección de actividad y luego la diseminación epidémica; para ordenar causalmente eventos entre nodos, véase también la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/relojes/">relojes físicos y lógicos</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_actividad_disponibilidad_y_salud"><a class="anchor" href="#_actividad_disponibilidad_y_salud"></a>Actividad, disponibilidad y salud</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Antes de elegir un mecanismo conviene distinguir qué se quiere averiguar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Actividad del proceso:</strong> ¿el proceso sigue ejecutándose y puede atender su bucle principal?</p>
</li>
<li>
<p><strong>Alcance de red:</strong> ¿puede un nodo intercambiar mensajes con otro por una ruta determinada?</p>
</li>
<li>
<p><strong>Disponibilidad de una operación:</strong> ¿el servicio puede completar ahora una solicitud concreta?</p>
</li>
<li>
<p><strong>Membresía:</strong> ¿qué nodos considera el grupo como participantes?</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Estas propiedades se relacionan, pero no son equivalentes. Un proceso puede estar vivo y responder heartbeats mientras una base de datos necesaria para atender compras está caída. Un endpoint de salud puede comprobar esa dependencia, pero no necesariamente permite que los demás nodos detecten una partición de red. A la inversa, que un nodo no responda a un heartbeat no demuestra que su proceso haya terminado: quizá solo se haya interrumpido la ruta entre ambos.</p>
</div>
<div class="paragraph">
<p>Por eso, los heartbeats suelen servir para detectar actividad o alcance de red; los chequeos de salud evalúan condiciones de servicio; y los mecanismos de membresía distribuyen qué participantes conoce el grupo. El diseño debe indicar qué significa cada señal y qué decisión se permite tomar a partir de ella.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_heartbeat_observar_actividad_mediante_señales_periódicas"><a class="anchor" href="#_heartbeat_observar_actividad_mediante_señales_periódicas"></a>Heartbeat: observar actividad mediante señales periódicas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un <strong>heartbeat</strong> (o <strong>latido</strong>) es un mensaje periódico que un proceso envía, o que espera recibir, para que otro proceso observe que hubo comunicación recientemente. Puede ser un mensaje unidireccional, un intercambio de solicitud y respuesta, o una señal incorporada a los mensajes normales. El receptor mantiene un temporizador y lo reinicia cuando recibe una señal válida.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">Nodo A                                      Nodo B
  |                                            |
  |---------------- heartbeat ---------------&gt;|
  |&lt;--------------- respuesta ----------------|
  |              reinicia timeout             |
  |                                            |
  |   no llega otra señal antes del timeout    |
  |   A marca a B como sospechoso              |</code></pre>
</div>
</div>
<div class="paragraph">
<p>El timeout produce una <strong>sospecha</strong>, no una prueba. La señal puede demorarse por congestión, colas, pausas del sistema operativo, recolección de basura o saturación del proceso. También puede perderse una respuesta aunque el nodo remoto siga funcionando. En un sistema asíncrono, una demora arbitrariamente larga puede ser indistinguible de una caída desde el punto de vista del observador; los detectores de fallas formalizan esta limitación y los compromisos entre rapidez y precisión <a href="#ChandraToueg1996" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ChandraToueg1996]</a>.</p>
</div>
<div class="sect2">
<h3 id="_intervalo_y_timeout"><a class="anchor" href="#_intervalo_y_timeout"></a>Intervalo y timeout</h3>
<div class="paragraph">
<p>El intervalo entre heartbeats y el timeout definen cuánto tarda el detector en sospechar de un nodo. No existe un valor universal:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Con intervalos cortos y timeouts pequeños, la detección puede ser rápida, pero una pausa breve puede producir una sospecha errónea.</p>
</li>
<li>
<p>Con intervalos largos o varios mensajes perdidos permitidos, disminuyen algunas sospechas prematuras, pero la reacción ante una caída demora más.</p>
</li>
<li>
<p>Si muchos nodos sincronizan sus envíos, pueden generar ráfagas periódicas de tráfico; introducir variación aleatoria (<strong>jitter</strong>) ayuda a repartir la carga.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>El timeout también debe considerar la carga esperada, los límites de latencia y el costo de actuar sobre un falso positivo. Sacar un nodo de rotación puede ser reversible; elegir un nuevo líder o confirmar una operación con datos desactualizados tiene consecuencias más serias. Conviene medir la distribución de los intervalos observados y validar los valores bajo carga, reinicios y degradaciones de red, en lugar de elegirlos solo a partir del promedio.</p>
</div>
<div class="paragraph">
<p>Algunos sistemas usan detectores de fallas adaptativos. El detector φ-accrual, por ejemplo, transforma la distribución observada de demoras entre heartbeats en un nivel de sospecha: cuanto más improbable resulta la demora actual según el historial, mayor es φ. La aplicación decide qué umbral usar según el costo de una sospecha; el detector no afirma que exista un umbral que distinga perfectamente una caída de una demora <a href="#Hayashibara2004" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Hayashibara2004]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_se_envía_y_por_qué_canal"><a class="anchor" href="#_qué_se_envía_y_por_qué_canal"></a>Qué se envía y por qué canal</h3>
<div class="paragraph">
<p>Un heartbeat puede limitarse a confirmar que el emisor sigue ejecutándose, o incluir un contador, una época de membresía, una versión de configuración o un resumen de estado. Incluir datos permite detectar cambios y reducir mensajes adicionales, pero requiere definir cómo se validan, actualizan y conservan esos datos.</p>
</div>
<div class="paragraph">
<p>El tráfico de aplicación a veces puede cumplir también la función de heartbeat: si ya se reciben mensajes recientes del nodo, enviar otra señal de actividad puede ser redundante. En cambio, un canal dedicado puede facilitar la detección cuando no hay tráfico normal. Ninguna alternativa es siempre superior:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Si heartbeat y tráfico de aplicación comparten una ruta saturada, la saturación puede retrasar ambas cosas y generar sospechas.</p>
</li>
<li>
<p>Si usan rutas independientes, una puede funcionar mientras la otra está rota; el detector debe describir qué conectividad está comprobando.</p>
</li>
<li>
<p>Una conexión separada agrega recursos, configuración y otra posible fuente de fallas.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Por lo tanto, separar canales no es una recomendación universal. La elección depende de si se busca detectar la salud del proceso, la conectividad entre nodos o la capacidad de atender una operación. Los heartbeats tampoco deberían presentarse como una comprobación completa de salud: un proceso puede generar latidos mientras una dependencia crítica no responde.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_gossip_diseminar_información_entre_pares"><a class="anchor" href="#_gossip_diseminar_información_entre_pares"></a>Gossip: diseminar información entre pares</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un protocolo de <strong>gossip</strong> (también llamado difusión epidémica) hace que los nodos intercambien información con algunos pares y la propaguen gradualmente. En vez de que todos consulten a un nodo central o mantengan una conexión directa con todos los demás, cada participante comparte actualizaciones con otros participantes. Los algoritmos epidémicos se estudiaron, entre otros usos, para mantener réplicas y propagar actualizaciones en sistemas distribuidos <a href="#Demers1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Demers1987]</a>.</p>
</div>
<div class="paragraph">
<p>Una ronda simplificada podría verse así:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">Ronda 0:       A conoce el cambio
Ronda 1:       A -&gt; B, A -&gt; C
Ronda 2:       B -&gt; D, C -&gt; E
Ronda 3:       D y E lo comparten con otros pares
               ...
Resultado:     los nodos alcanzables aprenden el cambio</code></pre>
</div>
</div>
<div class="paragraph">
<p>Cada nodo puede seleccionar pares al azar, intercambiar una o varias actualizaciones y repetir el proceso. En condiciones favorables, la información puede alcanzar a muchos nodos en pocas rondas; la rapidez y el tráfico reales dependen del tamaño del grupo, la frecuencia, el número de pares elegidos, las pérdidas, la topología y las particiones. La difusión no es instantánea ni garantiza que cada nodo tenga la misma vista en todo momento.</p>
</div>
<div class="paragraph">
<p>Si cada participante elige al azar un número acotado de pares por ronda, la cantidad de nodos que conoce el rumor puede crecer rápidamente al comienzo. En un modelo idealizado de contactos independientes, la propagación suele abarcar un grupo grande en un número de rondas que crece aproximadamente con el logaritmo del tamaño del grupo. Es una propiedad probabilística del modelo, no una cota temporal garantizada: particiones, nodos sobrecargados, membresía obsoleta y elecciones correlacionadas pueden retrasar la convergencia.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/gossip-difusion.svg" alt="Diseminación epidémica de una actualización mediante intercambios entre pares" width="760">
</div>
</div>
<div class="sect2">
<h3 id="_formas_de_intercambio"><a class="anchor" href="#_formas_de_intercambio"></a>Formas de intercambio</h3>
<div class="paragraph">
<p>Los mecanismos más comunes se pueden combinar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Push:</strong> el nodo que conoce una actualización la envía a pares seleccionados. Es útil para difundir rápidamente novedades.</p>
</li>
<li>
<p><strong>Pull:</strong> el nodo pregunta a un par por información que todavía no tiene. Puede ayudar a recuperar cambios perdidos o a sincronizar un nodo que vuelve a conectarse.</p>
</li>
<li>
<p><strong>Push-pull:</strong> ambos comparan lo que conocen y envían lo que falta. SWIM, por ejemplo, combina la detección de fallas con la diseminación de membresía en un protocolo pensado para grupos grandes <a href="#Das2002" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Das2002]</a>.</p>
</li>
<li>
<p><strong>Anti-entropy:</strong> los pares comparan resúmenes o versiones de sus estados e intercambian diferencias. Puede reparar divergencias que no se propagaron mediante la difusión inicial.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>El <strong>rumor mongering</strong> suele hacer circular una actualización como un rumor durante varias rondas y luego detener su difusión cuando ya parece suficientemente extendida. El anti-entropy, en cambio, puede continuar periódicamente para encontrar y reparar diferencias. Estas estrategias intercambian latencia, consumo de red y probabilidad de que una actualización llegue a todos los participantes.</p>
</div>
</div>
<div class="sect2">
<h3 id="_propagar_membresía_y_estados_de_nodos"><a class="anchor" href="#_propagar_membresía_y_estados_de_nodos"></a>Propagar membresía y estados de nodos</h3>
<div class="paragraph">
<p>En un grupo con membresía dinámica, el mensaje puede incluir identificadores de nodos, contadores, versiones o cambios de estado como <code>alive</code>, <code>suspect</code> y <code>dead</code>. Los nombres y transiciones concretos dependen del protocolo. Una secuencia ilustrativa es:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>Un nodo deja de recibir señales de otro dentro del intervalo esperado.</p>
</li>
<li>
<p>Lo marca como <strong>sospechoso</strong> y propaga esa observación.</p>
</li>
<li>
<p>Otros nodos pueden intentar comprobarlo o aportar evidencia independiente.</p>
</li>
<li>
<p>Si la sospecha persiste según las reglas del protocolo, se difunde un cambio de membresía.</p>
</li>
<li>
<p>Cuando el nodo reaparece, el grupo necesita decidir cómo reincorporarlo y reconciliar la información.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>La distinción entre <strong>sospechoso</strong> y <strong>caído</strong> permite no convertir inmediatamente una demora aislada en una decisión irreversible. Algunos protocolos usan números de época o <strong>incarnation numbers</strong>: el nodo sospechado puede incrementar su época y difundir una refutación que demuestre que su estado es más reciente. Los detalles importan: una versión antigua no debería sobrescribir una más nueva, y un identificador de nodo debe distinguirse de una dirección IP que puede cambiar.</p>
</div>
<div class="paragraph">
<p>El protocolo SWIM separa conceptualmente la detección de fallas de la diseminación de membresía: combina sondeos directos e indirectos con difusión de actualizaciones. Esto evita que cada nodo necesite sondear a todos los demás en cada ronda, aunque no elimina las sospechas erróneas ni garantiza una vista idéntica en todo instante <a href="#Das2002" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Das2002]</a>.</p>
</div>
<div class="paragraph">
<p>En una ronda de sondeo de SWIM, un miembro elige otro participante y le envía una comprobación directa. Si no recibe respuesta a tiempo, solicita a un conjunto pequeño de miembros intermediarios que intenten contactar al objetivo. Una respuesta indirecta permite distinguir algunos problemas de ruta entre dos nodos de una falta de respuesta más amplia. Si las comprobaciones fallan, se difunde primero una sospecha con un período de gracia; el miembro sospechado puede refutarla incrementando su número de <strong>incarnation</strong>. La duración de la sospecha y la interpretación de mensajes son parámetros del protocolo y de la implementación, no una prueba matemática de que el nodo haya terminado.</p>
</div>
<div class="paragraph">
<p>La detección y la difusión tienen funciones diferentes. Los sondeos buscan evidencia de alcanzabilidad entre participantes; el <strong>gossip</strong> propaga las observaciones y los cambios de membresía. Un nodo puede recibir rápidamente una sospecha sin que todo el grupo la haya visto, y las opiniones pueden diferir durante la convergencia. Por eso las aplicaciones deben tratar los estados de membresía como observaciones con versión, no como una autoridad global instantánea.</p>
</div>
</div>
<div class="sect2">
<h3 id="_versiones_reconciliación_y_convergencia"><a class="anchor" href="#_versiones_reconciliación_y_convergencia"></a>Versiones, reconciliación y convergencia</h3>
<div class="paragraph">
<p>La diseminación de una actualización solo resulta útil si los receptores pueden decidir si es nueva y cómo combinarla con el estado local. Para una misma entidad se suele incluir un identificador estable y una versión, época o contador de generación. Un receptor conserva la versión más reciente según las reglas del protocolo y evita que un mensaje retrasado restaure accidentalmente un estado anterior.</p>
</div>
<div class="paragraph">
<p>Si se propagan estados completos, una operación de combinación determinista, asociativa, conmutativa e idempotente facilita que réplicas que intercambian las mismas actualizaciones converjan aunque las reciban en distinto orden. Esa propiedad no aparece automáticamente por usar gossip: la aplicación debe definir el tipo de dato, los conflictos y la retención de eliminaciones o <strong>tombstones</strong>. Los mensajes de operación, por su parte, pueden necesitar deduplicación y orden explícito. Para reparar cambios omitidos durante una desconexión, las rondas periódicas de <strong>anti-entropy</strong> comparan resúmenes o versiones y solicitan las diferencias, en lugar de depender solo del primer envío del rumor <a href="#Demers1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Demers1987]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_garantías_no_ofrece_gossip"><a class="anchor" href="#_qué_garantías_no_ofrece_gossip"></a>Qué garantías no ofrece gossip</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Gossip es una estrategia de comunicación y propagación; por sí sola no es un protocolo de consenso. En general no garantiza:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>que todos los nodos conozcan un cambio al mismo tiempo;</p>
</li>
<li>
<p>que dos nodos tengan siempre la misma vista de membresía;</p>
</li>
<li>
<p>un orden total y único para las actualizaciones concurrentes;</p>
</li>
<li>
<p>que una sospecha equivalga a una caída definitiva;</p>
</li>
<li>
<p>que una partición se resuelva sin decisiones de la aplicación.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Durante una partición, cada lado puede seguir comunicándose internamente y dejar de recibir actualizaciones del otro. Al reconectarse, habrá que intercambiar diferencias y resolver cambios concurrentes según reglas explícitas. Si una decisión necesita que no existan dos líderes activos, que no se venda dos veces la última unidad o que todos acuerden el orden de una operación, se necesita un mecanismo adicional de coordinación y las garantías correspondientes. Para el comportamiento de una aplicación durante una partición, véase también la sección sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/interleaving/">netsplits e interleavings</a>.</p>
</div>
<div class="paragraph">
<p>La relación entre la detección de particiones y las decisiones de consistencia o disponibilidad se trata en la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/cap/">CAP</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_consideraciones"><a class="anchor" href="#_consideraciones"></a>Consideraciones</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Conviene observar métricas como el número de nodos sospechosos, los cambios de membresía, la demora de propagación, los mensajes enviados y las discrepancias detectadas por anti-entropy. Una tasa alta de sospechas puede señalar timeouts demasiado agresivos, saturación o problemas de red; bajar el timeout sin investigar puede esconder el problema o empeorar la inestabilidad.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="ChandraToueg1996"></a>[ChandraToueg1996] CHANDRA, Tushar D. y TOUEG, Sam. «Unreliable Failure Detectors for Reliable Distributed Systems». <strong>Journal of the ACM</strong>, 43(2), 1996, pp. 225–267. <a href="https://doi.org/10.1145/226643.226647">DOI</a>.</p>
</li>
<li>
<p><a id="Hayashibara2004"></a>[Hayashibara2004] HAYASHIBARA, Naohiro; DÉFAGO, Xavier; YARED, Rami; y KATAYAMA, Takuya. «The φ Accrual Failure Detector». <strong>Proceedings of the 23rd IEEE International Symposium on Reliable Distributed Systems</strong>, 2004, pp. 66–78. <a href="https://doi.org/10.1109/RELDIS.2004.1353004">DOI</a>.</p>
</li>
<li>
<p><a id="Demers1987"></a>[Demers1987] DEMERS, Alan; GREENE, Dan; HAUSER, Carl; IRISH, Wes; LARSON, John; SHENKER, Scott; STURGIS, Howard; SWINEHART, Dan; y TERRY, Doug. «Epidemic Algorithms for Replicated Database Maintenance». <strong>Proceedings of the Sixth Annual ACM Symposium on Principles of Distributed Computing</strong>, 1987. <a href="https://doi.org/10.1145/41840.41841">DOI</a>.</p>
</li>
<li>
<p><a id="Das2002"></a>[Das2002] DAS, Abhishek; GUPTA, Indranil; y MOTIVALA, Ashish. «SWIM: Scalable Weakly-consistent Infection-style Process Group Membership Protocol». <strong>Proceedings of the International Conference on Dependable Systems and Networks</strong>, 2002. <a href="https://doi.org/10.1109/DSN.2002.1028914">DOI</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};