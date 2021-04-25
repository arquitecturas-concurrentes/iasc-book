---
layout: default
title: "Introducción"
description: "¿De qué se trata Arquitecturas Concurrentes?"
---


La materia tiene un objetivo doble: por un lado, conocer tecnologías novedosas de aplicación en la industria de desarrollo de software, y por otro lado, transmitir conocimiento durables, ideas que trasciendan la tecnología, sobre la concurrencia, y la arquitectura de software.

## ¿Arquitecturas Concurrentes? ¿Qué es eso?

Hace varios años empezamos a armar la materia de Arquitecturas Concurrentes. La razón por la cual empezó esta materia surgía un poco de nuestra frustración de la poca rigurosidad técnica que encontramos en el día a día en nuestros trabajos frente a problemas de arquitecturas, a veces sobrediseñados, a veces bien ideados aunque muy mal bajados en la implementación, o en base a lo que está de moda, sin un sólido fundamento. Por otro lado surge de que la concurrencia nos tiene de hijo: no importa cuanto nos esforcemos, los malignos hilos de ejecución lograrán destruir nuestro programa en modos insospechados. El cuidado parece ser siempre insuficiente: de alguna forma irreproducibles bugs de sincronización nos harían morder el suelo.

¿Cuál fue la primera impresión una vez que armamos los contenidos iniciales? Que el diablo está en los detalles: muchas ideas de arquitectura y manejo de concurrencia intuitivamente "suenan bien". Pero recién cuando las bajamos a detalle vemos realmente sus consecuencias.

Entonces la materia se trata de dos cosas principales, por un lado dar un estudio bien práctico sobre el manejo de la concurrencia, con distintas herramientas. Y por el otro el de dar nociones de arquitecturas distribuidas.

A lo largo de la historia de la materia, la idea fue siempre la de adaptar los contenidos con materiales lo más actualizado posible, y la idea es siempre ir cambiando nuestros temas a lo que consideramos que es abarcar las dos ideas principales antes mencionadas con algunas de las técnologias más actuales.

## Sobre la Arquitectura
Primero, algunas palabras sobre la arquitectura de software. He aquí algunas interpretaciones comunes y complementarias del término:

- Es el diseño lógico de alto nivel: diseñar ya no en términos de componentes como objetos, procedimientos o funciones, sino en términos de módulos, nodos de red, etc.
- Es el diseño de aquellos aspectos que software que son difíciles de cambiar: tecnologías de base, lenguajes, etc.
- Es el diseño físico: la selección de los componentes de hardware y el despliegue del software sobre estos componentes.
  
En general no encontramos muchas desavenencias en torno a esta ideas. Los problemas surgen cuando pensamos en cómo hacer arquitectura.

### Haciendo arquitectura

Para nosotros la construcción de una arquitectura es un proceso:

