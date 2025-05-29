const e=`<div class="sect1">
<h2 id="_introduccion"><a class="anchor" href="#_introduccion"></a>Introduccion</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En <a href="https://arquitecturas-concurrentes.github.io/iasc-book/cps/">capítulos anteriores</a> vimos una posible forma de estructurar nuestros programas, utilizando CPS. Esta técnica, a diferencia de call-and-return y memoria compartida, nos permite implementar, de forma fácil:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>computaciones con un único resultado</p>
</li>
<li>
<p>computaciones que pueden fallar</p>
</li>
<li>
<p>computaciones no determinísticas</p>
</li>
<li>
<p>excepciones</p>
</li>
<li>
<p>asincronismo</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Bueno, quizás no tan fácilmente. Vimos que si no tenemos cuidado y no delegamos <em>apropiadamente</em>, es muy posible que caigamos en el callback-hell: continuaciones anidadas dentro de continuaciones. Para ser justos, esto no es un problema de CPS propiamente dicho sino de la subutilización de una de las herramientas más poderosas del paradigma funcional: el orden superior.</p>
</div>
<div class="paragraph">
<p>De todas formas, lo admitimos, para el programador inexperto en estos territorios, razonar sobre abstracciones que combinan funciones, como <em>compose</em>&#8217;s o <em>pipeline</em>&#8217;s no es simple: las funciones no son valores obvios.</p>
</div>
<div class="paragraph">
<p>A su vez, la secuenciación de continuaciones es un problema aún mayor cuando estamos trabajando con operaciones que pueden fallar, ya que la cantidad de flujos de ejecución posibles aumenta, haciendo que sea muy fácil perder algún potencial error.</p>
</div>
<div class="paragraph">
<p>Pero si <strong>secuenciar</strong> operaciones no es trivial, trabajar con operaciones <strong>concurrentes</strong> es todavía más difícil. Por ejemplo, si tenemos un cliente HTTP que usa continuaciones, y queremos agrupar en una lista las respuestas de varios requests, no nos queda otra opción que alejarnos del enfoque más <em>purista</em> de CPS e introducir estado mutable que va a ser modificado por las distintas continuaciones:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">const pokemonIniciales = [];
const pokemonObtenido = () =&gt; {
 if(pokemonIniciales.length &lt; 3) {
  return;
 }
 elegirInicial(pokemonIniciales);
};
request('https://pokeapi.co/api/v2/pokemon/1', (response) =&gt; {
 pokemonIniciales.push(response.body());
 pokemonObtenido();
});
request('https://pokeapi.co/api/v2/pokemon/4', (response) =&gt; {
 pokemonIniciales.push(response.body());
 pokemonObtenido();
});
request('https://pokeapi.co/api/v2/pokemon/7', (response) =&gt; {
 pokemonIniciales.push(response.body());
 pokemonObtenido();
});</code></pre>
</div>
</div>
<div class="paragraph">
<p>Motivada por estas problemáticas surge otra forma de estructurar programas concurrentes: las promesas (<em>futures</em> o <em>promises</em>, en inglés). Se trata de una técnica que de nueva no tiene nada (data de fines de los '\`70), pero que se ha popularizado y gracias a implementaciones en lenguajes como Scala o JavaScript.</p>
</div>
<div class="paragraph">
<p>Veamos qué tienen para ofrecernos.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_reificando_los_resultados_de_nuestras_operaciones"><a class="anchor" href="#_reificando_los_resultados_de_nuestras_operaciones"></a>Reificando los resultados de nuestras operaciones</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Para empezar, volvamos a nuestro clásico ejemplo: la función <code>successor</code>, en su variante CPS:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function successor(x, callback) {
 callback(x + 1);
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Que podemos usar de la siguiente forma:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">successor(4, (resultado) =&gt; console.log(resultado));</code></pre>
</div>
</div>
<div class="paragraph">
<p>Para pasar de nuestro mundo de continuaciones al de <em>promesas</em>, vamos a hacer lo siguente:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function successor(x) {
 return new Promise((resolve) =&gt; {
  resolve(x+1);
 });
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>¿Qué cambió? Ahora nuestra función <code>successor</code> retorna un valor, pero éste no es el valor del resultado que buscamos, sino que tenemos que interactuar con una <code>Promise</code> para obtenerlo.</p>
</div>
<div class="paragraph">
<p>La forma de hacerlo va a ser a través de uno de los mensajes que entienden las promesas: <code>then</code>, que nos permite encadenar operaciones que se van a llevar a cabo una vez que el resultado de la promesa esté disponible.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">successor(4).then((resultado) =&gt; console.log(resultado));</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>"Una vez que el resultado de la promesa esté disponible" dijiste?</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Claro, porque las promesas se usan en general para representar el resultado de operaciones asincrónicas:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">promesaConTimeout = new Promise((resolve) =&gt; {
 setTimeout(() =&gt; resolve("Vengo del pasado"), 5_000);
});
promesaConTimeout.then((mensaje) =&gt; console.log(mensaje));</code></pre>
</div>
</div>
<div class="paragraph">
<p>Si inspeccionamos esa promesa en el momento en que la creamos, vamos a ver que se encuentra en estado <strong>pendiente</strong>, ya que todavía no se ha completado. Sin embargo, si esperamos 5 segundos, veremos el mensaje en la consola, y al inspeccionar la promesa veremos que se encuentra <strong>resuelta</strong>.</p>
</div>
<div class="paragraph">
<p>Vemos entonces que las promesas son objetos con estado, y que éste puede variar con el tiempo, pasando de estar pendiente a resuelta.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_manejando_los_errores"><a class="anchor" href="#_manejando_los_errores"></a>Manejando los errores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Las promesas nos permiten no solo representar resultados exitosos, sino también casos de error:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function inverse(x) {
 return new Promise ((resolve, reject) =&gt; {
  if (x === 0) {
   reject("No existe la inversa de 0")
  } else {
   resolve(1 / x);
  }
 });
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Si invocamos esta función con <code>0</code> como parámetro, vemos que la promesa resultante está <strong>rechazada</strong>, y que tiene valor de error.</p>
</div>
<div class="paragraph">
<p>Esto nos permite manejar <em>excepciones</em>, usando otro mensaje que entienden las promesas, <code>catch</code>:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function printInverse(x) {
  inverse(x).then(result =&gt; console.log(result))
    .catch(error =&gt; console.error(error));
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Algo destacable del manejo de excepciones, es que las excepciones "cascadean" hasta el primer <code>catch</code> que puede manejarlas. Esto constituye una diferencia respecto a CPS, donde siempre tenemos que pasar los callback de error explícitamente.</p>
</div>
<div class="paragraph">
<p>Otra diferencia entre CPS y promesas que podemos observar es que las promesas siempre se resuelven o se rechazan. No nos permiten no tener un resultado (<em>fallar</em>), ni tampoco tener múltiples resultados (<em>no determinismo</em>).</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_encadenando_promesas"><a class="anchor" href="#_encadenando_promesas"></a>Encadenando promesas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Como ya vimos, podemos usar <code>then</code> para agregar un callback que se ejecutará cuando la promesa se resuelva. Lo interesante es que <code>then</code> nos devuelve <strong>una nueva promesa</strong>, por lo que podemos seguir encadenando operaciones:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">promesaConTimeout
 .then((mensaje) =&gt; '¡' + mensaje + '!')
 .then((mensajeConEnfasis) =&gt; console.log(mensajeConEnfasis));</code></pre>
</div>
</div>
<div class="paragraph">
<p>Además, si la función que le pasamos al <code>then</code> devuelve una promesa, nos garantiza que dicha promesa se va a resolver antes que la que devuelve el <code>then</code> mismo. Esto evita tener un <em>promise-hell</em> (patente pendiente) de promesas anidadas.</p>
</div>
<div class="paragraph">
<p>Veamos un ejemplo de esto último. Si usamos la función <code>fetch</code> que existe en el browser para hacer requests HTTP, obtenemos una promesa que eventualmente se resolverá con la respuesta al request. Ahora bien, si queremos parsear esa respuesta como JSON, vamos a tener que enviar el mensaje <code>json()</code> a la respuesta, que también nos devuelve una promesa. Usando <code>then</code> podemos secuenciar estas operaciones asincrónicas, de forma tal que, al final, sólo tengamos una promesa con el objeto parseado:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">fetch('https://pokeapi.co/api/v2/pokemon/1')
 .then(response =&gt; response.json())
 .then(pokemon =&gt; console.log(\`Encontre a: \${pokemon.name}\`));</code></pre>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_otras_formas_de_componer_promesas"><a class="anchor" href="#_otras_formas_de_componer_promesas"></a>Otras formas de componer promesas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Además de componer operaciones asincrónicas "en serie", muchas veces queremos hacerlo "en paralelo" (o, siendo más precisos, concurrentemente). Al principio vimos que hacer esto con callbacks nos llevaba por un camino bastante oscuro.</p>
</div>
<div class="paragraph">
<p>¿Cómo se logra lo mismo usando promesas?</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">const fetchJSON = (requestUrl) =&gt; fetch(requestUrl).then(response =&gt; response.json());
const respuestas = [1, 4, 7].map(nroPokedex =&gt; fetchJSON('https://pokeapi.co/api/v2/pokemon/' + nroPokedex));
Promise.all(respuestas)
 .then(iniciales =&gt; elegirInicial(iniciales));</code></pre>
</div>
</div>
<div class="paragraph">
<p>Con <code>Promise.all</code> podemos agregar los resultados de múltiples promesas, para después operar todos los resultados de forma conjunta, y de una forma mucho más declarativa que cuando usábamos CPS.</p>
</div>
<div class="paragraph">
<p><code>Promise.all</code> no es la única forma que tenemos de combinar promesas. Durante la cursada vamos a ver otras, aunque si tienen curiosidad, pueden buscar <code>Promise.race()</code>, <code>Promise.any()</code> y <code>Promise.allSettled()</code>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_volviendo_la_vista_atrás"><a class="anchor" href="#_volviendo_la_vista_atrás"></a>Volviendo la vista atrás</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Después de haber hecho un recorrido por las funcionalidades principales que nos ofrecen las promesas, cabe preguntarnos: ¿qué cambió con el uso de promesas, respecto al uso de CPS?</p>
</div>
<div class="paragraph">
<p>Primero que nada, es importante entender que no estamos agregando nada "mágico", ni ningún concepto de manejo de concurrencia novedoso. Las promesas se paran sobre el uso de continuaciones de toda la vida, sólo que agregando una capa de abstracción por encima que, por un lado, facilita ciertas cosas, pero que también impide otras.</p>
</div>
<div class="paragraph">
<p>La diferencia fundamental está en quién tiene el control de <em>la próxima acción a ejecutar</em>. Con CPS, una vez que pasábamos un callback por parámetro a una función, perdíamos todo control sobre el flujo de ejecución, que pasaba a ser responsabilidad de esa función. Con las promesas, seguimos teniendo una referencia del lado del invocador, y esto puede ser de gran ayuda al momento de agregar nuevas operaciones que dependen de la primera que hicimos.</p>
</div>
<div class="paragraph">
<p>Acá entran las distintas formas de componer promesas que vimos, que son posibles justamente gracias a haber reificado el resultado de la ejecución.</p>
</div>
<div class="paragraph">
<p>Ahora bien, las promesas no vienen a reemplazar el uso de callbacks, o al menos no en su totalidad. Como vimos, hay categorías enteras de situaciones (falla, no determinismo) que no se pueden manejar mediante el uso promesas. Esto en una primer momento podría parecer una desventaja, pero la realidad es que, al enfocarse en un escenario concreto en particular (el manejo de operaciones asincrónicas que producen un sólo resultado), las promesas pueden ofrecer una interfaz a la vez sencilla y poderosa para ese caso de uso.</p>
</div>
<div class="paragraph">
<p>De hecho, enfoques como la <strong>programación reactiva</strong> extienden los principios de las promesas (y agregan unos cuantos otros), permitiendo manejar tanto casos de falla como no determinismo. Pero al hacerlo también terminan con una interfaz mucho más compleja que la de las promesas.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_recursos_recomendados"><a class="anchor" href="#_recursos_recomendados"></a>Recursos recomendados</h2>
<div class="sectionbody">
<div class="ulist">
<ul>
<li>
<p><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises">Guía sobre uso de Promesas</a></p>
</li>
<li>
<p><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">Documentación más en detalle sobre su interfaz</a></p>
</li>
<li>
<p><a href="https://gist.github.com/staltz/868e7e9bc2a7b8c1f754">Bonus - Introducción a Programación Reactiva</a></p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};
