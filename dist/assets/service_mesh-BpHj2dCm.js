const e=`<div class="sect1">
<h2 id="_introduccion"><a class="anchor" href="#_introduccion"></a>Introduccion</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Tal como lo vimos en la introduccion a distribucion, aprendimos que el tener sistemas distribuidos en cualquier dimension pueden causar casos de uso que no hubiesemos pensado antes, asi como varios problemas a resolver.</p>
</div>
<div class="paragraph">
<p>Cuando estos sistemas eran simples, en general se trataba de minimizar la interaccion entre componentes remotos para que el impacto de la complejidad de los sistemas distribuidos sea minima. Y si bien en general, durante un tiempo hace un tiempo atras, si el sistema era dentro de todo simple o pequenio, solamente se trataba de evitar la distribucion aun si hubiese que duplicar logica o datos entre distintos sistemas.</p>
</div>
<div class="paragraph">
<p>Obviamente no eran soluciones optimas, y hoy por hoy se trata de solucionar problemas tales como la duplicacion de codigo o de logica entre un componente o varios. Y en este nuevo mundo, cuando empezaron a verse de nuevo casos de sistemas que cada vez necesitaban escalar debido a que escalar verticalmente era demasiado costoso. Incluso estas dificultades hacian que fuese dificil de escalar (un ejemplo mencionado <a href="http://highscalability.com/blog/2009/10/13/why-are-facebook-digg-and-twitter-so-hard-to-scale.html">aqui</a>)
Por eso varias soluciones iniciales fueron por asi decirlo ad-hoc para cada caso en un sistema en particular y de ahi fueron extrayendose nuevas soluciones cada vez mas sofisticadas.
A medida que descubrimos más sobre el dominio del problema y diseñamos mejores soluciones, comenzamos a cristalizar algunas de las necesidades más comunes en patrones, bibliotecas y eventualmente plataformas.</p>
</div>
<div class="paragraph">
<p>No solo se reduce esto a patrones, bibliotecas y codigo, sino tambien metodologias sobre como escalar y conceptos sobre sistemas distribuidos (mencion <a href="http://highscalability.com/blog/2010/6/10/the-four-meta-secrets-of-scaling-at-facebook.html">2</a>)</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_recapitulando_desde_microservicios"><a class="anchor" href="#_recapitulando_desde_microservicios"></a>Recapitulando desde microservicios</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Con los años, las computadoras se volvieron aún más baratas y más omnipresentes, y la pila de redes descrita anteriormente ha demostrado ser el conjunto de herramientas de facto para conectar sistemas de manera confiable. Con más nodos y conexiones estables, la industria ha jugado con varios tipos de sistemas en red, desde agentes y objetos distribuidos hasta arquitecturas orientadas a servicios compuestas de componentes más grandes pero aún muy distribuidos.</p>
</div>
<div class="paragraph">
<p>En los años 90, Peter Deutsch y sus colegas ingenieros de Sun Microsystems compilaron "Las 8 falacias de la computación distribuida", en la que enumera algunas suposiciones que las personas tienden a hacer cuando trabajan con sistemas distribuidos. El punto de Peter es que estos podrían haber sido ciertos en arquitecturas de redes más primitivas o en modelos teóricos, pero no son válidos en el mundo moderno. Pueden ver un poco mas a <a href="~@/mitos/">aca</a></p>
</div>
<div class="paragraph">
<p>Incluso vimos que existen distintos problemas, tales como los que vimos hasta ahora como CAP, interleaving, netsplits, entre otras cosas. Incluso podemos mencionar otras cosas con la que deberiamos lidiar con una arquitectura distribuida:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Provisionamiento rapido de los recursos (nuevas instancias)</p>
</li>
<li>
<p>Monitoreo, en lo posible en tiempo real o poco delay</p>
</li>
<li>
<p>Despliegue rapido</p>
</li>
<li>
<p>Facil de provisionar mas almacenamiento (BBDD, disco, etc)</p>
</li>
<li>
<p>Autenticacion</p>
</li>
<li>
<p>Tener algun mecanismo de RPC estandarizado entre los compoenentes internos del sistema (protocols, gRPC por ej)</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Entonces, aunque la pila TCP / IP y el modelo de red general desarrollado hace muchas décadas sigue siendo una herramienta poderosa para hacer que las computadoras se comuniquen entre sí, las arquitecturas más sofisticadas introdujeron otra capa de requisitos que, una vez más, deben cumplir los ingenieros que trabajan en tales arquitecturas.</p>
</div>
<div class="paragraph">
<p>Hay ejemplos que podemos mencionar que se usaron para solucionar algunos problemas de resilencia y distribucion, algunos de estos son failover/takeover, circuit breaker (algunos detalles de este pueden verse <a href="https://microservices.io/patterns/reliability/circuit-breaker.html">aca tambien</a>), y tambien service discovery. Un ejemplo de servicios puede ser el siguiente:</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/1.png" alt="1">
</div>
</div>
<div class="paragraph">
<p>Entonces Service Discovery es el proceso de encontrar automáticamente qué instancias de servicio satisfacen una consulta determinada, por ejemplo un servicio llamado <em>Compras</em> puede necesitar encontrar instancias de <em>Cotizacion de Envio</em> con alguna con variable de entorno seteado en <em>prod</em> por ejemplo. En ese caso se puede invocar un proceso de descubrimiento de servicio, que deberia devolver una lista de servidores adecuados.</p>
</div>
<div class="paragraph">
<p>Para una estructura monolitica esto es facil, mediante un DNS, algun load balancer y algunas convenciones sobre los puertos basta. Pero en entornos mas distribuidos, esto no es tan trivial; y los servicios que anteriormente podían confiar ciegamente en sus búsquedas de DNS para encontrar dependencias ahora tienen que lidiar con cosas como el equilibrio de carga del lado del cliente, múltiples entornos diferentes.</p>
</div>
<div class="paragraph">
<p>Si antes lo único que necesitaba era solo configuracion para resolver los nombres de host, ahora los servicios necesitan muchas líneas de repeticiones para lidiar con varios casos de esquina introducidos por una distribución más alta. Para esto se tiene este servicio de Service Discovery para encontrar las instancias a traves de la red que necesita un componente y las interconecta.</p>
</div>
<div class="paragraph">
<p>Los circuit breakers son un patron catalogado por <em>Michael Nygard</em> en el libro <a href="">Release it</a> del 2007. y lo que me gustaria mencionar aunque en ingles es la definicion de Martin Fowler en <a href="https://martinfowler.com/bliki/CircuitBreaker.html">3</a></p>
</div>
<div class="paragraph">
<p><cite cite="Martin Fowler">The basic idea behind the circuit breaker is very simple. You wrap a protected function call in a circuit breaker object, which monitors for failures. Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all. Usually you&#8217;ll also want some kind of monitor alert if the circuit breaker trips.</cite></p>
</div>
<div class="paragraph">
<p>Estos son patrones re simples que nos permiten tener mas confiabilidad en la interacciones entre los servicios. Sin embargo esto se empieza a complicar cuando se incrementa el mivel de distribucion. Por lo que puede pasar que tratar de "monitorear" una posible alerta en caso de que un circuit breaker se dispare, deja a veces de ser tan simple. Y una falla de un componente puede desencadenar tal vez una cascada de errores si lo tenemos todo</p>
</div>
<div class="paragraph">
<p>These are great simple devices to add more reliability to interactions between your services. Nevertheless, just like everything else they tend to get much more complicated as the level of distribution increases. The likelihood of something going wrong in a system raises exponentially with distribution, so even simple things like &#8220;some kind of monitor alert if the circuit breaker trips&#8221; aren&#8217;t necessarily straightforward anymore. One failure in one component can create a cascade of effects across many clients, and clients of clients, triggering thousands of circuits to trip at the same time. Once more what used to be just a few lines of code now requires loads of boilerplate to handle situations that only exist in this new world.</p>
</div>
<div class="paragraph">
<p>De hecho, los ejemplos enumerados anteriormente pueden ser tan difíciles de implementar correctamente que las bibliotecas grandes y sofisticadas como <a href="https://twitter.github.io/finagle/">Finagle</a> entre otras se han hecho para evitar reescribir la misma lógica o solucion de estos ejemplos una y otra vez en distintos modulos del sistema.</p>
</div>
<div class="paragraph">
<p>Entonces ahora podemos tener nuestra aplicacion de alguna manera separado de nuestra biblioteca pero aun en el mismo servicio x..</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/1.png" alt="1">
</div>
</div>
<div class="paragraph">
<p>Esta arquitectura de microservicios fue inicialmente utilizada por varias organizaciones que fueron pioneras de este tipo de arqutecturas como Twitter o Soundcloud. A medida que la cantidad de servicios aumento se empezo a ver de a poco las desventajas de esta solucion. La mayor limitante es que a medida que aumentan los servicios, se necesita una mayor cantidad de recursos, en terminos de ingenieros/desarrolladores para construir y de alguna manera "pegar" estas librerias en los servicios nuevos y mantenerlos tambien. Por lo que entre un 10-15% de los recursos se tienen que invertir en "pegar" y mantener estas librerias.</p>
</div>
<div class="paragraph">
<p>Otra desventaja un poco viene por el lado de la libreria puede llegar a atarse al runtime y lenguajes tambien que se pueden usar en los microservicios. Porque es muy probable que estas librerias esten escritas en una plataforma en particular, por ejemplo Finagle esta escrito en Scala para la JVM, por lo que en el caso que se quiera agregar un nuevo servicio y quiere usarse esta libreria, se debe o bien ajustarse a la plataforma en la que estamos usando la libreria o usar un port o alguna libreria alternativa que nos resuelva el mismo problema.</p>
</div>
<div class="sect2">
<h3 id="_mas_alla_de_los_microservicios"><a class="anchor" href="#_mas_alla_de_los_microservicios"></a>Mas alla de los microservicios</h3>
<div class="paragraph">
<p>De manera similar a lo que vimos en el stack de la red, sería altamente deseable extraer las características requeridas por los servicios distribuidos masivamente en una plataforma subyacente.</p>
</div>
<div class="paragraph">
<p>Las empresas escriben aplicaciones y servicios sofisticados utilizando protocolos de nivel superior como HTTP sin siquiera pensar en cómo TCP controla los paquetes en su red. Esta situación es lo que necesitamos para los microservicios, donde los ingenieros que trabajan en servicios pueden centrarse en su lógica de negocios y evitar perder tiempo escribiendo su propio código de infraestructura de servicios o administrando bibliotecas y marcos en toda la flota de microservicios.</p>
</div>
<div class="paragraph">
<p>Entonces nuestro diagrama vendria a quedar de esta manera..</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/2.png" alt="2">
</div>
</div>
<div class="paragraph">
<p>Pero esto no es tan trivial, agregar otro stack de la red involucra tambien que haya una interaccion entre la capa que antes era nuestra libreria y la superior, teniendo que ajustarlo o bien a un formato estandar sin tener que acoplarlo a la aplicacion, que haria que no fuese posible que se use a traves de varios servicios distintos.</p>
</div>
<div class="paragraph">
<p>Hay una solucion alternativa que es la de implementar esto mismo pero a partir de un componente <em>proxy</em>. Por lo que un servicio no se conecta directamente con las dependencias sino que pasara todo su trafico a traves de otro modulo que agrega de manera transparente estas soluciones como el Circuit Breaker, Service Discovery, etc..</p>
</div>
<div class="paragraph">
<p>Esto empezo a aparecer por primera vez con este articulo de <a href="https://medium.com/airbnb-engineering/smartstack-service-discovery-in-the-cloud-4b8a080de619">Airbnb</a> en donde se describia a este servicio proxy como algo llamado <em>sidecar</em>. Un año despues Netflix hace algo muy similar pero para aplicaciones que no son basadas en la JVM, que es su implementacion de un sidecar llamado <a href="https://medium.com/netflix-techblog/prana-a-sidecar-for-your-netflix-paas-based-applications-and-services-258a5790a015">Prana</a></p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/3.png" alt="3">
</div>
</div>
<div class="paragraph">
<p>Con el aumento de las arquitecturas basadas en microservicios, se siguio avanzando con esta arquitectura basada en proxies, y llegaron a aparecer en poco tiempo implementaciones de proxy que son lo suficientemente flexibles para adaptarse a distintos servicios y preferencias. Uno de los primeros fue <a href="https://buoyant.io/2016/02/18/linkerd-twitter-style-operability-for-microservices/">Linkerd</a>, creado por Twitter, y mas tarde por otra implementacion mas conocida hoy en dia llamado <a href="https://eng.lyft.com/announcing-envoy-c-l7-proxy-and-communication-bus-92520b6c8191">Envoy</a></p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_service_mesh"><a class="anchor" href="#_service_mesh"></a>Service Mesh</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El modelo de Service Mesh consiste en que, cada uno de sus servicios tendrá un sidecar proxy complementario. Dado que los servicios se comunican entre sí solo a través del proxy de sidecar, terminamos con una implementación similar al diagrama a continuación:</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/service-mesh.png" alt="service mesh">
</div>
</div>
<div class="paragraph">
<p>Una definicion un poco mas formal lo podemos ver en lo que escribio <a href="https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/"><em>William Morgan</em> de Buoyant en 2017</a></p>
</div>
<div class="paragraph">
<p><cite cite="William Morgan">A service mesh is a dedicated infrastructure layer for handling service-to-service communication. It&#8217;s responsible for the reliable delivery of requests through the complex topology of services that comprise a modern, cloud native application. In practice, the service mesh is typically implemented as an array of lightweight network proxies that are deployed alongside application code, without the application needing to be aware. </cite></p>
</div>
<div class="paragraph">
<p>Probablemente el aspecto más importante de su definición es que se aleja de pensar en los proxies como componentes aislados y reconoce en que la red que forman es algo valioso en sí mismo.</p>
</div>
<div class="paragraph">
<p>A medida que las organizaciones trasladan sus implementaciones de microservicios a deployments más sofisticados como Kubernetes, las personas y las organizaciones han comenzado a usar las herramientas disponibles por esas plataformas para implementar esta idea de un service mesh correctamente. Se están alejando de un conjunto de servidores proxy independientes que trabajan de forma aislada a un plano de control, o sea algo centralizado.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/service-mesh-generic-topology_social.png" alt="service mesh generic topology social">
</div>
</div>
<div class="paragraph">
<p>Viendo un poco nuestro diagrama de arriba,vemos que el tráfico real del servicio todavía fluye de proxy a proxy directamente, pero el plano de control conoce cada instancia de proxy. El plano de control permite a los proxies implementar cosas como el control de acceso y la recopilación de métricas, lo que requiere cooperación..</p>
</div>
<div class="paragraph">
<p>Otro diagrama un poco mas detallado de plano de control (<em>Control Plane</em>) puede verse como el siguiente:</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="./public/img/service_mesh/control_plane.png" alt="control plane">
</div>
</div>
<div class="paragraph">
<p>El proyecto que nos permite un poco utilizar el plano de control se llama <a href="https://istio.io/">Istio</a> y es por el momento la herramienta mas utilizada y conocida para implementar el plano de control.</p>
</div>
<div class="paragraph">
<p>Bibliografia</p>
</div>
<div class="paragraph">
<p><a href="https://www.oreilly.com/library/view/the-enterprise-path/9781492041795/ch01.html">The Enterprise Path to Service Mesh Architectures by Lee Calcote</a></p>
</div>
</div>
</div>`;export{e as default};
