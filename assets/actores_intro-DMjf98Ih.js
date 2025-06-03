const e=`<div class="quoteblock abstract">
<blockquote>
  Esta seccion se cambiara pronto, y por ahora solo es una mera introduccion a los actores, sin entrar en detalle en Elixir.
</blockquote>
</div>
<div class="sect1">
<h2 id="_introducción"><a class="anchor" href="#_introducción"></a>Introducción</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El modelo de Actores, como vimos, tiene muchas similitudes al paradigma de objetos aunque con algunas diferencias. El modelo de actores en si se define como uno que puede lidiar con computaciones concurrentes, por lo que hay algunas reglas en cómo deben ser modelados estos componentes, su comportamiento e interacción.
El modelo de actores tiene su unidad de computación más primitiva que es un actor, y que es una computación que recibe un mensaje y hace un procesamiento en base a eso, tambien ademas de recibir mensajes, puede enviar mensajes, tiene una identidad, que es mediante un id único en el sistema. Si empezamos a ver que un actor posee identidad, y envío/recepción de mensajes, uno pensaría que es bastante similar a la de un objeto, o no?. Bueno también un actor, cuando recibe un mensaje, hace algo dependiendo del mensaje que recibe ( similar a cuando llamamos a un método determinado a un objeto). Existen diferencias entre actores y objetos, y la más notoria es que en un modelo de objetos, varios objetos se ejecutan en una unidad de procesamiento (proceso o thread) y comparten recursos como memoria, esto no es lo mismo en el paradigma de actores en el que los actores son en realidad un contexto de ejecución y están completamente aislados uno de otros y nunca van a compartir memorias u otros recursos. También se debe aclarar que un actor puede mantener un estado privado y que este no puede ser cambiado directamente por otro actor (encapsulamiento). En el modelo de actores, nuestro sistema tiene que estar diagramado en actores y todo es un actor, y tienen que tener direcciones siempre, y esta dirección es lo que hablábamos antes que era el identificador en el ecosistema.</p>
</div>
<div class="paragraph">
<p>Los Actores además tienen un mailbox (buzón), en donde van a poder recibir los mensajes de otros actores, y por qué es esto? Bueno porque el envío de mensajes entre actores es asincrónico, por lo cual nunca se sabe exactamente cuando un actor recibe un mensaje, y el modelo elige este modelo de envío de mensajes, ya que al ser una unidad de ejecucion tambien, si se hacen llamadas sincrónicas, el proceso se quedara esperando a una respuesta que puede tal vez nunca llegar o demorar mucho más tiempo, quedando este proceso bloqueado mientras tanto y no dejando de que se pueda ejecutar otro actor que tal vez puede procesar algo. Al poder un actor recibir más de un mensaje en poco tiempo, y al procesar estos de a uno, si se recibe otro mensaje, el actor no lo puede recibir y procesar inmediatamente, por lo que estos mensajes que por el momento el actor no puede procesar quedan encolados en el buzón.
También estos escenarios suceden al tener múltiples actores que pueden ejecutarse al mismo tiempo, aunque un actor puede procesar un mensaje al mismo tiempo por lo que de nuevo, si un actor recibe al mismo tiempo 3 mensajes, va a ejecutar uno solo a la vez y por lo tanto hay que mantener un estado de que después hay dos mensajes más por ser procesados, esta es la razón de que los actores tengan un buzón. Si queremos que se ejecuten concurrentemente 3 mensajes, deberemos tener 3 actores y que se le envie un mensaje a cada uno.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/actors.png" alt="actors">
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_que_pueden_hacer_los_actores"><a class="anchor" href="#_que_pueden_hacer_los_actores"></a>Que pueden hacer los actores</h2>
<div class="sectionbody">
<div class="ulist">
<ul>
<li>
<p>Enviar y procesar mensajes de otros actores</p>
</li>
<li>
<p>Crear mas actores</p>
</li>
<li>
<p>ejecutar otro código después de procesar un mensaje.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Mencionamos que los actores son también una abstracción que tiene un contexto de ejecución propio, quien se encarga entonces de ejecutar a los actores. En la VM de Erlang/Elixir, existe algo llamado Scheduler, que se encarga de la coordinación de los actores y de la ejecución sobre un procesador del actor. <a href="http://erlang.org/pipermail/erlang-questions/2001-April/003132.html">Mas sobre el scheduler de BEAM</a></p>
</div>
<div class="paragraph">
<p>Que pasa cuando un actor no tiene ningun mensaje mas para procesar? El mismo muere. El ciclo de vida de un actor es relativamente corto y está pensado para que realice una acción en particular, reciba, envíe mensajes y cree otros actores, pero cuando deja de tener acciones futuras a realizar el mismo muere. Cómo podemos evitar que esto suceda? Bueno si queremos que un actor pueda quedar vivo, esperando a que reciba un mensaje eventualmente, podemos tan solo hacer eso llamándose a sí mismo y haciendo eso. Podemos ver un ejemplo <a href="https://github.com/arquitecturas-concurrentes/iasc-actors-intro-elixir/blob/master/elixir/intro_actors/lib/intro_actors.ex">aquí</a></p>
</div>
<div class="paragraph">
<p>Otro tema importante es que un actor no tiene métodos como los objetos, y el comportamiento de esta última está provista por las clases siempre. En Elixir/Erlang, existe algo más o menos similar que son los módulos, que podemos definir funciones que podemos pasarlas al actor para que las ejecute, es importante la siguiente línea del ejemplo anterior</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">spawn(fn -&gt; loop end)</code></pre>
</div>
</div>
<div class="paragraph">
<p>Spawn es la primitiva para crear un actor, y se le puede pasar una función que sea un loop que se llame a sí mismo y de acuerdo al mensaje que reciba realizará una acción. Esta es la manera más simple de que un actor quede vivo después de procesar los mensajes que tiene en el mailbox.</p>
</div>
<div class="paragraph">
<p>Hay otra librería que nos ayuda mucho a no tener que preocuparnos por esto que es OTP, que nos va a ayudar a modelar, mediante módulos que son más bien recurrentes, diferente tipos de actores que harán distintas acciones puntuales que nos van a ayudar bastante a que nos centremos más en el dominio de nuestra aplicación.</p>
</div>
<div class="paragraph">
<p>Que pasa si un actor falla por alguna razón? Bueno el mismo muere y hay que volver a crearlo y si recibió un mensaje en particular hay que enviarselo de nuevo, hay maneras de que podamos evitar esto mediante catcheo de excepciones, aunque puede ser a veces que pueda morir por otras razones, con lo cual a veces es mejor dejar de morir un actor solo&#8230;&#8203; Entonces que hago para poder volver a levantar un actor que se murió sin que tenga que hacerlo uno a mano? Hay un módulo de OTP que veremos en la próxima sección que nos ayuda con este tema y son los supervisores.</p>
</div>
<div class="paragraph">
<p>Más info sobre errores en el ecosistema de Erlang/Elixir <a href="https://learnyousomeerlang.com/errors-and-exceptions#not-so-fast">aqui</a></p>
</div>
<div class="paragraph">
<p>Adicional:</p>
</div>
<div class="paragraph">
<p>Leer principalmente la primera parte que describe brevemente el paradigma de actores junto con actores en Erlang y el scheduling en Erlang.</p>
</div>
<div class="paragraph">
<p><a href="https://rocketeer.be/articles/concurrency-in-erlang-scala/" class="bare">rocketeer.be/articles/concurrency-in-erlang-scala/</a></p>
</div>
</div>
</div>`;export{e as default};
