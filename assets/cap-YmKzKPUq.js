const e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>Hay alguna manera de que manteniendo la aplicación disponible durante intearleaves no haya pérdida de datos?
La respuesta rápida es no. No hay manera que la aplicación funcione correctamente en un interleave. esta idea es conocida como el teorema CAP<sup class="footnote" id="_footnote_3">[<a id="_footnoteref_1" class="footnote" href="#_footnotedef_1" title="View footnote.">1</a>]</sup>.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/distribucion/image1.png" alt="image1">
</div>
</div>
<div class="paragraph">
<p>Consistencia: Esta es la habilidad que nuestra sistema, tenga 2 o 312123243 nodos que pueda responder a consultas y que tenga el mismo estado, no importa al nodo al que se la hace la consulta. Esto es algo que se logra con transacciones o un mecanismo equivalente. Entonces se tiene que poder ver a todos los nodos como un bloque indivisible. Esto es lo que vimos al comienzo con los contadores, que siempre quede en un estado conocido para el sistema y que no haya por ej. dos nodos que respondan algo distinto al mismo tiempo de realizar la consulta.</p>
</div>
<div class="paragraph">
<p>Disponibilidad: Es simple que siempre que se le pida al sistema por algo de información el sistema me responda, y si no lo hace no está disponible.</p>
</div>
<div class="paragraph">
<p>Particionamiento: Esta parte del teorema es un poco más capciosa. Tolerancia a las particiones significa que el sistema puede seguir funcionando (y contener información útil, estado) aún cuando las partes no puedan comunicarse entre sí. Todo el punto de la tolerancia a la partición es que ese sistema pueda trabajar con mensajes que estén posiblemente perdidos entre componentes. Esto es algo abstracto pero iremos explicando más de esto.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cap_clasico_o_tradicional"><a class="anchor" href="#_cap_clasico_o_tradicional"></a>CAP Clasico o Tradicional</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La interpretación que veremos ahora es la clásica en la que solo se puede tener dos de los tres conceptos de CAP<sup class="footnote" id="_footnote_1">[<a id="_footnoteref_2" class="footnote" href="#_footnotedef_2" title="View footnote.">2</a>]</sup>, es decir se puede tener CA, CP o AP. No hay manera de que se puedan tener los tres. Lo malo es que no es posible tener las tres cosas incluso con un fallo de red. Lo bueno es que es un teorema, después veremos que esto es más abierto en la interpretación gradual.  tener Consistencia y Disponibilidad no es posible a menos que teóricamente no falle nunca la red, y si sucede en un nodo todo debería fallar. Entonces nos quedan las otras dos partes. AP o CP. Cuando hay un netsplit o interleave la disponibilidad o consistencia permanecen, pero no ambas.</p>
</div>
<div class="paragraph">
<p>El esquema que toman ambas opciones son las siguientes:</p>
</div>
<div class="paragraph">
<p>CP: El estado no cambio, no hay nada que hacer</p>
</div>
<div class="paragraph">
<p>AP: Tiene más flexibilidad y problemas que resolver, se utilizan distintas estrategias:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>La última escritura gana, es una resolución del conflicto en donde cualquiera que haga la última escritura, es el valor del estado que queda.</p>
</li>
<li>
<p>Esto puede ser algo abierto ya que en sistemas distribuidos, los timestamps generados pueden ser en el mismo momento o no estarlo incluso presente en el sistema.</p>
</li>
<li>
<p>Se puede elegir al ganador de la escritura aleatoriamente</p>
</li>
<li>
<p>Métodos más sofisticados ayudan a reducir los conflictos por medio de timestamps como el primer caso pero con relojes relativos. Los relojes relativos trabajan incrementalmente con un valor que se suma a cada escritura. Lamport Clocks extiende más esta idea</p>
</li>
<li>
<p>El que almacena el estado, si es un nodo central u otro sistema debe elegir cual de los estados es el correcto, un poco lo que sucede con git cuando tenemos un conflicto.</p>
</li>
</ul>
</div>
<div class="sect2">
<h3 id="_bbdd_y_cap"><a class="anchor" href="#_bbdd_y_cap"></a>BBDD y CAP</h3>
<div class="paragraph">
<p>Este es el gráfico que vimos en clase sobre CAP y BBDD, el post en el que se detalla más el siguiente:  <a href="http://blog.nahurst.com/visual-guide-to-nosql-systems" class="bare">blog.nahurst.com/visual-guide-to-nosql-systems</a></p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/distribucion/image14.png" alt="image14">
</div>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cap_gradual"><a class="anchor" href="#_cap_gradual"></a>Cap Gradual</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El otro concepto, un poco más gradual hace hincapié en que hoy por hoy no se puede solo tener dos de estos conceptos que permiten simplificar estos conceptos ya separados, y no hay que elegir entre uno u otro de los otros conceptos aparte de particiones, hablamos de consistencia y disponibilidad, sino que hay un rango de flexibilidad para manejar y recuperarse de las particiones<sup class="footnote" id="_footnote_4">[<a id="_footnoteref_3" class="footnote" href="#_footnotedef_3" title="View footnote.">3</a>]</sup>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_mas_sobre_cap"><a class="anchor" href="#_mas_sobre_cap"></a>Mas Sobre CAP</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La manera más fácil de entender CAP es pensar que dos nodos separados de una partición, permitiendo que al menos de estos nodos se actualice, permite que el otro se vuelva inconsistente, entonces se deja de lado C.  De la misma manera si se preserva la consistencia, un lado de la partición debe actuar como no disponible, dejando de lado A. Solo cuando se comunican los nodos es posible de preservar tanto C como A, dejando de la P. Entonces siempre se piensa en que se debe elegir dos de tres opciones, por el momento centrémonos en el caso en el que se necesiten realizar particiones, aunque dependendiendo del sistema, no siempre aparecen o se necesitan particiones. Entonces la elección entre C y A puede ocurrir varias veces en el sistema con una granularidad bastante fina, y no siempre es algo consistente en todo el sistema, pueden haber sistemas que prioricen una opción sobre otra. La disponibilidad es continuo entre 0 y 100 porciento, pero puede existir niveles de consistencia.
En el caso de la interpretación clásica de CAP, no se considera la latencia y se lo ignora, aunque en práctica, la latencia y las particiones están relacionadas en gran medida. La esencia de CAP toma parte durante un timeout, un período en el que programa debe tomar una decisión sobre la partición:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Cancelar la operación y disminuir la disponibilidad</p>
</li>
<li>
<p>Continuar con la operación y arriesgar a que aparezcan inconsistencias</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Entonces si queremos volver a intentar comunicarnos con el otro nodo, para querer mantener la consistencia, solo demora la decisión si no responde, entonces se puede decir que una partición es algo atado al tiempo en una comunicación. Si no se puede mantener la consistencia con las implicaciones de tiempo en la conexión implican una operación entre C o A. A veces tan solo se puede sacrificar C en pos de tener mayor A o viceversa, y de acuerdo a la partición y el momento y el escenario en el que está el sistema, priorizar una u otra. Por ejemplo, PNUTS de Yahoo incurre en la inconsistencia manteniendo copias remotas asincrónicamente. Sin embargo, hace una copia local maestra, que decrementa la latencia. Esta estrategia trabaja bien en práctica porque los datos de un usuario simple es naturalmente particionado de acuerdo a la localización del usuario. Facebook, usa otra estrategia,  que es la de tener la copia maestra en un lugar, y un usuario remoto en realidad tendría una copia stale más cercana a esta copia maestra. Sin embargo, cuando los usuarios actualizan su página, la actualización va a la copia maestra directamente y los usuarios leerán de esta copia maestra en poco tiempo, a los 20-30 segundos los usuarios empiezan a tener una idea más cercana de lo que está en la copia maestra.
Entonces si tenemos particiones, tiene sentido elegir entre A y C? Elegir entre C y A existiendo particiones significa que la probabilidad de particiones puede existir y en caso de falla, fallen múltiples componentes simultáneamente. En realidad lo que sucede es que el sistema realmente pierde algo tanto de C como de A, entonces las tres propiedades en cierta manera son importantes. Hay veces en las que se tiene un sistema en un solo datacenter ( en un solo lugar) y como no poseen particiones, tales diseños incluyendo las RBDMS tradicionales, no necesitan considerar P y son en general AC en su totalidad, estos sistemas en cambio no se particionan sino que optan por el esquema de replicación.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_manejando_particiones"><a class="anchor" href="#_manejando_particiones"></a>Manejando particiones</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En el caso en el que se deban manejar las particiones, estas solo dependen del tiempo en el que se generan y luego se debe unificar estas cuando se restauran, entonces una partición se ve como en la siguiente imagen:</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/distribucion/image11.jpg" alt="image11">
</div>
</div>
<div class="paragraph">
<p>y hay tres momentos en una partición</p>
</div>
<div class="ulist">
<ul>
<li>
<p>El momento en el que comienza una partición</p>
</li>
<li>
<p>Entrar en una partición explícitamente, que puede limitar algunas operaciones</p>
</li>
<li>
<p>Inicial la recuperación de una partición cuando se necesita unificar las particiones de un sistema.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>El último paso apunta a restaurar la consistencia y arreglar los cambios y valores inválidos en las invariantes que se generaron cuando el sistema se particiona. La imagen muestra la evolución de una partición. Una operación normal es una secuencia de operaciones atómicas, y, por lo tanto las particiones empiezan entre operaciones. Si tenemos dos nodos que están interconectados y dejan de hablarse durante un tiempo entonces es muy probable que se haya iniciado una partición, en ese caso el primero inicializa este modo, si en realidad existe una partición, entonces el otro nodo también entrará en este modo, pero solo de un lado se admite la partición. En estos casos debe comunicarse esto al otro nodo para que solo quede de un lado. Cuando un sistema entre en modo partición, dos estrategias son posibles. La primera opción es limitar las operaciones reduciendo la disponibilidad y el segundo guardando información extra sobre las operaciones que pueden ser de ayuda en la recuperación de la partición.
Entonces en este punto la comunicación se resume entre los nodos y debe volver a reunificarse el estado único del sistema, en este punto se sabe el estado de ambos nodos y sus historias, la historia en realidad es mejor que las invariantes que forman el estado por un tema que se puede determinar mejor cuál sería el estado final a tomar. El diseñador debe resolver dos problemas</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Ambos lados deben quedar consistentes</p>
</li>
<li>
<p>Debe haber una compensación para los errores cometidos durante la fase de partición.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>En general se hace una especie de merge dependiendo de la estrategia entre los estados, algo similar a lo que se ve en un CVS, pero hay muchos sistemas que no pueden hacer este mergeo de datos por un tema que no es posible, entonces es el caso en el que se reduce las operaciones disponibles en un sistema durante una partición, Google Docs es un caso de este tipo. Otras opciones son las de tomar por medio de algún algoritmo el dato más nuevo y tomar esas invariantes más nuevas como las definitivas en el sistema.</p>
</div>
<div class="sect2">
<h3 id="_adicional"><a class="anchor" href="#_adicional"></a>Adicional</h3>
<div class="paragraph warning">
<p><em>Esta seccion necesita un mayor desarrollo del tema y de citas.</em></p>
</div>
<div class="paragraph">
<p>Existen tambien criticas al teorema<sup class="footnote" id="_footnote_2">[<a id="_footnoteref_4" class="footnote" href="#_footnotedef_4" title="View footnote.">4</a>]</sup>, en el que se mencionan entre otras cosas, algunas confusiones y ambiguedades de los terminos, y algunos problemas en su formalización. Estas criticas se centran un poco en la dificil aplicacion que puede llegar a tener a veces sobre los sistemas reales.</p>
</div>
</div>
</div>
</div>
<div id="footnotes">
<hr>
<div class="footnote" id="_footnotedef_1">
<a href="#_footnoteref_1">1</a>. <a href="https://learnyousomeerlang.com/distribunomicon" class="bare">learnyousomeerlang.com/distribunomicon</a>. Distribunomicon - Learn you some Erlang for greater good
</div>
<div class="footnote" id="_footnotedef_2">
<a href="#_footnoteref_2">2</a>. <a href="http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.67.6951&amp;rep=rep1&amp;type=pdf" class="bare">citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.67.6951&amp;rep=rep1&amp;type=pdf</a> - Gilbert and Lynch. Brewer conjecture and the feasibility of consistent, available, partition-tolerant web services. ACM SIGACT News (2002) vol. 33 (2) pp. 59
</div>
<div class="footnote" id="_footnotedef_3">
<a href="#_footnoteref_3">3</a>. <a href="http://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed" class="bare">www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed</a> - Eric A Brewer. CAP twelve years later: How the &#8220;rules&#8221; have changed. IEEE Computer Magazine, 45(2):23&#8212;&#8203;29, February 2012. doi:10.1109/MC.2012.37.
</div>
<div class="footnote" id="_footnotedef_4">
<a href="#_footnoteref_4">4</a>. Kleppmann, M. (2015). A Critique of the CAP Theorem. <a href="https://doi.org/10.17863/CAM.13083" class="bare">doi.org/10.17863/CAM.13083</a>
</div>
</div>`;export{e as default};
