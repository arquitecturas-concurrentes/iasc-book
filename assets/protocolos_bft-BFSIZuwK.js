var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p><strong>BFT</strong> viene de <strong>Byzantine Fault Tolerance</strong> (tolerancia a fallas bizantinas). Un protocolo BFT permite que varias réplicas mantengan un servicio coherente aunque algunas se comporten de manera arbitraria: pueden detenerse, enviar datos falsos o presentar propuestas distintas a diferentes participantes. No se limita a detectar que un nodo dejó de responder; busca que los nodos correctos preserven las garantías acordadas aun cuando haya participantes que no siguen el protocolo.</p>
</div>
<div class="paragraph">
<p>Esta página desarrolla la idea de BFT introducida en <a href="https://arquitecturas-concurrentes.github.io/iasc-book/dos_generales/">el problema de los generales bizantinos</a>. Como ejemplo se usa <strong>Practical Byzantine Fault Tolerance</strong> (PBFT), el protocolo de Castro y Liskov. BFT es una familia de protocolos, no el nombre de un único algoritmo.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_intenta_garantizar"><a class="anchor" href="#_qué_intenta_garantizar"></a>Qué intenta garantizar</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un servicio replicado suele ejecutar operaciones en varias réplicas para evitar que la falla de una máquina detenga todo el sistema. Para que las réplicas no diverjan, necesitan ponerse de acuerdo en el orden de las operaciones y ejecutarlas de forma determinista. Un protocolo BFT añade la posibilidad de que algunas réplicas mientan o se contradigan.</p>
</div>
<div class="paragraph">
<p>Las garantías suelen explicarse en dos grupos:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Seguridad:</strong> dos réplicas correctas no confirman decisiones incompatibles. Una vez que una operación queda comprometida, los cambios de vista y las fallas de nodos no deberían permitir reemplazarla por otra.</p>
</li>
<li>
<p><strong>Progreso o vivacidad:</strong> las solicitudes correctas pueden avanzar y completarse, en lugar de quedar bloqueadas para siempre.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Estas propiedades tienen supuestos distintos. En PBFT, la seguridad no depende de que la red tenga demoras acotadas; para garantizar progreso se necesita que la comunicación eventualmente se vuelva suficientemente oportuna. Si los mensajes pueden demorarse para siempre, el protocolo no siempre puede distinguir una falla real de una demora y no puede prometer que avanzará.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_réplicas_y_quórums"><a class="anchor" href="#_réplicas_y_quórums"></a>Réplicas y quórums</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En el modelo clásico de PBFT, para tolerar hasta <code>f</code> réplicas bizantinas se usan al menos <code>3f + 1</code> réplicas. Por ejemplo, si <code>f = 1</code>, el servicio necesita cuatro réplicas. Un quórum de <code>2f + 1</code> mensajes tiene una propiedad útil: dos quórums de ese tamaño comparten al menos <code>f + 1</code> réplicas. Como máximo <code>f</code> pueden ser bizantinas, así que al menos una réplica compartida es correcta.</p>
</div>
<div class="paragraph">
<p>Ese solapamiento ayuda a impedir que dos grupos distintos confirmen órdenes incompatibles: las réplicas correctas siguen las reglas del protocolo y no validan dos decisiones contradictorias para la misma posición. Las réplicas bizantinas sí pueden enviar mensajes contradictorios, así que el protocolo no se basa en que todos los votos sean honestos; se basa en la cantidad de réplicas correctas que necesariamente aparece en los quórums.</p>
</div>
<div class="paragraph">
<p>Con <code>f = 1</code>, entonces, hay cuatro réplicas y cada quórum tiene tres. Dos grupos de tres entre cuatro comparten al menos dos réplicas; como solo una puede ser bizantina, al menos una de las compartidas debe ser correcta. Este cálculo ilustra el principio del quórum, aunque el protocolo completo necesita más reglas para comprobar propuestas, conservar decisiones previas y recuperarse de fallas.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/bft-pbft.svg" alt="Flujo simplificado de una operación en PBFT" width="760">
</div>
</div>
<div class="paragraph">
<p>La regla <code>3f + 1</code> es propia de determinados modelos clásicos de tolerancia bizantina, y no debe tomarse como una receta independiente del protocolo. Cambiar las suposiciones sobre autenticación, sincronía, topología o fallas puede cambiar las cantidades necesarias y las garantías obtenidas.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_pbft_en_una_operación_normal"><a class="anchor" href="#_pbft_en_una_operación_normal"></a>PBFT en una operación normal</h2>
<div class="sectionbody">
<div class="paragraph">
<p>PBFT organiza las réplicas en <strong>vistas</strong> (<strong>views</strong>). En cada vista hay una réplica primaria que propone el orden y varias réplicas de respaldo que verifican la propuesta. La primaria no puede imponer una decisión por sí sola: las otras réplicas comprueban los mensajes y participan en las fases de acuerdo.</p>
</div>
<div class="paragraph">
<p>En una versión simplificada del recorrido:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>Un cliente envía una solicitud de operación al servicio.</p>
</li>
<li>
<p>La réplica primaria propone la solicitud con un número de secuencia, que fija su posición en el orden de ejecución.</p>
</li>
<li>
<p>Las réplicas intercambian mensajes de <strong>prepare</strong> para comprobar que las correctas vieron la misma propuesta para esa vista y posición.</p>
</li>
<li>
<p>Luego intercambian mensajes de <strong>commit</strong>. Al reunirse el quórum requerido, la operación queda comprometida y las réplicas correctas la ejecutan en el mismo orden.</p>
</li>
<li>
<p>El cliente espera respuestas coincidentes de varias réplicas correctas antes de aceptar el resultado. En PBFT, espera <code>f + 1</code> respuestas iguales: como solo <code>f</code> réplicas pueden ser bizantinas, al menos una de esas respuestas proviene de una réplica correcta.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>La secuencia suele describirse como <strong>request, pre-prepare, prepare, commit, reply</strong>. Es una simplificación didáctica: la implementación completa también debe manejar duplicados, solicitudes retransmitidas, números de secuencia, puntos de control, recuperación de estado y cambios de vista.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_si_la_primaria_falla_o_miente"><a class="anchor" href="#_si_la_primaria_falla_o_miente"></a>Si la primaria falla o miente</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una primaria bizantina puede dejar de proponer operaciones, proponer órdenes distintas a diferentes réplicas o enviar mensajes inválidos. Las réplicas correctas validan las propuestas y no aceptan cualquier mensaje solo porque lo envió la primaria. Si no se logra progreso —por ejemplo, vence el timeout de una solicitud— las réplicas pueden iniciar un <strong>cambio de vista</strong> y elegir otra primaria.</p>
</div>
<div class="paragraph">
<p>El timeout sirve para iniciar la recuperación, no para demostrar que la primaria es maliciosa o que cayó. Tal vez está lenta o la red está demorada. Por eso el protocolo debe preservar la seguridad durante el cambio de vista: la nueva primaria recopila evidencia del trabajo previo para no olvidar una operación que ya pudo haber sido comprometida.</p>
</div>
<div class="paragraph">
<p>Este mecanismo muestra la diferencia entre seguridad y vivacidad. Una demora puede hacer que el sistema deje de progresar por un tiempo; no debería hacer que las réplicas correctas confirmen dos historias incompatibles. El nuevo líder permite reanudar el progreso cuando las condiciones de comunicación lo permiten.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_autenticación_quién_envió_un_mensaje"><a class="anchor" href="#_autenticación_quién_envió_un_mensaje"></a>Autenticación: quién envió un mensaje</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un protocolo BFT necesita que los participantes puedan verificar de quién provienen los mensajes y que no fueron alterados en tránsito. PBFT usa autenticación entre réplicas y resúmenes criptográficos para validar el contenido intercambiado. Las técnicas exactas varían según la implementación; pueden usarse códigos de autenticación de mensajes o firmas digitales.</p>
</div>
<div class="paragraph">
<p>La autenticación no hace que un nodo sea honesto. Sirve para atribuir un mensaje a una identidad y detectar modificaciones o suplantaciones según las claves y el modelo criptográfico. Si una réplica autorizada es bizantina, puede mentir usando su propia identidad; la tolerancia proviene del protocolo y de los quórums, no de asumir que toda firma contiene la verdad.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_costos_y_límites_prácticos"><a class="anchor" href="#_costos_y_límites_prácticos"></a>Costos y límites prácticos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>PBFT mostró que la tolerancia bizantina podía implementarse en servicios prácticos, pero requiere más comunicación y trabajo que replicar una sola máquina confiable. En su recorrido clásico, varias fases intercambian mensajes entre réplicas, lo que aumenta el tráfico al crecer el grupo. El paper original describe optimizaciones, entre ellas el uso de MACs y la ejecución por lotes de solicitudes, y presenta una implementación de NFS tolerante a fallas bizantinas <a href="#CastroLiskov1999" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[CastroLiskov1999]</a>.</p>
</div>
<div class="paragraph">
<p>Al evaluar un protocolo o una biblioteca BFT, conviene identificar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>cuántas réplicas y qué proporción de fallas puede tolerar;</p>
</li>
<li>
<p>si contempla fallas bizantinas, caídas simples o ambas;</p>
</li>
<li>
<p>qué supuestos hace sobre la red para la seguridad y cuáles para el progreso;</p>
</li>
<li>
<p>cómo autentica a clientes y réplicas, rota claves y evita la repetición de mensajes;</p>
</li>
<li>
<p>qué sucede al cambiar de líder, recuperarse de una caída o superar el límite de fallas;</p>
</li>
<li>
<p>qué latencia, tráfico, almacenamiento y operación administrativa agrega.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Los protocolos de consenso tolerantes a fallas por caída, como los diseñados para asumir que los procesos se detienen pero no mienten, no se vuelven BFT por el solo hecho de usar quórums. El modelo de falla es distinto y el protocolo debe contemplar explícitamente las propuestas contradictorias.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_relación_con_los_problemas_de_los_generales"><a class="anchor" href="#_relación_con_los_problemas_de_los_generales"></a>Relación con los problemas de los generales</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El problema de los generales bizantinos plantea qué significa acordar cuando algunos participantes pueden comportarse arbitrariamente. Un protocolo BFT convierte esa pregunta en un procedimiento concreto: define réplicas, mensajes, quórums, reglas de validación y recuperación.</p>
</div>
<div class="paragraph">
<p>El problema de los dos generales, en cambio, trata la imposibilidad de obtener certeza común con mensajes que pueden perderse sin límite. Los protocolos BFT prácticos no eliminan la incertidumbre de la red: declaran supuestos bajo los que preservan seguridad y bajo los que pueden progresar. Para distinguir ambos modelos y revisar el límite clásico de <code>3f + 1</code>, véase la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/dos_generales/">los dos generales y los generales bizantinos</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="CastroLiskov1999"></a>[CastroLiskov1999] CASTRO, Miguel y LISKOV, Barbara. «Practical Byzantine Fault Tolerance». <strong>Proceedings of the Third Symposium on Operating Systems Design and Implementation (OSDI)</strong>, 1999. <a href="https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance">USENIX</a>.</p>
</li>
<li>
<p><a id="LamportShostakPease1982"></a>[LamportShostakPease1982] LAMPORT, Leslie; SHOSTAK, Robert; y PEASE, Marshall. «The Byzantine Generals Problem». <strong>ACM Transactions on Programming Languages and Systems</strong>, 4(3), 1982, pp. 382–401. <a href="https://doi.org/10.1145/357172.357176">DOI</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};