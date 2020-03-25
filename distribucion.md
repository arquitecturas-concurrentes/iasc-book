---
layout: default
title: "Capitulo 7 - Distribucion"
description: "Introduccion y nociones de distribucion"
---

# Distribución

## Introduccion

Antes de hablar de distribución, es a veces ideal tratar de explicarlo de cómo se llega a ella. En general cuando se plantea la arquitectura de una aplicación, en cuanto a la arquitectura, en donde queda afuera lo que es el diseño e implementación del mismo, en general se plantea o se despliega por primera vez como un monolito, es decir, solo implementar todo nuestro sistema en un solo servidor. Ya sea un prototipo, o una versión temprana (beta) de nuestra aplicación, en general se plantea el monolito como arquitectura inicial, por costos y tiempo en el que se despliega la aplicación, y también porque no tenemos problemas que nos puede causar un sistema distribuido.

<img src="{{site.relative_url}}/images/distribucion/image2.png">

Esta es una imagen de una arquitectura monolitica tradicional, con una aplicacion y una base SQL, que en general esta desplegada en un solo servidor. Algunos problemas que puede generar esta arquitectura es la siguiente:

- Incremento de la complejidad de la aplicacion, a medida que pasa el tiempo y la misma empieza a tener gran cantidad de componentes o va creciendo los requerimientos del sistema
- Cuando empieza a ser usado cada vez por más usuarios, esto hace que aumente la carga y que un solo servidor pueda no ser suficiente o incluso generar problemas con la carga que generan estos usuarios

Ante el aumento de la carga de usuarios, tráfico y mayor interacción entre la aplicación y la base de datos, esto genera una carga mayor en el único servidor que tenemos, por lo cual deberemos escalar. Hay dos tipos de escala:

### Escala Vertical (Scale Up)

<img src="{{site.relative_url}}/images/distribucion/image6.png">

Esta manera de escalar, también conocido como escalar para arriba o verticalmente (?) (scale up), es incrementando los recursos de un servidor o un nodo, o sea aumentar CPU, memoria, disco, etc. 
Lo que nos permite este tipo de escala es que no necesitamos realizar cambios o desarrollo adicional en nuestro sistema, solo habrá un tiempo en el que nuestro sistema no estará disponible hasta una vez que hayan sido implementado estos cambios. 
El problema de escalar verticalmente es que el costo empieza a ser exponencial en un momento, por lo que en un momento se puede hacer muy costoso un nodo único muy grande en donde cada vez las mejoras van a ser menores en cuanto a recursos.
También hay un momento en el que, si utilizamos servidores tradicionales y no mainframes, exista una limitación en cuanto a la tecnología, en general por limitaciones en cuanto a la CPUs

### Escala Horizontal

<img src="{{site.relative_url}}/images/distribucion/image12.png">

La otra manera de escalar, es horizontalmente también (Scale Out) es cuando en vez de incrementar los recursos, se agregan nuevos servidores con los mismos recursos. Lo bueno de poder escalar horizontalmente es que la aplicación no deja de estar disponible al escalar de esta manera. El costo con esta metodología es mucho más económica por este medio, que escalando verticalmente, otro aspecto interesante es que es más tolerante a fallos, ya que más copias de la aplicación están corriendo al mismo tiempo. Las grandes desventajas son que la arquitectura se complica, junto con el aumento del ancho de banda entre los distintos componentes que puede llegar a tener nuestro sistema una vez que hagamos scale out.

Con respecto a nuestra aplicación monolítica, podemos bien o replicar toda la aplicación con su bbdd, y que no tengan relación alguna cada una de las maquinas (imagen izquierda), o bien podemos solo replicar en cada uno de los servidores la aplicación y luego tener en otra instancia nuestra bbdd (imagen derecha). 

<img src="{{site.relative_url}}/images/distribucion/image7.png">

