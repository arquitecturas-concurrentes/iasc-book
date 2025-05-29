const e=`<div class="sect2">
<h3 id="_introduccion"><a class="anchor" href="#_introduccion"></a>Introduccion</h3>
<div class="paragraph">
<p><a href="https://arquitecturas-concurrentes.github.io/iasc-book/introduccion/">Ya presentada la noción de arquitectura</a>,
nos queda introducir el otro gran tópico que nos incumbe: la concurrencia, concepto diferente pero relacionado (y a
veces confundido) con el de paralelismo. No vamos a entrar en definiciones de libro, pero es importante que repasemos
qué significa cada uno.</p>
</div>
</div>
<div class="sect2">
<h3 id="_paralelismo"><a class="anchor" href="#_paralelismo"></a>Paralelismo</h3>
<div class="paragraph">
<p>El <strong>paralelismo</strong> es la ejecución simultánea de dos o más operaciones. Se trata de una propiedad que permite a los
programas ejecutarse más rápido, y requiere un soporte <strong>físico</strong>: ya sean múltiples procesadores, núcleos o computadoras,
tenemos múltiples computaciones ejecutándose al mismo tiempo, con mínima o nula comunicación entre ellas. Es una
cuestión no funcional, normalmente no percibida cualitativamente por el usuario.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, tanto si procesamos un archivo de log para filtrar palabras en una sola computadora, o a través de un
clúster <a href="https://hadoop.apache.org/">Hadoop</a> con decenas de computadoras, el resultado final será el mismo.</p>
</div>
<div class="paragraph">
<p>El paralelismo existe en múltiples niveles:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Paralelismo a nivel de bit</strong>: ¿Por qué las computadoras de 64 bits son más rápidas que las de 16 bits? Si un equipo
de 16 bits quiere realizar una suma de dos números de 32 bits, debe realizar una serie de operaciones de 16 bits, pero
una computadora de 64 bits, puede realizar y soportar las mismas operaciones que las de 32, 16 y 8 bits, ya que
utilizan los registros de acuerdo a su longitud.</p>
</li>
<li>
<p><strong>Paralelismo a nivel de instrucción</strong>: Los procesadores, mediante técnicas como pipelining, ejecución fuera de orden
y ejecución especulativa, permiten ejecutar varias operaciones en simultáneo. Este tipo de optimización queda
encapsulada a este nivel, es decir, funciona "por atrás" sin que el usuario lo sepa. De hecho, gran parte de la
complejidad de estos mecanismos está en procurar que todos los resultados se vean como si la ejecución hubiese sido
secuencial.</p>
<div class="paragraph">
<p>En los últimos años no se han encontrado nuevas maneras para incrementar la velocidad de un procesador de un solo
núcleo. Por eso, la industria migró al mundo de los múltiples núcleos. Con esto, emergen los problemas de que las
instrucciones no se manejan secuencialmente.</p>
</div>
</li>
<li>
<p><strong>Paralelismo a nivel de datos</strong>: conocido como SIMD (&#8220;single instruction, multiple data&#8221;), esta arquitectura es capaz
de llevar a cabo la misma operación sobre una gran cantidad de datos en paralelo. Este tipo de ejecución no es útil
para todos los problemas, pero sí para varias áreas, como el procesamiento de imágenes (especialmente en videojuegos),
y el entrenamiento de modelos de deep learning. Por esta razón, las GPUs (unidades gráficas de procesamiento) se han
desarrollado como procesadores de datos paralelos especiales.</p>
</li>
<li>
<p><strong>Paralelismo a nivel de tareas</strong>: esto es lo que se conoce como múltiples procesadores. Desde el punto de vista de un
programador, el punto más importante de una arquitectura multiprocesador es el modelo de memoria, que puede ser
distribuida o compartida. En un multiprocesador con arquitectura de memoria compartida, cada procesador puede acceder
a cualquier locación de memoria, y la comunicación inter-procesador es generalmente realizada a través de la memoria.
En un esquema de memoria distribuida, cada procesador tiene su propia memoria local, y la comunicación
inter-procesador se realiza mediante la red, o un bus de datos (en caso de que estén en una misma máquina física).
Debido a que la comunicación inter-procesador es más rápida en memoria, históricamente se tendió a escribir código
para arquitecturas de memoria compartida. Sin embargo, cuando se cuenta con una cantidad elevada de procesadores, la
memoria compartida se convierte en un cuello de botella, y ahí el modelo que se ajusta mejor es uno basado en un
esquema distribuido. La memoria distribuida también es importante y fundamental si se desea implementar sistemas
tolerantes a fallos, que utilicen múltiples máquinas para soportar fallos de hardware.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>En esta materia vamos a enfocarnos en el paralelismo a nivel de tareas.</p>
</div>
</div>
<div class="sect2">
<h3 id="_concurrencia"><a class="anchor" href="#_concurrencia"></a>Concurrencia</h3>
<div class="paragraph">
<p>Decimos que hay <strong>concurrencia</strong> cuando existen simultáneamente múltiples contextos de ejecución. Se trata de una propiedad
<strong>lógica</strong> que permite a los programas ser más usables, y que afecta a la funcionalidad del sistema.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, si tenemos un procesador de texto, mientras escribimos, en segundo plano tendremos tareas que validan la
ortografía, guardan el documento, lo sincronizan contra una versión remota y descargan actualizaciones. Si estas
tareas no se estuvieran ejecutando de forma concurrente, tendríamos que dejar de escribir, guardar el archivo,
chequear la ortografía, etc., de forma secuencial, lo cual evidentemente afecta a la usabilidad del sistema. Y esto es
independiente de que las tareas se ejecuten en paralelo o no.</p>
</div>
<div class="paragraph">
<p>Como se desprende del ejemplo, cuando estamos ante un diseño concurrente, tendremos en general recursos compartidos
(por ejemplo la hoja del editor) y por tanto deberemos comunicar y coordinar de alguna forma estas tareas.</p>
</div>
<div class="paragraph">
<p>La concurrencia es naturalmente una fuente de <strong>no determinismo</strong>, dado que el orden de ejecución de los distintos contextos
de ejecución puede variar. Este no determinismo puede ser visible externamente (por ejemplo, por el usuario de un
programa), o puede estar abstraído de forma que exista la ilusión de una ejecución determinística.</p>
</div>
<div class="paragraph">
<p>Un ejemplo común de no determinismo son las <strong>condiciones de carrera</strong>, que ocurren cuando alguno de los órdenes
posibles en los que se pueden ejecutar los distintos contextos producen resultados no deseados.</p>
</div>
<div class="paragraph">
<p>Moraleja: si bien podemos tener sistemas concurrentes en los que haya ejecución paralela, concurrencia no implica
paralelismo. Y paralelismo no implica concurrencia.</p>
</div>
</div>`;export{e as default};
