var e=`<div class="sect1">
<h2 id="_introducción"><a class="anchor" href="#_introducción"></a>Introducción</h2>
<div class="sectionbody">
<div class="paragraph">
<p>El <strong>modelo de actores</strong> es un modelo de computación concurrente que describe un sistema como un conjunto de entidades autónomas —los <strong>actores</strong>— que interactúan mediante el envío de mensajes. Fue propuesto como un formalismo para razonar sobre computaciones concurrentes y, con el tiempo, se convirtió también en una influencia importante para el diseño de lenguajes y sistemas distribuidos <a href="#HewittBishopSteiger1973" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[HewittBishopSteiger1973]</a> <a href="#Agha1986" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Agha1986]</a>.</p>
</div>
<div class="paragraph">
<p>Esta introducción presenta sus conceptos generales y luego los relaciona con los procesos de Erlang/Elixir. Conviene distinguir ambos niveles: el modelo es una abstracción de computación, mientras que los procesos de una máquina virtual concreta son una implementación con decisiones y garantías propias.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_el_actor_y_su_comportamiento"><a class="anchor" href="#_el_actor_y_su_comportamiento"></a>El actor y su comportamiento</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un actor combina una identidad con un comportamiento. Su identidad permite que otros actores lo designen como destinatario de mensajes; su comportamiento determina cómo procesa los mensajes que recibe. En las formulaciones clásicas, al procesar un mensaje un actor puede:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>enviar mensajes a otros actores;</p>
</li>
<li>
<p>crear nuevos actores;</p>
</li>
<li>
<p>definir el comportamiento que tendrá al procesar mensajes futuros.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>El actor también puede mantener estado. Ese estado es privado: otros actores no lo modifican directamente, sino que solicitan cambios mediante mensajes. De este modo, el comportamiento de un actor puede actualizar su propio estado en respuesta a los mensajes que procesa. Este principio se parece al encapsulamiento de la programación orientada a objetos, pero la interacción no consiste en invocar directamente un método sobre un objeto compartido: el emisor envía un mensaje y el receptor decide cuándo y cómo atenderlo.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/actors.png" alt="actors">
</div>
</div>
<div class="paragraph">
<p>La identidad no debe confundirse necesariamente con una dirección física ni con un identificador global. La forma de nombrar y localizar actores depende del sistema: por ejemplo, Erlang usa identificadores de proceso (PID) para dirigir mensajes a procesos locales o remotos. Tampoco es necesario que cada actor corresponda a un hilo del sistema operativo; esa decisión pertenece a la implementación.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_mensajes_buzones_y_concurrencia"><a class="anchor" href="#_mensajes_buzones_y_concurrencia"></a>Mensajes, buzones y concurrencia</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En el modelo, el envío de mensajes es asincrónico: el emisor puede continuar sin esperar a que el destinatario procese el mensaje. El mensaje establece una forma de comunicación entre unidades independientes, sin compartir directamente el estado privado del receptor. Si una interacción requiere una respuesta, puede construirse un protocolo de solicitud y respuesta: el emisor envía una solicitud y, más adelante, recibe otro mensaje con el resultado. Que una API presente esa interacción como una llamada sincrónica no significa que el modelo subyacente haya dejado de usar mensajes.</p>
</div>
<div class="paragraph">
<p>Una implementación habitual mantiene para cada actor un <strong>buzón</strong> (mailbox), donde se almacenan los mensajes pendientes. Cuando llegan mensajes más rápido de lo que el actor puede procesarlos, estos se acumulan; el actor los atiende de acuerdo con las reglas de su implementación. Por ejemplo, los procesos de Erlang extraen mensajes de una cola mediante <code>receive</code> y pueden seleccionar un mensaje que coincida con ciertos patrones. Por eso, no se debe asumir que todos los modelos implementan los buzones exactamente igual ni que todo mensaje se procesa inmediatamente.</p>
</div>
<div class="paragraph">
<p>En una implementación que procesa un mensaje por vez para cada actor, ese actor no ejecuta simultáneamente dos cambios sobre su estado privado. Sin embargo, distintos actores sí pueden avanzar concurrentemente y, si la plataforma dispone de varios núcleos, en paralelo. Esta separación permite razonar sobre el estado local sin un bloqueo compartido por cada acceso, pero no elimina los problemas de coordinación: los actores todavía deben definir protocolos, manejar mensajes pendientes y decidir qué hacer ante demoras o fallas.</p>
</div>
<div class="paragraph">
<p>El envío asincrónico tampoco garantiza por sí solo entrega exactamente una vez, orden global, ausencia de fallas ni capacidad ilimitada del buzón. Esas propiedades dependen del entorno y del protocolo. Si un actor recibe trabajo más rápido de lo que puede completarlo, el crecimiento de su buzón puede aumentar el uso de memoria y la latencia; por ello, los sistemas reales necesitan considerar límites de carga y estrategias de control de flujo.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_diseñar_protocolos_entre_actores"><a class="anchor" href="#_diseñar_protocolos_entre_actores"></a>Diseñar protocolos entre actores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un sistema de actores no se define solo por la cantidad de procesos que crea, sino también por los <strong>protocolos</strong> que esos procesos acuerdan. Un protocolo especifica qué mensajes son válidos, qué significan, qué respuestas pueden esperarse y qué transiciones de estado produce cada mensaje. Por ejemplo, un actor que representa una cuenta podría aceptar solicitudes <code>depositar</code> y <code>consultar</code>; una solicitud de depósito debería definir qué ocurre ante un monto inválido y si el emisor recibe una confirmación.</p>
</div>
<div class="paragraph">
<p>Al diseñar estos intercambios conviene precisar:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Quién inicia y quién responde:</strong> indicar los destinatarios y, si habrá respuesta, cómo se identifica a quien la solicitó.</p>
</li>
<li>
<p><strong>Qué representa cada mensaje:</strong> definir su estructura y significado, evitando que el emisor y el receptor interpreten de manera distinta los mismos datos.</p>
</li>
<li>
<p><strong>Qué sucede ante demoras:</strong> establecer si se espera una respuesta, durante cuánto tiempo y qué significa que no llegue. Un timeout indica que la respuesta no se observó a tiempo; no demuestra que la operación no se haya ejecutado.</p>
</li>
<li>
<p><strong>Qué ocurre ante reintentos:</strong> si una solicitud puede repetirse, definir si debe ser idempotente o incluir un identificador que permita reconocer duplicados. De lo contrario, reintentar un depósito, por ejemplo, podría aplicarlo dos veces.</p>
</li>
<li>
<p><strong>Cómo se gestionan mensajes inesperados y carga:</strong> definir el tratamiento de mensajes no reconocidos, el crecimiento del buzón y la forma de limitar o regular el ritmo de producción.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Estas decisiones son parte del diseño de la aplicación, no consecuencias automáticas de usar actores. En sistemas distribuidos, además, el intercambio puede involucrar fallas de red y nodos inaccesibles; por ello, una respuesta ausente no permite concluir con certeza qué ocurrió en el receptor.</p>
</div>
<div class="sect2">
<h3 id="_ejemplo_contador_con_estado_privado"><a class="anchor" href="#_ejemplo_contador_con_estado_privado"></a>Ejemplo: contador con estado privado</h3>
<div class="paragraph">
<p>El siguiente ejemplo crea un proceso que conserva un contador. El emisor solicita incrementarlo y envía su propio PID para recibir una respuesta:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-elixir" data-lang="elixir">counter = fn
  loop, value -&gt;
    receive do
      {:increment, from} -&gt;
        next_value = value + 1
        send(from, {:value, next_value})
        loop.(loop, next_value)
    end
end

pid = spawn(fn -&gt; counter.(counter, 0) end)
send(pid, {:increment, self()})

receive do
  {:value, value} -&gt; value
end</code></pre>
</div>
</div>
<div class="paragraph">
<p>El estado <code>value</code> pertenece al proceso del contador: quien envía el mensaje no lo modifica directamente. Cada mensaje <code>{:increment, from}</code> produce una transición al estado siguiente y una respuesta <code>{:value, next_value}</code>. La recursión hace que el proceso vuelva a esperar mensajes después de atender uno; en este ejemplo no se manejan mensajes inválidos, timeouts ni terminación, simplificaciones que deben revisarse en una aplicación real. Para programas Elixir de producción, normalmente se prefieren abstracciones de OTP como <code>GenServer</code> y supervisores, que estandarizan el ciclo de vida y el manejo de fallas.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_el_modelo_de_actores_en_erlang_y_elixir"><a class="anchor" href="#_el_modelo_de_actores_en_erlang_y_elixir"></a>El modelo de actores en Erlang y Elixir</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Erlang y Elixir ofrecen procesos ligeros que comparten varias propiedades con los actores: tienen identificadores, reciben mensajes en buzones, mantienen estado local y se ejecutan sin compartir directamente su memoria con otros procesos. El envío normal de mensajes no transfiere el control al proceso receptor ni espera a que este termine su trabajo. La documentación de Erlang describe los procesos como unidades ligeras de ejecución y detalla su creación, comunicación y terminación <a href="#ErlangProcesses" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ErlangProcesses]</a>.</p>
</div>
<div class="paragraph">
<p>En BEAM, los procesos no son equivalentes a hilos del sistema operativo. Los <strong>schedulers</strong> de la máquina virtual distribuyen el trabajo de muchos procesos sobre los recursos disponibles; por lo tanto, crear un proceso no implica reservar un hilo del sistema operativo exclusivamente para él. Esta implementación permite manejar un gran número de procesos concurrentes, aunque el paralelismo efectivo depende de la configuración y los recursos de ejecución.</p>
</div>
<div class="paragraph">
<p>La correspondencia con el modelo de actores es útil, pero no debe tomarse como identidad perfecta entre teoría e implementación. Erlang/Elixir proporcionan mecanismos y convenciones concretos —como PID, <code>send</code>, <code>receive</code>, <code>spawn</code> y las abstracciones de OTP— cuyas garantías deben consultarse en su documentación. En particular, el envío asincrónico es distinto de una llamada sincrónica de <code>GenServer</code>, que construye un protocolo de solicitud y respuesta sobre la comunicación entre procesos.</p>
</div>
<div class="paragraph">
<p>Un proceso Erlang no termina simplemente porque su buzón quede vacío. Si su código llega al final, termina; si espera un mensaje en un <code>receive</code>, puede permanecer bloqueado a la espera de que llegue uno; también puede terminar por un error o por una señal de salida. Para mantener un proceso que atienda mensajes repetidamente, su comportamiento suele volver a esperar después de procesar cada mensaje. El diseño de ese ciclo y la recuperación ante fallas se desarrollan en las secciones sobre OTP y supervisión.</p>
</div>
<div class="paragraph">
<p>La concurrencia también plantea una cuestión de <strong>orden</strong>. No existe un orden global automático entre mensajes que provienen de actores distintos: si dos emisores envían mensajes al mismo destinatario, el resultado observable depende de cómo y cuándo lleguen y sean procesados. Cuando el orden importa, el protocolo debe expresarlo, por ejemplo, mediante secuencias, dependencias o una autoridad que coordine las operaciones. Las garantías concretas de orden entre procesos dependen de la plataforma y del tipo de comunicación; no deben suponerse a partir de la sola palabra «actor».</p>
</div>
<div class="paragraph">
<p>Por último, aislamiento no significa que una falla sea irrelevante para el resto del sistema. Un proceso puede fallar sin propagar una excepción por la pila de llamadas de otro proceso, pero otros actores pueden depender de sus respuestas o recibir señales de terminación según cómo estén vinculados y supervisados. En OTP, la estrategia usual es organizar procesos en árboles de supervisión para decidir cómo recuperarse ante fallas, en lugar de tratar cada proceso como una unidad sin relaciones.</p>
</div>
<div class="paragraph">
<p>Para ver un ejemplo concreto de creación y comunicación entre procesos en Elixir, puede consultarse el <a href="https://github.com/arquitecturas-concurrentes/iasc-actors-intro-elixir/blob/master/intro_actors/lib/intro_actors.ex">ejemplo introductorio</a>. La documentación oficial de Elixir también presenta los procesos y sus mecanismos de comunicación <a href="#ElixirProcesses" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ElixirProcesses]</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="HewittBishopSteiger1973"></a>[HewittBishopSteiger1973] HEWITT, Carl; BISHOP, Peter; STEIGER, Richard. «A Universal Modular ACTOR Formalism for Artificial Intelligence». <strong>Proceedings of the 3rd International Joint Conference on Artificial Intelligence (IJCAI)</strong>, 1973, pp. 235–245.</p>
</li>
<li>
<p><a id="Agha1986"></a>[Agha1986] AGHA, Gul. <strong>Actors: A Model of Concurrent Computation in Distributed Systems</strong>. Cambridge, MA: MIT Press, 1986.</p>
</li>
<li>
<p><a id="Hewitt2010"></a>[Hewitt2010] HEWITT, Carl. «Actor Model of Computation: Scalable Robust Information Systems». <strong>Communications of the ACM</strong>, 53(5), 2010, pp. 74–81. <a href="https://doi.org/10.1145/1624775.1624804">DOI</a>.</p>
</li>
<li>
<p><a id="ErlangProcesses"></a>[ErlangProcesses] ERLANG/OTP. «Processes». <strong>Erlang Reference Manual</strong>. <a href="https://www.erlang.org/doc/system/ref_man_processes.html">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="ElixirProcesses"></a>[ElixirProcesses] ELIXIR. «Process». <strong>Elixir Documentation</strong>. <a href="https://hexdocs.pm/elixir/Process.html">Documentación oficial</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};