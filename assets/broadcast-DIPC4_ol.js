var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema distribuido, <strong>broadcast</strong> es una abstracción de comunicación en la que un proceso envía un mensaje a un grupo de participantes. La abstracción describe qué mensajes reciben los procesos y qué garantías ofrece la entrega. No significa necesariamente que una única trama física de red llegue a todos: una implementación puede reenviar mensajes punto a punto, usar multicast de red, retransmisiones o una combinación de mecanismos.</p>
</div>
<div class="paragraph">
<p>Esta acepción es distinta del <strong>modo broadcast de NTP</strong>, donde un servidor difunde periódicamente la hora a varios receptores. NTP broadcast es una modalidad concreta de sincronización de relojes; los algoritmos de esta página estudian difusión de mensajes de aplicación y sus garantías. Para sincronización temporal, véase la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/relojes/">relojes físicos y lógicos</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_de_enviar_a_entregar"><a class="anchor" href="#_de_enviar_a_entregar"></a>De enviar a entregar</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Supongamos que un proceso A anuncia una actualización a los procesos B, C y D. En una llamada local bastaría con invocar una función para cada destinatario. En una red, sin embargo, cada envío puede demorarse, perderse o repetirse, el emisor puede fallar en medio de la operación y los destinatarios pueden observar órdenes diferentes.</p>
</div>
<div class="paragraph">
<p>Un algoritmo de broadcast define quién forma parte del grupo, cómo se disemina cada mensaje, cuándo un proceso puede declararlo <strong>entregado</strong> y qué ocurre si fallan el emisor o algún receptor. La entrega es un evento local: B puede entregar el mensaje antes que C, y un proceso no sabe solo por haber entregado que todos los demás ya lo hicieron.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/broadcast-reenvio.svg" alt="Difusión confiable mediante reenvío del mensaje recibido por primera vez" width="760">
</div>
</div>
<div class="paragraph">
<p>La figura ilustra una estrategia de reenvío: A inicia la difusión y B, después de recibir el mensaje, lo retransmite a otros participantes. El reenvío puede ayudar a que la información sobreviva a la caída del emisor original, pero las garantías finales dependen del protocolo, del modelo de fallas, de la membresía conocida y de que los mensajes puedan volver a circular después de una interrupción.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_difusión_best_effort_y_broadcast_confiable"><a class="anchor" href="#_difusión_best_effort_y_broadcast_confiable"></a>Difusión best-effort y broadcast confiable</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La difusión <strong>best-effort</strong> intenta enviar un mensaje a todos los participantes conocidos, pero ofrece garantías limitadas ante pérdidas y fallas. En un modelo habitual con fallas por caída (<strong>crash failures</strong>), puede expresarse con estas propiedades:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Validez:</strong> si un proceso correcto inicia la difusión de un mensaje, todos los procesos correctos del grupo finalmente lo entregan.</p>
</li>
<li>
<p><strong>Integridad:</strong> un proceso entrega cada mensaje a lo sumo una vez y no entrega mensajes que nadie difundió.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La difusión best-effort no garantiza que los procesos correctos coincidan cuando el emisor falla durante el envío: algunos pueden haber recibido el mensaje y otros no.</p>
</div>
<div class="paragraph">
<p>El <strong>reliable broadcast</strong> agrega una propiedad de acuerdo:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Acuerdo:</strong> si algún proceso correcto entrega un mensaje, todos los procesos correctos del grupo finalmente lo entregan.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La propiedad <strong>validez</strong> sigue exigiendo que una difusión de un emisor correcto alcance a los procesos correctos, e <strong>integridad</strong> evita entregas duplicadas o inventadas. La formulación exacta se adapta al modelo de fallas y a la definición del grupo. En algunas especificaciones, el <strong>uniform reliable broadcast</strong> fortalece el acuerdo: si cualquier proceso entrega un mensaje, incluso uno que después falla, todos los procesos correctos terminan entregándolo. Esta distinción importa si una aplicación puede observar el efecto de un proceso antes de que este caiga <a href="#Cachin2011" class="biblioref" class="biblioref">[Cachin2011]</a>.</p>
</div>
<div class="paragraph">
<p>Una estrategia intuitiva para lograr mayor tolerancia a la caída del emisor es que cada proceso retransmita un mensaje la primera vez que lo recibe. Si A falla luego de enviarlo solo a B, B puede seguir diseminándolo. Los receptores mantienen identificadores de mensajes para suprimir duplicados. Esta idea explica el mecanismo, pero no es una receta completa para todos los sistemas: deben definirse membresía, confirmaciones, expiración del historial, reintegración de participantes y comportamiento ante particiones.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_el_orden_de_entrega_es_una_garantía_independiente"><a class="anchor" href="#_el_orden_de_entrega_es_una_garantía_independiente"></a>El orden de entrega es una garantía independiente</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un broadcast confiable determina <strong>quién termina entregando cada mensaje</strong>, pero no necesariamente el orden entre distintos mensajes. Si A difunde <code>m1</code> y después <code>m2</code>, B podría entregar <code>m1, m2</code>, mientras C entrega <code>m2, m1</code>, salvo que el protocolo restrinja ese comportamiento.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/broadcast-orden-mensajes.svg" alt="Un mismo mensaje m1 se entrega en momentos distintos a los procesos B y C" width="760">
</div>
</div>
<div class="paragraph">
<p>En el primer esquema, A difunde <code>m1</code> a B y C. Aunque ambas copias pertenecen a la misma difusión, la red tiene demoras distintas: B puede recibirla antes que C. Eso no es por sí mismo una violación de confiabilidad. El problema aparece si otro evento depende de que B haya recibido <code>m1</code> y se difunde antes de que C entregue la copia original.</p>
</div>
<div class="paragraph">
<p>Se pueden añadir garantías de orden según las necesidades de la aplicación:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Sin orden adicional:</strong> los procesos correctos entregan los mismos mensajes, pero pueden hacerlo en órdenes diferentes.</p>
</li>
<li>
<p><strong>FIFO:</strong> si el mismo emisor difunde <code>m1</code> antes que <code>m2</code>, ningún receptor entrega <code>m2</code> antes que <code>m1</code>. No ordena mensajes de emisores distintos.</p>
</li>
<li>
<p><strong>Causal:</strong> si la difusión de <code>m1</code> causa la difusión de <code>m2</code>, los procesos que entregan ambos respetan ese orden. Los mensajes concurrentes todavía pueden entregarse en órdenes distintos.</p>
</li>
<li>
<p><strong>Total:</strong> todos los procesos correctos entregan los mensajes en el mismo orden, aunque hayan llegado por rutas diferentes.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Un <strong>atomic broadcast</strong> suele referirse a una abstracción que combina entrega confiable y orden total. La terminología varía entre textos y protocolos, por lo que conviene especificar explícitamente las propiedades en lugar de depender solo del nombre.</p>
</div>
<div class="sect2">
<h3 id="_fifo_y_orden_de_un_mismo_emisor"><a class="anchor" href="#_fifo_y_orden_de_un_mismo_emisor"></a>FIFO y orden de un mismo emisor</h3>
<div class="paragraph">
<p>Para imponer FIFO, un emisor puede numerar sus mensajes <code>1, 2, 3, &#8230;&#8203;</code>. El receptor conserva el próximo número esperado y retiene temporalmente mensajes que llegan adelantados. Cuando recibe el faltante, puede entregar la secuencia contigua. En la práctica se necesitan además reglas para retransmitir números ausentes y distinguir el estado de un emisor que se reinició de la instancia anterior.</p>
</div>
<div class="paragraph">
<p>FIFO preserva el orden local de un único emisor, no la causalidad entre procesos distintos. Si A difunde un mensaje que B recibe y B luego difunde una respuesta, FIFO por emisor no basta para expresar esa dependencia si los mensajes provienen de emisores diferentes.</p>
</div>
</div>
<div class="sect2">
<h3 id="_broadcast_causal_y_relojes_lógicos"><a class="anchor" href="#_broadcast_causal_y_relojes_lógicos"></a>Broadcast causal y relojes lógicos</h3>
<div class="paragraph">
<p>La entrega causal exige que los mensajes relacionados por una cadena de causas respeten ese orden. Si B recibe <code>m1</code> y, como consecuencia, difunde <code>m2</code>, ningún proceso que entregue ambos debe entregar <code>m2</code> antes que <code>m1</code>. En cambio, dos mensajes difundidos sin una relación causal pueden ser concurrentes.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/broadcast-orden-causal.svg" alt="Una entrega tardía de m1 llega a C después de que m2" width="760" height="ya fue entregado">
</div>
</div>
<div class="paragraph">
<p>El diagrama ilustra una entrega sin garantía causal. A difunde <code>m1</code> a B y C; B lo recibe y, como consecuencia, difunde <code>m2</code>. La copia de <code>m1</code> dirigida a C se demora, mientras que <code>m2</code> llega primero. C observa entonces <code>m2</code> antes que el evento que lo causó. Un broadcast causal retendría <code>m2</code> en C hasta entregar <code>m1</code>, preservando la dependencia aun cuando las rutas y sus demoras difieran.</p>
</div>
<div class="paragraph">
<p>Los relojes vectoriales pueden ayudar a representar dependencias: el mensaje lleva un resumen causal y el receptor retrasa su entrega hasta haber recibido los antecedentes requeridos. Así, la información de orden lógico descrita en la página de <a href="https://arquitecturas-concurrentes.github.io/iasc-book/relojes/">relojes</a> puede usarse para implementar o explicar la entrega causal. El vector no transmite por sí mismo los mensajes ausentes; el protocolo también debe garantizar su difusión y recuperación <a href="#Birman1991" class="biblioref" class="biblioref">[Birman1991]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_broadcast_de_orden_total"><a class="anchor" href="#_broadcast_de_orden_total"></a>Broadcast de orden total</h3>
<div class="paragraph">
<p>El orden total requiere que todos los procesos correctos que entregan los mismos mensajes respeten una secuencia relativa común. Una solución puede proponer secuencias o posiciones y acordarlas con un protocolo de coordinación; al mismo tiempo debe manejar emisores que fallan, cambios de membresía y mensajes retrasados. No alcanza con ordenar por timestamps físicos: relojes desfasados pueden asignar marcas incompatibles con el orden observado, y marcas iguales necesitan una regla adicional.</p>
</div>
<div class="paragraph">
<p>En sistemas asíncronos con fallas por caída, el broadcast atómico y el consenso están estrechamente relacionados: bajo los supuestos usuales, cada abstracción puede construirse a partir de la otra. Esto explica por qué acordar el orden de mensajes no es solo una cuestión de ordenar una cola; puede requerir resolver quién propone el siguiente elemento y cómo se recupera el grupo ante fallas <a href="#Schneider1990" class="biblioref" class="biblioref">[Schneider1990]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_elegir_las_garantías_de_difusión"><a class="anchor" href="#_elegir_las_garantías_de_difusión"></a>Elegir las garantías de difusión</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La garantía se elige según la semántica que debe preservar la aplicación. FIFO puede bastar para mantener el orden de eventos de un mismo productor. El orden causal resulta apropiado cuando una actualización depende de otra, pero no se necesita ordenar arbitrariamente los cambios concurrentes. El orden total es relevante cuando todos los participantes deben aplicar los mensajes en la misma secuencia, como ocurre en una máquina de estados replicada.</p>
</div>
<div class="paragraph">
<p>La decisión también depende de la membresía, del modelo de fallas y del costo operativo. Un grupo estable que solo contempla caídas de procesos presenta requisitos distintos de uno que admite particiones frecuentes o participantes bizantinos. Si el emisor puede fallar durante una difusión, deben considerarse cuáles receptores pudieron observar el mensaje, cómo se propaga a los restantes y cómo se evitan entregas duplicadas. Las garantías más fuertes pueden requerir coordinación adicional, más mensajes y mayor latencia; deben incorporarse solo cuando la aplicación depende de ellas.</p>
</div>
<div class="paragraph">
<p>Las garantías de broadcast deben entenderse bajo el modelo de fallas declarado. Los protocolos clásicos de difusión confiable suelen suponer participantes que pueden dejar de ejecutar, pero no mentir deliberadamente. Si se contemplan nodos bizantinos que envían valores contradictorios o falsifican mensajes, hacen falta mecanismos de autenticación y protocolos bizantinos, con supuestos y costos adicionales. Para estos casos, véase también la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/protocolos_bft/">protocolos BFT</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_broadcast_gossip_y_confiabilidad_de_transporte"><a class="anchor" href="#_broadcast_gossip_y_confiabilidad_de_transporte"></a>Broadcast, gossip y confiabilidad de transporte</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un protocolo <strong>gossip</strong> selecciona pares para intercambiar y propagar información de manera epidémica. Puede ser una estrategia escalable para transportar actualizaciones o membresía, pero el uso de gossip no implica automáticamente las propiedades de reliable broadcast: la probabilidad y el tiempo de propagación, la reparación de mensajes omitidos y el acuerdo deben quedar definidos por el protocolo. La página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/heartbeat_gossip/">heartbeats y gossip</a> profundiza en diseminación epidémica y anti-entropy.</p>
</div>
<div class="paragraph">
<p>Del mismo modo, que TCP entregue bytes en orden dentro de una conexión no crea por sí solo broadcast confiable, orden causal o total entre múltiples conexiones y participantes. Las garantías de transporte se aplican a un canal; las del broadcast se refieren a los eventos de entrega observados por el grupo. La aplicación debe elegir la abstracción que corresponde a su necesidad.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="Birman1991"></a>[Birman1991] BIRMAN, Kenneth P.; SCHIPER, André; y STEPHENSON, Pat. «Lightweight Causal and Atomic Group Multicast». <strong>ACM Transactions on Computer Systems</strong>, 9(3), 1991, pp. 272–314. <a href="https://doi.org/10.1145/128738.128742">DOI</a>.</p>
</li>
<li>
<p><a id="Cachin2011"></a>[Cachin2011] CACHIN, Christian; GUERRAOUI, Rachid; y RODRIGUES, Luís. <strong>Introduction to Reliable and Secure Distributed Programming</strong>. 2.ª ed. Springer, 2011. <a href="https://doi.org/10.1007/978-3-642-15260-3">DOI</a>.</p>
</li>
<li>
<p><a id="Schneider1990"></a>[Schneider1990] SCHNEIDER, Fred B. «Implementing Fault-Tolerant Services Using the State Machine Approach: A Tutorial». <strong>ACM Computing Surveys</strong>, 22(4), 1990, pp. 299–319. <a href="https://doi.org/10.1145/98163.98167">DOI</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};