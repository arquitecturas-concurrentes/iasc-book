---
layout: default
title: "Contenedores"
description: "Contenedores con Docker"
---

# Containers y Docker

Los contenedores, junto con la tecnología de contenedorización como Docker y Kubernetes , se han convertido en componentes cada vez más comunes en los kits de herramientas de muchos desarrolladores. El objetivo de los contenedores, en esencia, es ofrecer una mejor manera de crear, empaquetar e implementar software en diferentes entornos de una manera predecible y fácil de administrar.

## Que es un Contenedor???

Los contenedores son una tecnología de virtualización del sistema operativo que se utiliza para empaquetar aplicaciones y sus dependencias y ejecutarlas en entornos aislados. Proporcionan un método ligero de empaquetar e implementar aplicaciones de manera estandarizada en muchos tipos diferentes de infraestructura.

Estos objetivos hacen que los contenedores sean una opción atractiva tanto para desarrolladores como para sys ops. Los contenedores se ejecutan constantemente en cualquier host con capacidad de hostearlos, por lo que los desarrolladores pueden probar el mismo software localmente que luego implementarán en entornos de producción completos. El formato del contenedor también asegura que las dependencias de la aplicación se cuecen en la imagen misma, simplificando los procesos de entrega y liberación. Debido a que los hosts y las plataformas que ejecutan contenedores son genéricos, la gestión de la infraestructura para sistemas basados ​​en contenedores puede estandarizarse.

Los contenedores se crean a partir de imágenes: paquetes que representan el sistema, las aplicaciones y el entorno del contenedor. Las imágenes de contenedor actúan como plantillas para crear contenedores específicos, y la misma imagen se puede usar para generar cualquier cantidad de contenedores en ejecución.

Esto es similar a cómo funcionan las clases y las instancias en la programación orientada a objetos; Se puede usar una sola clase para crear cualquier número de instancias así como se puede usar una sola imagen de contenedor para crear cualquier número de contenedores. Esta analogía también es válida con respecto a la herencia, ya que las imágenes de contenedor pueden actuar como el padre de otras imágenes de contenedor más personalizadas. Los usuarios pueden descargar contenedores preconstruidos de fuentes externas o crear sus propias imágenes personalizadas según sus necesidades.

## Introduccion a Docker

<img src="{{site.relative_url}}/images/contenedores/docker.png" class='center'>

Si bien los contenedores de Linux son una tecnología algo genérica que se puede implementar y administrar de diferentes maneras, Docker es, con mucho, la forma más común de ejecutar contenedores de construcción y ejecución. Docker es un conjunto de herramientas que permiten a los usuarios crear imágenes de contenedores, insertar o extraer imágenes de registros externos, y ejecutar y administrar contenedores en muchos entornos diferentes. El aumento en la popularidad de los contenedores en Linux se puede atribuir directamente a los esfuerzos de Docker después de su lanzamiento en 2013.

En docker podemos ejecutar y administrar contenedores, actuando como administrador de procesos para cargas de trabajo de contenedores. Se puede crear nuevas imágenes de contenedor leyendo y ejecutando comandos desde el Dockerfile tomando snapshots de contenedores que ya se están ejecutando. El comando también puede interactuar con Docker Hub, que es un registro de imágenes de contenedor, para desplegar nuevas imágenes de contenedor o subir imágenes locales para guardarlas o publicarlas.

Si bien Docker proporciona sólo una de las muchas implementaciones de contenedores en Linux, tiene la distinción de ser el punto de entrada más común en el mundo de los contenedores y la solución más comúnmente implementada. Si bien se han desarrollado estándares abiertos para contenedores para garantizar la interoperabilidad, la mayoría de las plataformas y herramientas relacionadas con contenedores tratan a Docker como su objetivo principal al probar y lanzar software. Docker puede no ser siempre la solución más eficiente para un entorno dado, pero es probable que sea una de las opciones mejor probadas.

En términos prácticos, si bien existen alternativas para los contenedores en Linux, generalmente tiene sentido aprender Docker primero debido a su ubicuidad y su influencia en la terminología, los estándares y las herramientas del ecosistema.