La motivación para la arquitectura de la imagen de la izquierda puede ser que se quiera distribuir por países el sistema, o sea, que en cada país que exista esta aplicación se dirija a un servidor que contiene todo su estado. La otra manera de escalar horizontalmente nuestro monolito nos permite que no tengamos tres bases de datos distintas, y que incluso el sistema pueda ser visto aun por el usuario como uno solo, o sea generalmente mediante alguna diferencia de endpoints, pero… como manejar la carga de manera que no se sobrecargue un solo servidor y los otros no?  Con un load balancer…

<img src="{{site.relative_url}}/images/distribucion/image13.png">

Un load balancer nos va a permitir usar alguna estrategia por la cual la carga sea distribuida de manera equitativa. Esto puede ser por un algoritmo simple, tal como puede ser un round robin, o puede tener algún feedback de los nodos o servidores, que pueden dar al load balancer un poco más de información sobre a dónde redirigir el tráfico.

Pero esta es la única manera de escalar?? La respuesta es no.

Se puede escalar horizontalmente de varias maneras, existe un libro que es el de “Art of Scalability” de Michael Fisher que nos propone un interesante modelo de cubo de como escalar.

<img src="{{site.relative_url}}/images/distribucion/image9.png">

En esta representación el punto de origen concuerda con el sistema monolítico en una sola instancia, y la arista de arriba a la derecha del cubo, nos representa la máxima escalabilidad de la aplicación. Y como el cubo es en tres dimensiones, eso nos dice que no solo hay una manera de escalar nuestra aplicación sino que hay varias que incluso podríamos llegar a combinar, ahora veremos cada una de las dimensiones

### Eje X - Clonacion

Esta manera de escalar, es la que vimos al final de la sección anterior, es cuando tenemos varias réplicas de nuestra aplicación monolítica y que pueden o bien acceder a una bbdd. Otros temas a mencionar que no se hayan hecho antes es el tema de que al existir varias copias de nuestro sistema, tendremos que de alguna manera garantizar que los datos se mantengan consistentes, ya que varias copias van a estar accediendo a los mismos datos, por lo que tendremos que bien o implementar un sistema de lockeo de los datos o usar algo que nos garantice esto, que bien puede ser la base de datos.
Este esquema no nos resuelve aún el problema de una aplicación de alta complejidad, o sea.. Que aun nuestro código va a estar aun organizado como una aplicación monolítica, esto puede no ser una desventaja si no tenemos un basecode demasiado grande pero si lo fuese, por temas de complejidad o incluso de uso de servicios de terceros, tal vez sea un problema a nivel de desarrollo o mantenimiento.


### Eje Y - Descomposición Funcional

En vez de tener varias instancias o nodos del mismo sistema, cada uno conteniendo todo el código del sistema, en este eje se va a descomponer nuestra aplicación entre los distintos nodos, esto es lo que se conoce generalmente como microservicios, y cada uno de estos va a ser responsable de una función. 

<img src="{{site.relative_url}}/images/distribucion/image8.png">

Y como podemos descomponer a nuestra aplicación? 

- Podemos descomponer por medio de la función técnica de lo que hace ya sea un endpoint, o una funcionalidad, por ejemplo, se puede descomponer una aplicación en servicios de capacidad (capability-services) como login, usuarios, productos, etc. Abajo hay un pequeño ejemplo de un servicio de discusión, estilo reddit.
  <img src="{{site.relative_url}}/images/distribucion/image2.png">
- Otra manera de descomponer es dividir por dominios a la aplicación, o sea por los recursos pero como un todo, y no por las funcionalidades, o sea si tenemos una aplicación de venta, podemos dividir la aplicación en: servicio al cliente, ventas, catalogo para el usuario. Esta división es más bien por entidades (Entity-Services)

También pueden combinarse esta división o usarse otro tipo de división del sistema, el esquema no es estricto en este sentido, por lo que nos da la libertad de escalar nuestra aplicación o más bien de dividirla de acuerdo a nuestro dominio. No hay ya necesidad de clonar toda la aplicación de esta manera. El problema es que esto genera otras desventajas y son que ahora nuestros microservicios además de trabajar con la bbdd a veces tendrán que coordinarse los unos a los otros mediante mensajes o requests incluso, también puede haber un incremento en el uso del ancho de banda.

