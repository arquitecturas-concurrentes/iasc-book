---
layout: default
title: "Introduccion"
description: "De que se trata Arquitecturas Concurrentes??"
---


La materia tiene un objetivo doble: por un lado, conocer tecnologías novedosas de aplicación en la industria de desarrollo de software, y por otro lado, transmitir conocimiento durables, ideas que trasciendan la tecnología, sobre la concurrencia, y la arquitectura de software.

## ¿Arquitecturas Concurrentes? ¿Qué es eso?

Hace varios años empezamos a armar la materia de Arquitecturas Concurrentes. La razon por la cual empezo esta materia surgia un poco de nuestra frustracion de la poca rigurosidad tecnica que encontramos en el dia a dia en nuestros trabajos frente a problemas de arquitecturas, a veces sobrediseñados, a veces bien ideados aunque muy mal bajados en la implementacion, o en base a lo que esta de moda, sin un solido fundamento. Por otro lado surge de que la concurrencia nos tiene de hijo: no importa cuanto nos esforcemos, los malignos hilos de ejecución lograrán destruir nuestro programa en modos insospechados. El cuidado parece ser siempre insuficiente: de alguna forma irreproducibles bugs de sincronización nos harían morder el suelo.

Cual fue la primera impresion una vez que armamos los contenidos iniciales? Que el diablo está en los detalles: muchas ideas de arquitectura y manejo de concurrencia intuitivamente "suenan bien". Pero recién cuando las bajamos a detalle vemos realmente sus consecuencias.

Entonces la materia se trata de dos cosas principales, por un lado dar un estudio bien practico sobre el manejo de la concurrencia, con distintas herramientas. Y por el otro el de dar nociones de arquitecturas distribuidas.

A lo largo de la historia de la materia, la idea fue siempre la de adaptar los contenidos con materiales lo mas actualizado posible, y la idea es siempre ir cambiando nuestros temas a lo que consideramos que es abarcar las dos ideas principales antes mencionadas con algunas de las tecnologias mas actuales.

## Sobre la Arquitectura
Primero, algunas palabras sobre la arquitectura de software. He aquí algunas interpretaciones comunes y complementarias del término:

- Es el diseño lógico de alto nivel: diseñar ya no en términos de componentes como objetos, procedimientos o funciones, sino en términos de módulos, nodos de red, etc
- Es el diseño de aquellos aspectos que software que son difíciles de cambiar: tecnologías de base, lenguajes, etc
- Es el diseño físico: la selección de los componentes de hardware y el despliegue del software sobre estos componentes. En general no encontramos muchas desavenencias en torno a esta ideas. Los problemas surgen cuando pensamos en cómo hacer arquitectura.

### Haciendo arquitectura

Para nosotros la construcción de una arquitectura es un proceso:

