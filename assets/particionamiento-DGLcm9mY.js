var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>El <strong>particionamiento</strong> divide un conjunto de datos en subconjuntos y asigna cada uno a distintos nodos. Cada nodo almacena una parte del total, en lugar de guardar una copia completa. También se lo llama <strong>sharding</strong> o particionamiento horizontal.</p>
</div>
<div class="paragraph">
<p>Su objetivo principal es distribuir el almacenamiento y el trabajo cuando un nodo ya no puede atender de forma eficiente el volumen de datos o de solicitudes. A diferencia de la replicación, que conserva copias redundantes, particionar aumenta la capacidad total disponible al repartir el conjunto. Una misma arquitectura suele combinar ambas técnicas: cada partición se replica para sumar tolerancia a fallas y disponibilidad.</p>
</div>
<div class="imageblock center">
<div class="content">
<img src="/iasc-book/img/distribucion/particionamiento-claves.svg" alt="Distribución de claves entre particiones" width="760">
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_un_ejemplo_registros_de_clientes"><a class="anchor" href="#_un_ejemplo_registros_de_clientes"></a>Un ejemplo: registros de clientes</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Supongamos que una aplicación almacena los perfiles de millones de clientes. En lugar de guardar todos los perfiles en un único nodo, puede distribuirlos en varias particiones según una clave. Una consulta por <code>cliente_id</code> calcula o busca qué partición contiene ese registro y la envía al nodo correspondiente.</p>
</div>
<div class="paragraph">
<p>El flujo de una operación incluye, al menos:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>Elegir la clave o criterio que determina dónde se almacena cada registro.</p>
</li>
<li>
<p>Calcular la partición responsable de la clave.</p>
</li>
<li>
<p>Enrutar la consulta o escritura al nodo que sirve esa partición.</p>
</li>
<li>
<p>Mantener metadatos sobre la ubicación y el estado de las particiones.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>La aplicación necesita una forma consistente de resolver el destino. Esa información puede estar en el cliente, en un servicio de enrutamiento, en una tabla de metadatos o implícita en una función determinista. Si cambia la asignación, los participantes deben conocer la nueva topología y evitar dirigir escrituras a dueños anteriores.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_elegir_una_clave_de_particionamiento"><a class="anchor" href="#_elegir_una_clave_de_particionamiento"></a>Elegir una clave de particionamiento</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La clave determina cómo se distribuyen los registros y qué operaciones pueden resolverse localmente. Una clave conveniente tiende a repartir espacio y solicitudes y coincide con los patrones de acceso más importantes.</p>
</div>
<div class="paragraph">
<p>Algunos criterios comunes son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Rangos:</strong> asignar intervalos de claves a particiones, como identificadores del 1 al 1000 en una y del 1001 al 2000 en otra. Facilita recorrer intervalos ordenados, pero las claves nuevas o populares pueden concentrarse en una partición.</p>
</li>
<li>
<p><strong>Hash:</strong> aplicar una función a la clave y asignar el resultado a una partición. Suele repartir mejor claves variadas, pero dificulta consultas por rango y puede requerir mover muchos datos al cambiar el número de particiones.</p>
</li>
<li>
<p><strong>Región o ubicación:</strong> mantener juntos los datos de una zona geográfica puede reducir la latencia local y ayudar a cumplir requisitos de residencia. Si la carga o población está concentrada, el reparto puede ser desigual.</p>
</li>
<li>
<p><strong>Lista o categoría:</strong> dirigir valores conocidos —por ejemplo, tipo de entidad— a particiones específicas. Puede ajustarse al dominio, aunque una categoría dominante se vuelve un punto caliente.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La clave no debe evaluarse solo por cómo divide el almacenamiento. También hay que preguntar qué consultas se ejecutan, qué escrituras compiten y qué relaciones deben cruzar particiones.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_distribución_uniforme_y_particiones_calientes"><a class="anchor" href="#_distribución_uniforme_y_particiones_calientes"></a>Distribución uniforme y particiones calientes</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un reparto numéricamente equilibrado de registros no implica una carga equilibrada. Si una clave recibe muchas más solicitudes que las demás, la partición que la contiene puede saturarse aunque las otras tengan capacidad libre. Se la denomina <strong>partición caliente</strong> o <strong>hot shard</strong>.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, particionar mensajes por <code>usuario_id</code> puede distribuir bien a la mayoría de los usuarios, pero una cuenta extremadamente popular puede concentrar muchas lecturas y escrituras. Particionar por tiempo puede facilitar búsquedas recientes, pero también dirigir todas las escrituras nuevas al rango más reciente.</p>
</div>
<div class="paragraph">
<p>Mitigaciones posibles incluyen elegir otra clave, agregar una segunda dimensión de distribución, dividir claves especialmente activas o mantener una capa de caché. Cada alternativa complica el enrutamiento o la actualización de datos. No hay una función hash que arregle un patrón de acceso concentrado si toda operación debe seguir dirigida al mismo registro lógico.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_consultas_dentro_y_entre_particiones"><a class="anchor" href="#_consultas_dentro_y_entre_particiones"></a>Consultas dentro y entre particiones</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una consulta que incluye la clave de particionamiento puede dirigirse a una sola partición. Una consulta que no la incluye quizá deba consultarlas todas (<strong>scatter/gather</strong>), combinando sus resultados. A medida que crecen los nodos, ese recorrido puede aumentar la latencia y el trabajo total.</p>
</div>
<div class="paragraph">
<p>Lo mismo ocurre con índices y relaciones:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>un índice local a una partición ayuda a consultar sus propios datos;</p>
</li>
<li>
<p>un índice global que abarca varias particiones requiere coordinación y mantenimiento adicionales;</p>
</li>
<li>
<p>una unión entre registros de particiones distintas puede necesitar comunicación de red;</p>
</li>
<li>
<p>una transacción que modifica varias particiones debe definir qué sucede si solo una parte logra completarse.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Por eso la clave de particionamiento debe elegirse junto con el modelo de datos y las consultas principales. Un diseño que distribuye bien la escritura puede volver costosas consultas que recorren todo el conjunto.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_reequilibrar_y_mover_datos"><a class="anchor" href="#_reequilibrar_y_mover_datos"></a>Reequilibrar y mover datos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Al crecer el conjunto o cambiar la carga, las particiones pueden dejar de estar equilibradas. Agregar nodos no reubica automáticamente los registros ni actualiza todos los componentes que enrutan solicitudes.</p>
</div>
<div class="paragraph">
<p>El reequilibrio puede implicar:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>Asignar rangos o grupos de claves a nuevos nodos.</p>
</li>
<li>
<p>Copiar datos sin perder escrituras que continúan llegando.</p>
</li>
<li>
<p>Cambiar el enrutamiento de forma coordinada.</p>
</li>
<li>
<p>Retirar los datos antiguos cuando se verifica la nueva ubicación.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>Una estrategia habitual es dividir el espacio lógico en más particiones que nodos físicos y asignarlas entre ellos. Así se puede mover un subconjunto de particiones cuando se agrega capacidad, en vez de recalcular el destino de todo el conjunto. Aun así, hay que gestionar el traslado concurrente, la carga extra y los errores a mitad de la operación.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_disponibilidad_recuperación_y_replicación"><a class="anchor" href="#_disponibilidad_recuperación_y_replicación"></a>Disponibilidad, recuperación y replicación</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Particionar por sí solo no crea una copia de respaldo. Si un nodo contiene la única copia de su partición y falla, los datos de esa partición pueden quedar inaccesibles. El sistema puede repartir carga entre varios nodos y aun así tener un punto único de falla para cada fragmento.</p>
</div>
<div class="paragraph">
<p>Una solución frecuente es replicar cada partición. Por ejemplo, la partición A puede tener un líder y seguidores, y la partición B tener otro grupo de réplicas. Así se combinan:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Particionamiento:</strong> decide qué nodo o grupo es responsable de cada porción de los datos.</p>
</li>
<li>
<p><strong>Replicación:</strong> mantiene copias redundantes dentro de ese grupo y define cómo se propagan cambios y se recupera una falla.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Esta composición agrega decisiones de coordinación por partición: elección de líder, quórums o confirmaciones, lecturas atrasadas y recuperación. Si una falla de red separa las réplicas de una partición, sus respuestas siguen sujetas a las garantías de consistencia y disponibilidad analizadas en <a href="https://arquitecturas-concurrentes.github.io/iasc-book/cap/">CAP</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cuándo_conviene_particionar"><a class="anchor" href="#_cuándo_conviene_particionar"></a>Cuándo conviene particionar</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El particionamiento puede ser útil cuando el tamaño de los datos, el volumen de solicitudes o los límites de un nodo justifican distribuir el trabajo. Antes de incorporarlo, conviene preguntar:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>¿Qué recurso limita hoy el sistema y cómo lo muestran las mediciones?</p>
</li>
<li>
<p>¿Qué clave produce un reparto razonable de datos y solicitudes?</p>
</li>
<li>
<p>¿Cuántas consultas podrán dirigirse a una sola partición?</p>
</li>
<li>
<p>¿Qué operaciones requieren combinar datos de varias particiones?</p>
</li>
<li>
<p>¿Cómo se mueve una partición y se actualiza el enrutamiento sin perder escrituras?</p>
</li>
<li>
<p>¿Qué mecanismo replica cada partición y qué fallas puede tolerar?</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>Particionar no es una etapa obligatoria de toda aplicación distribuida. Reduce algunos límites de capacidad, pero añade enrutamiento, cambios de topología, movimiento de datos y operaciones que cruzan particiones. La estrategia adecuada depende de la carga real y de qué costos el sistema está dispuesto a asumir.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="Kleppmann2017"></a>[Kleppmann2017] KLEPPMANN, Martin. <strong>Designing Data-Intensive Applications</strong>. O&#8217;Reilly Media, 2017, capítulo 6: «Partitioning».</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};