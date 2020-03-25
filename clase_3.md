---
layout: default
title: "Capitulo 3 - CPS"
description: "Introduccion a CPS"
---

# Introduccion

Empecemos de a poco y por algo muy simple: una función que incrementa en una unidad a su argumento, la función succesor.

> Nota: cuando decimos función lo decimos en el sentido estricto de una computación que toma un valor y devuelve otro, sin tener ningún tipo de efecto
En JavaScript, su código se ve como el siguiente:

```javascript
function succesor(x) {
  return x + 1;
}
```

Usar esta función no tiene mucho misterio:

```javascript
var i0 = 0;
var i1 = succesor(i0);
…etc…
```

La función succesor está escrita en lo que se conoce como estilo directo: los resultados de la misma (en este caso, su entrada más uno) se obtienen a partir de su retorno.

Hasta acá nada extraño. Hagamos ahora un salto conceptual: otra forma posible de escribir este código, es que el resultado se obtenga a partir de un callback.

```javascript
function succesor(x, callback) {
 callback(x + 1);
}
```

¿Y cómo la usamos?

```javascript
var i0 = 0;
succesor(i0, function(resultado) {
 var i1 = resultado;
 //...etc...
});
```

¡Momento! ¿Qué fue eso? Si bien puede verse un poco perturbador al principio, este código es totalmente equivalente al anterior: cuando se aplica la función succesor, calcula su siguiente, y se lo pasa al callback, que opera con el mismo normalmente.

> Si te estás preguntando hacia dónde vamos y qué tiene todo esto que ver con la concurrencia, ¡danos uno rato! Prometemos que pronto todo tendrá sentido.

A este callback se lo llama continuación. Porque… ¡es lo que que se ejecuta a continuación! O en inglés: continuation.
¿Qué significa esto? Que las funciones que toman continuaciones, no solo ahora saben lo que tienen que hacer, sino también cuándo se ejecutará lo que siga. Por eso decimos que una función escrita de este forma tiene, además de la lógica de negocio, control de flujo (o simplemente llamado control).

Peeeero, para que esto sea realmente posible, tenemos que tomar ciertas precauciones, y entender que al trabajar de esta forma, el resultado sólo se puede obtener dentro de la continuación.
Por tanto, el siguiente es un code smell:

```
var i0 = 0;
var i1;
succesor(i0, function(resultado) {
  i1 = resultado;
});
//..resto...
```

Aquí estamos capturando el resultado de successor a través de la continuación, asumiendo que el código se ejecutará inmediatamente y que estará disponible en la línea 6.

Pero si es realmente successor quien tiene control sobre cuándo y cómo se ejecuta la continuación, no podemos garantizar esto dado que no sabemos cuándo se va a ejecutar la continuación.

¿Esto significa que el código anterior no funciona? No, pero tenemos que entender que estamos rompiendo el modelo de continuación, al no permitir que sea la función successor la que determine cuándo y cómo seguir. Y eso puede ser una fuente de bugs.

### Consecuencias

En oposición al estilo directo, caracterizado por la obtención de resultados mediante retornos, surge así el estilo de paso de continuaciones (CPS, por sus siglas en inglés). Es decir, cuando tenemos una función que toma una continuación y efectivamente colocamos todo el código que opera con el resultado dentro de la misma, tenemos una función CPS.

El CPS es especial porque es fácil introducirlo, pero imposible salir de él, al menos no sin introducir bugs y potenciales problemas en el sistema.

Retomando las ideas de nuestro primer episodio, esto es una propiedad interesante: una vez impuesta la arquitectura, no tenemos opción de escapar de ella, lo que nos resta en flexibilidad, pero nos fuerza a ser consistentes.

Ejemplo: si ahora queremos implementar una función que incrementa el doble de un número, usando nuestro successor CPS, estaríamos tentados a escribir esto:

```javascript
function incrementarDoble(i) {
  var i0 = 2 * i;
  succesor(i0, function(resultado) {
   var i1 = resultado;
   ???
  });
}
```

Y ahí vemos el problema: incrementarDoble debe retornar i1, ¡pero no puede hacerlo, porque no hay garantías de cuando se va a ejecutar la continuación, ni cuantas veces!
Por ello, la única alternativa válida (sin basarse en los detalles de implementación de successor, claro), es convertir a incrementarDoble en CPS también:

