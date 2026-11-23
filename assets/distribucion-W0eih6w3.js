var e=`<div class="sect1">
<h2 id="_una_definición"><a class="anchor" href="#_una_definición"></a>Una definición</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un sistema distribuido reúne componentes independientes que colaboran mediante una red para ofrecer un servicio común. Una definición más precisa es:</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Un sistema distribuido es una colección de elementos informáticos autónomos que se comunican a través de una red, y que aparece a sus usuarios como un único sistema coherente.</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>La definición combina dos perspectivas. Por un lado, describe cómo está construido el sistema: sus componentes son autónomos y se comunican por una red. Por otro, indica qué experiencia busca ofrecer: que los usuarios perciban el servicio como una unidad. Cada parte señala una propiedad importante:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Elementos autónomos:</strong> los nodos son computadoras o procesos que ejecutan de manera independiente. Pueden tener memoria y estado locales, y cada uno puede fallar sin que los demás fallen al mismo tiempo.</p>
</li>
<li>
<p><strong>Se comunican a través de una red:</strong> no comparten necesariamente memoria; coordinan su trabajo intercambiando mensajes. La red introduce demoras y puede perder o reordenar mensajes.</p>
</li>
<li>
<p><strong>Un único sistema coherente para sus usuarios:</strong> quienes usan la aplicación interactúan con un servicio o una interfaz común, aunque detrás haya varios componentes. Esta apariencia no significa que la distribución sea invisible en toda circunstancia: una interrupción puede afectar lo que el sistema puede responder.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Esta definición destaca la tensión central de la distribución: se busca coordinar componentes independientes como un conjunto, aunque cada nodo solo conoce los mensajes que recibió y el estado local que conserva.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_por_qué_distribuir_un_sistema"><a class="anchor" href="#_por_qué_distribuir_un_sistema"></a>¿Por qué distribuir un sistema?</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Distribuir no es un objetivo en sí mismo. Puede ser útil cuando una sola máquina ya no alcanza, cuando hace falta atender usuarios desde distintas regiones, cuando se necesita continuar ante ciertas fallas o cuando distintas partes del dominio requieren ciclos de evolución independientes.</p>
</div>
<div class="paragraph">
<p>Algunas motivaciones frecuentes son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Escalabilidad:</strong> repartir carga de cómputo, almacenamiento o tráfico entre varios nodos.</p>
</li>
<li>
<p><strong>Disponibilidad y tolerancia a fallas:</strong> mantener algunas operaciones ante la caída de un componente, si hay redundancia y mecanismos para conmutar o recuperarse.</p>
</li>
<li>
<p><strong>Cercanía geográfica:</strong> atender a usuarios desde una región más próxima para reducir demoras.</p>
</li>
<li>
<p><strong>Descomposición organizativa o funcional:</strong> permitir que partes distintas del sistema tengan límites, responsabilidades o ciclos de despliegue propios.</p>
</li>
<li>
<p><strong>Dominio naturalmente distribuido:</strong> conectar participantes que ya están en lugares, redes u organizaciones diferentes.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Cada motivación trae decisiones y costos. La <a href="https://arquitecturas-concurrentes.github.io/iasc-book/replicacion/">replicación</a> puede aumentar la disponibilidad de lectura, pero obliga a decidir qué consistencia ofrecer. La <a href="https://arquitecturas-concurrentes.github.io/iasc-book/particionamiento/">partición de datos</a> reparte almacenamiento y trabajo, pero agrega enrutamiento y consultas que pueden cruzar nodos. Separar una aplicación en servicios puede permitir escalarlos por separado, pero agrega comunicación remota, contratos y operación. La distribución no garantiza automáticamente que el sistema sea más rápido, barato o confiable.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_empezar_de_manera_simple"><a class="anchor" href="#_empezar_de_manera_simple"></a>Empezar de manera simple</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Es frecuente empezar con una aplicación desplegada en una sola máquina o en pocas instancias coordinadas. Una arquitectura monolítica puede ser una buena opción inicial: simplifica el despliegue y permite que llamadas internas y cambios de estado ocurran dentro de un mismo proceso o base de datos.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image2.png" alt="Ejemplo de una aplicación monolítica y su base de datos" width="500">
</div>
</div>
<div class="paragraph">
<p>Conviene distinguir <strong>monolito</strong> de <strong>una sola máquina</strong>. Monolito describe cómo está organizada la aplicación; una aplicación monolítica puede ejecutarse en varias instancias detrás de un balanceador. A la inversa, una solución compuesta por servicios puede seguir dependiendo de un único servidor de base de datos. La organización del software y la topología de despliegue son decisiones relacionadas, pero no idénticas.</p>
</div>
<div class="paragraph">
<p>Al crecer el uso, pueden aparecer límites de CPU, memoria, almacenamiento, capacidad de la base de datos o velocidad de respuesta. Antes de distribuir, es útil medir qué recurso está saturado y cuál es el objetivo: aumentar capacidad, reducir latencia, mejorar la disponibilidad o separar responsabilidades. Distintos problemas requieren estrategias distintas.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_lo_que_cambia_al_cruzar_la_red"><a class="anchor" href="#_lo_que_cambia_al_cruzar_la_red"></a>Lo que cambia al cruzar la red</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una llamada a otro nodo no se comporta como una llamada local. La respuesta puede tardar, perderse o llegar después de que quien espera haya vencido su timeout. Si se pierde la respuesta, el emisor puede no saber si la operación remota llegó a ejecutarse.</p>
</div>
<div class="paragraph">
<p>Además, cada nodo puede tener una vista distinta y temporal del estado. Copiar información no implica que todas las réplicas se actualicen al mismo tiempo, y detectar que un nodo no responde no permite saber con certeza si falló o si solo se interrumpió la comunicación con él.</p>
</div>
<div class="paragraph">
<p>Al diseñar una interacción distribuida conviene especificar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>qué ocurre si la respuesta se demora o no llega;</p>
</li>
<li>
<p>si es seguro reintentar la operación y cómo se reconocen duplicados;</p>
</li>
<li>
<p>qué datos deben estar inmediatamente coordinados y cuáles pueden converger después;</p>
</li>
<li>
<p>qué operaciones siguen disponibles ante una partición de red;</p>
</li>
<li>
<p>cómo se recupera o reconcilia el estado al restablecerse la comunicación.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La sección sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/mitos_distribucion/">las falacias de la computación distribuida</a> profundiza en supuestos que suelen quedar ocultos al pasar de llamadas locales a comunicación por red. Para la detección de actividad y el intercambio de información entre nodos, véase <a href="https://arquitecturas-concurrentes.github.io/iasc-book/heartbeat_gossip/">heartbeats y gossip</a>; para pensar la decisión bajo una partición, véase <a href="https://arquitecturas-concurrentes.github.io/iasc-book/cap/">CAP</a>.</p>
</div>
<div class="paragraph">
<p>La coordinación cuando se pueden perder mensajes y la tolerancia a participantes que mienten se desarrollan en las páginas sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/dos_generales/">los dos generales y el problema bizantino</a> y <a href="https://arquitecturas-concurrentes.github.io/iasc-book/protocolos_bft/">protocolos BFT</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_escalabilidad_una_decisión_aparte"><a class="anchor" href="#_escalabilidad_una_decisión_aparte"></a>Escalabilidad: una decisión aparte</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La escala horizontal es una motivación posible para distribuir, pero no es la única. Clonar una aplicación, dividirla en servicios y particionar sus datos son estrategias diferentes, que pueden combinarse y tienen costos propios.</p>
</div>
<div class="paragraph">
<p>Para profundizar en el escalado vertical y horizontal, el modelo de ejes X/Y/Z, los balanceadores y el manejo de sesiones, véase la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/escalabilidad/">escalabilidad</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_material_complementario"><a class="anchor" href="#_material_complementario"></a>Material complementario</h2>
<div class="sectionbody">
<div class="paragraph">
<p><a href="https://www.youtube.com/watch?v=Y6Ev8GIlbxc">Distributed Systems in One Lesson, de Tim Berglund</a></p>
</div>
</div>
</div>`;export{e as default};