### Eje Z - Sharding/Data Partitioning

Hasta ahora vimos cómo dividir nuestro sistema pero a nivel de organización de la lógica de nuestros componentes, puede existir el caso en el que si estamos persistiendo los datos de nuestro sistema, el mismo aún tenga una sola base de datos o a lo sumo este replicada en otras bases, pero que en suma estas réplicas son solo una copia de todo el estado de la base de datos principal, por lo que en ese esquema solo una base de datos admite escrituras y todas puedan ser leídas. Dependiendo del tipo de réplica, la misma puede ser hecha ni bien se escriben los valores o a veces pueden tenerse escrituras que no garantice que una vez que se escribió el valor en la base de datos, el mismo esté replicado en las otras bases, esto se llama replicación asincrónica. Pueden ver mas de esto en el siguiente (link)[https://www.cybertec-postgresql.com/en/services/postgresql-replication/synchronous-synchronous-replication/]

Pero aún tenemos el estado, a lo sumo replicado, tal como lo teníamos con los servidores al escalarlo mediante clonación (eje x), y solo podemos tener una escritura a la vez, esto puede ser un cuello de botella si existen muchas escrituras sobre la base de datos. El esquema de este eje z, es el de dividir la base de datos o el estado en subsets, por lo que podemos dividir el estado bajo un criterio determinado, por ejemplo si tenemos un estado que son los productos, bien podemos dividir los mismos por rango de letras como el siguiente ejemplo.

<img src="{{site.relative_url}}/images/distribucion/image4.png">

Y como tenemos ahora el estado particionado, vamos a tener que tener algo que nos pueda despachar al nodo correcto los pedidos de lectura o escritura, que puede ser un load balancer, o bien que los nodos de estado o persistencia se puedan hablar entre ellos para devolver o persistir el estado, esto último es en el caso en el que no se tenga una base de datos relacional o tan solo se pueda implementar un shardeo de este tipo.
Lo interesante de este esquema es que no tenemos más de un nodo de datos que pueda aceptar escrituras, aunque solo habrá una escritura por subset.


## Combinación de Ejes

Como el modelo de escala es tridimensional, se puede incluso combinar para que nuestra arquitectura sea más robusta, por ejemplo, podemos tener un esquema de microservicios en el que además cada servicio, como el de login, puede esta clonado y tener más de un servicio de login disponible y el mismo esté tan solo distribuido por un segundo nivel de load balancer que redirige los request con un criterio, que nos da un esquema así? Como dijimos antes, mayor robustez, si bien escalar por microservicios divide la carga, aun todos los usuarios en gran medida, deberán loguearse, y ademas al separar los servicios, aun seguimos teniendo un solo punto de fallo, por lo que para que el servicio esté disponible si el servidor de login se cae, es el de escalar después este microservicio por medio de clonar el mismo en varios servidores idénticos con este microservicios.

<img src="{{site.relative_url}}/images/distribucion/image5.png">

### Sesiones

Otro tema que no hablamos antes es sobre las sesiones en nuestra aplicación ahora distribuida, en el primer caso que es el de replicar la aplicación, si tenemos varios nodos con toda nuestra aplicación y un load balancer, puede ocurrir que un usuario se loguee en un nodo y luego en otro request, pueda ser redirigido a otro nodo donde no se tiene registro de su login, como se resuelve esto? O bien teniendo un lugar, como una base de datos aparte donde se registren las sesiones o bien se puede optar por un esquema de sticky sessions

<img src="{{site.relative_url}}/images/distribucion/image10.png">

ELs sticky sessions permiten mediante una cookie, saber contra qué servidor se autenticaron, además de otra información de la sesión, el load balancer sabe a qué nodo redirigir los requests de un usuario en particular sobre un modelo de cloning o en el que nuestra aplicación esta solo replicada, en otros tipo de arquitecturas como microservicios, puede ser que no sea necesario a menos que exista solo nodo de login de usuarios.

### Heartbeat y gossip

A veces es necesario saber si un nodo o servicio esta disponible y que sepamos que no este caido, a veces si es solo un servicio que estamos exponiendo podemos tan solo tener un healthcheck, que es solo un endpoint de nuestro sistema,( algo mas de detalle en (https://microservices.io/patterns/observability/health-check-api.html)[https://microservices.io/patterns/observability/health-check-api.html], puede ser incluso implementado si no estamos en un esquema de microservicios) para confirmar si nuestro servicio esta disponible y puede admitir nuevos pedidos, pero esto es en general a nivel de HHTP, por lo que si un nodo nuestro se cae podriamos no llegar a poder responder un request hecho a nuestro endpoint. 
Entonces cómo podemos detectar fallas en nodos de nuestro sistema si no es solo mediante un chequeo de healthcheck o un mecanismo similar? Podemos hacerlo mediante conexiones de tcp en las que se pase un token o un bit o un valor que se van a ir pasando entre los nodos, y de esta manera cuando un nodo deje de pasar ese valor después de un tiempo prolongado, muy superior al tiempo entre emisión de este valor, se puede tomar al nodo como caido.
Esto se lo conoce como heartbeat, y es útil para conocer si se cayeron los nodos sin depender de un healthcheck, ya que pudo existir una caída del nodo y que no sea un problema lógico o de algún componente o servicio externo. Lo recomendable es que la información de heartbeat este en una vía o conexión distinta a lo que se usaría para intercambiar información entre nodos o servidores.
Otra manera un poco mas bien ordenada o distribuida, de cómo notificar a otros servidores y no hacer múltiples conexiones entre nodos, para usar heartbeat, es el de usar un protocolo de gossip. Esto permite que se intercambie más información entre servidores, y que no sea solo un simple valor o bit, por ejemplo, puede ser información tal como por ejemplo: “se cayó el nodo de login x”, o “volvió a estar disponible el nodo que contiene la base de datos”. Se puede encontrar un poco más de información en el siguiente (link)[https://github.com/gossiperl/gossiperl/wiki/gossip-in-computer-science]

## Distribución en Elixir/Erlang (BEAM)

Cuando hablamos de distribución en general, en general estamos solos sin ayuda de algún componente del lenguaje que estamos usando, es decir, estamos solos en la oscuridad sin saber qué es lo que puede suceder. Con erlang/elixir, a pesar de que posee mecanismos como los que vimos, tampoco estamos con mucha más ayuda del lenguaje, o sea seguimos en la oscuridad. Elixir nos da ventajas para tolerancia a fallos y resiliencia pero no mucho más que eso. Cuando se implementó Erlang muchas de las consideraciones que veremos hoy no se tomaron en cuenta por un tema de que la arquitectura en la que fue concebido es distinto a lo que hoy conocemos.
Elixir posee algunas cosas base por la cuales podemos utilizar como fundaciones para construir aplicaciones distribuidas, que ya vimos interconectando máquinas virtuales entre si, como serializar datos (van a tener que ver la api para esto), y como saber cuando un nodo se cae (esto lo vemos pronto), pero no sobre soluciones específicas como que pasa cuando un proceso se cae o algo falla inesperadamente en una maquina. O sea OTP nos da muchas herramientas para ir manejando y construyendo estas herramientas pero no existe una en particular para solucionar todos los problemas puntuales de nuestra aplicación Erlang/Elixir, o sea no hay bala de plata.

Una instancia de la máquina virtual de erlang, que está lista para comunicarse con otras vm’s las llamaremos nodos. Cuando se inicializa un nodo, se le da un nombre en concreto como vimos con el caso del ping pong y este se conecta a una aplicación llamada Erlang Port Mapper Daemon (EPMD), que ejecuta en cada una de las máquinas que son parte del cluster que estaremos armando, si es el caso que es más de una máquina. EPMD actuará como un name server que permite que los nodos se registren, se contacten con otros nodos y notifiquen cuando hay algún conflicto de nombres.

De esta manera ya podemos empezar a conectar uno nodos con otros, y ver como empiezan a haber comunicación entre estos, un primer approach que se puede ver es que si se tiene un nodo A y otro B solo con una conexión y uno de estos se cae, el otro nodo queda aislado. 

Si B estaba comunicado con C y necesita procesar algo que puede solo hacerlo A y B solo lo hacia delegando a A, esta funcionalidad ya no funciona ya que A esta aislado. Una primera idea es interconectar a todos con todos. Esta idea podría ser interesante, más que nada por una cuestión de tolerancia a fallos, pero sucede que puede ser un problema si la aplicación escala y se necesitan interconectar más nodos. Será dificil de tener cientos y cientos de nodos interconectados en sí más que nada por la cantidad de conexiones que necesitan, también hay que recordar que se necesita un puerto por nodo al que se está conectando. La topología más común a esto es hacerlo en forma de anillo, algo parecido a lo que hay en token ring, pero sin el token. 

Una vez que se conectaron los nodos, estos son ya independientes, poseen su registro del proceso, sus tablas de ETS y módulos independientes unos de otros. Un nodo cuando se cae no hace que se caigan los nodos asociados. Lo interesante de la conexión entre nodos es que se pueden mandar mensajes de la misma manera en la que se lo hace entre procesos de un mismo nodo. La serialización/deserialización lo hace automáticamente y de manera transparente el nodo. Veremos que las estructuras incluidas los pids funcionan de la misma manera remotamente como localmente, esto significa que puede mandarse mensajes de pids sobre la red y comunicarlos mediante mensajes. 


## Bonus: Mitos de la distribución

Durante muchos tiempo, existieron 8 leyes o enunciados principales que son falacias y que son difíciles de manejar y la gente de erlang tomó algunas decisiones cuando se diseñó el lenguaje en sí.

- La red es confiable: Esta es la primera falacia que hay en la computación distribuida, pueden existir fallos de red bastante más frecuente de lo que uno cree, más acá que en otros lados incluso por muchas razones (cortes de luz, falla de hardware, cable roto, etc). Entonces ya de por si no es verdadero que uno puede interconectar dos nodos en una red y siempre esperar que uno desde un nodo se puede conectar y hablar normalmente con otro nodo. Erlang en si no tiene un mecanismo especial para eso, lo mejor que nos provee es que haya una comunicación asincrónica en la que se manden mensajes asincrónicamente y después de un timeout se reintente o falle, entonces si un nodo se cae, lo manejaremos como si fuese un fallo local.

- No hay latencia: Esta es otra falacia ya que de por sí a menos que estén todos los nodos en una sola máquina, siempre existe la conocida latencia de red, e incluso si los nodos estuviesen localmente existe una pequeña latencia. Erlang de la manera en la que es, teniendo nodos como procesos aislados e independientes, mensajes asincrónicos, timeouts, monitores, nos permite ir manejando y viendo cómo ir tratando de manejar la latencia entre los distintos nodos e ir ajustando esto dependiendo de la red.

- El ancho de banda es infinito: Si bien el ancho de banda es mucho mayor que hace unos años, no hay que ir pasando exceso de información o gran cantidad de información entre dos nodos, siempre hay que tener en consideración que una comunicación entre dos nodos pasa en general mediante una conexión de TCP y solo una. Entonces todos los mensajes que mandemos pasarán por un solo canal entre dos nodos, entonces pasar un mensaje muy grande puede generar un bloqueo para otros mensajes consecuentes en este canal y crear un cuello de botella. Además Erlang/Elixir tienen un mecanismo para saber que los nodos están aún vivos que se lo conoce como heartbeat, y funciona de manera en el que los nodos  conectados mandan mensajes cortos entre sí para avisar que aún están vivos y levantados y pueden hablar entre sí llamados beats. Estos mensajes se pasan por el mismo canal que los mensajes comunes entonces bloquear el canal con un mensaje muy grande puede generar que se bloquee el mensaje de beat y luego de pasado un tiempo que se rompa el vínculo entre los nodos.

- La red es segura. Acá no hay mucho que explicar, sabemos que la red es bastante insegura hoy por hoy. En general las aplicaciones se arman en clusters en una red local, y en general hacerlo en nodos en diferentes lugares físicos no está recomendado, de tener que hacerlo, debería implementar algún mecanismo que no viene por default en Erlang/Elixir, mediante ssl, o implementar el protocolo de comunicación entre los nodos. Hay algunos links que después pasaremos de esto.

- La Topología no cambia. Uno puede diseñar una aplicación distribuida en una LAN o intranet con una cantidad de máquinas con IP fija y una red pre-establecida, pero la realidad es que.. el hardware cambia con el tiempo, se hacen migraciones de red, o se cambia como era la topología de la LAN o inranet. Entonces sucede que no se puede hardcodear la ip de las máquinas al interconectarlas, para eso, Erlang identifica mendiante username a los nodos, hay un mecanismo que no veremos pero que existe llamado cookies que permite que se pueda identificar a un nodo con un username, no hay que confundirlo con las cookies de http pero son algo similares, aunque nunca deben considerarse un mecanismo de seguridad.

- Solo hay un administrador. Esto se cae muy rápido en los caso que tengamos una gran cantidad de servidores o incluso cuando nuestro sistema empieza a escalar, como vimos para volver a levantar procesos en Erlang es dentro de todo bastante simple aunque debe hacerse por medio de un administrador o persona si el nodo se cae definitivamente.

- El costo de transporte es cero. Lease esto como costo de transporte de datos de un nodo a otro en términos de tiempos y/o dinero. Serializar los datos no es gratis o rápido a veces, y la red posee una latencia también como mencionamos que acarrea un costo. En cuanto a costo monetario, siempre hay costo de mantenimiento de la red, servicio de ISP, hardware, personal.

- La red es homogenea. Esto último se refiere a que siempre usamos los mismos formatos para operar todo junto. Esto se refiere a que siempre se usa un mismo estándar y no siempre es así, se usan distintos lenguajes y estándares (XML, JSON, no no vamos a compararlos aca), pero en Erlang se tiene en cuenta que siempre nos vamos a comunicar y hablar con nodos y nuestro sistema está en el mismo lenguaje y que hablan el mismo protocolo. Entonces volvemos a un concepto como duck typing, en la que si tenemos un nodo que está implementado en otro lenguaje pero usa el mismo protocolo que erlang, entonces podrá hablar con otros nodos, un caso es cnode.
Otra manera de intercambiar información es mediante BERT-RPC, cualquier otro sistema que use esta implementación podrá pasar información a un nodo erlang/elixir.

## Interleaving y netsplits

Sucede a veces cuando tenemos una interconexión entre nodos, momentos en los que tal vez un nodo no empieza a responder a los heartbeats y perdemos conocimiento de él, después de un tiempo tendremos que asumir que esta muerto. En general se asume, y también en lenguajes que nos ayudan con algunos temas de distribución como Erlang, que si un nodo no se puede conocer si está vivo, está muerto, que es el caso más pesimista que es cuando se piensa que hay más fallos de hardware/software que de red. Otro esquema sería el optimista en el que el nodo está vivo y en realidad lo que pasó es que por un momento la red se cayó o había demasiada latencia y no llegaba al nodo extraviado. Este esquema supone que es más frecuente el fallo de red que de hardware/software. Imaginemos un sitio de compra y venta tipo mercadolibre con dos nodos y sucede este esquema, cuando se realizar una transacción en un nodo, se debe también sincronizar la transacción en el otro nodo ya que puede existir el caso que una de las dos partes tiene su cuenta en otro nodo, si funciona todo bien no hay problemas, pero en el caso de que uno de los nodos no responda, y luego en realidad haya pasado que había un fallo de la red, el nodo queda desincronizado, pero el esquema que tomemos puede tener una desventaja u otra, el pesimista es que no permita que haya transacciones y en consecuencia perdamos plata, no cobramos la comisión, pero el otro caso si es optimista, puede suceder que haya un interleave que deje que dos personas compre un mismo productos en los dos nodos y después no se sepa quien ganó. 
