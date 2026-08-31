const e=`<div class="sect1">
<h2 id="_paradigma_funcional_qué_es_eso"><a class="anchor" href="#_paradigma_funcional_qué_es_eso"></a>¿Paradigma Funcional? ¿Qué es eso?</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Es irónico que aunque el paradigma funcional es muy anterior al paradigma de objetos, lo que le ha dado la posibilidad de construir sólidas bases, es difícil dar una definición del mismo. Por ejemplo, la definición más obvia reza que
funcional es un paradigma en el que las soluciones a los problemas se estructuran en términos de aplicación de funciones
y, si bien es correcta, hay tantos elementos fundamentales que se desprenden de ésta y que no son evidentes que resulta de poca utilidad.</p>
</div>
<div class="paragraph">
<p>Quizás sea más útil pensarlo a partir de las características más frecuentemente evocadas cuando se piensa en éste:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>Pureza: las funciones, al igual que en matemática, no presentan efectos colaterales, sino que tan sólo reciben, operan y devuelven valores</p>
</li>
<li>
<p>Evaluación diferida: ciertas partes del código no se evaluarán salvo que sea necesario</p>
</li>
<li>
<p>Funciones de primer orden: las funciones son valores, y por tanto pueden ser pasadas por parámetro</p>
</li>
<li>
<p>Pattern matching: los valores pueden ser descompuestos estructuralmente, en un proceso inverso a la construcción: la deconstrucción. Y además podemos usar a esta herramienta como mecanismo de control de flujo: según encaje un valor con un patrón u otro, podremos tomar acciones diferentes.</p>
</li>
<li>
<p>Expresiones lambda: Es posible escribir valores de función de forma literal, sin asignarle un nombre.</p>
</li>
<li>
<p>Inmutabilidad: las variables son meras etiquetas, que una vez unificadas contra un valor, no pueden ser cambiadas.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Sin embargo, ¿son las anteriores ideas propias del paradigma funcional? Miremos más en detalle:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>No todos los lenguajes funcionales son realmente puros. LISP y sus derivados, por ejemplo, no lo son normalmente: permiten hacer input-ouput (IO) imperativo, modificar variables, etc.</p>
</li>
<li>
<p>No todos los lenguajes funcionales presentan evaluación diferida. Para ser justos, ni siquiera Haskell: éste ofrece evaluación no-estricta, lo cual es ligeramente diferente.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Por un lado muchos lenguajes (funcionales o no) presentan algún tipo de operación de deconstrucción: Ruby, ECMAScript6, Clojure, etc, que es la base para implementar pattern-matching. Y por otro lado, la idea de Pattern matching no figura en Cálculo Lambda, la base teórica de funcional.</p>
</div>
<div class="paragraph">
<p>Virtualmente todos los lenguajes modernos presentan lambdas, closures o bloques de código, que permiten cosificar una porción de código.</p>
</div>
<div class="paragraph">
<p>Si nada de lo que parece tan propio de funcional es realmente exclusivo del mismo, entonces, volvemos a la pregunta: ¿qué es eso? Simple: es la forma particular en que combinamos estas herramientas, razonando declarativamente en términos de valores y transformaciones sobre los mismos.
Nuevamente, el todo es más que la suma de las partes.</p>
</div>
<div class="paragraph">
<p>Durante las próximas clases vamos a estar viendo por qué el paradigma funcional puede ser una herramienta muy útil a la hora de trabajar con concurrencia y paralelismo. En particular, vamos a estar trabajando con Haskell, uno de los exponentes más notables de este paradigma. Pero antes, vamos a necesitar aprender (o repasar) algunos conceptos que nos van a ser de utilidad más adelante.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_sobre_pureza_en_funcional"><a class="anchor" href="#_sobre_pureza_en_funcional"></a>Sobre pureza en funcional</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Haskell es un lenguaje puro; toda operación es similar a una función matemática, donde el resultado de dicha función depende únicamente de sus argumentos. Tanto es así, que hasta los efectos están modelados como valores de tipo IO, que representa un efecto, el cual puede ser operado como cualquier otro valor: podemos pasar efectos por parámetros, colocarlos en listas, ordenarlos, etc.
De hecho, un programa ejecutable es una función que devuelve un valor de tipo IO. El runtime de Haskell ejecuta el efecto representado por este valor, produciendo así los efectos en el mundo real deseados.
Moraleja: un programa Haskell no tiene efectos, pero es capaz de devolver un valor que los representa, pudiendo así hacer todo lo que un programa imperativo podría hacer, y más.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_simplicidad"><a class="anchor" href="#_simplicidad"></a>Simplicidad</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La sintaxis e ideas fundamentales de Haskell son realmente simples, y el resto de las ideas más complejas se construyen normalmente sobre las más simples.</p>
</div>
<div class="paragraph">
<p><strong>TODO: Completar o eliminar sección.</strong></p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_tipos_en_haskell"><a class="anchor" href="#_tipos_en_haskell"></a>Tipos en Haskell</h2>
<div class="sectionbody">
<div class="paragraph">
<p>A diferencia de otros lenguajes, como Ruby o Smalltalk, Haskell tiene un sistema de tipos estático. Esto significa que el tipo de cada expresión es conocido en tiempo de compilación.</p>
</div>
<div class="paragraph">
<p>Ilustrémoslo con un ejemplo: si tenemos una función que suma dos números, y le pasamos un string que se sume a un int, en un lenguaje dinámico solo fallaría en tiempo de ejecución, mientras que en un lenguaje con un sistema de tipos estático, no compilaría. Esto permite que puedan capturarse errores en tiempo de compilación en vez de que tengan que aparecer en ejecución.</p>
</div>
<div class="paragraph">
<p>En Haskell todo tiene un tipo, y a diferencia de otros lenguajes similares como Java, Haskell tiene además inferencia de tipos. Si escribimos un número, no tenemos que decirle a Haskell que es un número, sino que puede inferirlo solo. El tipo de un valor se puede conocer por medio del comando <code>:t</code>:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t 'a'
'a' :: Char
Prelude&gt; :t True
True :: Bool</code></pre>
</div>
</div>
<div class="dlist">
<dl>
<dt class="hdlist1">Como vemos en el GhCI, cuando ejecutamos el comando <code>:t</code> junto con un valor, nos dice de qué tipo es. \`x </dt>
<dd>
<p>T\` puede leerse como "x es del tipo T".</p>
</dd>
</dl>
</div>
<div class="paragraph">
<p>Con expresiones más complejas podemos ver algo como lo siguiente:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t 4 + 3
4 + 3 :: Num a =&gt; a</code></pre>
</div>
</div>
<div class="paragraph">
<p>Simple, todas las expresiones generan un valor con un tipo asociado.</p>
</div>
<div class="paragraph">
<p>Las funciones son otra cosa que también necesita una declaración de tipos, y es una buena práctica que ayuda al sistema de inferencia de tipos, y es recomendado a menos que se necesite crear funciones muy chicas. Empecemos con un ejemplo bien simple:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; let succ a = a + 1
Prelude&gt; :t succ
succ :: Num a =&gt; a -&gt; a</code></pre>
</div>
</div>
<div class="paragraph">
<p>Esto se vería así en un código que no sea ghci</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">succ :: Int -&gt; Int
succ a = a + 1</code></pre>
</div>
</div>
<div class="paragraph">
<p>Veamos un poco más en detalle otro prototipo de función, por ej. <code>head</code> y <code>tail</code></p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t head
head :: [a] -&gt; a

Prelude&gt; :t tail
tail :: [a] -&gt; [a]</code></pre>
</div>
</div>
<div class="paragraph">
<p>Este ejemplo es bien conocido por tomar el primer elemento de una lista, head. Pero veamos la declaración de tipos, head toma un parámetro, que es del tipo lista de a. Pero a no es un tipo&#8230;&#8203; ¿qué es entonces? En este caso es un tipo genérico. Puede ser un <code>Int</code>, <code>String</code>, etc., pero el tipo va a ser consistente; es decir, si tenemos una función que va de <code>[a] -&gt; a</code>, entonces si a es un <code>Int</code>, la función va a tomar una lista de <code>Int</code>, y devolver un <code>Int</code>. Esto es porque la función es polimórfica y puede tomar cualquier lista de un tipo, y devolver el primer elemento, sin importar de qué tipo es la lista.</p>
</div>
<div class="paragraph">
<p>Nuestra función <code>succ</code>, en cambio, solo toma un <code>Int</code> y devuelve otro <code>Int</code>. Si le pasamos algo de tipo <code>String</code>, fallaría en tiempo de compilación.</p>
</div>
<div class="paragraph">
<p>En el ejemplo de <code>head</code>, en la declaración de tipos, a es llamado type variable.</p>
</div>
<div class="paragraph">
<p>Tomemos otro ejemplo, <code>fst</code></p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t fst
fst :: (a, b) -&gt; a</code></pre>
</div>
</div>
<div class="paragraph">
<p>En este caso se puede ver cómo la función toma una tupla y devuelve el primer elemento, y tenemos dos type variables, a y b, que si bien son diferentes, no significa que sean de tipos distintos. También podemos ver que el primer elemento y lo que devuelve la función son del mismo tipo, tal como ocurre con <code>head</code>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_typeclases"><a class="anchor" href="#_typeclases"></a>Typeclases</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una Typeclass es como una especie de interfaz que define un comportamiento. Si un tipo es parte de una typeclass, el tipo soporta e implementa el comportamiento que describe dicha typeclass. Haciendo una comparación con el paradigma de objetos, podríamos decir que las typeclases son como las interfaces de Java, pero implementando el comportamiento, no solo definiendo su contrato.</p>
</div>
<div class="paragraph">
<p>Veamos la operación suma de <code>succ</code></p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t (+)
(+) :: Num a =&gt; a -&gt; a -&gt; a</code></pre>
</div>
</div>
<div class="paragraph">
<p>Antes que nada vemos que ahora está el símbolo <code>=&gt;</code>. La lectura hacia la derecha es como las funciones que vimos hasta ahora: la función toma dos elementos de tipo a y devuelve otro de tipo a. A la izquierda del <code>=&gt;</code> se indica que el tipo de los dos valores y el retorno deben ser miembros de la clase <code>Num</code>. Esto último se conoce como <strong>class constraint</strong>.</p>
</div>
<div class="paragraph">
<p>Veamos otro ejemplo</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t (&lt;=)
(&lt;=) :: Ord a =&gt; a -&gt; a -&gt; Bool</code></pre>
</div>
</div>
<div class="paragraph">
<p><code>Ord</code> es otra typeclass, que define la interfaz para ordenamiento (&lt;, &gt;, &lt;= y &gt;=, entre otras), por lo que cualquier tipo que requiera ordenamiento de dos o más elementos, debe ser un miembro de <code>Ord</code>.</p>
</div>
<div class="paragraph">
<p>Volviendo a la suma, vimos que <code>Num</code> es un typeclass numérico, y permite que un tipo actúe como número, por ej:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; :t 42
42 :: Num a =&gt; a</code></pre>
</div>
</div>
<div class="paragraph">
<p>Por lo que los números pueden actuar como constantes polimórficas, por lo que podemos definir un 42 numérico, flotante o doble, pero hay operaciones que si bien son parte del typeclass, su contrato debe ser cumplido, por ej. si sumamos un doble con un interfaces</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-haskell" data-lang="haskell">Prelude&gt; (42 :: Integer) + (2 :: Double)

&lt;interactive&gt;:25:20:
    Couldn't match expected type ‘Integer’ with actual type ‘Double’
    In the second argument of ‘(+)’, namely ‘(2 :: Double)’
    In the expression: (42 :: Integer) + (2 :: Double)
    In an equation for ‘it’: it = (42 :: Integer) + (2 :: Double)
Prelude&gt; (42 :: Integer) + (2 :: Integer)
44</code></pre>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_dualidad_en_estructuras_de_tipos"><a class="anchor" href="#_dualidad_en_estructuras_de_tipos"></a>Dualidad en estructuras de tipos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Cada una de ellas presenta una dualidad, pudiendo ser pensada tanto como una estructura de datos, como una estructura de control. Dicho de otra forma, a las estructuras funcionales podemos verlas tanto como contenedores (cajas que almacenan valores) como computaciones (operaciones que al ejecutarlas producen valores).</p>
</div>
</div>
</div>`;export{e as default};