### Cómo funcionan los contenedores

Docker implementa una API de alto nivel para proporcionar contenedores livianos que ejecutan procesos de manera aislada. Construido sobre el kernel Linux, es decir, usa directamente las funciones que este proporciona, lo que lo hace mucho más liviano que una máquina virtual. utiliza el aislamiento de recursos (CPU, la memoria, el bloque E / S, red, etc.) y namespaces separados para aislar la vista de una aplicación del sistema operativo. Docker accede a la virtualización del kernel Linux ya sea directamente a través de la biblioteca libcontainer.

<img src="{{site.relative_url}}/images/contenedores/docker_intro.png" class='center iasc-image'>

*Libcontainer* es una abstracción, para soportar una gama más amplia de tecnologías de aislamiento.

*Libvirt* es una API de código abierto, demonio y herramienta de administración para administrar la virtualización de la plataforma.

*LXC (Linux Containers)* es una tecnología de virtualización en el nivel de SO. Permite que un servidor físico ejecute múltiples instancias de sistemas operativos aislados, conocidos como Servidores Privados Virtuales (VPS en inglés). LXC no provee de una máquina virtual, más bien provee un entorno virtual que tiene su propio espacio de procesos y redes.

*Systemd* es un conjunto de demonios o daemons de administración de sistema, bibliotecas y herramientas diseñados como una plataforma de administración y configuración central para interactuar con el núcleo del Sistema operativo GNU/Linux.

### Cómo funcionan internamente los contenedores en linux?

El kernel de linux posee algo llamado grupos de control de Linux , o cgroups , y que son una característica del núcleo que permite que los procesos y sus recursos se agrupen, aislen y administren como una unidad. cgroups permite agrupar procesos, determinar a qué recursos pueden acceder y proporcionar un mecanismo para administrar y monitorear su comportamiento. Siguen un sistema jerárquico que permite que los procesos secundarios heredan las condiciones de sus padres y potencialmente adopten más restricciones. Los cgroups proporcionan la funcionalidad necesaria para agrupar procesos como un grupo y limitar los recursos a los que pueden acceder.

La otra característica principal del núcleo en la que confían los contenedores son los espacios de nombres de Linux . Los espacios de nombres limitan lo que los procesos pueden ver del resto del sistema. Los procesos que se ejecutan dentro de los espacios de nombres no conocen nada que se ejecute fuera de su espacio de nombres. Debido a que los espacios de nombres definen un contexto distinto que está separado del resto del sistema, el árbol de procesos del espacio de nombres debe reflejar ese contexto. Dentro del espacio de nombres, el proceso principal se convierte en PID 1 (ID de proceso 1), el PID tradicionalmente reservado para el sistema init del sistema operativo. Este árbol de procesos virtuales muy manipulado construido dentro del espacio de nombres permite que los procesos que se ejecutan dentro de los contenedores se comporten como si estuvieran operando en un entorno normal y sin restricciones.

## Máquinas Virtuales vs Contenedores

Las máquinas virtuales , o VM, son una tecnología de virtualización de hardware que le permite virtualizar completamente el hardware y los recursos de una computadora. Un sistema operativo invitado (guest) separado administra la máquina virtual, completamente separada del sistema operativo que se ejecuta en el sistema host. En el sistema host, un software llamado hipervisor (hypervisor) es responsable de iniciar, detener y administrar las máquinas virtuales.

Debido a que las máquinas virtuales funcionan como computadoras completamente distintas que, en condiciones normales de funcionamiento, no pueden afectar el sistema host u otras máquinas virtuales, las máquinas virtuales ofrecen un gran aislamiento y seguridad. Sin embargo, tienen sus inconvenientes. Por ejemplo, la virtualización de una computadora completa requiere que las máquinas virtuales utilizan una cantidad significativa de recursos. Dado que la máquina virtual es operada por un sistema operativo invitado completo, el aprovisionamiento de la máquina virtual y los tiempos de arranque pueden ser bastante lentos. Del mismo modo, dado que la VM funciona como una máquina independiente, los administradores a menudo necesitan adoptar herramientas y procesos de administración similares a la infraestructura para actualizar y ejecutar los entornos individuales.

