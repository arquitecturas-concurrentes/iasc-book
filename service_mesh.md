---
layout: default
title: "Service Mesh"
description: "Introduccion conceptual de Service Mesh"
---

## Introduccion

Tal como lo vimos en la introduccion a distribucion, aprendimos que el tener sistemas distribuidos en cualquier dimension pueden causar casos de uso que no hubiesemos pensado antes, asi como varios problemas a resolver.

Cuando estos sistemas eran simples, en general se trataba de minimizar la interaccion entre componentes remotos para que el impacto de la complejidad de los sistemas distribuidos sea minima. Y si bien en general, durante un tiempo hace un tiempo atras, si el sistema era dentro de todo simple o pequenio, solamente se trataba de evitar la distribucion aun si hubiese que duplicar logica o datos entre distintos sistemas.

Obviamente no eran soluciones optimas, y hoy por hoy se trata de solucionar problemas tales como la duplicacion de codigo o de logica entre un componente o varios. Y en este nuevo mundo, cuando empezaron a verse de nuevo casos de sistemas que cada vez necesitaban escalar debido a que escalar verticalmente era demasiado costoso. Incluso estas dificultades hacian que fuese dificil de escalar (un ejemplo mencionado [aqui](http://highscalability.com/blog/2009/10/13/why-are-facebook-digg-and-twitter-so-hard-to-scale.html))
Por eso varias soluciones iniciales fueron por asi decirlo ad-hoc para cada caso en un sistema en particular y de ahi fueron extrayendose nuevas soluciones cada vez mas sofisticadas. 
A medida que descubrimos más sobre el dominio del problema y diseñamos mejores soluciones, comenzamos a cristalizar algunas de las necesidades más comunes en patrones, bibliotecas y eventualmente plataformas.

No solo se reduce esto a patrones, bibliotecas y codigo, sino tambien metodologias sobre como escalar y conceptos sobre sistemas distribuidos (mencion [2](http://highscalability.com/blog/2010/6/10/the-four-meta-secrets-of-scaling-at-facebook.html))

## Recapitulando desde microservicios

Con los años, las computadoras se volvieron aún más baratas y más omnipresentes, y la pila de redes descrita anteriormente ha demostrado ser el conjunto de herramientas de facto para conectar sistemas de manera confiable. Con más nodos y conexiones estables, la industria ha jugado con varios tipos de sistemas en red, desde agentes y objetos distribuidos hasta arquitecturas orientadas a servicios compuestas de componentes más grandes pero aún muy distribuidos.

En los años 90, Peter Deutsch y sus colegas ingenieros de Sun Microsystems compilaron "Las 8 falacias de la computación distribuida", en la que enumera algunas suposiciones que las personas tienden a hacer cuando trabajan con sistemas distribuidos. El punto de Peter es que estos podrían haber sido ciertos en arquitecturas de redes más primitivas o en modelos teóricos, pero no son válidos en el mundo moderno. Pueden ver un poco mas a [aca]({{site.relative_url}}/mitos/)

Incluso vimos que existen distintos problemas, tales como los que vimos hasta ahora como CAP, interleaving, netsplits, entre otras cosas. Incluso podemos mencionar otras cosas con la que deberiamos lidiar con una arquitectura distribuida:

- Provisionamiento rapido de los recursos (nuevas instancias)
- Monitoreo, en lo posible en tiempo real o poco delay
- Despliegue rapido
- Facil de provisionar mas almacenamiento (BBDD, disco, etc)
- Autenticacion
- Tener algun mecanismo de RPC estandarizado entre los compoenentes internos del sistema (protocols, gRPC por ej)


Entonces, aunque la pila TCP / IP y el modelo de red general desarrollado hace muchas décadas sigue siendo una herramienta poderosa para hacer que las computadoras se comuniquen entre sí, las arquitecturas más sofisticadas introdujeron otra capa de requisitos que, una vez más, deben cumplir los ingenieros que trabajan en tales arquitecturas.

Hay ejemplos que podemos mencionar que se usaron para solucionar algunos problemas de resilencia y distribucion, algunos de estos son failover/takeover, circuit breaker (algunos detalles de este pueden verse [aca tambien(https://microservices.io/patterns/reliability/circuit-breaker.html)]), y tambien service discovery. Un ejemplo de servicios puede ser el siguiente:

<img src="{{site.relative_url}}/images/service_mesh/1.png" class='center'>

Entonces Service Discovery es el proceso de encontrar automáticamente qué instancias de servicio satisfacen una consulta determinada, por ejemplo un servicio llamado *Compras* puede necesitar encontrar instancias de *Cotizacion de Envio* con alguna con variable de entorno seteado en *prod* por ejemplo. En ese caso se puede invocar un proceso de descubrimiento de servicio, que deberia devolver una lista de servidores adecuados.

Para una estructura monolitica esto es facil, mediante un DNS, algun load balancer y algunas convenciones sobre los puertos basta. Pero en entornos mas distribuidos, esto no es tan trivial; y los servicios que anteriormente podían confiar ciegamente en sus búsquedas de DNS para encontrar dependencias ahora tienen que lidiar con cosas como el equilibrio de carga del lado del cliente, múltiples entornos diferentes. 

 Si antes lo único que necesitaba era solo configuracion para resolver los nombres de host, ahora los servicios necesitan muchas líneas de repeticiones para lidiar con varios casos de esquina introducidos por una distribución más alta. Para esto se tiene este servicio de Service Discovery para encontrar las instancias a traves de la red que necesita un componente y las interconecta.

Los circuit breakers son un patron catalogado por *Michael Nygard* en el libro [Release it]() del 2007. y lo que me gustaria mencionar aunque en ingles es la definicion de Martin Fowler en [3](https://martinfowler.com/bliki/CircuitBreaker.html)

<cite cite="Martin Fowler">The basic idea behind the circuit breaker is very simple. You wrap a protected function call in a circuit breaker object, which monitors for failures. Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all. Usually you’ll also want some kind of monitor alert if the circuit breaker trips.</cite>

Estos son patrones re simples que nos permiten tener mas confiabilidad en la interacciones entre los servicios. Sin embargo esto se empieza a complicar cuando se incrementa el mivel de distribucion. Por lo que puede pasar que tratar de "monitorear" una posible alerta en caso de que un circuit breaker se dispare, deja a veces de ser tan simple. Y una falla de un componente puede desencadenar tal vez una cascada de errores si lo tenemos todo  

These are great simple devices to add more reliability to interactions between your services. Nevertheless, just like everything else they tend to get much more complicated as the level of distribution increases. The likelihood of something going wrong in a system raises exponentially with distribution, so even simple things like “some kind of monitor alert if the circuit breaker trips” aren’t necessarily straightforward anymore. One failure in one component can create a cascade of effects across many clients, and clients of clients, triggering thousands of circuits to trip at the same time. Once more what used to be just a few lines of code now requires loads of boilerplate to handle situations that only exist in this new world.


<img src="{{site.relative_url}}/images/service_mesh/2.png" class='center'>

