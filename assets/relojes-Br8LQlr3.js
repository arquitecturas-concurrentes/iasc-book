var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p>Los sistemas distribuidos usan marcas de tiempo para registrar eventos, medir duraciones, expirar datos y coordinar tareas. Sin embargo, cada máquina mantiene su propio reloj, y la comunicación entre ellas tiene demoras variables. Por eso no existe, en general, un reloj físico perfecto y compartido que permita ordenar todos los eventos con exactitud.</p>
</div>
<div class="paragraph">
<p>En un modelo físico ideal, un reloj local <code>C_i(t)</code> mostraría para un instante real <code>t</code> exactamente el mismo valor que todos los demás relojes. En la práctica, cada reloj aproxima ese tiempo con un offset y una tasa de avance propios. La sincronización puede acotar la diferencia entre relojes, pero toda cota depende de supuestos sobre las fuentes de tiempo, la red y el intervalo entre correcciones. Un programa distribuido debe diseñarse considerando esa incertidumbre, no suponiendo que los relojes son idénticos.</p>
</div>
<div class="paragraph">
<p>Conviene distinguir dos problemas:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Medir tiempo físico:</strong> aproximar la hora civil o el tiempo transcurrido y sincronizar relojes de distintas máquinas.</p>
</li>
<li>
<p><strong>Representar orden lógico:</strong> describir relaciones causales entre eventos, aunque no se conozca la hora exacta en que ocurrieron.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Un timestamp de pared puede ser útil para mostrar una fecha o comparar registros con tolerancia conocida. No basta, por sí solo, para demostrar que un evento de un nodo ocurrió antes que otro en una máquina distinta.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_relojes_físicos_hora_offset_y_deriva"><a class="anchor" href="#_relojes_físicos_hora_offset_y_deriva"></a>Relojes físicos: hora, offset y deriva</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un reloj físico de computadora cuenta oscilaciones de un componente electrónico y las convierte en unidades de tiempo. Puede representar una hora de calendario, pero su marcha no coincide exactamente con la de una referencia ideal. Dos propiedades ayudan a describir el error:</p>
</div>
<div class="ulist">
<ul>
<li>
<p>El <strong>offset</strong> es la diferencia entre la hora indicada por el reloj y una referencia en un instante determinado.</p>
</li>
<li>
<p>La <strong>deriva</strong> (<strong>clock drift</strong>) es la variación de esa diferencia a lo largo del tiempo. La frecuencia del oscilador puede ser algo mayor o menor que la nominal y cambiar con la temperatura, el envejecimiento y las condiciones eléctricas.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La deriva suele expresarse en partes por millón (ppm). Un error de frecuencia de <code>1 ppm</code> acumula aproximadamente <code>86,4 ms</code> por día si no se corrige; <code>50 ppm</code> equivaldría a unos <code>4,32 s</code> por día. Es un ejemplo de acumulación, no una especificación universal de los relojes de computadora: la precisión real depende del dispositivo y del entorno.</p>
</div>
<div class="paragraph">
<p>La <strong>exactitud</strong> describe cuán cerca está una medición de la referencia; la <strong>precisión</strong> se relaciona con la repetibilidad de las mediciones, y la <strong>resolución</strong> indica el menor incremento que el reloj puede representar. Un reloj con muchos dígitos puede tener alta resolución y, aun así, estar desfasado respecto de UTC.</p>
</div>
<div class="paragraph">
<p>Una idealización útil es modelar un reloj como <code>C_i(t) = α_i t + β_i</code>: <code>β_i</code> representa un offset inicial y <code>α_i</code> una tasa de avance ligeramente distinta de uno. La sincronización corrige o estima ambos errores, aunque el offset puede cambiar mientras transcurre el tiempo. Si se conoce una cota de deriva <code>ρ</code> y pasan <code>Δt</code> segundos sin sincronizar, el error puede crecer aproximadamente hasta <code>ρ × Δt</code>, además de los errores iniciales y de medición. La cota concreta depende del hardware y de las condiciones de operación.</p>
</div>
<div class="paragraph">
<p>En esa estimación, <code>ρ</code> representa una cota sobre el valor absoluto del error de frecuencia, no su signo. Por ejemplo, si un reloj puede desviarse hasta <code>20 ppm</code>, en una hora su error por deriva podría aumentar hasta aproximadamente <code>72 ms</code> (<code>20 × 10⁻⁶ × 3600 s</code>), incluso si en el instante de sincronización tenía offset cero. Al sincronizar relojes de dos máquinas, las cotas de error de ambas contribuyen a la diferencia máxima entre ellas.</p>
</div>
<div class="paragraph">
<p>Esta diferencia también ayuda a separar <strong>deriva</strong> y <strong>salto</strong>: la deriva acumula gradualmente error de frecuencia; un salto cambia de manera abrupta el valor del reloj, por ejemplo, por un ajuste manual o una corrección de sincronización. Una aplicación que calcula una duración restando dos lecturas del reloj de pared puede obtener un resultado negativo o excesivamente grande si ocurre un salto en medio de la medición. En cambio, para registrar que un evento ocurrió «a las 14:30 UTC» se necesita una referencia de calendario, no solo el contador monotónico local.</p>
</div>
<div class="sect2">
<h3 id="_sincronización_a_través_de_una_red"><a class="anchor" href="#_sincronización_a_través_de_una_red"></a>Sincronización a través de una red</h3>
<div class="paragraph">
<p>Una sincronización puede perseguir dos objetivos diferentes. La <strong>sincronización externa</strong> intenta que los relojes se aproximen a una referencia común, como UTC. La <strong>sincronización interna</strong> intenta que los relojes de un conjunto se mantengan próximos entre sí, aunque todos se aparten de UTC. Una cota de <strong>desfase máximo</strong> (<strong>skew</strong>) limita cuánto pueden diferir dos relojes del grupo. Tener un buen promedio no basta: para ordenar eventos interesa conocer la incertidumbre de cada lectura y, en muchos casos, una cota para el peor par de relojes.</p>
</div>
<div class="paragraph">
<p>Un algoritmo de sincronización usa mensajes para estimar la diferencia entre relojes. La demora de red limita la calidad de esa estimación: en una red asíncrona, el receptor no conoce con exactitud cuánto tardó cada tramo del viaje ni si ambos sentidos tuvieron la misma latencia. Aunque el tiempo de ida y vuelta sea medible, no necesariamente se divide en partes iguales: el camino puede estar congestionado en un solo sentido, los paquetes pueden esperar en colas y el emisor o receptor pueden demorarse en procesarlos.</p>
</div>
<div class="paragraph">
<p>El algoritmo de Cristian consulta un servidor de tiempo. Si el cliente envía la solicitud en <code>t0</code>, recibe la respuesta en <code>t1</code> y el servidor incluye su hora <code>T</code>, el cliente puede estimar el tiempo de tránsito como <code>(t1 - t0) / 2</code> y ajustar su reloj aproximadamente a <code>T + (t1 - t0) / 2</code>. Esa operación supone que las demoras de ida y vuelta son suficientemente simétricas y que el servidor tiene una referencia adecuada. Si la ida demora 10 ms y la vuelta 50 ms, sumar la mitad del RTT sobrecorrige en unos 20 ms respecto de la demora real de retorno. El tiempo de ida y vuelta, por lo tanto, da contexto sobre la incertidumbre, no una garantía de exactitud <a href="#Cristian1989" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Cristian1989]</a>.</p>
</div>
<div class="paragraph">
<p>Un método de coordinación interna, asociado al algoritmo de Berkeley, elige un coordinador que consulta los relojes de los participantes, estima sus diferencias y propone correcciones para que el grupo se acerque a un tiempo promedio. A diferencia de consultar un reloj atómico o una fuente UTC, el objetivo principal es mantener sincronizados entre sí los nodos del grupo. El promedio puede excluir lecturas atípicas, pero el resultado sigue dependiendo de las demoras de las consultas y de la calidad del coordinador <a href="#GusellaZatti1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GusellaZatti1987]</a>.</p>
</div>
<div class="paragraph">
<p>Network Time Protocol (NTP) intercambia cuatro marcas de tiempo. Si el cliente envía en <code>t1</code>, el servidor recibe en <code>t2</code>, responde en <code>t3</code> y el cliente recibe en <code>t4</code>, se pueden estimar el offset <code>θ</code> y el retardo de ida y vuelta <code>δ</code>:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">offset estimado, θ = ((t2 - t1) + (t3 - t4)) / 2</code></pre>
</div>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">retardo estimado, δ = (t4 - t1) - (t3 - t2)</code></pre>
</div>
</div>
<div class="paragraph">
<p>El cálculo estima el offset suponiendo que las demoras de red en ambos sentidos son parecidas. NTP además combina mediciones de varias fuentes y filtra muestras; sus algoritmos y formatos se especifican en el RFC 5905 <a href="#NTPRFC5905" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[NTPRFC5905]</a>. La sincronización reduce el error, pero no elimina la incertidumbre de la red ni garantiza un tiempo global exacto.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, supongamos que el cliente registra <code>t1 = 1000,000 s</code>; el servidor recibe la consulta en <code>t2 = 1000,120 s</code>, responde en <code>t3 = 1000,125 s</code>, y el cliente recibe la respuesta en <code>t4 = 1000,045 s</code>. El offset estimado es <code>120 ms) + (80 ms / 2 = 100 ms</code>, y el retardo estimado es <code>45 ms - 5 ms = 40 ms</code>. Si las demoras de red fueron 20 ms en cada sentido, el cálculo recupera el offset de 100 ms. Si los caminos fueran asimétricos, la estimación también reflejaría esa diferencia como error.</p>
</div>
<div class="paragraph">
<p>Con esta convención, un <code>θ</code> positivo indica que el reloj del servidor está adelantado respecto del cliente, por lo que el cliente debería avanzar su lectura para aproximarse al servidor. En una implementación real, el resultado se acompaña de una estimación de dispersión y se compara con otras muestras y fuentes. Una muestra con RTT grande suele ofrecer menos información sobre el offset que una muestra con RTT bajo, porque hay más oportunidad para que la demora variable y las colas distorsionen la estimación. Sin embargo, elegir solo la muestra más rápida tampoco basta para protegerse de una fuente de tiempo equivocada o de una ruta sistemáticamente asimétrica.</p>
</div>
<div class="paragraph">
<p>En un esquema de <strong>unidifusión</strong>, cada cliente intercambia mensajes con una fuente y puede estimar el retardo de ida y vuelta. En un esquema de <strong>broadcast de NTP</strong>, un emisor difunde periódicamente su hora a muchos receptores. Este modo reduce la necesidad de solicitudes individuales, pero los receptores no miden por separado el trayecto de ida; la asimetría y la demora de red limitan la precisión, a menos que se incorporen mediciones o supuestos adicionales. NTP define modos de comunicación que incluyen broadcast, pero el modo no elimina esas fuentes de error <a href="#NTPRFC5905" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[NTPRFC5905]</a>. Esta sincronización por difusión es distinta del <strong>broadcast confiable</strong> y de los algoritmos de orden de mensajes desarrollados en la página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/broadcast/">broadcast distribuido</a>.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/relojes-ntp.svg" alt="Intercambio de cuatro marcas de tiempo utilizado para estimar offset y retardo en NTP" width="760">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_jerarquía_ntp_y_límites_de_la_hora_civil"><a class="anchor" href="#_jerarquía_ntp_y_límites_de_la_hora_civil"></a>Jerarquía NTP y límites de la hora civil</h3>
<div class="paragraph">
<p>NTP organiza las fuentes en <strong>estratos</strong> (<strong>strata</strong>). Un servidor de estrato 1 se sincroniza directamente con una fuente de referencia, como un reloj atómico o un receptor GNSS; uno de estrato 2 toma su referencia de uno o más servidores de estrato 1, y así sucesivamente. El número de estrato expresa distancia lógica a una referencia, no constituye por sí solo una medida de precisión o calidad. La selección de fuentes también considera la incertidumbre y el comportamiento observado <a href="#NTPRFC5905" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[NTPRFC5905]</a>.</p>
</div>
<div class="paragraph">
<p>En la terminología NTP, una fuente <strong>stratum 0</strong> es el dispositivo de referencia, como un reloj atómico o un receptor GNSS; por lo común no es un servidor NTP de red. Un servidor conectado directamente a ella anuncia estrato 1. Por tanto, elegir un servidor con un número de estrato bajo no garantiza automáticamente que sea la mejor referencia: también importan su error estimado, estabilidad, diversidad respecto de otras fuentes y el estado de sincronización.</p>
</div>
<div class="paragraph">
<p>En operación, los clientes pueden consultar varias fuentes para detectar lecturas incoherentes, reducir el efecto de una fuente defectuosa y elegir una estimación más robusta. Los filtros y la disciplina del reloj ajustan gradualmente la frecuencia o el valor mostrado según la implementación. Un salto grande puede ser necesario al iniciar un equipo muy desfasado, mientras que correcciones pequeñas suelen aplicarse de forma gradual para evitar que el reloj de pared retroceda. La convergencia toma tiempo y no debe tratarse como una propiedad instantánea del arranque.</p>
</div>
<div class="paragraph">
<p>Los sistemas operativos suelen exponer tanto un reloj de pared como un reloj monotónico. El primero intenta representar la hora civil y puede ajustarse por sincronización o administración; el segundo mide duraciones dentro de una máquina y no debe retroceder ante esos ajustes. Para timeouts y mediciones de intervalo conviene usar un reloj monotónico. Su valor no se compara directamente con el de otro nodo. Algunos entornos ofrecen además un reloj monotónico que incluye el tiempo de suspensión del equipo; la elección depende de si el timeout debe vencer mientras el sistema estaba suspendido.</p>
</div>
<div class="paragraph">
<p>La hora civil también incorpora decisiones de calendario, zonas horarias y segundos intercalares.</p>
</div>
</div>
<div class="sect2">
<h3 id="_segundos_intercalares_leap_seconds"><a class="anchor" href="#_segundos_intercalares_leap_seconds"></a>Segundos intercalares (<strong>leap seconds</strong>)</h3>
<div class="paragraph">
<p>La rotación de la Tierra no es perfectamente uniforme. Para mantener el tiempo civil UTC cerca del tiempo de rotación terrestre, históricamente se han añadido segundos intercalares cuando lo determina la autoridad internacional de referencia. Un <strong>segundo intercalar positivo</strong> se inserta al final de un mes UTC: la secuencia de etiquetas de tiempo puede pasar, por ejemplo, de <code>23:59:59</code> a <code>23:59:60</code> y luego a <code>00:00:00</code>. No ocurre todos los años ni en una fecha que las aplicaciones deban predecir por su cuenta. La decisión y la fecha se anuncian mediante boletines oficiales del IERS; las reglas de UTC y de las señales horarias se describen en la recomendación ITU-R TF.460 <a href="#ITU460" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ITU460]</a>.</p>
</div>
<div class="paragraph">
<p>El segundo <code>23:59:60</code> no es una hora de zona horaria ni un error de formato: representa un segundo adicional dentro de UTC. Sin embargo, no todas las bibliotecas, bases de datos o formatos de timestamp pueden expresarlo directamente. Un sistema puede representar ese instante con una etiqueta especial, mapearlo a otra escala de tiempo o aplicar una política de <strong>leap smear</strong>, que distribuye gradualmente el ajuste alrededor del evento. El <strong>smear</strong> evita que el reloj de pared repita o salte un segundo de golpe, pero durante el intervalo usa una escala que difiere de UTC; dos servicios que utilicen estrategias de smear distintas podrían discrepar temporalmente.</p>
</div>
<div class="paragraph">
<p>La respuesta depende del reloj y de la aplicación. Algunos sistemas ajustan el reloj de pared en el instante indicado, otros lo corrigen de forma gradual y algunos entornos ignoran el ajuste si no reciben la notificación correspondiente. NTP incluye indicadores para comunicar la proximidad de un segundo intercalar; esos indicadores informan al cliente, pero la conducta final depende de la implementación y la configuración <a href="#NTPRFC5905" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[NTPRFC5905]</a>. Por eso no conviene asumir que todos los servidores, sistemas operativos y servicios representan ese segundo de la misma manera.</p>
</div>
<div class="paragraph">
<p>Los efectos aparecen en código que supone que cada día tiene exactamente <code>86 400</code> segundos, en comparaciones de timestamps alrededor del evento, en claves construidas a partir de la hora y en tareas programadas para una hora de pared. Un reloj de pared puede repetir una etiqueta o presentar un ajuste; los cronómetros basados en tiempo monotónico deben seguir midiendo duraciones sin depender de esa corrección. Para tareas de calendario, se debe conservar la fecha UTC o local y aplicar las reglas del sistema temporal utilizado; para medir cuánto tardó una operación, se deben restar lecturas de un reloj monotónico.</p>
</div>
<div class="sect3">
<h4 id="_caso_de_estudio_el_segundo_intercalar_de_2012"><a class="anchor" href="#_caso_de_estudio_el_segundo_intercalar_de_2012"></a>Caso de estudio: el segundo intercalar de 2012</h4>
<div class="paragraph">
<p>El 30 de junio de 2012 se insertó un segundo intercalar positivo. El instante adicional fue <code>23:59:60 UTC</code>; en el Reino Unido, que en esa fecha usaba el horario de verano británico (BST, UTC+1), correspondió a <code>00:59:60</code> del 1 de julio. Por eso el evento ocurrió durante la noche británica del 30 de junio al 1 de julio, aunque no exactamente a la medianoche local. La fecha de inserción figura en el registro del NIST <a href="#NISTLeapSeconds" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[NISTLeapSeconds]</a>.</p>
</div>
<div class="paragraph">
<p>Alrededor de ese instante se informaron interrupciones o degradaciones en distintos servicios en línea y sistemas de reservas de aerolíneas. La cobertura contemporánea mencionó, entre otros, a Qantas, Reddit y Mozilla <a href="#GuardianLeap2012" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GuardianLeap2012]</a>. Esto no significa que Internet colapsara por completo ni demuestra que todos esos incidentes tuvieran una única causa: el segundo intercalar fue el evento común, pero los sistemas y sus modos de falla eran distintos.</p>
</div>
<div class="paragraph">
<p>En el caso investigado por Reddit, algunos servidores Linux se volvieron extremadamente lentos y sus CPU quedaron ocupadas. El análisis técnico atribuyó ese comportamiento a un error en el subsistema del kernel llamado <strong>hrtimer</strong> (<strong>high-resolution timer</strong>), activado al procesar el cambio temporal. La ruta de código se ejecutaba con poca frecuencia; aunque ya había una corrección disponible en el kernel antes del evento, no todas las instalaciones la habían incorporado <a href="#WiredLeap2012" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[WiredLeap2012]</a> y <a href="#StultzLeap2012" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[StultzLeap2012]</a>. La evidencia disponible no permite atribuir automáticamente ese mismo defecto a los sistemas de reservas de Qantas ni a cada servicio afectado.</p>
</div>
<div class="paragraph">
<p>El episodio muestra que una convención temporal puede convertirse en una condición de borde operacional: el riesgo no reside en que el segundo adicional sea incorrecto, sino en supuestos y rutas de código que casi nunca se ejercitan. Las lecciones prácticas son probar con anticipación el tratamiento del evento en la combinación real de kernel, bibliotecas y aplicaciones; desplegar las correcciones pertinentes; vigilar uso de CPU y temporizadores; y acordar una política de tiempo entre servicios, especialmente si algunos aplican <strong>leap smear</strong>. Para medir intervalos y vencimientos locales, el código debe continuar usando relojes monotónicos, no restas de hora civil.</p>
</div>
<div class="paragraph">
<p>Una marca de tiempo UTC es una representación útil para humanos e interoperabilidad, pero no es un contador monótono universal: ajustes del reloj pueden repetir o saltar valores. La zona horaria es una regla de presentación y conversión, no una propiedad que deba incorporarse al cálculo de duraciones. Las aplicaciones deben definir cómo manejan ajustes, segundos intercalares y conversiones de calendario en expiraciones, registros y operaciones sensibles al tiempo.</p>
</div>
<div class="paragraph">
<p>Los timestamps físicos son especialmente delicados cuando se usan para elegir «la última escritura». Si dos servidores tienen un error de reloj distinto, la operación que ocurrió después puede recibir una marca anterior y perder ante una actualización vieja. Una marca de tiempo puede ser un criterio práctico si se conoce el error máximo y se acepta su semántica, pero no sustituye un protocolo de orden, una versión causal ni una política de resolución de conflictos.</p>
</div>
<div class="paragraph">
<p>Si un reloj informa <code>T</code> y su error está acotado por <code>ε</code>, el instante real estimado pertenece al intervalo <code>[T - ε, T + ε]</code>. Por ejemplo, con una lectura <code>10:00:00.100 ± 20 ms</code>, el instante estaría entre <code>10:00:00.080</code> y <code>10:00:00.120</code>. Si otra lectura tiene intervalo <code>[10:00:00.180, 10:00:00.220]</code>, los intervalos no se superponen y las cotas permiten inferir cuál evento ocurrió primero en tiempo físico. Si los intervalos se superponen, las marcas no alcanzan para ordenarlos. Incluso cuando un evento ocurrió físicamente antes, eso no prueba que haya causado al otro: la causalidad requiere una relación de proceso o de comunicación, como la relación de Lamport definida más adelante.</p>
</div>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_relojes_lógicos_representar_causalidad"><a class="anchor" href="#_relojes_lógicos_representar_causalidad"></a>Relojes lógicos: representar causalidad</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Para razonar sobre el orden de eventos no siempre hace falta conocer la hora física. Lamport define la relación <strong>ocurrió antes que</strong> (<code>→</code>): si dos eventos pertenecen al mismo proceso, se ordenan según la ejecución; el envío de un mensaje precede a su recepción; y la relación es transitiva. Si no puede establecerse ninguna de esas relaciones entre dos eventos, son concurrentes desde la información disponible <a href="#Lamport1978" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Lamport1978]</a>.</p>
</div>
<div class="paragraph">
<p>La relación es un orden parcial: algunos pares de eventos se pueden comparar y otros no. Que dos eventos sean concurrentes no significa necesariamente que ocurrieran en el mismo instante físico; significa que ninguno causó al otro según el orden local y los mensajes observados. Una fecha física podría sugerir cuál ocurrió primero, pero solo con una incertidumbre conocida suficientemente pequeña se podría usar para distinguirlos con confianza.</p>
</div>
<div class="paragraph">
<p>Un <strong>reloj de Lamport</strong> asigna un contador a cada proceso. Para un evento local o para enviar un mensaje, el proceso incrementa su contador y adjunta el valor al mensaje saliente. Al recibir un mensaje con marca <code>m</code>, actualiza el contador a <code>max(local, m) + 1</code> antes de registrar el evento de recepción. Esta regla asegura que el envío y sus causas tengan marcas menores que la recepción. Así, si <code>a → b</code>, entonces <code>L(a) &lt; L(b)</code>. La implicación inversa no vale: <code>L(a) &lt; L(b)</code> no demuestra causalidad, porque una relación numérica puede aparecer entre eventos concurrentes.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, A registra el evento <code>a</code> con contador <code>1</code> y luego envía un mensaje con contador <code>2</code>. Mientras tanto, B registra un evento local <code>b</code> con contador <code>1</code>, sin haber recibido ese mensaje. <code>a</code> y <code>b</code> son concurrentes aunque la numeración coincida. Cuando B recibe el mensaje, actualiza su reloj a <code>max(1, 2) + 1 = 3</code>; el evento de recepción queda después del envío. Si una aplicación necesita un orden total reproducible, puede ordenar por <code>(contador, identificador del nodo)</code>, pero ese desempate solo construye una secuencia determinista: no convierte eventos concurrentes en causalmente relacionados.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book/img/distribucion/relojes-logicos.svg" alt="Eventos concurrentes y relación causal representados con relojes vectoriales" width="760">
</div>
</div>
<div class="sect2">
<h3 id="_relojes_vectoriales"><a class="anchor" href="#_relojes_vectoriales"></a>Relojes vectoriales</h3>
<div class="paragraph">
<p>Un reloj vectorial mantiene un contador por proceso. Un vector <code>V_i</code> en el proceso <code>i</code> resume qué cantidad de eventos de cada proceso conoce <code>i</code>. Antes de un evento local, el proceso incrementa su propia componente. Al enviar un mensaje, adjunta una copia del vector. Al recibir un vector, toma el máximo componente por componente entre el vector local y el recibido, y luego incrementa su propia componente para representar la recepción. En un grupo fijo de procesos:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><code>V(a) &lt; V(b)</code> si cada componente de <code>V(a)</code> es menor o igual que la correspondiente de <code>V(b)</code> y al menos una es estrictamente menor. Esto representa que <code>a</code> precede causalmente a <code>b</code>.</p>
</li>
<li>
<p>Si ninguno de los vectores es menor que el otro, los eventos son concurrentes según la información registrada.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Por ejemplo, <code>[1,0]</code> y <code>[0,1]</code> son incomparables: cada proceso registró un evento sin conocer el del otro. Cuando un mensaje transmite la primera actualización al segundo proceso, el vector recibido permite registrar que el evento remoto precedió a la recepción. Los relojes vectoriales capturan más información causal que un único contador, a cambio de mantener metadatos cuyo tamaño depende de la membresía <a href="#Fidge1988" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Fidge1988]</a>.</p>
</div>
<div class="paragraph">
<p>Con dos procesos <code>A</code> y <code>B</code>, supongamos que cada uno inicia con <code>[0,0]</code>. A registra un cambio y obtiene <code>[1,0]</code>; B, sin conocerlo, registra otro cambio y obtiene <code>[0,1]</code>. Los vectores son incomparables, así que las actualizaciones son concurrentes. Si B recibe después el mensaje de A, combina <code>[0,1]</code> con <code>[1,0]</code>, obtiene <code>[1,1]</code> y al registrar la recepción incrementa su componente: <code>[1,2]</code>. Los eventos previos de ambos quedan reflejados en la nueva versión.</p>
</div>
<div class="paragraph">
<p>Esta comparación permite detectar si una versión es anterior a otra o si ambas contienen cambios concurrentes, y se usa como fundamento de algunas versiones causales y contextos de causalidad. No decide cómo resolver los conflictos. Una base de datos puede conservar ambas actualizaciones para que la aplicación las combine, aplicar una regla determinista o usar una estructura de datos diseñada para converger. Además, los vectores completos crecen con el número de participantes; sistemas con membresía grande o dinámica pueden usar versiones compactas, metadatos causales parciales u otras representaciones con compromisos distintos. La política de resolución pertenece al sistema de datos, no al reloj.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_reloj_usar_en_cada_problema"><a class="anchor" href="#_qué_reloj_usar_en_cada_problema"></a>Qué reloj usar en cada problema</h2>
<div class="sectionbody">
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="20%">
<col width="40%">
<col width="40%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Necesidad</th>
<th class="tableblock halign-left valign-top">Mecanismo apropiado</th>
<th class="tableblock halign-left valign-top">Límite importante</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mostrar fecha y hora de un evento</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reloj de pared sincronizado, junto con su incertidumbre cuando sea relevante</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Dos timestamps cercanos no establecen necesariamente orden causal.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Medir un timeout o una duración local</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reloj monotónico del sistema operativo</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">No se compara directamente entre máquinas.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Comprobar precedencia causal</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reloj lógico de Lamport o vectorial, según el detalle necesario</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">No mide segundos transcurridos.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Coordinar una fecha límite global</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Relojes físicos sincronizados y una política explícita para el error</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La sincronización y la red tienen incertidumbre; no hay exactitud absoluta.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>Un sistema puede combinar mecanismos: usar hora física para observabilidad y vencimientos aproximados, un reloj monotónico para temporizadores, y metadatos causales para detectar relaciones entre actualizaciones. No conviene ordenar operaciones de negocio únicamente por timestamps de nodos distintos, salvo que el sistema documente las cotas de error y las reglas de desempate.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="Cristian1989"></a>[Cristian1989] CRISTIAN, Flaviu. «Probabilistic Clock Synchronization». <strong>Distributed Computing</strong>, 3, 1989, pp. 146–158. <a href="https://doi.org/10.1007/BF01784024">DOI</a>.</p>
</li>
<li>
<p><a id="Fidge1988"></a>[Fidge1988] FIDGE, Colin J. «Timestamps in Message-Passing Systems That Preserve the Partial Ordering». <strong>Australian Computer Science Communications</strong>, 10(1), 1988, pp. 56–66.</p>
</li>
<li>
<p><a id="GusellaZatti1987"></a>[GusellaZatti1987] GUSELLA, Riccardo y ZATTI, Stefano. «The Accuracy of the Clock Synchronization Achieved by TEMPO in Berkeley UNIX 4.3BSD». Computer Science Division, University of California, Berkeley, Report UCB/CSD 87/337, 1987.</p>
</li>
<li>
<p><a id="GuardianLeap2012"></a>[GuardianLeap2012] THE GUARDIAN. «Leap second hits Qantas air bookings, while Reddit and Mozilla stutter». 2 de julio de 2012. <a href="https://news.google.com/search?q=%22leap+second+hits+Qantas+air+bookings%22">Registro de búsqueda del artículo</a>.</p>
</li>
<li>
<p><a id="ITU460"></a>[ITU460] ITU-R. «Standard-frequency and time-signal emissions». Recommendation ITU-R TF.460-6, 2002. <a href="https://www.itu.int/rec/R-REC-TF.460/en">Recomendación</a>.</p>
</li>
<li>
<p><a id="Lamport1978"></a>[Lamport1978] LAMPORT, Leslie. «Time, Clocks, and the Ordering of Events in a Distributed System». <strong>Communications of the ACM</strong>, 21(7), 1978, pp. 558–565. <a href="https://doi.org/10.1145/359545.359563">DOI</a>.</p>
</li>
<li>
<p><a id="NISTLeapSeconds"></a>[NISTLeapSeconds] NATIONAL INSTITUTE OF STANDARDS AND TECHNOLOGY. «Leap Seconds». <a href="https://www.nist.gov/pml/time-and-frequency-division/time-realization/leap-seconds">Registro de segundos intercalares</a>.</p>
</li>
<li>
<p><a id="NTPRFC5905"></a>[NTPRFC5905] MILLS, David; MARTIN, Jim; BURBANK, Jack; y KASCH, William. «Network Time Protocol Version 4: Protocol and Algorithms Specification». RFC 5905, 2010. <a href="https://www.rfc-editor.org/rfc/rfc5905">RFC Editor</a>.</p>
</li>
<li>
<p><a id="StultzLeap2012"></a>[StultzLeap2012] STULTZ, John. «[PATCH] time: Avoid making timekeeping adjustments in the future». Linux Kernel Mailing List, 1 de julio de 2012. <a href="https://lkml.org/lkml/2012/7/1/203">Mensaje técnico</a>.</p>
</li>
<li>
<p><a id="WiredLeap2012"></a>[WiredLeap2012] WIRED. «Leap Second Glitch Explained». 2 de julio de 2012. <a href="https://www.wired.com/2012/07/leap-second-glitch-explained">Artículo y análisis técnico del incidente</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};