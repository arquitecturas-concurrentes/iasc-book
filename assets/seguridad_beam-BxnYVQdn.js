var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>La distribución de Erlang/OTP permite que nodos BEAM establezcan conexiones y ejecuten operaciones remotas. Esa capacidad implica una frontera de seguridad importante: quien logra conectarse como nodo de confianza puede obtener capacidades amplias sobre los procesos y servicios del cluster. La distribución debe tratarse como una interfaz privilegiada, no como un puerto de aplicación común.</p>
</div>
<div class="paragraph">
<p>Esta página presenta controles defensivos para proteger nodos y sus conexiones. No reemplaza una revisión de amenazas específica del sistema ni las guías de configuración de la versión de OTP utilizada.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_modelo_de_amenazas"><a class="anchor" href="#_modelo_de_amenazas"></a>Modelo de amenazas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El diseño debe considerar, al menos, estos riesgos:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>acceso de una máquina no autorizada a los puertos de distribución;</p>
</li>
<li>
<p>robo o filtración de una cookie de Erlang desde archivos, imágenes, logs, variables o sistemas de despliegue;</p>
</li>
<li>
<p>escucha o modificación del tráfico en una red no confiable cuando la distribución no usa cifrado;</p>
</li>
<li>
<p>abuso de una credencial válida para ejecutar operaciones remotas con los privilegios del nodo;</p>
</li>
<li>
<p>errores de DNS, puertos, membresía o configuración que conecten entornos que debían permanecer separados.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La pregunta central no es solo «¿el nodo tiene cookie?», sino qué capacidades obtiene un participante autenticado y qué controles impiden que una red o un entorno equivocado alcance esa interfaz.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_la_cookie_no_sustituye_tls_ni_controles_de_red"><a class="anchor" href="#_la_cookie_no_sustituye_tls_ni_controles_de_red"></a>La cookie no sustituye TLS ni controles de red</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Los nodos usan una <strong>magic cookie</strong> compartida para autenticar conexiones de distribución. Si la cookie no coincide, el establecimiento de la conexión se rechaza. Esto ayuda a separar grupos de nodos, pero no equivale a una identidad robusta con autorización granular: los nodos que comparten la cookie forman, en la práctica, un mismo dominio de confianza.</p>
</div>
<div class="paragraph">
<p>La documentación oficial advierte que la autenticación clásica de cookies no está diseñada como protección criptográfica suficiente ante un atacante activo y que el transporte TCP por defecto no cifra el tráfico. Por eso, una cookie fuerte no debe tratarse como sustituto de cifrado, autenticación TLS, segmentación de red o control de acceso <a href="#ErlangDistributedSystem" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangDistributedSystem]</a> <a href="#ErlangTLSDistribution" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangTLSDistribution]</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_controles_de_despliegue"><a class="anchor" href="#_controles_de_despliegue"></a>Controles de despliegue</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_restringir_el_alcance_de_red"><a class="anchor" href="#_restringir_el_alcance_de_red"></a>Restringir el alcance de red</h3>
<div class="ulist">
<ul>
<li>
<p>Mantener los nodos detrás de redes privadas y permitir conexiones solo desde hosts y segmentos necesarios.</p>
</li>
<li>
<p>No publicar EPMD ni los puertos de distribución directamente en Internet.</p>
</li>
<li>
<p>Configurar explícitamente direcciones y rangos de puertos para que los firewalls puedan aplicar reglas mínimas.</p>
</li>
<li>
<p>Separar los entornos de desarrollo, pruebas y producción con credenciales y redes distintas.</p>
</li>
<li>
<p>Revisar el acceso tanto al puerto de descubrimiento como a los puertos de distribución del nodo.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>EPMD ayuda a resolver nombres hacia los puertos de distribución; no es un proxy de seguridad ni un filtro de autorización. Un nodo oculto o <code>-connect_all false</code> puede cambiar visibilidad y comportamiento de conexiones, pero no reemplaza los controles de acceso a la red.</p>
</div>
</div>
<div class="sect2">
<h3 id="_gestionar_las_cookies_como_credenciales"><a class="anchor" href="#_gestionar_las_cookies_como_credenciales"></a>Gestionar las cookies como credenciales</h3>
<div class="paragraph">
<p>Las cookies deben generarse con entropía adecuada, entregarse mediante un gestor de secretos o mecanismo de provisión protegido, y restringirse al usuario del sistema que ejecuta la VM. No deben escribirse en el código fuente, artefactos públicos, argumentos visibles, logs ni imágenes reutilizadas entre ambientes.</p>
</div>
<div class="paragraph">
<p>La rotación requiere coordinación: los nodos que deben comunicarse necesitan credenciales compatibles. Conviene planificar el cambio, validar quién conserva acceso, revocar copias antiguas y probar el procedimiento de recuperación. La cookie compartida tampoco ofrece por sí sola autorización por proceso o por operación; las aplicaciones deben validar qué solicitudes acepta cada servicio.</p>
</div>
</div>
<div class="sect2">
<h3 id="_cifrar_la_distribución_con_tls"><a class="anchor" href="#_cifrar_la_distribución_con_tls"></a>Cifrar la distribución con TLS</h3>
<div class="paragraph">
<p>Erlang/OTP permite usar distribución sobre TLS mediante <code>inet_tls_dist</code>. TLS puede proteger la confidencialidad e integridad del transporte y autenticar certificados según su configuración. Todos los nodos participantes deben usar un mecanismo compatible y validar correctamente las autoridades certificantes, nombres y certificados <a href="#ErlangTLSDistribution" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangTLSDistribution]</a>.</p>
</div>
<div class="paragraph">
<p>Activar TLS no elimina la necesidad de aislar la red, proteger cookies, limitar quién puede iniciar nodos ni revisar permisos de los servicios remotos. La seguridad depende de las opciones de certificados y validación configuradas; una sesión cifrada con validación débil no ofrece la misma garantía que una identidad correctamente verificada.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_nombres_membresía_y_topología"><a class="anchor" href="#_nombres_membresía_y_topología"></a>Nombres, membresía y topología</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Los nombres de nodos y los servicios de resolución deben administrarse de forma predecible. Los nombres cortos y largos no son intercambiables, y una resolución DNS incorrecta puede dirigir conexiones al host equivocado. Las reglas de red deben seguir la topología que realmente se configuró, no una suposición sobre una estrella, un anillo o una malla.</p>
</div>
<div class="paragraph">
<p>La conexión transitiva predeterminada puede ampliar qué nodos intentan conectarse entre sí. Si se limita con <code>-connect_all false</code>, nodos ocultos u otra política de membresía, hay que comprobar que el resultado coincide con el dominio de confianza y que los servicios OTP necesarios siguen funcionando. Ninguna de estas opciones debe considerarse un mecanismo criptográfico de autorización.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_operación_y_respuesta"><a class="anchor" href="#_operación_y_respuesta"></a>Operación y respuesta</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una estrategia defensiva debe contemplar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>registro y revisión de cambios en membresía y conexiones, sin exponer cookies ni datos sensibles;</p>
</li>
<li>
<p>alertas ante conexiones inesperadas, fallas reiteradas de autenticación o cambios de topología;</p>
</li>
<li>
<p>actualización o revocación de credenciales si se sospecha una filtración;</p>
</li>
<li>
<p>procedimientos para aislar un nodo comprometido y volver a incorporarlo con credenciales y estado verificados;</p>
</li>
<li>
<p>pruebas periódicas de certificados, reglas de firewall, rotación y recuperación.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Los nodos conectados deben considerarse parte de una misma frontera de privilegios. Si distintas aplicaciones o equipos no comparten ese nivel de confianza, conviene separarlos en redes o clusters distintos y comunicar sus servicios mediante interfaces más acotadas.</p>
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
<p><a id="ErlangTLSDistribution"></a>[ErlangTLSDistribution] ERLANG/OTP. «Using SSL for Erlang Distribution». <strong>Erlang/OTP SSL User&#8217;s Guide</strong>. <a href="https://www.erlang.org/doc/apps/ssl/ssl_distribution.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ErlangEPMD"></a>[ErlangEPMD] ERLANG/OTP. «Erlang Port Mapper Daemon». <strong>Erlang/OTP ERTS User&#8217;s Guide</strong>. <a href="https://www.erlang.org/doc/apps/erts/epmd_cmd.html">Documentación oficial</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};