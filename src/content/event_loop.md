## Introducción


El **event loop** es la forma que usa Node.js para **organizar el procesamiento del código**.

Para poder profundizar en el event loop debemos entender de forma high level qué es la V8 y qué relación tiene con Node.

V8, de forma muy básica, podemos definirlo como uno de los motores de JavaScript que interpreta y ejecuta código Js. Todos los browser contienen un motor Js: V8 es el creado por Google (Firefox usa el propio llamado SpiderMonkey).

V8 de alguna forma permitía una interpretación mucho más rápida de JavaScript de los navegadores, esto gracias a la combinación del uso del intérprete y el compilador.

Ryah Dahll, como explica en la presentación de [JsConf](https://www.youtube.com/watch?v=ztspvPYybIY&t=1s), consigue crear servidores web para las necesidades actuales haciendo que la V8 funcione por fuera del navegador, es decir, en el sistema operativo.

Motor V8 de JavaScript:
- Posee dos componentes principales:
  - Heap: Aloca variables, funciones y estructuras.
  - Call Stack: Permite el anidamiento de llamadas.
- Existe un bucle de ejecución

<img src="~@/images/eventloop/v8.png"  class='center iasc-image'>


El bucle que anteriormente nombramos es el EVENT LOOP y es quien nos permite manejar la concurrencia de eventos. ¿Qué es un evento? Pequeñas funcionalidades/funciones que vamos a ejecutar a lo largo del tiempo.

**Tiene un modelo de concurrencia orientado a EVENTOS.**


### ¿Qué es Node?

<cite cite="Node.js Documentation">As an asynchronous event-driven JavaScript runtime, Node.js is designed to build scalable network applications</cite>

Ejemplo en Node de un contador:

```JavaScript
var a = 0;

for (let i = 0; i < 10000; i++) {
    setImmediate(() => a +=1);
}
console.log(a);
```

**¿Qué hace el código?**
En una primera instancia podemos pensar que en `a` se incrementa uno a uno y luego imprimimos la variable con 10000.

¿Qué pensamos que hace el `setImmediate`? ¿Lo ejecuta inmediatamente?

El `immediate` lo que hace es generar un evento, es decir, se generan eventos que se van ejecutando en el bucle de event loop.

Si lo ejecutamos, vamos a notar que imprime 0.

**¿Qué pasó?**

Los eventos, a diferencia de las `corutinas`, se planifican automáticamente, tenemos como ventaja el poder delegar esos detalles, ya que el modelo está más implícito.

**Cada evento es un contexto de ejecución distinto.** Nuestra pregunta puede ser ¿cuándo se produce un cambio de contexto?

En el ejemplo del contador, podemos decir que encolamos 10000 veces ese evento y nos da la sensación que estas son llamadas _sincrónicas_, pero realmente esto no pasa. Por atrás tenemos un elemento que nos permite de alguna forma multiplexar, hacer que el IO que es sincrónico no lo sea.

Las interrupciones una vez que llegan, se ejecutan inmediatamente.

### Primer acercamiento al evento loop - High level

Podemos pensar que el event loop es un bucle simple en donde los eventos se van ejecutando hasta que en un momento termina.

<img src="~@/images/eventloop/basic-event-loop.png" class='center iasc-image'>


¿Qué pasa si a nuestro anterior ejemplo agrego un `console.log` dentro de otro `setImmediate()`?

```JavaScript
var a = 0;

for (let i = 0; i < 10000; i++) {
    setImmediate(() => a +=1);
}
setImmediate(console.log(a));
```
Alternativas:
- Log con 10000
- Log con 0
- Resultados no determinísticos.

**Realidad**: Si lo ejecuto me termina dando 10000, aparentemente se encolan y se van ejecutando en el orden correcto. 

¿Por qué sucede esto?

El event loop es una especie de bucle que tiene varias etapas, y tienen algunas ya prefijadas

<img src="~@/images/eventloop/complete-event-loop.png" class='center iasc-image'>

Son pequeñas etapas, y por cada uno de estos ciclos va a procesar eventos de diferentes naturalezas. El orden de estos ciclos es determinístico.

A la cajita de Js, podemos interpretarlas como el código de Js principal de nuestra app.

Cambiando un poco el ejemplo

```JavaScript
var a = 0;

for (let i = 0; i < 10000; i++) {
    setImmediate(() => a +=1);
}
setTimeout(()=> {
    console.log('Dentro del timeout');
    console.log(a);
}, 3300);

console.log(a);
```
Si ejecuto este código me da 0.

Esto sucede ya que se lee todo el código, y el resto de los eventos se planifica después.

El bucle se ejecuta en un tiempo específico por lo cual se le asigna una cantidad determinada de tiempo a cada una de sus etapas, justamente porque estamos corriendo sobre solo un thread, en consecuencia solo lo podemos planificar en un solo procesador.

**¿Qué pasa si en alguna de esas cajitas de Js tenemos una ejecución CPU Intensive?**

El sistema operativo ve a Node como un solo thread. Tanto lo CPU intensive como elementos sincronicos pueden hacer que todas las fases se demoren y bloqueen. Este thread tiene una política de no desalojo de la ejecución si la misma es de código Js, por más que se asignen pequeñas porciones de tiempo a cada etapa del event loop si tenemos elemento que bloquean la CPU, no nos permite que el schedule pueda correr y dar paso a la nueva etapa.

<cite cite="What is the event loop">The event loop is what allows Node.js to perform non-blocking I/O operations — despite the fact that JavaScript is single-threaded — by offloading operations to the system kernel whenever possible</cite>

### Componentes de nuestro sistema Node.js

<img src="~@/images/eventloop/Node-system.png" class='center iasc-image'>

Podemos observar que tiene una queue de eventos general que el event loop va a ir tratando.

[libuv](https://github.com/libuv/libuv): Es una lib que nos permite wrappear las llamadas bloqueantes en no bloqueantes, esto puede lograrse a través de los llamados worker threads. Estos van a ejecutar estas llamadas y una vez que las terminen de tratar mediante el callback vuelven evento entrando el event queue.
Esta lib va a tratar todas las operaciones bloqueantes como pueden ser escuchar un puerto, leer archivos, entre otras operaciones.

<img src="~@/images/eventloop/complete-event-loop.png" class='center iasc-image'>

¿Cómo serian los pasos de nuestro event loop?

- Escaneo de nuestro código principal (index.js)
  - Ejecuta todas las operaciones que se puedan ejecutar inmediatamente.
  - Si en el index detecta eventos (continuaciones, operaciones asincrónicas u operaciones IO) los atiende después, es decir, los encola.
- Terminada la lectura del index, comienza a ciclar por una secuencia bien definida. Atiende timeouts, IO, de red, immediate y eventos de cierre de recursos.
  - En esta etapa existen microqueues (Js) donde se fija si existen eventos encolados que están listos para ser procesados, y los ejecuta. (**1)
- Si no tiene más nada que ejecutar, termina el ciclo y la ejecución, caso contrario, arranca nuevamente el ciclo.
  
(**1) Es una cola de tareas que los worker threads van tomando desde ese punto y cuando está listo ese procesamiento vuelve a encolar en la cola de eventos del event loop.

**IMPORTANTE**: No debemos bloquear el event loop

Si tengo operaciones CPU intensive debemos considerar:
- _Partitioning_.
- _Offloading_.
- Uso de funciones de worker threads.


Lo que en nuestro gráfico simplificado nombramos como _función unicornio_ (este es un nombre inventado por nosotros, no existe tal nomenclatura) permite aprovechar funciones del sistema operativo, es una especie de listener el cual cuando se termina de procesar un elemento o existen nuevos eventos, dicha función puede ser de nexo e informar cuando suceden estas cosas. (libuv y SO).

## Resumen de event loop

- Forma de organizar el procesamiento del código en Node.js.
- Se basa en procesamiento concurrente de código Js con un solo thread, con no-desalojo para código Js.
- Tiene tres pasos
  - Escanea el index, donde ejecuta todo el código que se pueda ejecutar inmediatamente, encolando continuations, IO, etc.
  - Terminado el escaneo, itera en la siguiente secuencia, teniendo microqueues donde revisa si existen eventos preparados para ser ejecutados, y los ejecuta.
    - Atiende operaciones asincrónicas, timeouts
    - IO y redes
    - immediate
    - eventos de cierra de recursos
  - Si no tiene más que ejecutar, cierra la ejecución, caso contrario, vuelve a retomar el ciclo.
- Tiene 1 hilo, pero n workers que se encargan de ejecutar las tareas pesadas.

### Referencias
- [Morning Keynote- Everything You Need to Know About Node.js Event Loop - Bert Belder, IBM](https://www.youtube.com/watch?v=PNa9OMajw9w)
- [Ryan Dahl: Original Node.js presentation - JsConf](https://www.youtube.com/watch?v=ztspvPYybIY&t=1s)
- [Introduction to libuv: What's a Unicorn Velociraptor? - Colin Ihrig, Joyent](https://www.youtube.com/watch?v=_c51fcXRLGw)
- [Don't Block the Event Loop (or the Worker Pool)](https://NodeJs.org/en/docs/guides/dont-block-the-event-loop/)
- [Introduction to Node.js](https://NodeJs.dev/learn)
- [What is the event loop](https://NodeJs.org/en/docs/guides/event-loop-timers-and-nexttick/#what-is-the-event-loop)

 