```javascript
function incrementarDoble(i, cont) {
  var i0 = 2 * i;
  succesor(i0, cont);
}
```

Moraleja: una vez que introducimos CPS, su uso sólo puede extenderse.

> Esto no significa que no podamos tener computaciones no CPS. Por ejemplo, la multiplicación podría ser extraída como una función en estilo directo. Desarrollaremos esta idea arquitectural mejor en próximos episodios cuando ataquemos el mundo monádico.

### ¿Para qué CPS?

Resulta bastante evidente que razonar sobre CPS es más complejo que en el estilo directo. Entonces, ¿por qué habríamos de adoptarlo?

CPS, al otorgarle a la función no sólo capacidad de cómputo sino de control, permite hacer cosas muy poderosas. En los ejemplos anteriores no lo aprovechamos, porque la computación succesor puede ser modelada con una función con un sólo resultado posible:

```javascript

function succesor(x, cont) {
 cont(x + 1);
}
```

Pero sin embargo, podríamos haber aplicado a la función cont cero (1) o muchas veces (2), podríamos haber recibido múltiples continuaciones y ejecutar alguna de ellas (3), o podríamos haberlas ejecutado en otro momento (4). CPS nos permite, entones, implementar 4 tipos de computaciones: con falla, no determinísticas, con excepciones y asincrónicas.

> Recordar estos tipos de continuaciones, volverán en episodios futuros

### Falla

Con CPS podemos codificar computaciones que pueden no tener resultado (los matemáticos las llaman funciones parciales). Por ejemplo, la división es una función parcial que no tiene un resultado cuando su segundo argumento es cero, por lo que podemos definir una función inversa CPS de la siguiente forma:

```javascript
function inversa(x, cont) {
  if (x !== 0) {
    cont(1/x);
  }
}
```

Si ahora aplicamos a inversa con el valor 2, tendremos como resultado 0.5. Pero si la aplicamos con 0, no tendremos resultado. Esto no es lo mismo que no devolver nada en una función en estilo directo (o devolver null): en una función CPS que puede fallar, si no hay resultado, el programa continuación NO continúa; el flujo de ejecución se detiene.

### No determinismo.

Hay computaciones que pueden arrojar cero o más resultados, son la generalización de la función: la relación. Por ejemplo, la pregunta ¿quien es hijo de Vito Corleone? (notá el singular) tiene múltiples respuestas: Sonny, Michel, Connie, etc.
Esta es la base del paradigma lógico: relaciones que pueden generar ningún resultado, uno, o varios.

```javascript
function hijoDeVito(cont) {
  cont("sonny");
  cont("michel");
  cont("connie");
  cont("freddo");
}
```

Se observa fácilmente que logramos las múltiples respuestas mediante la aplicación reiterada de la continuación: el mismo programa está continuando múltiples veces con argumento diferentes.

### Excepciones

Todos conocemos las excepciones. Estas nos dan dos flujos de ejecución: uno de éxito y uno de fracaso, y en ambos hay resultados: el resultado normal del programa o el error en cuestión. Y esto lo podemos lograr pasando dos continaciones: la que contiene el flujo normal, y la que contiene el flujo de error.

### Computaciones asincrónicas.

¡Éstas son las que más nos interesan! Operaciones que quizás no se ejecuten inmediatamente, sino en un momento posterior. Más sobre esto, en breve.

### CPS, ¿y Callback Hell?

Un pequeño paréntesis: se suele achacar al uso de CPS la inevitable caída en el callback hell. Por ejemplo:

```javascript
var cuentaLoca = function(x, cont) { 
  siguiente(x, function(y){
    inversa(y, function(z){
      duplicar(z, cont);
    })
  })
};
```

Como se observa, algo tan simple en estilo directo como

```javascript
duplicar(inversa(siguiente(x))) 
```

se convierte en una compleja estructura de continuaciones anidadas.
¿Podríamos delegar esto de mejor forma? Si analizamos cómo queda expresada esta computación en estilo directo, podemos ver que duplicar la inversa del siguiente, a fin de cuentas, está describiendo una composición de funciones: al resultado de aplicar una función se le pasa a la entrada la otra.
Obviamente, no es la misma composición de funciones que conocemos en estilo directo: es una composición CPS. Y entender esto nos permite definir una función componer, que haga justamente esto, y utilizarla así:


