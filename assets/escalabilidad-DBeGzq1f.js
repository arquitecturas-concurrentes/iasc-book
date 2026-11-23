var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>Escalar un sistema significa aumentar su capacidad para atender carga o almacenar datos. La estrategia depende del cuello de botella: cómputo, memoria, base de datos, tráfico de red o una funcionalidad que concentra muchas solicitudes. No hay una forma de escalar que mejore por sí sola el costo, la disponibilidad y el rendimiento en todos los casos.</p>
</div>
<div class="paragraph">
<p>Esta página reúne dos enfoques básicos —escalar vertical y horizontalmente— y el modelo de cubo que organiza algunas estrategias horizontales en ejes X, Y y Z. Para el concepto de sistema distribuido y sus costos, véase la <a href="https://arquitecturas-concurrentes.github.io/iasc-book/distribucion/">introducción a sistemas distribuidos</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_escala_vertical_aumentar_los_recursos"><a class="anchor" href="#_escala_vertical_aumentar_los_recursos"></a>Escala vertical: aumentar los recursos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Escalar verticalmente (<strong>scale up</strong>) consiste en asignarle más recursos a un nodo existente, por ejemplo, más CPU, memoria o almacenamiento.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image6.png" alt="Representación de escala vertical">
</div>
</div>
<div class="paragraph">
<p>Puede ser la opción más sencilla cuando el software ya está preparado para usar los recursos adicionales y no se quiere introducir coordinación entre réplicas. Sin embargo, cada máquina tiene un límite, y los equipos de mayor capacidad pueden ser más costosos. También puede ser necesario reiniciar o migrar el servicio al modificar la infraestructura; que haya una interrupción depende de la plataforma y de cómo se haga el cambio.</p>
</div>
<div class="paragraph">
<p>Escalar verticalmente no elimina necesariamente un punto único de falla: si el nodo que contiene la aplicación o sus datos deja de funcionar, las operaciones que dependen de él pueden dejar de estar disponibles.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_escala_horizontal_sumar_nodos"><a class="anchor" href="#_escala_horizontal_sumar_nodos"></a>Escala horizontal: sumar nodos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Escalar horizontalmente (<strong>scale out</strong>) consiste en agregar más nodos. Para aprovecharlos, hay que decidir qué trabajo realiza cada uno y cómo se distribuyen las solicitudes y el estado.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image12.png" alt="Representación de escala horizontal">
</div>
</div>
<div class="paragraph">
<p>Una aplicación puede replicarse en varias instancias y compartir una base de datos; o puede distribuir su aplicación y sus datos de otra manera. En el primer caso, agregar servidores de aplicación no elimina por sí solo el cuello de botella de la base de datos compartida.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image7.png" alt="Dos alternativas para distribuir aplicación y datos">
</div>
</div>
<div class="paragraph">
<p>Tener varias copias puede permitir que el sistema continúe ante la falla de una instancia, pero no lo garantiza automáticamente. Hay que detectar la falla, retirar o sustituir el nodo, manejar las solicitudes en curso y determinar qué pasa con los datos que la instancia mantenía localmente. La redundancia solo mejora la disponibilidad cuando el sistema puede usar las copias y conservar las garantías requeridas.</p>
</div>
<div class="sect2">
<h3 id="_balancear_solicitudes"><a class="anchor" href="#_balancear_solicitudes"></a>Balancear solicitudes</h3>
<div class="paragraph">
<p>Un balanceador dirige solicitudes hacia diferentes nodos de aplicación. Puede usar un reparto simple, como <strong>round robin</strong>, o considerar señales como carga y salud de las instancias.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image13.png" alt="Distribución de solicitudes mediante un balanceador">
</div>
</div>
<div class="paragraph">
<p>El balanceador debe evitar enviar nuevas solicitudes a instancias que no puedan atenderlas y permitir la recuperación cuando vuelvan a estar disponibles. La distribución puede ser desigual si las solicitudes tienen costos diferentes; por eso el algoritmo de reparto no necesariamente resulta «equitativo» en términos de trabajo.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_el_cubo_de_escalabilidad"><a class="anchor" href="#_el_cubo_de_escalabilidad"></a>El cubo de escalabilidad</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El modelo del cubo de escalabilidad presenta tres ejes que se pueden combinar. No es una receta ni una secuencia obligatoria: ayuda a reconocer qué se replica o se divide.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image9.png" alt="Cubo de escalabilidad y sus ejes X" width="Y y Z">
</div>
</div>
<div class="sect2">
<h3 id="_eje_x_clonar_instancias"><a class="anchor" href="#_eje_x_clonar_instancias"></a>Eje X: clonar instancias</h3>
<div class="paragraph">
<p>En el eje X se ejecutan varias copias de una aplicación que ofrecen la misma funcionalidad. Un balanceador reparte las solicitudes entre ellas. Es una forma directa de repartir carga de cómputo, pero requiere decidir cómo comparten o replican el estado.</p>
</div>
<div class="paragraph">
<p>Si las instancias acceden a una base de datos común, esa base puede convertirse en el próximo cuello de botella. Si cada una guarda su propia copia modificable de los datos, aparecen problemas de coordinación y consistencia. El estado local no compartido —por ejemplo, una sesión guardada solo en memoria de una instancia— también puede causar errores cuando una solicitud siguiente llega a otra copia.</p>
</div>
</div>
<div class="sect2">
<h3 id="_eje_y_dividir_responsabilidades"><a class="anchor" href="#_eje_y_dividir_responsabilidades"></a>Eje Y: dividir responsabilidades</h3>
<div class="paragraph">
<p>En el eje Y se divide la aplicación en componentes que se ocupan de responsabilidades diferentes. Estos límites pueden seguir capacidades funcionales —como usuarios, catálogo o autenticación— o partes del dominio —como ventas o atención al cliente—.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image8.png" alt="Descomposición funcional del sistema en el eje Y">
</div>
</div>
<div class="paragraph">
<p>Esta descomposición permite que cada componente evolucione o escale de forma independiente, si su carga y sus dependencias lo permiten. Pero introduce llamadas remotas, contratos entre servicios, observabilidad y despliegues coordinados o compatibles. Separar el código en servicios no garantiza por sí solo que el dominio esté bien dividido ni que la operación sea más sencilla.</p>
</div>
</div>
<div class="sect2">
<h3 id="_eje_z_particionar_datos_o_solicitudes"><a class="anchor" href="#_eje_z_particionar_datos_o_solicitudes"></a>Eje Z: particionar datos o solicitudes</h3>
<div class="paragraph">
<p>En el eje Z, los datos o las solicitudes se reparten entre grupos de nodos según una clave o criterio. Esta técnica suele llamarse <strong>sharding</strong> o particionamiento horizontal. Por ejemplo, los registros podrían distribuirse por rango de identificadores o por región.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image4.png" alt="Ejemplo de particionamiento de datos por rangos">
</div>
</div>
<div class="paragraph">
<p>El sistema necesita determinar qué partición contiene cada dato y dirigir allí las operaciones. Una buena clave reparte la carga; una clave mal elegida puede generar una partición caliente que reciba una proporción excesiva de solicitudes. Cambiar la cantidad o distribución de particiones puede requerir mover datos.</p>
</div>
<div class="paragraph">
<p>Particionar no es lo mismo que replicar. Al particionar, cada nodo almacena una parte del conjunto; al replicar, varios nodos guardan copias de los mismos datos, total o parcialmente. Una arquitectura puede combinar ambas estrategias. Para profundizar, véanse las páginas sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/particionamiento/">particionamiento</a> y <a href="https://arquitecturas-concurrentes.github.io/iasc-book/replicacion/">replicación</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_combinar_estrategias"><a class="anchor" href="#_combinar_estrategias"></a>Combinar estrategias</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Los ejes pueden combinarse. Por ejemplo, se pueden dividir las responsabilidades en servicios (Y), ejecutar varias réplicas de cada servicio (X) y particionar los datos de un servicio concreto (Z).</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image5.png" alt="Ejemplo de combinación de los ejes de escalabilidad">
</div>
</div>
<div class="paragraph">
<p>Cada combinación agrega sus propios mecanismos: descubrimiento y balanceo, particionado y enrutamiento, replicación, coordinación entre servicios y manejo de fallas. Es importante escalar la parte que limita la capacidad y revisar cómo se propaga el cuello de botella al resto del sistema.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_sesiones_y_estado_de_usuario"><a class="anchor" href="#_sesiones_y_estado_de_usuario"></a>Sesiones y estado de usuario</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Supongamos que una persona inicia sesión en una instancia, que guarda el estado de autenticación en memoria local. Si la siguiente solicitud llega a otra instancia, esta puede no reconocer la sesión.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/image10.png" alt="Una sesión de usuario asociada a una instancia">
</div>
</div>
<div class="paragraph">
<p>Algunas opciones para manejarlo son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Estado compartido:</strong> guardar la sesión en un almacenamiento accesible por las instancias. Ese almacenamiento pasa a ser una dependencia que también requiere disponibilidad, capacidad y una política de consistencia adecuada.</p>
</li>
<li>
<p><strong>Sesiones sin estado en la aplicación:</strong> llevar un token verificable en cada solicitud. Hay que protegerlo, definir su vencimiento y considerar cómo revocar o actualizar permisos; no equivale a guardar cualquier dato sensible en el cliente.</p>
</li>
<li>
<p><strong>Afinidad de sesión</strong> (<strong>sticky sessions</strong>): intentar enviar las solicitudes de una persona a la misma instancia. Puede reducir accesos a un almacén compartido, pero no replica el estado ni garantiza continuidad si esa instancia falla.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La elección depende de qué información contiene la sesión, cuánto debe durar y qué comportamiento se espera ante el reinicio o la pérdida de un nodo.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_para_seguir_pensando"><a class="anchor" href="#_para_seguir_pensando"></a>Para seguir pensando</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Antes de elegir una estrategia de escalado, conviene identificar el cuello de botella con mediciones y formular el objetivo: ¿más solicitudes por segundo, menor latencia, continuidad ante fallas o crecimiento del conjunto de datos? Luego hay que evaluar el costo de estado, coordinación y operación que introduce la solución.</p>
</div>
<div class="paragraph">
<p><a href="https://www.youtube.com/watch?v=PE4gwstWhmc">How We&#8217;ve Scaled Dropbox</a></p>
</div>
</div>
</div>`;export{e as default};