- **Iterativo**: si bien la arquitectura trata de lidiar con aquellas cosas que son difíciles de cambiar, aún así hay lugar para iterar. Por ejemplo: probablemente cambiar el lenguaje cada 3 iteraciones no sea una opción viable; sin embargo sí lo es empezar con un almacenamiento en archivos o una base embebida SQLite, luego pasar a un motor relacional, luego extraer una parte a una base de datos Mongo, y luego implementar sharding.
constructivo: la arquitectura incluye la construcción. Si bien comunicar la arquitectura es una tarea real, la definición de una arquitectura no se limita a generar diagramas de despliegue y listados de tecnologías: hay que meter las manos en el barro. Medir, desplegar, programar, probar, son tareas imprescindibles. Ademas casi es imposible realizar el diseño de una arquitectura con una metodologia en cascada, donde deberiamos ya plantear la arquitectura definitiva en una sola iteracion. Veremos mas adelante que siempre requiren de cambios
- **verificable**: si la arquitectura no se puede validar de forma rápida, entonces el proceso está fallando. De la misma forma que no deberíamos programar todo el sistema antes de hacer las pruebas, o todas las pruebas antes de poner nuestra primera línea de código productivo, o encarar refactors que duren días, tampoco deberíamos embarcarnos en implementar arquitecturas de las que no podamos tener ningún feedback hasta dentro de varios meses.
- **holístico**: en el desarrollo de una arquitectura los aspectos humanos suelen tener mucho más peso que los técnicos o tecnológicos. Así, cuestiones económicas o financieras (debemos reducir el gasto mensual en servidores en X%), políticas (vamos a usar el contenedor de aplicaciones X porque nuestra empresa tiene un convenio con quien lo comercializa), interpersonales (el gerente de sistemas de nuestro sector está peleado con el área de base de datos, por lo que utilizaremos almacenamiento en la nube), entre otras, son aspectos que impactan en el desarrollo. Debemos construir teniendo en cuenta estas cuestiones, que a veces pueden jugarnos en contra, y otras, a favor nuestro.
- **potenciado por la tecnología**: el conocimiento de la tecnología existente nos ayudará a ahorrarnos el esfuerzo de pensar e implementar ideas ya probadas. Sin embargo, las decisiones arquitectónicas no deberán estar guiadas por la tecnología. No se trata de ir al supermercado, dirigirnos a la góndola de tecnologías, comprar una marca particular de una base de datos, un ESB y soporte comercial. Se trata de entender la problemática, pensar soluciones, y utilizar algún producto si realmente calza con lo que necesitamos. Cuando alguien se presente como Arquitecto Java/.Net/Node/LoQueSea, salí corriendo.
- **enriquecido por la historia**: de forma similar al punto anterior, hay valor en conocer las soluciones que otros sistemas aplicaron, pero eso no significa que debamos hacer algo sólo porque otro lo hizo. Debemos siempre entender y estudiar las particularidades de nuestro problema, y no ser naïve pensando que simplemente podemos copiar el éxito de otro ignorando el proceso de meses o años que lo llevó a donde está. Si Facebook hizo X, capaz tu solución no necesite X… ¡porque no sos Facebook! Un punto a tener en cuenta es siempre el de no sobrediseñar nuestra arquitectura

### Cualidades Arquitectonicas

Y que consideramos una buena arquitectura? Cuando podemos desarrollar sin problemas ni complejidades, es decir, libre de duplicaciones y que minimicen la redundancia y el codigo que solo es burocracia (en la medida de lo posible), llamado tambien boilerplate, que tengamos buenas abstracciones, que sea facil de mantener y de probar. Y además, como la caracteristica mas importante, que sea **simple**.

#### La madre de todas las cualidades

Podemos decir que la simplicidad es la madre de todas las cualidades, porque queremos solamente que nuestro sistema deba tener la complejidad mínima necesaria para solucionar una problemática.

<cite cite="AI">Everything Should Be Made as Simple as Possible, But Not Simpler</cite>

Cuando la simpleza nos permite desarrollar y mantener un sistema sin mayores problemas, sin perder sus abstracciones escenciales ni duplicando codigo, vamos a poder desarrollar un sistema de manera rapida y el resto de las cualidades serán más fácil de lograr

<img src="{{site.relative_url}}/images/principio-kiss.jpg" class='center'>


#### Cuidado al escalar

Si bien la escalabilidad es algo importante en una gran cantidad de sistemas, y tambien es algo que queremos eventualmente cuando crece nuestro sistema en medida de usuarios o de requerimientos. Pero escalar no es algo gratis, es decir, que generalmente nos puede agregar una complejidad al sistema que no teniamos planeado

<cite cite="Paul Graham">Do things that don’t scale.</cite>

Por eso, siempre es bueno como primera iteracionn de cualquier arquitectura, la que sea mas simple y que soporte la carga de usuarios y recursos que deberiamos soportar a ciencia cierta...

> Pero y si no no sabemos cual será la carga, quizás porque es una aplicación que estamos lanzando por primera vez al mercado?

Bueno, tal vez a muchos les haga algo de ruido que respondamos a que sea lo mas simple posible, en este caso una aplicación monolitica implementada con las tecnologías que mas rápido les permitan satisfacer sus requerimientos funcionales. Sea Rails o Django, tal vez como primera iteracion da lo misimo. 

<img src="{{site.relative_url}}/images/monolito.jpg" class='center'>

Tengan en cuenta que tambien la decision de la tecnologia depende de que equipo de desarrollo tengan, que experiencia tienen el equipo de desarrollo con el que trabajan y si la tecnología les permite desarrollar sin problemas y que tengan las librerias necesarias para cumplir con los requerimientos funcionales.

