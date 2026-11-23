var e=`<div id="preamble">
<div class="sectionbody">
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image1.png" alt="Ilustración de la gorra del teorema CAP" width="340">
</div>
</div>
<div class="paragraph">
<p>¿Qué debería hacer un sistema cuando dos nodos no pueden comunicarse y ambos reciben una operación? Si los dos responden como si tuvieran la información más reciente, pueden confirmar resultados incompatibles. Si esperan a coordinarse, alguno quizá no pueda responder. El teorema CAP permite razonar sobre esta tensión, pero suele resumirse de una forma que induce a error: «hay que elegir dos de tres».</p>
</div>
<div class="paragraph">
<p>La idea central es más precisa: <strong>si ocurre una partición de red, un sistema con datos compartidos no puede garantizar a la vez que toda operación responda y que cada respuesta respete la consistencia fuerte definida por el teorema</strong>. Fuera de una partición, CAP no obliga a renunciar a ninguna de esas dos propiedades.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_tres_conceptos_con_definiciones_precisas"><a class="anchor" href="#_tres_conceptos_con_definiciones_precisas"></a>Tres conceptos, con definiciones precisas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En la formulación formal de Gilbert y Lynch, los términos describen garantías específicas. No deben confundirse con etiquetas generales de calidad de un producto o de una base de datos <a href="#GilbertLynch2002" class="biblioref" class="biblioref" class="biblioref">[GilbertLynch2002]</a>.</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Consistencia &#169;:</strong> en este resultado significa <strong>consistencia linealizable</strong>: cada operación parece ocurrir de manera atómica en un único orden, compatible con el orden real en que se ejecutaron. Una lectura no debe devolver un valor viejo si ya se confirmó una escritura posterior. No es simplemente la «C» de ACID.</p>
</li>
<li>
<p><strong>Disponibilidad (A):</strong> cada solicitud recibida por un nodo que no falló obtiene una respuesta. Responder con un error o rechazar una escritura también cuenta como respuesta en algunos usos coloquiales, pero no equivale a completar satisfactoriamente la operación; por eso hay que especificar qué garantía se está evaluando.</p>
</li>
<li>
<p><strong>Tolerancia a particiones (P):</strong> el sistema contempla que la comunicación entre grupos de nodos se interrumpa o demore sin límite conocido. P no es un botón que se apaga para evitar la decisión: en un sistema distribuido, una interrupción de red puede ocurrir. Lo que se diseña es el comportamiento frente a ella.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Los timeouts y los <strong>heartbeats</strong> pueden ayudar a sospechar que una comunicación se interrumpió, pero no prueban que el otro nodo haya fallado ni eligen la política correcta. Para más contexto sobre esa incertidumbre, véase la sección sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/heartbeat_gossip/">heartbeats y gossip</a> y la de <a href="https://arquitecturas-concurrentes.github.io/iasc-book/interleaving/">interleaving y netsplits</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_el_caso_mínimo_dos_nodos_y_una_partición"><a class="anchor" href="#_el_caso_mínimo_dos_nodos_y_una_partición"></a>El caso mínimo: dos nodos y una partición</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Supongamos que dos nodos guardan copias de un mismo dato. La red se parte y cada nodo recibe una escritura. Si ambos la confirman sin conocer la operación del otro, no hay una única historia linealizable que explique las dos respuestas. Si, en cambio, un nodo espera a comunicarse con el otro antes de contestar, la operación de ese lado puede quedar sin respuesta mientras dure la partición.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/cap-particion.svg" alt="Dos nodos aislados durante una partición y las decisiones posibles" width="760">
</div>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="25%">
<col width="25%">
<col width="50%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Estrategia durante la partición</th>
<th class="tableblock halign-left valign-top">Qué prioriza</th>
<th class="tableblock halign-left valign-top">Qué debe aceptar el diseño</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">No confirmar operaciones que requieren coordinación</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Consistencia fuerte en las operaciones que sí se confirman</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Algunos nodos u operaciones pueden rechazar o aplazar solicitudes. No implica necesariamente apagar todo el sistema.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Aceptar escrituras independientes en ambos lados</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Responder a más operaciones mientras no hay comunicación</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Pueden existir resultados incompatibles; luego hace falta reconciliarlos según reglas de la aplicación.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>En el vocabulario habitual, la primera estrategia suele llamarse <strong>CP</strong> y la segunda <strong>AP</strong>. Son abreviaturas para describir qué se prioriza <strong>durante una partición</strong>, no una clasificación completa de una base de datos. Tampoco significan que todos los datos y todas las operaciones de un sistema deban seguir siempre la misma política.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, una tienda con una sola unidad de un producto puede rechazar la compra en un lado sin coordinación, o aceptar operaciones locales y correr el riesgo de confirmar dos ventas. «Gana la última escritura» puede resolver qué valor conservar, pero no deshace por sí sola una compra ya confirmada ni restaura una invariante del negocio.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_por_qué_elegir_dos_de_tres_confunde"><a class="anchor" href="#_por_qué_elegir_dos_de_tres_confunde"></a>Por qué «elegir dos de tres» confunde</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La frase sugiere que las tres propiedades son opciones simétricas y que un sistema debe escoger una pareja para siempre. No es así:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>P describe una condición de falla.</strong> Si hay partición, los nodos afectados no pueden intercambiar información como de costumbre; un diseño debe decidir cómo responder.</p>
</li>
<li>
<p><strong>La tensión entre C y A aparece ante esa condición.</strong> Sin una partición, los nodos pueden coordinarse y ofrecer ambas garantías. No se «sacrifica P» para obtener una combinación CA: simplemente no está ocurriendo la falla que plantea el teorema.</p>
</li>
<li>
<p><strong>La decisión puede ser más fina que una etiqueta.</strong> Puede variar según el dato, la operación, el lado que conserva un quórum o el nivel de garantía que la aplicación exige.</p>
</li>
<li>
<p><strong>Una respuesta no es necesariamente una operación exitosa.</strong> Rechazar una escritura a tiempo y completar una escritura son comportamientos distintos, aunque ambos puedan contarse como respuestas en una definición amplia de disponibilidad.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Por eso, decir que una base de datos «es AP» o «es CP» suele ocultar detalles relevantes: qué operaciones quedan disponibles, para qué datos, ante qué topología y con qué garantía de lectura o escritura.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_recuperar_la_comunicación_no_resuelve_el_conflicto"><a class="anchor" href="#_recuperar_la_comunicación_no_resuelve_el_conflicto"></a>Recuperar la comunicación no resuelve el conflicto</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Cuando vuelve la red, las réplicas pueden intercambiar sus cambios. Pero converger a un mismo valor no garantiza que ese valor sea correcto. El diseño debe decidir cómo manejar operaciones duplicadas, escrituras incompatibles y reglas del dominio que dejaron de cumplirse.</p>
</div>
<div class="paragraph">
<p>Algunas opciones son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>permitir escrituras solo en un líder o en un quórum, y rechazar las que no puedan coordinarse;</p>
</li>
<li>
<p>aceptar operaciones en más de un lado cuando se puedan combinar de forma segura;</p>
</li>
<li>
<p>conservar suficiente historia para detectar conflictos y resolverlos según reglas explícitas;</p>
</li>
<li>
<p>compensar efectos ya confirmados, o pedir resolución manual cuando no existe una combinación automática correcta.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Los relojes y las marcas de tiempo ayudan a ordenar algunos eventos, pero no dicen por sí solos qué resultado es justo o válido para la aplicación. La reconciliación debe partir de las invariantes del dominio, no solo de una técnica para fusionar registros.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_aporta_la_interpretación_gradual"><a class="anchor" href="#_qué_aporta_la_interpretación_gradual"></a>Qué aporta la interpretación gradual</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Brewer señaló que la formulación «dos de tres» simplifica en exceso el espacio de diseño. Las particiones pueden ser poco frecuentes, y los sistemas tienen margen para elegir cómo conservar consistencia y disponibilidad durante la falla y cómo recuperarse después. La decisión puede variar entre componentes y operaciones; además, consistencia y disponibilidad admiten distintos niveles en sistemas reales <a href="#Brewer2012" class="biblioref" class="biblioref" class="biblioref">[Brewer2012]</a>.</p>
</div>
<div class="paragraph">
<p>Esto no contradice el resultado formal: CAP establece un límite para garantías estrictas bajo una partición. La perspectiva gradual ayuda a pensar qué compromisos tienen sentido dentro de ese límite, en vez de etiquetar todo el sistema como si una propiedad se perdiera por completo.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_la_crítica_de_kleppmann_cap_ayuda_a_diseñar_sistemas_reales"><a class="anchor" href="#_la_crítica_de_kleppmann_cap_ayuda_a_diseñar_sistemas_reales"></a>La crítica de Kleppmann: ¿CAP ayuda a diseñar sistemas reales?</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En <strong>A Critique of the CAP Theorem</strong>, Martin Kleppmann no intenta demostrar que sea posible mantener todas las garantías ante cualquier falla ni presenta un nuevo límite de imposibilidad. Su crítica apunta a la distancia entre <strong>lo que las distintas versiones de CAP definen formalmente</strong> y <strong>lo que normalmente entendemos por disponibilidad y tolerancia a fallas al diseñar un servicio</strong>. El paper recorre las definiciones, examina el modelo y las pruebas de Gilbert y Lynch, y luego reúne resultados previos para proponer otra manera de analizar el costo de coordinación: la sensibilidad de cada operación a la demora de red <a href="#Kleppmann2015" class="biblioref" class="biblioref" class="biblioref">[Kleppmann2015]</a>.</p>
</div>
<div class="sect2">
<h3 id="_primera_crítica_disponible_puede_significar_cosas_distintas"><a class="anchor" href="#_primera_crítica_disponible_puede_significar_cosas_distintas"></a>Primera crítica: «disponible» puede significar cosas distintas</h3>
<div class="paragraph">
<p>En ingeniería, solemos medir la disponibilidad observada: qué proporción de las solicitudes termina <strong>correctamente</strong> dentro del plazo acordado. Por ejemplo, un servicio puede considerarse disponible si responde con éxito en menos de 500 ms. El resultado depende del tráfico, las fallas, la ubicación de los clientes y el período medido; es un indicador operacional, no una etiqueta absoluta que un algoritmo lleva consigo.</p>
</div>
<div class="paragraph">
<p>En la formulación de Gilbert y Lynch, en cambio, disponibilidad es una propiedad teórica de <strong>terminación</strong>: toda solicitud que recibe un nodo que no falló debe terminar en algún momento, sin un límite máximo de latencia. Kleppmann subraya la diferencia: bajo esa definición, una operación que demora una semana todavía puede contar como disponible. Para una prueba de imposibilidad, «eventualmente responde» es una condición precisa y útil; para una persona usuaria o un SLA, el plazo es parte esencial de la garantía.</p>
</div>
<div class="paragraph">
<p>También importa quién cuenta como nodo que «no falló». Como la definición excluye a los nodos declarados fallidos, un algoritmo podría dejar fuera de servicio a todos los nodos durante una partición y satisfacer la condición de manera vacía: no queda ningún nodo al que se le exija responder. La prueba es válida para lo que formaliza, pero esa interpretación no expresa la intención habitual de CAP: analizar qué puede hacer cada lado que continúa operando.</p>
</div>
</div>
<div class="sect2">
<h3 id="_segunda_crítica_las_conclusiones_dependen_del_modelo_de_fallas"><a class="anchor" href="#_segunda_crítica_las_conclusiones_dependen_del_modelo_de_fallas"></a>Segunda crítica: las conclusiones dependen del modelo de fallas</h3>
<div class="paragraph">
<p>«Tolerar particiones» no es una propiedad que pueda agregarse al sistema de forma aislada: describe qué fallas admite el modelo usado para razonar. Una partición temporal, tras la cual los mensajes vuelven a llegar, no es lo mismo que una separación permanente. Kleppmann observa que esta distinción importa para interpretar las pruebas:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Si una partición puede durar para siempre, los mensajes entre lados pueden no llegar nunca. Un algoritmo que espera para conservar un único orden puede dejar operaciones bloqueadas indefinidamente.</p>
</li>
<li>
<p>Si se consideran enlaces con pérdidas <strong>justas</strong> —pueden perder mensajes durante un período, pero eventualmente entregan los reintentos—, una partición temporal puede terminar. Un algoritmo linealizable puede esperar a que vuelva la comunicación y completar entonces; «responde en algún momento» no garantiza que responda dentro de un plazo práctico.</p>
</li>
<li>
<p>Si la separación es permanente, las réplicas no pueden intercambiar los cambios que desconocen. Tampoco es posible garantizar que todas converjan a un mismo estado si nunca vuelve a fluir información.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Por eso el paper advierte que «CAP demuestra que la consistencia eventual es más disponible» es una conclusión demasiado amplia. Si se permite una partición permanente, ni siquiera la convergencia eventual puede garantizarse en todos los casos. Si se habla de particiones temporales, tanto una operación linealizable como una eventualmente consistente pueden terminar una vez restaurada la comunicación; la diferencia relevante aparece al exigir qué respuestas se pueden dar <strong>mientras tanto</strong>.</p>
</div>
<div class="paragraph">
<p>Kleppmann propone una formalización más precisa para aislar esa diferencia. En su modelo de enlaces particionables, exige que toda operación termine incluso si algunos mensajes se pierden para siempre; luego pregunta si el sistema puede ser linealizable en todas las ejecuciones sin pérdidas. Su resultado es que no: si una escritura y una lectura ocurren mientras no pueden intercambiar información, hacer terminar ambas puede dejar una lectura obsoleta. En cambio, define una propiedad más débil que solo exige convergencia en ejecuciones sin particiones, y muestra que esa forma de consistencia eventual sí es posible. Así deja explícito qué se exige durante la falla y qué se exige cuando la comunicación funciona. El punto útil para la clase no es memorizar esa variante formal, sino advertir qué supuestos hacen falta para que «CP frente a AP» tenga un significado concreto.</p>
</div>
</div>
<div class="sect2">
<h3 id="_tercera_crítica_consistencia_tampoco_nombra_una_sola_garantía"><a class="anchor" href="#_tercera_crítica_consistencia_tampoco_nombra_una_sola_garantía"></a>Tercera crítica: «consistencia» tampoco nombra una sola garantía</h3>
<div class="paragraph">
<p>El término <strong>consistencia</strong> se usa para ideas distintas. En CAP puede referirse a linealizabilidad; en ACID, la C se refiere a restricciones de integridad; en otros textos se contrasta «fuerte» con «eventual». No son sinónimos. Además, entre linealizabilidad y convergencia eventual hay modelos intermedios, como consistencia secuencial y causal. La pregunta «¿es consistente?» queda incompleta hasta especificar qué lecturas y escrituras se permiten y qué orden deben respetar.</p>
</div>
<div class="paragraph">
<p>Esta precisión importa porque las decisiones de una aplicación dependen de la operación. Leer una descripción de producto tolerando un valor algo desactualizado puede ser aceptable; confirmar dos reservas de la última unidad quizá no. Una base de datos no se describe adecuadamente con una sola etiqueta C si ofrece garantías distintas por operación, configuración o tipo de dato.</p>
</div>
</div>
<div class="sect2">
<h3 id="_la_propuesta_alternativa_sensibilidad_al_retraso"><a class="anchor" href="#_la_propuesta_alternativa_sensibilidad_al_retraso"></a>La propuesta alternativa: sensibilidad al retraso</h3>
<div class="paragraph">
<p>El paper propone analizar <strong>cuánto depende la latencia de una operación de la demora de la red</strong>. En sus ejemplos teóricos, <code>d</code> representa esa demora:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>O(d), sensible al retraso:</strong> si la comunicación se demora, la operación debe esperar y su latencia crece con esa demora.</p>
</li>
<li>
<p><strong>O(1), independiente del retraso de red:</strong> la operación puede terminar sin esperar una respuesta remota; su latencia de respuesta no crece con <code>d</code>. Esto no significa que la operación no use la red ni que la réplica remota ya esté actualizada: la propagación y convergencia pueden ocurrir después.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Para registros replicados y bajo los supuestos analizados por el paper, la tabla resume límites de latencia que ayudan a pensar el compromiso:</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="33.3333%">
<col width="33.3333%">
<col width="33.3334%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Garantía de consistencia</th>
<th class="tableblock halign-left valign-top">Latencia de lectura</th>
<th class="tableblock halign-left valign-top">Latencia de escritura</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Linealizabilidad</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">O(d)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">O(d)</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Consistencia secuencial</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">O(1)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">O(d)</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Consistencia causal</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">O(1)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">O(1)</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>En un registro linealizable, lecturas y escrituras pueden requerir coordinación remota para mantener un único orden observable. Con consistencia secuencial, el resultado resumido permite lecturas que no esperan a la red y escrituras sensibles a la demora; según el algoritmo, también puede priorizarse el caso inverso. La consistencia causal permite que ambas operaciones respondan sin esperar coordinación síncrona, pero el sistema debe preservar las relaciones causales y propagar los cambios.</p>
</div>
<div class="paragraph">
<p><code>O(d)</code> y <code>O(1)</code> aquí expresan dependencia respecto de la demora de red, no tiempos absolutos ni una predicción de rendimiento para cualquier base de datos. Los resultados son límites teóricos para determinados objetos y modelos; una implementación concreta puede añadir viajes de red, colas, procesamiento, almacenamiento y costos de metadatos. En particular, una operación <code>O(1)</code> respecto de la red no significa que toda la aplicación sea instantánea ni que no existan costos de reconciliación.</p>
</div>
<div class="paragraph">
<p>La idea es traducir una partición en una demora muy grande. Si una operación depende de recibir un mensaje remoto, su respuesta puede quedar detenida durante toda la interrupción. Si puede responder sin esa coordinación, la latencia local puede mantenerse acotada, aunque el sistema tenga que reconciliar o propagar el cambio después. Esto hace visible una decisión que la etiqueta «AP» no describe: <strong>¿qué interacción requiere esperar a quién, para qué operación y cuánto tiempo?</strong></p>
</div>
<div class="paragraph">
<p>El paper usa como ejemplo una aplicación de calendario en un teléfono: mientras no hay conexión, la persona puede consultar la agenda y agregar eventos; los cambios se sincronizan al recuperar la red. Es una elección razonable si se tolera que otros dispositivos todavía no vean esos eventos y si el dominio permite resolver ediciones concurrentes. No sería automáticamente correcta para una operación que debe impedir dos confirmaciones incompatibles.</p>
</div>
<div class="paragraph">
<p>También es importante que la demora no tiene por qué ser igual entre todos los nodos. Una operación puede coordinarse con réplicas del mismo centro de datos, pero no con las de otras regiones. Por eso el análisis debe decir <strong>a qué distancia o enlace</strong> es sensible cada operación, en lugar de clasificar al sistema entero como dependiente o independiente de toda la red.</p>
</div>
<div class="paragraph">
<p>La crítica de Kleppmann no invalida el límite formal de CAP ni afirma que se pueda garantizar cualquier combinación de propiedades. Reconoce que CAP fue influyente al impulsar la exploración de sistemas con garantías más débiles, pero sostiene que ya no debería usarse para justificar decisiones de diseño. Su advertencia es que la versión abreviada del teorema puede ocultar los supuestos sobre fallas, tiempos de respuesta y consistencia. Para justificar una arquitectura, conviene especificar esos supuestos y describir las garantías por operación; <strong>delay-sensitivity</strong> ofrece un vocabulario para analizar cuánto cuesta en latencia mantenerlas.</p>
</div>
</div>
<div class="sect2">
<h3 id="_una_guía_para_aplicar_estas_ideas"><a class="anchor" href="#_una_guía_para_aplicar_estas_ideas"></a>Una guía para aplicar estas ideas</h3>
<div class="paragraph">
<p>Al diseñar una operación distribuida, conviene preguntar:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>¿Qué dato o invariante debe protegerse? ¿Qué significa una respuesta correcta para esta operación?</p>
</li>
<li>
<p>¿Qué garantía de consistencia se necesita: linealizabilidad, orden causal, lecturas eventualmente convergentes u otra?</p>
</li>
<li>
<p>Si no se puede contactar a otro nodo, ¿la operación debe rechazarse, esperar o avanzar con información local?</p>
</li>
<li>
<p>¿Qué latencia y tiempo de espera son aceptables? ¿Cómo cambia la respuesta si la red se demora, además de cuando se interrumpe?</p>
</li>
<li>
<p>Cuando vuelva la comunicación, ¿cómo se detectan y resuelven conflictos sin perder efectos que ya se confirmaron?</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>La respuesta puede ser distinta para una consulta de catálogo que para reservar la última unidad de inventario. CAP sirve como punto de partida para reconocer el límite; la especificación de operaciones, las demoras y las reglas de recuperación permite tomar una decisión de arquitectura.</p>
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
<p><a id="GilbertLynch2002"></a>[GilbertLynch2002] GILBERT, Seth y LYNCH, Nancy. «Brewer&#8217;s Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services». <strong>ACM SIGACT News</strong>, 33(2), pp. 51–59, 2002. <a href="https://doi.org/10.1145/564585.564601">DOI</a>.</p>
</li>
<li>
<p><a id="Brewer2012"></a>[Brewer2012] BREWER, Eric. «CAP Twelve Years Later: How the “Rules” Have Changed». <strong>Computer</strong>, 45(2), pp. 23–29, 2012. <a href="https://doi.org/10.1109/MC.2012.37">DOI</a>.</p>
</li>
<li>
<p><a id="Kleppmann2015"></a>[Kleppmann2015] KLEPPMANN, Martin. «A Critique of the CAP Theorem», 2015. <a href="https://doi.org/10.17863/CAM.13083">DOI</a>. <a href="https://arxiv.org/abs/1509.05393">Versión en arXiv</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};