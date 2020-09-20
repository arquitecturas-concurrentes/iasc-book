---
layout: default
title: "Promises"
description: "Modelando computaciones asincrónicas"
---

En [capítulos anteriores](https://arquitecturas-concurrentes.github.io/iasc-book/cps/) vimos una posible forma de estructurar nuestros programas, utilizando CPS. Esta técnica, a diferencia de call-and-return y memoria compartida, nos permite implementar, de forma fácil:
- computaciones con un único resultado
- computaciones que pueden fallar
- computaciones no determinísticas
- excepciones
- asincronismo

Bueno, quizás no tan fácilmente. Vimos que si no tenemos cuidado y no delegamos _apropiadamente_, es muy posible que caigamos en el callback-hell: continuaciones anidadas dentro de continuaciones. Para ser justos, esto no es un problema de CPS propiamente dicho sino de la subutilización de una de las herramientas más poderosas del paradigma funcional: el orden superior.

De todas formas, lo admitimos, para el programador inexperto en estos territorios, razonar sobre abstracciones que combinan funciones, como _compose_’s o _pipeline_’s no es simple: las funciones no son valores obvios.

A su vez, la secuenciación de continuaciones es un problema aún mayor cuando estamos trabajando con operaciones que pueden fallar, ya que la cantidad de flujos de ejecución posibles aumenta, haciendo que sea muy fácil perder algún potencial error.

Pero si **secuenciar** operaciones no es trivial, trabajar con operaciones **concurrentes** es todavía más difícil. Por ejemplo, si tenemos un cliente HTTP que usa continuaciones, y queremos agrupar en una lista las respuestas de varios requests, no nos queda otra opción que alejarnos del enfoque más _purista_ de CPS e introducir estado mutable que va a ser modificado por las distintas continuaciones:
```javascript
const pokemonIniciales = [];
const pokemonObtenido = () => {
 if(pokemonIniciales.length < 3) {
  return;
 }
 elegirInicial(pokemonIniciales);
};
request('https://pokeapi.co/api/v2/pokemon/1', (response) => {
 pokemonIniciales.push(response.body());
 pokemonObtenido();
});
request('https://pokeapi.co/api/v2/pokemon/4', (response) => {
 pokemonIniciales.push(response.body());
 pokemonObtenido();
});
request('https://pokeapi.co/api/v2/pokemon/7', (response) => {
 pokemonIniciales.push(response.body());
 pokemonObtenido();
});
```  

Motivada por estas problemáticas surge otra forma de estructurar programas concurrentes: las promesas (_futures_ o _promises_, en inglés). Se trata de una técnica que de nueva no tiene nada (data de fines de los ‘70), pero que se ha popularizado y gracias a implementaciones en lenguajes como Scala o JavaScript.

Veamos qué tienen para ofrecernos.

## Reificando los resultados de nuestras operaciones

Para empezar, volvamos a nuestro clásico ejemplo: la función `successor`, en su variante CPS:

```javascript
function successor(x, callback) {
 callback(x + 1);
}
```

Que podemos usar de la siguiente forma:
```javascript
successor(4, (resultado) => console.log(resultado));
```

Para pasar de nuestro mundo de continuaciones al de _promesas_, vamos a hacer lo siguente:

```javascript
function successor(x) {
 return new Promise((resolve) => {
  resolve(x+1);
 });
}
```

¿Qué cambió? Ahora nuestra función `successor` retorna un valor, pero éste no es el valor del resultado que buscamos, sino que tenemos que interactuar con una `Promise` para obtenerlo.

La forma de hacerlo va a ser a través de uno de los mensajes que entienden las promesas: `then`, que nos permite encadenar operaciones que se van a llevar a cabo una vez que el resultado de la promesa esté disponible.

```javascript
successor(4).then((resultado) => console.log(resultado));
```

> "Una vez que el resultado de la promesa esté disponible" dijiste?

Claro, porque las promesas se usan en general para representar el resultado de operaciones asincrónicas:
```javascript
promesaConTimeout = new Promise((resolve) => {
 setTimeout(() => resolve("Vengo del pasado"), 5_000);
});
promesaConTimeout.then((mensaje) => console.log(mensaje));
```

Si inspeccionamos esa promesa en el momento en que la creamos, vamos a ver que se encuentra en estado **pendiente**, ya que todavía no se ha completado. Sin embargo, si esperamos 5 segundos, veremos el mensaje en la consola, y al inspeccionar la promesa veremos que se encuentra **resuelta**.

Vemos entonces que las promesas son objetos con estado, y que éste puede variar con el tiempo, pasando de estar pendiente a resuelta.

## Manejando los errores

Las promesas nos permiten no solo representar resultados exitosos, sino también casos de error:
```javascript
function inverse(x) {
 return new Promise ((resolve, reject) => {
  if (x === 0) {
   reject("No existe la inversa de 0")
  } else {
   resolve(1 / x);
  }
 });
}
```

Si invocamos esta función con `0` como parámetro, vemos que la promesa resultante está **rechazada**, y que tiene valor de error.

Esto nos permite manejar _excepciones_, usando otro mensaje que entienden las promesas, `catch`:
```javascript
function printInverse(x) {
  inverse(x).then(result => console.log(result))
    .catch(error => console.error(error));
}
```

Algo destacable del manejo de excepciones, es que las excepciones "cascadean" hasta el primer `catch` que puede manejarlas. Esto constituye una diferencia respecto a CPS, donde siempre tenemos que pasar los callback de error explícitamente.

Otra diferencia entre CPS y promesas que podemos observar es que las promesas siempre se resuelven o se rechazan. No nos permiten no tener un resultado (_fallar_), ni tampoco tener múltiples resultados (_no determinismo_).

## Encadenando promesas

Como ya vimos, podemos usar `then` para agregar un callback que se ejecutará cuando la promesa se resuelva. Lo interesante es que `then` nos devuelve **una nueva promesa**, por lo que podemos seguir encadenando operaciones:
```javascript
promesaConTimeout
 .then((mensaje) => '¡' + mensaje + '!')
 .then((mensajeConEnfasis) => console.log(mensajeConEnfasis));
```

Además, si la función que le pasamos al `then` devuelve una promesa, nos garantiza que dicha promesa se va a resolver antes que la que devuelve el `then` mismo. Esto evita tener un _promise-hell_ (patente pendiente) de promesas anidadas.

Veamos un ejemplo de esto último. Si usamos la función `fetch` que existe en el browser para hacer requests HTTP, obtenemos una promesa que eventualmente se resolverá con la respuesta al request. Ahora bien, si queremos parsear esa respuesta como JSON, vamos a tener que enviar el mensaje `json()` a la respuesta, que también nos devuelve una promesa. Usando `then` podemos secuenciar estas operaciones asincrónicas, de forma tal que, al final, sólo tengamos una promesa con el objeto parseado:
```javascript
fetch('https://pokeapi.co/api/v2/pokemon/1')
 .then(response => response.json())
 .then(pokemon => console.log(`Encontre a: ${pokemon.name}`));
```

## Otras formas de componer promesas

Además de componer operaciones asincrónicas "en serie", muchas veces queremos hacerlo "en paralelo" (o, siendo más precisos, concurrentemente). Al principio vimos que hacer esto con callbacks nos llevaba por un camino bastante oscuro.

¿Cómo se logra lo mismo usando promesas?

```javascript
const fetchJSON = (requestUrl) => fetch(requestUrl).then(response => response.json());
const respuestas = [1, 4, 7].map(nroPokedex => fetchJSON('https://pokeapi.co/api/v2/pokemon/' + nroPokedex));
Promise.all(respuestas)
 .then(iniciales => elegirInicial(iniciales));
```

Con `Promise.all` podemos agregar los resultados de múltiples promesas, para después operar todos los resultados de forma conjunta, y de una forma mucho más declarativa que cuando usábamos CPS.

`Promise.all` no es la única forma que tenemos de combinar promesas. Durante la cursada vamos a ver otras, aunque si tienen curiosidad, pueden buscar `Promise.race()`, `Promise.any()` y `Promise.allSettled()`.

## Volviendo la vista atrás

Después de haber hecho un recorrido por las funcionalidades principales que nos ofrecen las promesas, cabe preguntarnos: ¿qué cambió con el uso de promesas, respecto al uso de CPS?

Primero que nada, es importante entender que no estamos agregando nada "mágico", ni ningún concepto de manejo de concurrencia novedoso. Las promesas se paran sobre el uso de continuaciones de toda la vida, sólo que agregando una capa de abstracción por encima que, por un lado, facilita ciertas cosas, pero que también impide otras.

La diferencia fundamental está en quién tiene el control de _la próxima acción a ejecutar_. Con CPS, una vez que pasábamos un callback por parámetro a una función, perdíamos todo control sobre el flujo de ejecución, que pasaba a ser responsabilidad de esa función. Con las promesas, seguimos teniendo una referencia del lado del invocador, y esto puede ser de gran ayuda al momento de agregar nuevas operaciones que dependen de la primera que hicimos.

Acá entran las distintas formas de componer promesas que vimos, que son posibles justamente gracias a haber reificado el resultado de la ejecución.

Ahora bien, las promesas no vienen a reemplazar el uso de callbacks, o al menos no en su totalidad. Como vimos, hay categorías enteras de situaciones (falla, no determinismo) que no se pueden manejar mediante el uso promesas. Esto en una primer momento podría parecer una desventaja, pero la realidad es que, al enfocarse en un escenario concreto en particular (el manejo de operaciones asincrónicas que producen un sólo resultado), las promesas pueden ofrecer una interfaz a la vez sencilla y poderosa para ese caso de uso.

De hecho, enfoques como la **programación reactiva** extienden los principios de las promesas (y agregan unos cuantos otros), permitiendo manejar tanto casos de falla como no determinismo. Pero al hacerlo también terminan con una interfaz mucho más compleja que la de las promesas.

## Recursos recomendados

- [Guía sobre uso de Promesas](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [Documentación más en detalle sobre su interfaz](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Bonus - Introducción a Programación Reactiva](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)