> Pero.... ¿No soporta miles de transacciones por minuto, no es tolerante a fallos, no puede crecer automáticamente, no puede ser distribuida geográficamente?

No se preocupen, tal vez en una primera iteracion no lo necesiten. Además si estan lanzando una aplicacion por primera vez al mercado, tal vez quieran empezar con algo chico y ver si la idea mas alla de todo les resulta. Tambien tengan en cuenta que si queremos además de resolver un problema, que la aplicacion sea toletante a fallos, pueda ser distribuida geográficamente y que pueda crecer automaticamente, tal vez tome mucho mas tiempo, porque no solo es el desarrollo para cumplir con los requerimientos funcionales del trabajo y estos otros requisitos, sino tambien el de hacer pruebas y que todo funcione. Con lo cual esto puede tomar mucho mas tiempo del necesario, para una primera iteracion. 

Puede suceder que aun asi tienen el presupuesto, el tiempo para cumplir con todo esto; puede suceder el peor de los casos, que es que su aplicacion una vez que esta en el mercado, no lo utilice mucha gente y con lo cual la arquitectura haya quedado sobrediseñada. Esto es un puntapié para dar paso a la proxima sección.

### YAGNI: You aren't gonna need it

Recién cuando estas necesidades surjan, allí podremos construir en base a requerimientos concretos, medibles. Quizás eso signifique distribuir componentes, introducir redundancias, reescribir parte del código, cambiar la forma en que se despliegan las aplicaciones. Lo mismo vale para otras cualidades duras como la tolerancia a fallos, la carga, la seguridad, etc. Son todas cuestiones que deberemos atacar ante demanda y no tratar de sobrediseñar o pensar muy a largo plazo.

Según este enfoque, las buenas arquitecturas no se anticipan, no se planifican. Mas bien, emergen: son la consecuencia de decisiones justificadas en los momentos indicados. Y eso nos lleva a una última idea: las buenas arquitecturas son mínimas.

<cite cite="Dieter Rams">Good design is as little design as possible.</cite>

Esto es un poco que no hay elementos o componentes innecesarios y si apenas percibimos las restricciones que la arquitectura nos propone, entonces el programar dentro de esa arquitectura se vuelve natural y simple, sin preocuparse mas que en los requerimientos o fallas de un sistema.

Entonces, no siempre empezar con microservicios es la mejor alternativa y no solo por el hype deberiamos adoptar una arquitectura o una tecnologia porque esta de moda o porque si... 

> Moraleja: desconfiá de todo aquel arquitecto que, tras brindarle una somera descripción del problema, te proponga una compleja aplicación distribuida en 12 Capas, 3 lenguajes (Go, Scala, JS, porque están de moda) , un Redis, un Oracle, un Memcached, 4 microservicios, 3 tareas batch, 3 niveles de replicación, un despliegue con Puppet, 10 servidores, un BPM y una lata de duraznos (para asegurar la buena digestión). O cualquier combinación que seguro ya te contaron.

![]({{site.relative_url}}/images/homero-movil.jpg)

Tengan en cuenta que si deciden optar por empezar con una arquitectura mas compleja, de ver los costos y los tiempos que eso conlleva, necesitaran mas tiempo y mas recursos necesariamente, que se traduce en que haya un mayor presupuesto, y si bien llegar a una arquitectura mas compleja puede parecer una buena idea para el futuro. Esta el problema de que tal vez nunca tengan los usuarios o la carga para aprovechar todas las ventajas de su arquitectura propuesta, y ademas, al introducir mayor cantidad de componentes que seguro tiene una arquitectura mas compleja, esto introduce otros problemas que sean de mantenimiento o de errores, con lo cual pued ser incluso contraproducente si despues no pueden solucionar estos en un tiempo que no les afecte al negocio o la idea que propone su sistema.

![]({{site.relative_url}}/images/auto_homero.png)

La idea es que su arquitectura no se interponga o complejize el desarrollo de su sistema sea de fallos o nuevos requerimientos, y que ayude a solucionar problemas que son los que estan mas alla de los requerimientos que tiene que resolver un problema, como la carga de usuarios, informacion, distribucion geografica, etc.
