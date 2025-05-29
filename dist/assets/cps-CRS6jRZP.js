const e=`<div class="sect1">
<h2 id="_introduccion"><a class="anchor" href="#_introduccion"></a>Introduccion</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Empecemos de a poco y por algo muy simple: una función que incrementa en una unidad a su argumento, la función succesor.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Nota: cuando decimos función lo decimos en el sentido estricto de una computación que toma un valor y devuelve otro, sin tener ningún tipo de efecto
En JavaScript, su código se ve como el siguiente:</p>
</div>
</blockquote>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-ruby" data-lang="ruby">require 'sinatra'

get '/hi' do
  "Hello World!"
end</code></pre>
</div>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function succesor(x) {
  return x + 1;
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Usar esta función no tiene mucho misterio:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">var i0 = 0;
var i1 = succesor(i0);
…etc…</code></pre>
</div>
</div>
<div class="paragraph">
<p>La función succesor está escrita en lo que se conoce como estilo directo: los resultados de la misma (en este caso, su entrada más uno) se obtienen a partir de su retorno.</p>
</div>
<div class="paragraph">
<p>Hasta acá nada extraño. Hagamos ahora un salto conceptual: otra forma posible de escribir este código, es que el resultado se obtenga a partir de un callback.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function succesor(x, callback) {
 callback(x + 1);
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>¿Y cómo la usamos?</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">var i0 = 0;
succesor(i0, (resultado) =&gt; {
 var i1 = resultado;
 //...etc...
});</code></pre>
</div>
</div>
<div class="paragraph">
<p>¡Momento! ¿Qué fue eso? Si bien puede verse un poco perturbador al principio, este código es totalmente equivalente al anterior: cuando se aplica la función succesor, calcula su siguiente, y se lo pasa al callback, que opera con el mismo normalmente.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Si te estás preguntando hacia dónde vamos y qué tiene todo esto que ver con la concurrencia, ¡danos uno rato! Prometemos que pronto todo tendrá sentido.</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>A este callback se lo llama continuación. Porque&#8230;&#8203; ¡es lo que que se ejecuta a continuación! O en inglés: continuation.
¿Qué significa esto? Que las funciones que toman continuaciones, no solo ahora saben lo que tienen que hacer, sino también cuándo se ejecutará lo que siga. Por eso decimos que una función escrita de este forma tiene, además de la lógica de negocio, control de flujo (o simplemente llamado control).</p>
</div>
<div class="paragraph">
<p>Peeeero, para que esto sea realmente posible, tenemos que tomar ciertas precauciones, y entender que al trabajar de esta forma, el resultado sólo se puede obtener dentro de la continuación.
Por tanto, el siguiente es un code smell:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">var i0 = 0;
var i1;
succesor(i0, (resultado) =&gt; {
  i1 = resultado;
});
//..resto...</code></pre>
</div>
</div>
<div class="paragraph">
<p>Aquí estamos capturando el resultado de successor a través de la continuación, asumiendo que el código se ejecutará inmediatamente y que estará disponible en la línea 6.</p>
</div>
<div class="paragraph">
<p>Pero si es realmente successor quien tiene control sobre cuándo y cómo se ejecuta la continuación, no podemos garantizar esto dado que no sabemos cuándo se va a ejecutar la continuación.</p>
</div>
<div class="paragraph">
<p>¿Esto significa que el código anterior no funciona? No, pero tenemos que entender que estamos rompiendo el modelo de continuación, al no permitir que sea la función successor la que determine cuándo y cómo seguir. Y eso puede ser una fuente de bugs.</p>
</div>
<div class="sect2">
<h3 id="_consecuencias"><a class="anchor" href="#_consecuencias"></a>Consecuencias</h3>
<div class="paragraph">
<p>En oposición al estilo directo, caracterizado por la obtención de resultados mediante retornos, surge así el estilo de paso de continuaciones (CPS, por sus siglas en inglés). Es decir, cuando tenemos una función que toma una continuación y efectivamente colocamos todo el código que opera con el resultado dentro de la misma, tenemos una función CPS.</p>
</div>
<div class="paragraph">
<p>El CPS es especial porque es fácil introducirlo, pero imposible salir de él, al menos no sin introducir bugs y potenciales problemas en el sistema.</p>
</div>
<div class="paragraph">
<p>Retomando las ideas de nuestro primer episodio, esto es una propiedad interesante: una vez impuesta la arquitectura, no tenemos opción de escapar de ella, lo que nos resta en flexibilidad, pero nos fuerza a ser consistentes.</p>
</div>
<div class="paragraph">
<p>Ejemplo: si ahora queremos implementar una función que incrementa el doble de un número, usando nuestro successor CPS, estaríamos tentados a escribir esto:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function incrementarDoble(i) {
  var i0 = 2 * i;
  succesor(i0, function(resultado) {
   var i1 = resultado;
   ???
  });
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Y ahí vemos el problema: incrementarDoble debe retornar i1, ¡pero no puede hacerlo, porque no hay garantías de cuando se va a ejecutar la continuación, ni cuantas veces!
Por ello, la única alternativa válida (sin basarse en los detalles de implementación de successor, claro), es convertir a incrementarDoble en CPS también:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function incrementarDoble(i, cont) {
  var i0 = 2 * i;
  succesor(i0, cont);
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Moraleja: una vez que introducimos CPS, su uso sólo puede extenderse.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Esto no significa que no podamos tener computaciones no CPS. Por ejemplo, la multiplicación podría ser extraída como una función en estilo directo. Desarrollaremos esta idea arquitectural mejor en próximos episodios cuando ataquemos el mundo monádico.</p>
</div>
</blockquote>
</div>
</div>
<div class="sect2">
<h3 id="_para_qué_cps"><a class="anchor" href="#_para_qué_cps"></a>¿Para qué CPS?</h3>
<div class="paragraph">
<p>Resulta bastante evidente que razonar sobre CPS es más complejo que en el estilo directo. Entonces, ¿por qué habríamos de adoptarlo?</p>
</div>
<div class="paragraph">
<p>CPS, al otorgarle a la función no sólo capacidad de cómputo sino de control, permite hacer cosas muy poderosas. En los ejemplos anteriores no lo aprovechamos, porque la computación succesor puede ser modelada con una función con un sólo resultado posible:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function succesor(x, cont) {
 cont(x + 1);
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Pero sin embargo, podríamos haber aplicado a la función cont cero (1) o muchas veces (2), podríamos haber recibido múltiples continuaciones y ejecutar alguna de ellas (3), o podríamos haberlas ejecutado en otro momento (4). CPS nos permite, entones, implementar 4 tipos de computaciones: con falla, no determinísticas, con excepciones y asincrónicas.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Recordar estos tipos de continuaciones, volverán en episodios futuros</p>
</div>
</blockquote>
</div>
</div>
<div class="sect2">
<h3 id="_falla"><a class="anchor" href="#_falla"></a>Falla</h3>
<div class="paragraph">
<p>Con CPS podemos codificar computaciones que pueden no tener resultado (los matemáticos las llaman funciones parciales). Por ejemplo, la división es una función parcial que no tiene un resultado cuando su segundo argumento es cero, por lo que podemos definir una función inversa CPS de la siguiente forma:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function inversa(x, cont) {
  if (x !== 0) {
    cont(1/x);
  }
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Si ahora aplicamos a inversa con el valor 2, tendremos como resultado 0.5. Pero si la aplicamos con 0, no tendremos resultado. Esto no es lo mismo que no devolver nada en una función en estilo directo (o devolver null): en una función CPS que puede fallar, si no hay resultado, el programa continuación NO continúa; el flujo de ejecución se detiene.</p>
</div>
</div>
<div class="sect2">
<h3 id="_no_determinismo"><a class="anchor" href="#_no_determinismo"></a>No determinismo.</h3>
<div class="paragraph">
<p>Hay computaciones que pueden arrojar cero o más resultados, son la generalización de la función: la relación. Por ejemplo, la pregunta ¿quien es hijo de Vito Corleone? (notá el singular) tiene múltiples respuestas: Sonny, Michel, Connie, etc.
Esta es la base del paradigma lógico: relaciones que pueden generar ningún resultado, uno, o varios.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">function hijoDeVito(cont) {
  cont("sonny");
  cont("michel");
  cont("connie");
  cont("freddo");
}</code></pre>
</div>
</div>
<div class="paragraph">
<p>Se observa fácilmente que logramos las múltiples respuestas mediante la aplicación reiterada de la continuación: el mismo programa está continuando múltiples veces con argumento diferentes.</p>
</div>
<div class="paragraph">
<p>CPS no nos da una restriccion sobre la cantidad de veces a las que se deba llamar la continuacion que recibe. Por lo que vamos a poder aplicar la continuacion 0 o múltiples veces.</p>
</div>
<div class="paragraph">
<p>Tal vez el ejemplo de recien no fue tan convincente&#8230;&#8203;. bueno tenemos el ejemplo mas basico que podemos encontrar en la documentacion de Node.js:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) =&gt; {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () =&gt; {
  console.log(\`Server running at http://\${hostname}:\${port}/\`);
});</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Shamelessly taken from <a href="https://nodejs.org/ca/docs/guides/getting-started-guide/">here</a></p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Este pequeño ejemplo nos muestra claramente el no determinismo, porque es un servidor que podemos levantar, y nunca vamos a saber cuantos request nos van a llegar al servidor durante el tiempo que este levantado, tal vez recibimos 28392389 requests, tal vez 0.</p>
</div>
</div>
<div class="sect2">
<h3 id="_excepciones"><a class="anchor" href="#_excepciones"></a>Excepciones</h3>
<div class="paragraph">
<p>Todos conocemos las excepciones. Estas nos dan dos flujos de ejecución: uno de éxito y uno de fracaso, y en ambos hay resultados: el resultado normal del programa o el error en cuestión. Y esto lo podemos lograr pasando dos continaciones: la que contiene el flujo normal, y la que contiene el flujo de error.</p>
</div>
</div>
<div class="sect2">
<h3 id="_computaciones_asincrónicas"><a class="anchor" href="#_computaciones_asincrónicas"></a>Computaciones asincrónicas.</h3>
<div class="paragraph">
<p>¡Éstas son las que más nos interesan! Operaciones que quizás no se ejecuten inmediatamente, sino en un momento posterior. Más sobre esto, en breve.</p>
</div>
</div>
<div class="sect2">
<h3 id="_cps_y_callback_hell"><a class="anchor" href="#_cps_y_callback_hell"></a>CPS, ¿y Callback Hell?</h3>
<div class="paragraph">
<p>Un pequeño paréntesis: se suele achacar al uso de CPS la inevitable caída en el callback hell. Por ejemplo:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">var cuentaLoca = function(x, cont) {
  siguiente(x, function(y){
    inversa(y, function(z){
      duplicar(z, cont);
    })
  })
};</code></pre>
</div>
</div>
<div class="paragraph">
<p>Como se observa, algo tan simple en estilo directo como</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">duplicar(inversa(siguiente(x)))</code></pre>
</div>
</div>
<div class="paragraph">
<p>se convierte en una compleja estructura de continuaciones anidadas.
¿Podríamos delegar esto de mejor forma? Si analizamos cómo queda expresada esta computación en estilo directo, podemos ver que duplicar la inversa del siguiente, a fin de cuentas, está describiendo una composición de funciones: al resultado de aplicar una función se le pasa a la entrada la otra.
Obviamente, no es la misma composición de funciones que conocemos en estilo directo: es una composición CPS. Y entender esto nos permite definir una función componer, que haga justamente esto:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript"> function componer(f, g) {
     return function(x, cont) {
         g(x, function(y){
             f(y, cont);
         })
     }
 }</code></pre>
</div>
</div>
<div class="paragraph">
<p>y una vez que tenemos eso podemos ya utilizarla así:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">var cuentaLoca = componer(duplicar, componer(inversa, siguiente))</code></pre>
</div>
</div>
<div class="paragraph">
<p>Y si le damos una vuelta de tuerca más, podemos observar que estamos ante la estructura de aplicación de un fold, y definir una función pipeline que componga todas las funciones cps</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript"> function pipeline(fs) {
     return fs.reduce(componer);
 }</code></pre>
</div>
</div>
<div class="paragraph">
<p>Con este <a href="#ref-1" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ref-1]</a> pipeline podemos reutilizar el componer aplicandole un fold sobre un array y de esta manera que se puedan componer todas las funciones que tenemos sin caer de nuevo en el Callback Hell:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-javascript" data-lang="javascript">var cuentaLoca = pipeline([duplicar, inversa, siguiente]);</code></pre>
</div>
</div>
<div class="paragraph">
<p>Y así vemos como eliminar el callback hell, aun con CPS, es posible.
Moraleja: no es culpa del CPS, es culpa nuestra al no delegar convenientemente.</p>
</div>
</div>
<div class="sect2">
<h3 id="_conclusiones"><a class="anchor" href="#_conclusiones"></a>Conclusiones</h3>
<div class="ulist">
<ul>
<li>
<p>CPS nos da gran poder, pero es difícil de manejar adecuadamente</p>
</li>
<li>
<p>CPS nos lleva, si no tenemos cuidado al callback hell. Sin embargo, no es inherente a CPS, sino que es consecuencia de una mala delegación. Es posible resolverlo si se delega apropiadamente y aplicando los conceptos de programación funcional de orden superior y creando combinadores apropiados</p>
</li>
<li>
<p>CPS nos permite implementar computaciones asincrónicas. NodeJS emplea CPS para soportarlas.</p>
</li>
<li>
<p>El uso de CPS en NodeJS: pésimo manejo de errores y ausencia de abstracciones para hacerlo mas tratable. Por eso es que la comunidad centró su atención en otra forma de estructurar programas con influencias funcionales: las promesas (promises).</p>
</li>
</ul>
</div>
<div class="paragraph">
<p><em>The Pragmatic Programmer</em> <a href="#pp" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[pp]</a> should be required reading for all developers.
To learn all about design patterns, refer to the book by the &#8220;Gang of Four&#8221; <a href="#gof" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[gang]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_references"><a class="anchor" href="#_references"></a>References</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="pp"></a>[pp] Andy Hunt &amp; Dave Thomas. The Pragmatic Programmer:
From Journeyman to Master. Addison-Wesley. 1999.</p>
</li>
<li>
<p><a id="gof"></a>[gang] Erich Gamma, Richard Helm, Ralph Johnson &amp; John Vlissides.
Design Patterns: Elements of Reusable Object-Oriented Software. Addison-Wesley. 1994.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};