```javascript
var cuentaLoca = componer(duplicar, componer(inversa, siguiente))
```

Y si le damos una vuelta de tuerca más, podemos observar que estamos ante la estructura de aplicación de un fold, y definir una función pipeline que componga todas las funciones cps:

```javascript
var cuentaLoca = pipeline([duplicar, inversa, siguiente]);
```

Y así vemos como eliminar el callback hell, aun con CPS, es posible.
Moraleja: no es culpa del CPS, es culpa nuestra al no delegar convenientemente.



### Conclusiones

- CPS nos da gran poder, pero es difícil de manejar adecuadamente
- CPS nos lleva, si no tenemos cuidado al callback hell. Sin embargo, no es inherente a CPS, sino que es consecuencia de una mala delegación. Es posible resolverlo si se delega apropiadamente y aplicando los conceptos de programación funcional de orden superior y creando combinadores apropiados
- CPS nos permite implementar computaciones asincrónicas. NodeJS emplea CPS para soportarlas.
- El uso de CPS en NodeJS: pésimo manejo de errores y ausencia de abstracciones para hacerlo mas tratable. Por eso es que la comunidad centró su atención en otra forma de estructurar programas con influencias funcionales: las promesas (promises).


## 2da Parte Node.js 

Una aplicación típica de Node.js es básicamente una colección de devoluciones de llamada que se ejecutan en respuesta a varios eventos: una conexión entrante, finalización de E / S, vencimiento del tiempo de espera, resolución de promesa, etc. Hay un solo hilo principal (también conocido como Event-Loop ) que ejecuta todas estas devoluciones de llamada y, por lo tanto, las devoluciones de llamada deben completarse rápidamente ya que todas las demás devoluciones de llamada pendientes están esperando su turno. Esta es una limitación conocida y desafiante de Node y también se explica muy bien en los documentos:
[https://nodejs.org/en/docs/guides/dont-block-the-event-loop/](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)


Let’s add a new endpoint /compute-async where we’ll partition the long blocking loop by yielding the control back to the event-loop after every computation step (too much context switching? maybe… we can optimize later and yield only once every X iterations, but let’s start simple):

Event-Loop Phases
When something similar happened to me, I turned to Google for answers. Looking for stuff like “node async block event loop” one of the first results is this official Node.js guide: https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/. It really opened my eyes.

It explains that the event-loop is not the magic scheduler I imaged it to be, but a pretty straight-forward loop with several phases in it. Here is a nice ASCII diagram of the main phases, copied from the guide:


(later I’ve found that this loop is nicely implemented in libuv with functions named as in the diagram: https://github.com/libuv/libuv/blob/v1.22.0/src/unix/core.c#L359)

The guide explains about the different phases, and gives the following overview:

* timers: this phase executes callbacks scheduled by setTimeout() and setInterval().
* pending callbacks: executes I/O callbacks deferred to the next loop iteration.
* idle, prepare: only used internally.
* poll: retrieve new I/O events; execute I/O related callbacks.
* check: setImmediate() callbacks are invoked here.
* close callbacks: some close callbacks, e.g. socket.on('close', ...).

> “generally, when the event loop enters a given phase, it will perform any operations specific to that phase, then execute callbacks in that phase’s queue until the queue has been exhausted … Since any of these operations may schedule more operations …”.


This (vaguely) suggests that when a callback enqueues another callback that can be handled in the same phase, then it will be handled before moving to the next phase.

Only in the poll phase Node.js checks the network socket for new requests. So does that mean that what we did in /compute-async actually prevented the event-loop from leaving a certain phase, and thus never looping through the poll phase to even receive the /healthcheck request?

We’ll need to dig more to get better answers, but it is definitely clear now why setTimeout() helped: Every time we enqueue a timer callback, and the queue of the current phase has been exhausted, the event-loop has to loop through all the phases to reach the “Timers” phase, passing through the poll phase on the way, and handling the pending network requests.


<img src="{{site.relative_url}}/images/event-loop-circle.png">