<img src="{{site.relative_url}}/images/contenedores/virtualizacion_diagrama.png" class='center'>

En general, las máquinas virtuales le permiten subdividir los recursos de una máquina en computadoras individuales más pequeñas, pero el resultado final no difiere significativamente de la administración de una flota de computadoras físicas. La membresía de la flota se expande y la responsabilidad de cada host puede centrarse más, pero las herramientas, estrategias y procesos que emplea y las capacidades de su sistema probablemente no cambiarán notablemente.

Los contenedores toman un enfoque diferente como vimos antes. En lugar de virtualizar toda la computadora, los contenedores virtualizan el sistema operativo directamente. Se ejecutan como procesos especializados administrados por el núcleo del sistema operativo host, pero con una visión restringida y muy manipulada de los procesos, recursos y entorno del sistema. 

<img src="{{site.relative_url}}/images/contenedores/contenedores_diagrama.png" class='center'>

Los contenedores no son conscientes de que existen en un sistema compartido y funcionan como si tuvieran el control total de la computadora.

### Ventajas de utilizar contenedores

- Aislamiento

Construido sobre las facilidades proporcionadas por el kernel Linux (principalmente cgroups y namespaces), un contenedor Docker, a diferencia de una máquina virtual, no requiere incluir un sistema operativo independiente.En su lugar, se basa en las funcionalidades del kernel y utiliza el aislamiento de recursos (CPU, la memoria, el bloque E / S, red, etc.) y namespaces separados para aislar la vista de una aplicación del sistema operativo. Docker accede a la virtualización del kernel Linux ya sea directamente a través de la biblioteca libcontainer o indirectamente a través de libvirt, LXC o systemd.

Mediante el uso de contenedores, los recursos pueden ser aislados, los servicios restringidos, y se otorga a los procesos la capacidad de tener una visión casi completamente privada del sistema operativo con su propio identificador de espacio de proceso, la estructura del sistema de archivos, y las interfaces de red.

- Virtualización Ligera

Es la principal diferencia con las máquinas virtuales, ya que estas virtualizan todo un sistema operativo con sus componentes, compartiendo recursos con el host. La filosofía de los contenedores es distinta, si bien tratan también de aislar a las aplicaciones y de generar un entorno replicable y estable para que funcionen, en lugar de albergar un sistema operativo completo lo que hacen es compartir los recursos del propio sistema operativo "host" sobre el que se ejecutan.

### Que pasa cuando quiero crear y utilizar/levantar múltiples contenedores (Intro a docker compose)

Docker compose es una herramienta para definir y ejecutar aplicaciones Docker de contenedores múltiples. Utiliza archivos YAML para configurar los servicios de la aplicación y realiza el proceso de creación y puesta en marcha de todos los contenedores con un solo comando. La utilidad cliente (CLI) docker-compose permite a los usuarios ejecutar comandos en varios contenedores a la vez, por ejemplo, crear imágenes, escalar contenedores, ejecutar contenedores que se detuvieron y más.

<img src="{{site.relative_url}}/images/contenedores/compose.png" class='center iasc-image'>

## Orquestación de contenedores con Swarm

Docker Swarm proporciona una funcionalidad de agrupación nativa para contenedores Docker, que convierte un grupo de “Docker Engines” en un único “Docker engine” virtual. Swarm está integrado con Docker Engine. El cliente de docker swarm permite a los usuarios ejecutar contenedores Swarm, crear tokens, enumerar nodos en el clúster y más. También permite a los usuarios ejecutar varios comandos para administrar nodos en manada (Swarm). Docker maneja el swarm usando el algoritmo Raft. Según Raft, para que se realice una actualización, la mayoría de los nodos de Swarm deben estar de acuerdo con la actualización.

<img src="{{site.relative_url}}/images/contenedores/swarm.png" class='center iasc-image'>