- **Iterativo**: si bien la arquitectura trata de lidiar con aquellas cosas que son difíciles de cambiar, aún así hay lugar para iterar. Por ejemplo: probablemente cambiar el lenguaje cada 3 iteraciones no sea una opción viable; sin embargo sí lo es empezar con un almacenamiento en archivos o una base embebida SQLite, luego pasar a un motor relacional, luego extraer una parte a una base de datos Mongo, y luego implementar sharding.
constructivo: la arquitectura incluye la construcción. Si bien comunicar la arquitectura es una tarea real, la definición de una arquitectura no se limita a generar diagramas de despliegue y listados de tecnologías: hay que meter las manos en el barro. Medir, desplegar, programar, probar, son tareas imprescindibles. Además casi es imposible realizar el diseño de una arquitectura con una metodología en cascada, donde deberíamos ya plantear la arquitectura definitiva en una sola iteración. Veremos más adelante que siempre requieren de cambios
- **verificable**: si la arquitectura no se puede validar de forma rápida, entonces el proceso está fallando. De la misma forma que no deberíamos programar todo el sistema antes de hacer las pruebas, o todas las pruebas antes de poner nuestra primera línea de código productivo, o encarar refactors que duren días, tampoco deberíamos embarcarnos en implementar arquitecturas de las que no podamos tener ningún feedback hasta dentro de varios meses.
- **holístico**: en el desarrollo de una arquitectura los aspectos humanos suelen tener mucho más peso que los técnicos o tecnológicos. Así, cuestiones económicas o financieras (debemos reducir el gasto mensual en servidores en X%), políticas (vamos a usar el contenedor de aplicaciones X porque nuestra empresa tiene un convenio con quien lo comercializa), interpersonales (el gerente de sistemas de nuestro sector está peleado con el área de base de datos, por lo que utilizaremos almacenamiento en la nube), entre otras, son aspectos que impactan en el desarrollo. Debemos construir teniendo en cuenta estas cuestiones, que a veces pueden jugarnos en contra, y otras, a favor nuestro.
- **potenciado por la tecnología**: el conocimiento de la tecnología existente nos ayudará a ahorrarnos el esfuerzo de pensar e implementar ideas ya probadas. Sin embargo, las decisiones arquitectónicas no deberán estar guiadas por la tecnología. No se trata de ir al supermercado, dirigirnos a la góndola de tecnologías, comprar una marca particular de una base de datos, un ESB y soporte comercial. Se trata de entender la problemática, pensar soluciones, y utilizar algún producto si realmente calza con lo que necesitamos. Cuando alguien se presente como Arquitecto Java/.Net/Node/LoQueSea, salí corriendo.
- **enriquecido por la historia**: de forma similar al punto anterior, hay valor en conocer las soluciones que otros sistemas aplicaron, pero eso no significa que debamos hacer algo sólo porque otro lo hizo. Debemos siempre entender y estudiar las particularidades de nuestro problema, y no ser naïve pensando que simplemente podemos copiar el éxito de otro ignorando el proceso de meses o años que lo llevó a donde está. Si Facebook hizo X, capaz tu solución no necesite X… ¡porque no sos Facebook! Un punto a tener en cuenta es siempre el de no sobrediseñar nuestra arquitectura

### Cualidades Arquitectonicas

¿Y qué consideramos una buena arquitectura? Cuando podemos desarrollar sin problemas ni complejidades, es decir, libre de duplicaciones y que minimicen la redundancia y el código que solo es burocracia (en la medida de lo posible), llamado también boilerplate, que tengamos buenas abstracciones, que sea fácil de mantener y de probar. Y además, como la característica más importante, que sea **simple**.

#### La madre de todas las cualidades

Podemos decir que la simplicidad es la madre de todas las cualidades, porque queremos solamente que nuestro sistema deba tener la complejidad mínima necesaria para solucionar una problemática.

<cite cite="AI">Everything Should Be Made as Simple as Possible, But Not Simpler</cite>

Cuando la simpleza nos permite desarrollar y mantener un sistema sin mayores problemas, sin perder sus abstracciones esenciales ni duplicando código, vamos a poder desarrollar un sistema de manera rápida y el resto de las cualidades serán más fácil de lograr

<img src="{{site.relative_url}}/images/principio-kiss.jpg" class='center'>

#### Cuidado al escalar

Si bien la escalabilidad es algo importante en una gran cantidad de sistemas, y también es algo que queremos eventualmente cuando crece nuestro sistema en medida de usuarios o de requerimientos. Pero escalar no es algo gratis, es decir, que generalmente nos puede agregar una complejidad al sistema que no teníamos planeado

<cite cite="Paul Graham">Do things that don’t scale.</cite>

Por eso, siempre es bueno como primera iteración de cualquier arquitectura, la que sea más simple y que soporte la carga de usuarios y recursos que deberíamos soportar a ciencia cierta...

> Pero y si no no sabemos cual será la carga, quizás porque es una aplicación que estamos lanzando por primera vez al mercado?

Bueno, tal vez a muchos les haga algo de ruido que respondamos a que sea lo más simple posible, en este caso una aplicación monolítica implementada con las tecnologías que más rápido les permitan satisfacer sus requerimientos funcionales. Sea Rails o Django, tal vez como primera iteración da lo mismo. 

<img src="{{site.relative_url}}/images/monolito.jpg" class='center'>

Tengan en cuenta que también la decision de la tecnología depende de que equipo de desarrollo tengan, que experiencia tienen el equipo de desarrollo con el que trabajan y si la tecnología les permite desarrollar sin problemas y que tengan las librerías necesarias para cumplir con los requerimientos funcionales.

> Pero.... ¿No soporta miles de transacciones por minuto, no es tolerante a fallos, no puede crecer automáticamente, no puede ser distribuida geográficamente?

No se preocupen, probablemente en una primera iteración no lo necesiten. Además, si están lanzando una aplicación por primera vez al mercado, tal vez quieran empezar con algo chico y ver si la idea más alla de todo les resulta. También tengan en cuenta que si queremos además de resolver un problema, que la aplicación sea tolerante a fallos, pueda ser distribuida geográficamente y que pueda crecer automáticamente, tal vez tome mucho más tiempo, porque no solo es el desarrollo para cumplir con los requerimientos funcionales del trabajo y estos otros requisitos, sino también el de hacer pruebas y que todo funcione. Con lo cual esto puede tomar mucho más tiempo del necesario, para una primera iteración. 

Puede suceder que aun asi tienen el presupuesto, el tiempo para cumplir con todo esto; puede suceder el peor de los casos, que es que su aplicación una vez que está en el mercado, no lo utilice mucha gente y con lo cual la arquitectura haya quedado sobrediseñada. Esto es un puntapié para dar paso a la próxima sección.

### YAGNI: You aren't gonna need it

Recién cuando estas necesidades surjan, allí podremos construir en base a requerimientos concretos, medibles. Quizás eso signifique distribuir componentes, introducir redundancias, reescribir parte del código, cambiar la forma en que se despliegan las aplicaciones. Lo mismo vale para otras cualidades duras como la tolerancia a fallos, la carga, la seguridad, etc. Son todas cuestiones que deberemos atacar ante demanda y no tratar de sobrediseñar o pensar muy a largo plazo.

Según este enfoque, las buenas arquitecturas no se anticipan, no se planifican. Mas bien, emergen: son la consecuencia de decisiones justificadas en los momentos indicados. Y eso nos lleva a una última idea: las buenas arquitecturas son mínimas.

<cite cite="Dieter Rams">Good design is as little design as possible.</cite>

Esto es un poco que no hay elementos o componentes innecesarios y si apenas percibimos las restricciones que la arquitectura nos propone, entonces el programar dentro de esa arquitectura se vuelve natural y simple, sin preocuparse más que en los requerimientos o fallas de un sistema.

Entonces, no siempre empezar con microservicios es la mejor alternativa y no solo por el hype deberíamos adoptar una arquitectura o una tecnología porque esta de moda o porque sí... 

> Moraleja: desconfiá de todo aquel arquitecto que, tras brindarle una somera descripción del problema, te proponga una compleja aplicación distribuida en 12 Capas, 3 lenguajes (Go, Scala, JS, porque están de moda) , un Redis, un Oracle, un Memcached, 4 microservicios, 3 tareas batch, 3 niveles de replicación, un despliegue con Puppet, 10 servidores, un BPM y una lata de duraznos (para asegurar la buena digestión). O cualquier combinación que seguro ya te contaron.

<img src="{{site.relative_url}}/images/homero-movil.jpg" class='center'>

Tengan en cuenta que si deciden optar por empezar con una arquitectura más compleja, de ver los costos y los tiempos que eso conlleva, necesitaran más tiempo y más recursos necesariamente, que se traduce en que haya un mayor presupuesto, y si bien llegar a una arquitectura más compleja puede parecer una buena idea para el futuro. Está el problema de que tal vez nunca tengan los usuarios o la carga para aprovechar todas las ventajas de su arquitectura propuesta, y además, al introducir mayor cantidad de componentes que seguro tiene una arquitectura más compleja, esto introduce otros problemas que sean de mantenimiento o de errores, con lo cual puede ser incluso contraproducente si después no pueden solucionar estos en un tiempo que no les afecte al negocio o la idea que propone su sistema.

<img src="{{site.relative_url}}/images/auto_homero.png" class='center iasc-images'>

La idea es que su arquitectura no se interponga o complejice el desarrollo de su sistema sea de fallos o nuevos requerimientos, y que ayude a solucionar problemas que son los que están más alla de los requerimientos que tiene que resolver un problema, como la carga de usuarios, información, distribución geográfica, etc.