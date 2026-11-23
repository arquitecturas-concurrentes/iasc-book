var e=`<div class="sect1">
<h2 id="_resumen"><a class="anchor" href="#_resumen"></a>Resumen</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema distribuido, las decisiones suelen involucrar a procesos que no comparten memoria ni tienen una visión completa de lo que ocurre. Cada uno conoce su propio estado y recibe noticias de los demás a través de mensajes que pueden retrasarse, perderse o llegar después de una falla. El problema aparece cuando esas decisiones deben ser compatibles: no basta con que cada proceso funcione correctamente por separado; también hace falta que el conjunto se comporte de manera coherente.</p>
</div>
<div class="paragraph">
<p>Este texto distingue tres conceptos que a menudo se mezclan. El <strong>consenso distribuido</strong> trata de lograr que distintos procesos acuerden un valor. La <strong>votación</strong> es una forma de reunir respuestas o compromisos locales, pero no determina por sí sola el resultado. La <strong>confirmación atómica</strong> (<strong>atomic commitment</strong>) se ocupa de decidir si una transacción distribuida se confirma por completo o se aborta, sin dejar resultados definitivos contradictorios entre sus participantes.</p>
</div>
<div class="paragraph">
<p>A partir de esa diferencia, estudiaremos la confirmación en dos fases (<strong>Two-Phase Commit</strong>, 2PC) y en tres fases (<strong>Three-Phase Commit</strong>, 3PC). Veremos cómo intercambian mensajes, qué estados deben conservar y qué sucede cuando una máquina falla en un momento delicado. También explicaremos por qué 2PC necesita que todos los participantes estén preparados, mientras que los protocolos de consenso como Paxos y Raft utilizan quórums entre réplicas. La relación entre estos problemas se examina formalmente en el trabajo de Gray y Lamport sobre Paxos Commit <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>, <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="admonitionblock note">
<table>
<tr>
<td class="icon">
<i class="fa icon-note" title="Note"></i>
</td>
<td class="content">
<div class="paragraph">
<p><strong>Aclaracion</strong> En estas páginas, <strong>commit</strong> significa confirmar de forma duradera una transacción. No es exactamente lo mismo que una entrada <strong>committed</strong> en el registro replicado de Raft, aunque la palabra inglesa sea la misma. Tampoco hay que confundir <strong>Two-Phase Commit</strong> con <strong>Two-Phase Locking</strong> (2PL): el primero coordina la decisión final de una transacción; el segundo se refiere al control de concurrencia.</p>
</div>
</td>
</tr>
</table>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_antes_de_hablar_de_protocolos_qué_problema_queremos_resolver"><a class="anchor" href="#_antes_de_hablar_de_protocolos_qué_problema_queremos_resolver"></a>Antes de hablar de protocolos: ¿qué problema queremos resolver?</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_coordinar_decisiones_cuando_nadie_ve_el_sistema_completo"><a class="anchor" href="#_coordinar_decisiones_cuando_nadie_ve_el_sistema_completo"></a>Coordinar decisiones cuando nadie ve el sistema completo</h3>
<div class="paragraph">
<p>A diferencia de un programa que ejecuta todos sus pasos en una sola máquina, un sistema distribuido está formado por procesos que avanzan de manera independiente. Se comunican por mensajes y no siempre saben qué ocurrió en los demás. Una respuesta que tarda puede significar que el otro proceso está ocupado, que la red está congestionada o que la máquina dejó de funcionar. Desde afuera, estas situaciones pueden verse exactamente iguales.</p>
</div>
<div class="paragraph">
<p>Esto vuelve más difícil algo que, en un sistema centralizado, parece bastante natural: tomar una decisión común. Un proceso puede haber completado su trabajo y otro todavía estar comprobando si puede hacerlo. Uno puede conocer la decisión final mientras otro solo conoce una promesa preliminar. La cuestión es cómo lograr que todos respeten un resultado compatible y, a la vez, qué hacer cuando la información necesaria no llega.</p>
</div>
<div class="paragraph">
<p>Para estudiar esa dificultad conviene separar <strong>las respuestas locales</strong>, <strong>la decisión compartida</strong> y <strong>la ejecución de esa decisión</strong>. No son tres nombres para el mismo hecho: que un proceso esté dispuesto a realizar algo no significa que el grupo haya decidido hacerlo, y una decisión tomada tampoco implica que todos la hayan recibido al mismo tiempo.</p>
</div>
<div class="paragraph">
<p>En las transacciones distribuidas llamaremos <strong>participante</strong> a cada componente responsable de una parte de la operación. Si hace falta precisar el papel técnico, usaremos <strong>gestor de recursos</strong>: es quien administra una base de datos u otro recurso con capacidad de preparar y confirmar cambios transaccionales. El <strong>coordinador</strong> organiza el intercambio de mensajes y la decisión global. En la bibliografía inglesa, ese participante suele denominarse <em>resource manager</em>; aquí evitaremos repetir una sigla innecesaria <a href="#Gray1978" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Gray1978]</a>, <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_suponemos_sobre_la_red_y_las_fallas"><a class="anchor" href="#_qué_suponemos_sobre_la_red_y_las_fallas"></a>Qué suponemos sobre la red y las fallas</h3>
<div class="paragraph">
<p>Para entender qué garantiza un protocolo, primero hay que decir qué fallas se permiten. Supondremos inicialmente un conjunto conocido de participantes, comunicación por mensajes y fallas por detención seguidas, eventualmente, de recuperación. No incluiremos fallas bizantinas: un participante no falsifica información ni envía deliberadamente mensajes contradictorios. Los mensajes pueden sufrir pérdidas, retrasos, duplicaciones o reordenamiento; el diseño debe contemplar reintentos y operaciones idempotentes.</p>
</div>
<div class="paragraph">
<p>Otro elemento importante es el <strong>almacenamiento persistente</strong>. Los participantes y el coordinador conservan, antes de determinados pasos irreversibles, registros que les permiten reconstruir lo ocurrido tras un reinicio. Habitualmente se emplea un registro de escritura anticipada, o <strong>write-ahead log</strong> (WAL). Sin esa persistencia, un proceso podría prometer que está listo para confirmar y olvidar luego su promesa, lo que haría imposible una recuperación correcta <a href="#Mohan1992" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Mohan1992]</a>.</p>
</div>
<div class="paragraph">
<p>No todas las redes ofrecen las mismas garantías temporales. En un <strong>sistema sincrónico</strong> existen cotas conocidas sobre procesamiento y comunicación. En uno <strong>asincrónico</strong> no podemos decidir, únicamente por la demora, si una máquina está caída o simplemente responde lentamente. La <strong>sincronía parcial</strong> admite cotas que podrían ser desconocidas o comenzar a cumplirse después de un período de inestabilidad <a href="#Dwork1988" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Dwork1988]</a>. Esta diferencia explica buena parte de las condiciones que necesita el protocolo de tres fases.</p>
</div>
</div>
<div class="sect2">
<h3 id="_seguridad_y_vivacidad_no_son_la_misma_garantía"><a class="anchor" href="#_seguridad_y_vivacidad_no_son_la_misma_garantía"></a>Seguridad y vivacidad: no son la misma garantía</h3>
<div class="paragraph">
<p>En sistemas distribuidos solemos pedir dos clases de propiedades. La <strong>seguridad</strong> (<em>safety</em>) afirma que nunca se alcanza una situación prohibida; por ejemplo, que una parte de la transacción termine confirmada mientras otra termina definitivamente abortada. La <strong>vivacidad</strong> (<em>liveness</em>) pregunta si el sistema logra terminar, suponiendo determinadas condiciones de funcionamiento.</p>
</div>
<div class="paragraph">
<p>Un protocolo puede ser seguro y aun así quedarse esperando. Si el coordinador desaparece y los participantes no saben si la decisión global ya fue tomada, bloquearse puede ser la única conducta segura. La situación contraria sería avanzar sin pruebas suficientes: se obtendría una respuesta rápida, pero quizá dos participantes terminarían con decisiones incompatibles.</p>
</div>
<div class="paragraph">
<p>Conviene recordar aquí el resultado de Fischer, Lynch y Paterson. En el modelo completamente asincrónico, un algoritmo determinista de consenso no puede garantizar terminación en <strong>todas</strong> las ejecuciones si siquiera un proceso puede detenerse <a href="#FLP1985" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[FLP1985]</a>. Esto no quiere decir que Paxos o Raft nunca decidan; significa que las garantías de vivacidad necesitan condiciones adicionales, como sincronía parcial y eventual estabilidad de la comunicación <a href="#Dwork1988" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Dwork1988]</a>, <a href="#ChandraToueg1996" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[ChandraToueg1996]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_consenso_votación_y_confirmación_atómica_dónde_se_parecen_y_dónde_no"><a class="anchor" href="#_consenso_votación_y_confirmación_atómica_dónde_se_parecen_y_dónde_no"></a>Consenso, votación y confirmación atómica: dónde se parecen y dónde no</h2>
<div class="sectionbody">
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/00_mapa_conceptual.svg" alt="Mapa conceptual de consenso" width="100%">
</div>
</div>
<div class="sect2">
<h3 id="_consenso_ponerse_de_acuerdo_sobre_un_valor"><a class="anchor" href="#_consenso_ponerse_de_acuerdo_sobre_un_valor"></a>Consenso: ponerse de acuerdo sobre un valor</h3>
<div class="paragraph">
<p>La pregunta básica del <strong>consenso distribuido</strong> es fácil de formular: varios procesos disponen de propuestas y necesitan decidir un único valor que todos puedan reconocer como resultado. Ese valor puede representar un líder, una operación del registro replicado, una configuración del clúster o una decisión de aplicación. La clave está en que <strong>cada problema define qué valores son válidos</strong>. El consenso no incorpora de manera automática la regla «si un participante se opone, hay que abortar».</p>
</div>
<div class="paragraph">
<p>Para expresarlo de manera formal, consideremos procesos \\(p_1, p_2, \\ldots, p_n\\), con propuestas \\(v_1, v_2, \\ldots, v_n\\) pertenecientes a un dominio \\(V\\). Buscamos un valor decidido \\(d\\). El <strong>acuerdo</strong> exige que dos procesos correctos que decidan no elijan valores distintos; la <strong>integridad</strong> exige que cada uno decida a lo sumo una vez; la <strong>validez</strong> especifica cuáles son los valores admisibles; y la <strong>terminación</strong> pide que los procesos correctos eventualmente decidan, bajo las condiciones del modelo. En el consenso clásico, una condición de validez habitual es que el valor decidido haya sido propuesto por algún proceso.</p>
</div>
<div class="paragraph">
<p>Paxos y Raft proporcionan mecanismos para construir acuerdo sobre información replicada. Cuando recurren a mayorías, no están preguntando si la mayoría de los recursos involucrados en una transacción está de acuerdo en realizarla. Están utilizando conjuntos de réplicas que se solapan: dos mayorías de un mismo grupo siempre tienen al menos un integrante en común, lo que permite preservar la continuidad de las decisiones <a href="#Lamport1998" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Lamport1998]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_votar_es_lo_mismo_que_decidir"><a class="anchor" href="#_votar_es_lo_mismo_que_decidir"></a>¿Votar es lo mismo que decidir?</h3>
<div class="paragraph">
<p>No. En una votación, cada participante expresa una posición; solo después se aplica alguna regla para obtener el resultado. Recibir votos y decidir son dos pasos diferentes. La regla para pasar de uno al otro puede exigir una mayoría simple, una mayoría calificada, unanimidad u otra condición, según el problema.</p>
</div>
<div class="paragraph">
<p>En una transacción distribuida, el coordinador puede preguntar a cada participante: «¿terminaste tu trabajo local y podés garantizar que confirmarás si recibís la orden?». Una respuesta <code>YES</code> es una promesa duradera: el participante se encuentra <strong>preparado</strong>, pero todavía <strong>no confirmó</strong> la transacción. Una respuesta <code>NO</code> significa que no puede asumir esa obligación. Luego debe existir una decisión global <code>COMMIT</code> o <code>ABORT</code>, que cada participante conocerá y ejecutará.</p>
</div>
<div class="paragraph">
<p>Por eso, cuando hablamos de la «fase de votación» de 2PC, nos referimos a <strong>una etapa del protocolo de confirmación</strong>, no a una elección independiente por mayoría. El mismo vocabulario «voto», «aceptación», «preparación» aparece en algoritmos diferentes, pero su significado técnico depende del contexto.</p>
</div>
</div>
<div class="sect2">
<h3 id="_commit_atómico_la_semántica_del_todo_o_nada"><a class="anchor" href="#_commit_atómico_la_semántica_del_todo_o_nada"></a>Commit atómico: la semántica del todo o nada</h3>
<div class="paragraph">
<p>La <strong>confirmación atómica</strong> (<em>atomic commitment</em>) plantea una pregunta más concreta: dado un conjunto de participantes que realizaron trabajo local como parte de la misma transacción, ¿se deben hacer definitivos los cambios de todos o se deben deshacer todos? La respuesta tiene que ser común y estable. La atomicidad no exige que todos apliquen el cambio en el mismo nanosegundo; exige que ninguno termine definitivamente en un resultado incompatible con los demás.</p>
</div>
<div class="paragraph">
<p>La diferencia con el consenso general está en la <strong>validez de la decisión</strong>. Para confirmar correctamente una transacción, <strong>cada participante necesario</strong> tuvo que alcanzar un estado en el que pueda comprometerse a confirmar. Si una sola de esas partes se niega, no es válido confirmar el resto y llamar a eso la misma transacción atómica. A la inversa, si todos están preparados, <code>COMMIT</code> se vuelve una opción válida, pero la red todavía puede fallar antes de que el coordinador haya decidido. Los votos positivos no son, por sí mismos, una decisión global durable <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
<div class="paragraph">
<p>Esta exigencia puede expresarse de manera compacta:</p>
</div>
<div class="stemblock">
<div class="content">
\\[\\mathrm{COMMIT}(T)\\;\\Longrightarrow\\;\\bigwedge_{i=1}^{n} \\mathrm{Prepared}(p_i,T)\\]
</div>
</div>
<div class="paragraph">
<p>Además, si un participante declara correctamente un rechazo definitivo durante la preparación, la salida global debe ser <code>ABORT</code>. En un protocolo práctico se pueden producir abortos por demoras o fallas antes de una decisión de confirmación irreversible; <strong>no</strong> debemos inferir la equivalencia inversa «todos están preparados, luego ya ocurrió COMMIT».</p>
</div>
<div class="paragraph">
<p>Para razonar formalmente sobre este problema usamos <strong>estabilidad</strong> (nadie abandona un estado final), <strong>consistencia de las decisiones</strong> (no hay finales incompatibles), <strong>validez de la confirmación</strong> (nadie confirma sin que todos hayan podido preparar su parte) y alguna condición explícita de <strong>vivacidad o no trivialidad</strong>. Gray y Lamport presentan una especificación precisa y muestran cómo relacionarla con consenso <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_tres_situaciones_parecidas_tres_preguntas_distintas"><a class="anchor" href="#_tres_situaciones_parecidas_tres_preguntas_distintas"></a>Tres situaciones parecidas, tres preguntas distintas</h3>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="20%">
<col width="40%">
<col width="40%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Mecanismo</th>
<th class="tableblock halign-left valign-top">Pregunta que responde</th>
<th class="tableblock halign-left valign-top">Regla que importa</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Consenso sobre un registro replicado</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">¿Qué operación o valor queda decidido por el conjunto de réplicas?</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Acuerdo y validez del valor, con quórums apropiados</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Voto de preparación</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">¿Puede <strong>este participante concreto</strong> confirmar luego su parte?</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Estado local persistente de cada participante</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Commit atómico</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">¿Confirmamos o abortamos <strong>toda la transacción</strong>?</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>COMMIT</code> requiere que <strong>todos los participantes necesarios</strong> estén preparados</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>Una diferencia práctica adicional es que <strong>un voto afirmativo puede obligar al participante a esperar</strong>. Si el gestor de recursos responde <code>YES</code>, debe mantener un estado recuperable que le permita obedecer el resultado global posterior. No le alcanza con cambiar de opinión porque haya vencido un tiempo de espera. Este detalle explica gran parte del comportamiento bloqueante de 2PC.</p>
</div>
</div>
<div class="sect2">
<h3 id="_entonces_2pc_acepta_dos_tercios_de_los_votos"><a class="anchor" href="#_entonces_2pc_acepta_dos_tercios_de_los_votos"></a>Entonces, ¿2PC acepta dos tercios de los votos?</h3>
<div class="paragraph">
<p><strong>No.</strong> En su forma clásica, el protocolo de confirmación en dos fases exige unanimidad entre los participantes lógicos de la transacción. Si tres gestores de recursos intervienen en una operación, dos respuestas <code>YES</code> y una respuesta <code>NO</code> conducen a <code>ABORT</code>. El participante que rechaza tiene poder de veto porque no estamos eligiendo una propuesta entre varias: queremos una operación que debe resultar atómica en los <strong>tres</strong> recursos.</p>
</div>
<div class="paragraph">
<p>La idea de que «dos de tres alcanzan» tiene sentido en otro escenario: cuando las tres máquinas son <strong>réplicas de un mismo estado</strong>. En Raft, por ejemplo, una mayoría de tres réplicas son dos; eso puede bastar para confirmar una entrada del registro según las reglas del algoritmo, aunque la tercera esté temporalmente desconectada. En un sistema de cinco réplicas, en cambio, la mayoría es tres, no «dos tercios» de forma literal. La condición general de mayoría es más de la mitad, y las reglas particulares de confirmación de entradas en Raft tienen detalles adicionales vinculados a los períodos del líder <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/09_unanimidad_vs_quorum.svg" alt="Contraste entre voto unánime de recursos y mayoría entre réplicas" width="100%">
</div>
</div>
<div class="paragraph">
<p>La figura contrasta dos conjuntos que <strong>no representan lo mismo</strong>: tres participantes que poseen distintas partes de una transacción, y tres réplicas que mantienen el mismo registro lógico. No sería correcto reemplazar una de las bases de datos de la transacción por otra simplemente porque la mayoría votó que sí.</p>
</div>
</div>
<div class="sect2">
<h3 id="_y_de_dónde_sale_el_umbral_de_dos_tercios"><a class="anchor" href="#_y_de_dónde_sale_el_umbral_de_dos_tercios"></a>¿Y de dónde sale el umbral de dos tercios?</h3>
<div class="paragraph">
<p>La cifra aparece con frecuencia en algoritmos tolerantes a <strong>fallas bizantinas</strong>, es decir, cuando algunas réplicas pueden comportarse arbitrariamente y hasta enviar mensajes contradictorios. En el modelo clásico de <strong>Practical Byzantine Fault Tolerance</strong> (PBFT), para tolerar hasta \\(f\\) fallas se trabaja con \\(3f+1\\) réplicas y ciertos pasos requieren \\(2f+1\\) respuestas coincidentes. Se habla informalmente de «dos tercios», aunque el umbral exacto viene dado por esa fórmula: con cuatro réplicas y una falla tolerada, por ejemplo, hacen falta tres respuestas <a href="#Castro1999" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Castro1999]</a>.</p>
</div>
<div class="paragraph">
<p>Este umbral no tiene relación con las tres fases de 3PC. El «tres fases» del protocolo de commit de Skeen no es el mismo mecanismo que las etapas de replicación bizantina de PBFT, aunque puedan aparecer nombres semejantes como <em>prepare</em> o <em>commit</em>. Las hipótesis, los roles y las propiedades demostradas son diferentes <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>, <a href="#Castro1999" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Castro1999]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_se_pueden_combinar_mayorías_y_transacciones_atómicas"><a class="anchor" href="#_se_pueden_combinar_mayorías_y_transacciones_atómicas"></a>¿Se pueden combinar mayorías y transacciones atómicas?</h3>
<div class="paragraph">
<p>Sí. De hecho, esa combinación ayuda a entender mejor para qué sirven las mayorías. Imaginemos tres particiones lógicas de una base distribuida: cuentas, inventario y pedidos. Cada partición se mantiene, a su vez, en tres réplicas que utilizan consenso. La transacción necesita un resultado compatible en <strong>las tres particiones</strong>, pero cada una de ellas puede usar una <strong>mayoría de sus propias réplicas</strong> para almacenar de modo seguro su voto o su decisión. La mayoría existe <strong>dentro de cada servicio replicado</strong>, mientras que la confirmación global todavía depende del estado de todos los servicios participantes.</p>
</div>
<div class="paragraph">
<p><strong>Paxos Commit</strong> formaliza una construcción muy relevante: obtiene un resultado de consenso para el estado preparado o abortado de <strong>cada</strong> participante y deriva <code>COMMIT</code> solamente cuando todos esos resultados son <code>Prepared</code>. Así puede evitar la dependencia de un único coordinador: con \\(2f+1\\) aceptadores y un quórum de \\(f+1\\), el protocolo puede progresar con hasta \\(f\\) aceptadores fallidos, bajo las condiciones necesarias de comunicación y disponibilidad. Pero <strong>ninguna mayoría de aceptadores permite pasar por alto el rechazo de una partición necesaria</strong> <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
<div class="paragraph">
<p>Podemos diseñar también operaciones con <strong>quórums de lectura y escritura</strong> o flujos con <strong>compensaciones</strong> (sagas), pero ahí cambian las garantías o la definición de la operación. Una saga no es un reemplazo transparente de una transacción global ACID: sus pasos pueden ser visibles y sus compensaciones no equivalen siempre a un rollback atómico <a href="#GarciaMolinaSalem1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GarciaMolinaSalem1987]</a>. El punto general es que <strong>se puede cambiar el modelo del sistema</strong> para aprovechar mayorías; lo que no se puede hacer es cambiar la regla de 2PC por «confirmar con el 67 %» y conservar automáticamente la atomicidad original.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_two_phase_commit_2pc"><a class="anchor" href="#_two_phase_commit_2pc"></a>Two-Phase Commit (2PC)</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_qué_hace_exactamente_el_protocolo_de_dos_fases"><a class="anchor" href="#_qué_hace_exactamente_el_protocolo_de_dos_fases"></a>Qué hace exactamente el protocolo de dos fases</h3>
<div class="paragraph">
<p>El protocolo <strong>Two-Phase Commit</strong> (2PC) nació para coordinar la terminación de transacciones que abarcan más de un sistema transaccional. La idea se entiende fácilmente; lo difícil aparece cuando alguna máquina deja de responder: primero se pregunta a todos los participantes si están preparados para confirmar; después se informa a todos una única decisión global. La formulación clásica puede estudiarse en Gray <a href="#Gray1978" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Gray1978]</a> y la formalización de Gray y Lamport <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
<div class="paragraph">
<p>El <strong>coordinador</strong> sabe qué participantes integran la transacción, envía las solicitudes, registra los votos y establece una decisión definitiva. Cada <strong>participante</strong>, o gestor de recursos, ejecutó su propia parte del trabajo y debe conservar suficiente información para obedecer la decisión, incluso si la máquina se reinicia. En nuestros diagramas el coordinador aparece como un proceso independiente; en un sistema real podría compartir máquina con uno de los participantes.</p>
</div>
</div>
<div class="sect2">
<h3 id="_primera_fase_preparar_y_votar"><a class="anchor" href="#_primera_fase_preparar_y_votar"></a>Primera fase: preparar y votar</h3>
<div class="paragraph">
<p>Supongamos una transacción <code>T</code> entre tres bases de datos. El coordinador envía a cada una el mensaje <code>PREPARE(T)</code>. Cada participante revisa sus restricciones, verifica que pueda cumplir las operaciones locales, conserva los bloqueos o reservas necesarios y prepara la información que necesitaría para confirmar más adelante. Si todo está en condiciones, escribe duraderamente <code>PREPARED(T)</code> y <strong>recién entonces</strong> responde <code>YES(T)</code>.</p>
</div>
<div class="paragraph">
<p>La respuesta afirmativa es mucho más que una expresión de deseo. Desde ese instante el participante ha asumido una obligación: no puede decidir por su cuenta que va a abortar simplemente porque el coordinador tarda. Debe ser capaz de recuperar su preparación después de una falla. Si, en cambio, detecta un error que le impide comprometerse por ejemplo, una restricción violada o un conflicto imposible de resolver, responde <code>NO(T)</code> y la operación global no podrá confirmarse <a href="#Mohan1992" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Mohan1992]</a>.</p>
</div>
<div class="paragraph">
<p>El coordinador reúne esos votos. En la ruta exitosa recibe <code>YES</code> de todos. Si recibe un solo <code>NO</code>, puede decidir <code>ABORT</code>; si no consigue las respuestas necesarias, también puede abortar <strong>antes de haber persistido una decisión de confirmación</strong>, según la política y el protocolo de recuperación. Una demora no equivale matemáticamente a un voto negativo: el timeout permite tomar una decisión conservadora, no demostrar que la máquina estaba caída.</p>
</div>
</div>
<div class="sect2">
<h3 id="_segunda_fase_decidir_y_comunicar"><a class="anchor" href="#_segunda_fase_decidir_y_comunicar"></a>Segunda fase: decidir y comunicar</h3>
<div class="paragraph">
<p>Si todos los participantes respondieron afirmativamente y el coordinador opta por confirmar, debe registrar <code>COMMIT(T)</code> en almacenamiento estable <strong>antes de anunciarlo</strong>. A continuación envía <code>GLOBAL-COMMIT(T)</code> a cada uno. Cuando un participante recibe esa decisión, hace definitiva su parte de la transacción, registra el resultado y libera los recursos correspondientes.</p>
</div>
<div class="paragraph">
<p>Si hay un rechazo, o si se elige abortar antes del punto irreversible, el coordinador registra <code>ABORT(T)</code> y transmite <code>GLOBAL-ABORT(T)</code>. Los participantes deshacen o descartan sus modificaciones locales de manera recuperable. En muchas implementaciones contestan con un mensaje de confirmación de recepción (<code>ACK</code>), que permite limpiar registros. Ese reconocimiento posterior <strong>no constituye una tercera fase de votación</strong>.</p>
</div>
<div class="paragraph">
<p>El orden importa. Anunciar <code>COMMIT</code> antes de persistirlo sería peligroso: si el coordinador cae, podría olvidar una decisión que otros sistemas ya obedecieron. El registro duradero, los identificadores de transacción y las retransmisiones idempotentes son condiciones indispensables de una implementación correcta <a href="#Mohan1992" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Mohan1992]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_diagrama_de_secuencia_ejecución_exitosa"><a class="anchor" href="#_diagrama_de_secuencia_ejecución_exitosa"></a>Diagrama de secuencia: ejecución exitosa</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/01_2pc_commit.svg" alt="Diagrama de secuencia 2PC con votos YES y commit global" width="100%">
</div>
</div>
<div class="paragraph">
<p>La figura muestra explícitamente por qué <code>YES</code> y <code>COMMIT</code> no son sinónimos. Entre el último <code>YES</code> y la transmisión de <code>GLOBAL-COMMIT</code> existe una acción crítica: la persistencia de la decisión en el coordinador. Si este falla después de ese registro y antes de notificar a todos, la recuperación debe <strong>retransmitir COMMIT</strong>, no optar por un aborto nuevo.</p>
</div>
</div>
<div class="sect2">
<h3 id="_diagrama_de_secuencia_ejecución_con_abort"><a class="anchor" href="#_diagrama_de_secuencia_ejecución_con_abort"></a>Diagrama de secuencia: ejecución con abort</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/02_2pc_abort.svg" alt="Diagrama de secuencia 2PC con voto NO y decisión abort" width="100%">
</div>
</div>
<div class="paragraph">
<p>Un solo <code>NO</code> obliga a la decisión global <code>ABORT</code>. A diferencia de un protocolo electoral con mayoría simple, 2PC no necesita contar «cuántos» participantes votaron sí para vencer al voto negativo. Es suficiente un rechazo válido de un participante que participa de la transacción.</p>
</div>
</div>
<div class="sect2">
<h3 id="_máquina_de_estados_y_persistencia"><a class="anchor" href="#_máquina_de_estados_y_persistencia"></a>Máquina de estados y persistencia</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/04_2pc_estados.svg" alt="Autómata simplificado del participante 2PC" width="100%">
</div>
</div>
<div class="paragraph">
<p>El diagrama muestra la evolución de un participante. Mientras está trabajando (<code>WORKING</code>), todavía puede abortar su tarea local sin contradecir una promesa global. Después de persistir <code>PREPARED</code>, queda <strong>en duda</strong> (<em>in doubt</em>): aceptó confirmar si el coordinador lo ordena, pero no conoce la decisión definitiva. Desde allí solo puede continuar hacia <code>COMMITTED</code> o <code>ABORTED</code> cuando obtiene información autorizada. Ambos estados finales son estables: una transacción confirmada no vuelve a estar abortada por decisión del mismo protocolo.</p>
</div>
<div class="paragraph">
<p>Por su parte, el coordinador pasa de iniciar la preparación a esperar los votos y, finalmente, registrar una de las dos decisiones posibles. No son simples etiquetas de una interfaz: cada transición crítica tiene efectos de persistencia y recuperación que constituyen parte de la corrección del protocolo.</p>
</div>
<div class="sect3">
<h4 id="_orden_de_operaciones_críticas"><a class="anchor" href="#_orden_de_operaciones_críticas"></a>Orden de operaciones críticas</h4>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">Participante que responde YES:
  1. asegurar cambios y metadatos recuperables
  2. forzar al WAL el registro PREPARED(T)
  3. enviar YES(T)

Coordinador que decide COMMIT:
  1. verificar YES de todos los participantes obligatorios
  2. forzar al WAL el registro GLOBAL-COMMIT(T)
  3. enviar GLOBAL-COMMIT(T) a todos</code></pre>
</div>
</div>
<div class="paragraph">
<p>Si se invierte el orden de persistencia y comunicación, una caída puede hacer que otro proceso actúe basándose en una decisión que el emisor ya no es capaz de reconstruir al reiniciarse. En implementaciones reales existen optimizaciones y variantes del log; deben preservar las mismas obligaciones de recuperación.</p>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_por_qué_el_protocolo_puede_quedar_bloqueado"><a class="anchor" href="#_por_qué_el_protocolo_puede_quedar_bloqueado"></a>Por qué el protocolo puede quedar bloqueado</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/03_2pc_bloqueo.svg" alt="2PC: falla del coordinador en la ventana crítica de preparación" width="100%">
</div>
</div>
<div class="paragraph">
<p>Imaginemos que dos participantes reciben <code>PREPARE</code>, registran <code>PREPARED</code> y responden <code>YES</code>. El coordinador deja de responder justo después. Los dos participantes saben que están preparados; incluso pueden comunicarse entre sí y comprobar que ambos votaron afirmativamente. Sin embargo, ninguno sabe necesariamente si el coordinador alcanzó a registrar una decisión final antes de detenerse.</p>
</div>
<div class="paragraph">
<p>¿Por qué no resuelven el problema haciendo otra votación? Porque esa nueva votación no prueba qué decisión pudo haber quedado registrada en otro lugar o comunicada parcialmente. Si se confirma sin conocer el historial autorizado, se corre el riesgo de contradecir una decisión durable previa. Si se aborta sin saberlo, podría haber un participante que ya recibió <code>COMMIT</code>. El hecho de que todos los votos originales fueran positivos no corrige esa falta de información <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
<div class="paragraph">
<p>Ahí aparece el <strong>bloqueo</strong> característico de 2PC. Para conservar seguridad, los participantes que se encuentran preparados pueden necesitar esperar a que el coordinador recupere su registro o a que otro procedimiento obtenga evidencia suficiente de la decisión. Mientras esperan, quizá mantengan bloqueos, espacio de registro o reservas que afectan otras operaciones. El problema no es simplemente que se perdió un mensaje: falta una fuente de información con autoridad sobre un resultado irreversible.</p>
</div>
<div class="sect3">
<h4 id="_sirve_consultar_a_otros_participantes"><a class="anchor" href="#_sirve_consultar_a_otros_participantes"></a>¿Sirve consultar a otros participantes?</h4>
<div class="paragraph">
<p>Sí, pero la utilidad depende de <strong>qué saben esos participantes</strong>. Si uno conserva una decisión global <code>COMMIT</code> o <code>ABORT</code> auténtica y durable, el resto puede aprenderla y actuar en consecuencia. Si todos están solamente en <code>PREPARED</code> y nadie conoce una decisión, repetir la consulta no transforma esos votos en una autorización para inventar una salida. En algunas ejecuciones, un participante todavía no preparado puede aportar evidencia suficiente para abortar; en otras, no. Lo determinante es reconstruir el historial posible conforme a las reglas del protocolo, no contar las respuestas como si se tratara de una nueva elección por mayoría.</p>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_matriz_de_fallas_y_recuperación"><a class="anchor" href="#_matriz_de_fallas_y_recuperación"></a>Matriz de fallas y recuperación</h3>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="27.2727%">
<col width="27.2727%">
<col width="45.4546%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Falla</th>
<th class="tableblock halign-left valign-top">Estado observable</th>
<th class="tableblock halign-left valign-top">Comportamiento seguro</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Participante cae antes de <code>YES</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">No confirmó preparación</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">El coordinador puede elegir <code>ABORT</code> si no existe una decisión de confirmación duradera.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Participante cae después de <code>YES</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>PREPARED</code> registrado en su WAL</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Al reiniciarse debe consultar o recuperar la decisión global, y cumplirla.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Coordinador cae antes de <code>PREPARE</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Sin participantes preparados por esta ejecución</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Es posible abortar la transacción sin violar una decisión de commit inexistente.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Coordinador cae tras todos los <code>YES</code>, antes de comunicar decisión</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">participantes pueden quedar <strong>in-doubt</strong></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Esperar información suficiente o recuperar al coordinador; no abortar unilateralmente.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Coordinador cae después de persistir <code>COMMIT</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Decisión irreversible en WAL</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Al reiniciarse retransmite <code>COMMIT</code> a quienes no lo aprendieron.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mensaje <code>GLOBAL-COMMIT</code> se pierde</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Algunos participantes confirman y otros siguen preparados</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Retransmisión/consulta de estado; nunca sustituir por <code>ABORT</code>.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">ACK final se pierde</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Decisión ya conocida por el participante</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reenviar ACK; limpieza eventual, sin cambiar resultado.</p></td>
</tr>
</tbody>
</table>
</div>
<div class="sect2">
<h3 id="_costos_latencia_mensajes_y_recursos"><a class="anchor" href="#_costos_latencia_mensajes_y_recursos"></a>Costos: latencia, mensajes y recursos</h3>
<div class="paragraph">
<p>Con \\(n\\) participantes y un coordinador separado, en la forma didáctica aquí descrita:</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="30%">
<col width="20%">
<col width="50%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Intercambio</th>
<th class="tableblock halign-left valign-top">Mensajes</th>
<th class="tableblock halign-left valign-top">Observación</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>PREPARE</code> a todos</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Difusión de solicitud</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>YES</code>/<code>NO</code> al coordinador</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Recolección de votos</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>GLOBAL-COMMIT/ABORT</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Difusión de decisión</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">ACK final (opcional)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Limpieza y confirmación</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><strong>Total</strong></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><strong>\\(3n\\) o \\(4n\\)</strong></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Conteo para esta variante sin mensaje de inicio ni retransmisiones</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>En ausencia de fallas, se requieren aproximadamente tres retardos de mensaje de ida entre el inicio de <code>PREPARE</code> y el conocimiento de la decisión por los participantes, si los envíos se paralelizan y no se consideran las demoras de WAL. El ciclo de ACK agrega otro retardo para la finalización administrativa. El costo fundamental es el de <strong>escrituras síncronas persistentes</strong> y <strong>retención de recursos</strong> durante la preparación, además del tráfico de red. Gray y Lamport estudian variantes optimizadas con otros conteos y ubicaciones del coordinador <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>; los números anteriores son específicos del intercambio representado.</p>
</div>
<div class="sect3">
<h4 id="_ventajas_y_desventajas_evaluación_crítica"><a class="anchor" href="#_ventajas_y_desventajas_evaluación_crítica"></a>Ventajas y desventajas: evaluación crítica</h4>
<div class="paragraph">
<p>La ventaja central de 2PC es su <strong>semántica clara</strong>. Coordina sistemas que ya disponen de transacciones locales, puede apoyarse en registros de recuperación bien estudiados y requiere un flujo relativamente simple en ausencia de fallas. Su decisión es estable y, si todos cumplen el protocolo, no permite que unos participantes confirmen definitivamente mientras otros abortan. Por esa razón, la confirmación en dos fases ocupa un lugar importante en la historia de las bases de datos distribuidas <a href="#Gray1978" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Gray1978]</a>, <a href="#Bernstein1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Bernstein1987]</a>.</p>
</div>
<div class="paragraph">
<p>El precio aparece en dos lugares. Primero, un gestor de recursos que respondió afirmativamente puede quedar esperando una decisión final durante un tiempo indefinido si se pierde el acceso al coordinador o a la evidencia necesaria. Segundo, mientras espera suele mantener información persistente y recursos reservados; esto aumenta la latencia y la contención. También hay un costo de mensajes y escrituras síncronas durante el camino crítico. El protocolo prioriza la <strong>seguridad</strong> sobre la <strong>capacidad de terminar siempre</strong>, y ese compromiso es exactamente lo que intenta modificar 3PC.</p>
</div>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_three_phase_commit_3pc"><a class="anchor" href="#_three_phase_commit_3pc"></a>Three-Phase Commit (3PC)</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_por_qué_se_propuso_una_tercera_fase"><a class="anchor" href="#_por_qué_se_propuso_una_tercera_fase"></a>Por qué se propuso una tercera fase</h3>
<div class="paragraph">
<p>Si el bloqueo de 2PC se produce porque el participante preparado no sabe si puede confirmar o abortar, surge una idea razonable: <strong>¿qué pasa si agregamos una etapa en la que el coordinador anuncie, antes del resultado definitivo, que todos los participantes dieron su conformidad?</strong> El protocolo de tres fases explora justamente esa posibilidad. Dale Skeen desarrolló las condiciones para diseñar protocolos de commit no bloqueantes dentro de modelos específicos <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>.</p>
</div>
<div class="paragraph">
<p>En 2PC, el estado <code>PREPARED</code> concentra dos posibilidades finales que el participante no puede distinguir por sí solo. En una construcción clásica de 3PC aparecen dos estados de espera diferenciados. El primero, habitualmente llamado <code>WAIT</code> o <code>READY</code>, indica que el participante está dispuesto a confirmar, pero todavía no recibió la comunicación global intermedia. El segundo, <code>PRE-COMMIT</code>, registra que el coordinador ya reunió todas las respuestas afirmativas y comunicó una intención de confirmar. Ese paso extra deja más información disponible para intentar terminar la operación cuando ocurren ciertas fallas.</p>
</div>
</div>
<div class="sect2">
<h3 id="_la_advertencia_necesaria_no_funciona_igual_bajo_cualquier_red"><a class="anchor" href="#_la_advertencia_necesaria_no_funciona_igual_bajo_cualquier_red"></a>La advertencia necesaria: no funciona igual bajo cualquier red</h3>
<div class="paragraph">
<p>Conviene ser cuidadosos con la expresión <strong>«no bloqueante»</strong>. Los resultados clásicos dependen de hipótesis sobre los tiempos de comunicación, sobre qué fallas pueden producirse y sobre la posibilidad de determinar qué participantes siguen disponibles. Si admitimos retrasos arbitrarios y particiones indefinidas, un timeout no alcanza para distinguir una caída de una desconexión. La elección de un coordinador nuevo, además, no puede dejar dos coordinadores con autoridad para emitir decisiones incompatibles.</p>
</div>
<div class="paragraph">
<p>Por eso, para explicar la garantía de vivacidad de esta familia de algoritmos, supondremos un entorno con sincronía suficientemente fuerte, fallas por detención y recuperación, registros persistentes correctos, conectividad acorde con el procedimiento de terminación y una forma segura de reemplazar al coordinador. <strong>No estamos afirmando que 3PC preserve seguridad y vivacidad frente a cualquier partición.</strong> Un diseño que extienda esas garantías tiene que añadir mecanismos y demostrar sus propiedades <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>, <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_primera_fase_preguntar_si_es_posible_confirmar"><a class="anchor" href="#_primera_fase_preguntar_si_es_posible_confirmar"></a>Primera fase: preguntar si es posible confirmar</h3>
<div class="paragraph">
<p>La ejecución comienza con <code>CAN-COMMIT?(T)</code>. El coordinador consulta a todos los participantes si pueden comprometerse a confirmar la transacción. Cada gestor comprueba sus condiciones locales y responde <code>YES</code> o <code>NO</code>. Si aparece un rechazo, o si las condiciones de esta primera etapa no se completan con seguridad, el protocolo puede terminar en <code>ABORT</code> antes de entrar en el estado intermedio. Si todos aceptan, la ejecución continúa. Hasta ese momento no hay una confirmación global irreversible.</p>
</div>
</div>
<div class="sect2">
<h3 id="_segunda_fase_el_estado_intermedio_pre_commit"><a class="anchor" href="#_segunda_fase_el_estado_intermedio_pre_commit"></a>Segunda fase: el estado intermedio PRE-COMMIT</h3>
<div class="paragraph">
<p>Tras haber recibido todos los votos afirmativos, el coordinador registra que puede avanzar y envía <code>PRE-COMMIT(T)</code> a cada participante. Quien recibe el mensaje conserva de forma persistente el nuevo estado y devuelve <code>ACK-PRE-COMMIT(T)</code>. En la variante didáctica que presenta nuestro diagrama, el coordinador espera los reconocimientos antes de pasar al paso final.</p>
</div>
<div class="paragraph">
<p>Esta fase no significa que los cambios ya sean definitivos. Su función es distribuir información adicional sobre el avance de la transacción y habilitar una recuperación con condiciones más precisas. Para que ese dato resulte suficiente hace falta, además, un procedimiento correcto de terminación y un modelo de fallas que permita interpretar lo observado <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_tercera_fase_confirmar_definitivamente"><a class="anchor" href="#_tercera_fase_confirmar_definitivamente"></a>Tercera fase: confirmar definitivamente</h3>
<div class="paragraph">
<p>Cuando se han satisfecho las condiciones del protocolo, el coordinador persiste la decisión <code>COMMIT(T)</code> y envía <code>DO-COMMIT(T)</code> a todos. Los participantes registran y ejecutan la confirmación, liberan recursos y, si corresponde, emiten los reconocimientos finales. Como antes, enviar una orden no significa que todos la hayan recibido: hacen falta retransmisiones y recuperación idempotente.</p>
</div>
<div class="paragraph">
<p>3PC no elimina la necesidad de cooperación. Lo que hace es incorporar <strong>más estados y más mensajes</strong> para poder terminar en ciertos escenarios de falla, siempre que se cumplan sus hipótesis.</p>
</div>
</div>
<div class="sect2">
<h3 id="_diagrama_de_secuencia_ejecución_exitosa_2"><a class="anchor" href="#_diagrama_de_secuencia_ejecución_exitosa_2"></a>Diagrama de secuencia: ejecución exitosa</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/05_3pc_commit.svg" alt="Secuencia 3PC con CAN-COMMIT" width="100%">
</div>
</div>
<div class="paragraph">
<p>Frente a 2PC, 3PC incorpora un intercambio completo adicional antes de la difusión final, con sus respectivos registros y confirmaciones. La intención no es acelerar el caso normal sino mejorar las posibilidades de terminación ante fallas admitidas por el modelo.</p>
</div>
</div>
<div class="sect2">
<h3 id="_autómata_del_participante"><a class="anchor" href="#_autómata_del_participante"></a>Autómata del participante</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/06_3pc_estados.svg" alt="Autómata simplificado del participante 3PC" width="100%">
</div>
</div>
<div class="paragraph">
<p>En el autómata, <code>INIT</code> representa el estado previo a la preparación. Luego de un voto afirmativo se llega a <code>WAIT</code> o <code>READY</code>, etapa en la que todavía no se conoce el avance global. <code>PRE-COMMIT</code> conserva evidencia persistente de esa comunicación intermedia. Los estados finales <code>COMMITTED</code> y <code>ABORTED</code> son estables.</p>
</div>
<div class="paragraph">
<p>Las flechas con asterisco del diagrama son transiciones que necesitan un procedimiento seguro de terminación; no autorizan a que cualquier participante decida por su cuenta según un timeout. Esta representación resume una variante didáctica y no reemplaza la especificación completa de sus condiciones de recuperación.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_sucede_si_desaparece_el_coordinador"><a class="anchor" href="#_qué_sucede_si_desaparece_el_coordinador"></a>¿Qué sucede si desaparece el coordinador?</h3>
<div class="paragraph">
<p>Si el coordinador original deja de responder, los participantes disponibles pueden iniciar un procedimiento de reemplazo, siempre que el modelo permita hacerlo con seguridad. El nuevo coordinador necesita consultar los estados recuperables por ejemplo, <code>WAIT</code>, <code>PRE-COMMIT</code>, <code>COMMITTED</code> o <code>ABORTED</code> y decidir qué resultados siguen siendo compatibles con la información obtenida.</p>
</div>
<div class="paragraph">
<p>La idea es la siguiente: si se demuestra que existe información que obliga a continuar hacia la confirmación, la terminación puede avanzar en esa dirección. Si puede probarse que nadie superó el estado previo, aún puede resultar válido abortar. Pero la palabra <strong>«demostrar»</strong> es crucial: conocer únicamente el estado de una mayoría arbitraria no prueba lo que pudo suceder en la otra parte de la red. La corrección depende de la relación entre mensajes en tránsito, participantes caídos, estados persistidos y autoridad del coordinador de reemplazo.</p>
</div>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/07_3pc_recuperacion.svg" alt="Esquema de recuperación 3PC después de falla del coordinador" width="100%">
</div>
</div>
<div class="paragraph">
<p>La fase intermedia tiene valor porque deja una pista que 2PC no conserva de la misma manera. No obstante, esa pista solo se convierte en una garantía de recuperación cuando se aplica un protocolo formalmente válido bajo las condiciones admitidas por el modelo <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_análisis_de_seguridad_por_qué_importa_el_estado_intermedio"><a class="anchor" href="#_análisis_de_seguridad_por_qué_importa_el_estado_intermedio"></a>Análisis de seguridad: por qué importa el estado intermedio</h3>
<div class="paragraph">
<p>En 2PC, cuando todos votaron <code>YES</code> y el coordinador desaparece, un participante preparado puede ser incapaz de distinguir una ejecución en la que el coordinador eligió <code>COMMIT</code> de otra en la que aún no lo hizo. La decisión puede haberse persistido y perdido en tránsito hacia los participantes.</p>
</div>
<div class="paragraph">
<p>El razonamiento de 3PC intenta evitar que la incertidumbre persista en un solo estado. Si la decisión de avanzar está distribuida a través de <code>PRE-COMMIT</code>, un protocolo de terminación que observa ese estado puede continuar hacia commit; si prueba que ningún participante alcanzó esa etapa, puede abortar. Para que esa inferencia sea correcta debe existir una relación controlada entre los estados observables de todos los procesos, los mensajes en tránsito y la autoridad del coordinador.</p>
</div>
<div class="paragraph">
<p><strong>Esquema de invariante:</strong> ninguna ejecución admitida debe permitir simultáneamente que un participante tenga una evidencia irreversible que obligue a <code>COMMIT</code> y que otro participante pueda elegir definitivamente <code>ABORT</code>. El estado intermedio contribuye a mantener este invariante solamente si los mecanismos de recuperación pueden distinguir las ejecuciones relevantes y evitar coordinadores rivales. La prueba de corrección es, por tanto, <strong>condicional</strong> al modelo.</p>
</div>
</div>
<div class="sect2">
<h3 id="_particiones_contraejemplo_conceptual"><a class="anchor" href="#_particiones_contraejemplo_conceptual"></a>Particiones: contraejemplo conceptual</h3>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/08_3pc_particion.svg" alt="Partición de red y decisiones incompatibles en 3PC clásico" width="100%">
</div>
</div>
<div class="paragraph">
<p>Considérese una transacción con \\(P_1\\) y \\(P_2\\). Ambos votaron <code>YES</code>. El coordinador llega a transmitir <code>PRE-COMMIT</code> a \\(P_1\\), pero el mensaje destinado a \\(P_2\\) se demora indefinidamente o la red se particiona. \\(P_1\\) ve un estado <code>PRE-COMMIT</code>, mientras \\(P_2\\) sigue en <code>WAIT</code>. Si cada componente se considera por error autorizada para tomar una decisión definitiva a partir de timeouts y observaciones parciales, una puede confirmar y la otra abortar.</p>
</div>
<div class="admonitionblock important">
<table>
<tr>
<td class="icon">
<i class="fa icon-important" title="Important"></i>
</td>
<td class="content">
<div class="paragraph">
<p><strong>La lección no es que toda implementación de 3PC necesariamente produzca ese resultado.</strong> Es que la garantía clásica de no bloqueo <strong>no puede extenderse sin más</strong> a ejecuciones con particiones y coordinadores rivales. Para preservar seguridad debe impedirse al menos una de las decisiones locales, lo cual puede requerir bloqueo, quórums, una hipótesis adicional o un mecanismo formal de consenso. El simple hecho de agregar <code>PRE-COMMIT</code> no resuelve la indeterminación sobre quién puede decidir <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>, <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
</td>
</tr>
</table>
</div>
<div class="paragraph">
<p>En sistemas reales, una partición no se distingue fiablemente de un retraso excesivo mediante un timeout aislado. Por esa razón, una propuesta de «3PC no bloqueante ante cualquier caída o partición» debe leerse con sospecha hasta conocer sus hipótesis y su demostración de seguridad.</p>
</div>
</div>
<div class="sect2">
<h3 id="_costos_y_complejidad"><a class="anchor" href="#_costos_y_complejidad"></a>Costos y complejidad</h3>
<div class="paragraph">
<p>Si los mensajes se envían en paralelo a \\(n\\) participantes:</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="30%">
<col width="20%">
<col width="50%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Intercambio</th>
<th class="tableblock halign-left valign-top">Mensajes</th>
<th class="tableblock halign-left valign-top">Observación</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>CAN-COMMIT?</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Consulta inicial</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Respuestas <code>YES/NO</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Votación</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>PRE-COMMIT</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Difusión del estado intermedio</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>ACK-PRE-COMMIT</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Confirmación del estado intermedio</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>DO-COMMIT</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Decisión final</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">ACK final (opcional)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Limpieza y observabilidad</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><strong>Total</strong></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><strong>\\(5n\\) o \\(6n\\)</strong></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Conteo de esta variante sin retransmisiones ni elección de reemplazo</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>La latencia mínima de divulgación de <code>DO-COMMIT</code>, sin WAL, es aproximadamente cinco retardos de mensaje de ida desde <code>CAN-COMMIT?</code>, en contraste con tres de la variante de 2PC presentada. El objetivo del intercambio adicional es cambiar las posibilidades de terminación bajo fallas, no reducir costo temporal. Las escrituras durables intermedias, además, pueden aumentar el trabajo de I/O y prolongar la retención de recursos.</p>
</div>
<div class="sect3">
<h4 id="_ventajas_y_desventajas_evaluación_crítica_2"><a class="anchor" href="#_ventajas_y_desventajas_evaluación_crítica_2"></a>Ventajas y desventajas: evaluación crítica</h4>
<div class="paragraph">
<p>La contribución de 3PC consiste en mostrar cómo un estado adicional puede modificar la estructura de incertidumbre de un protocolo. En entornos suficientemente sincrónicos y sin particiones que invaliden sus hipótesis, determinadas fallas del coordinador pueden resolverse sin esperar su recuperación. Esto lo convierte en una herramienta muy valiosa para enseñar qué información hace falta para pasar de un estado incierto a una decisión segura.</p>
</div>
<div class="paragraph">
<p>La contracara es la complejidad. El protocolo incorpora mensajes, persistencias y estados adicionales, aumenta la latencia del camino normal y obliga a diseñar cuidadosamente el reemplazo del coordinador. Sobre todo, la promesa de no bloqueo <strong>no se sostiene sin sus supuestos</strong>. En una red susceptible de particiones, una implementación ingenua puede tomar decisiones incompatibles o verse obligada a esperar para conservar seguridad. Por eso no conviene presentarlo como una mejora absoluta sobre 2PC.</p>
</div>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_comparación_crítica_de_2pc_y_3pc"><a class="anchor" href="#_comparación_crítica_de_2pc_y_3pc"></a>Comparación crítica de 2PC y 3PC</h2>
<div class="sectionbody">
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="20%">
<col width="40%">
<col width="40%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Criterio</th>
<th class="tableblock halign-left valign-top">Two-Phase Commit</th>
<th class="tableblock halign-left valign-top">Three-Phase Commit clásico</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Propósito</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Atomicidad de una transacción distribuida</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Atomicidad con mejores condiciones de terminación bajo ciertas fallas</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Fases</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>PREPARE/VOTE</code> y <code>DECIDE</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>CAN-COMMIT</code>, <code>PRE-COMMIT</code> y <code>DO-COMMIT</code></p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Estados decisivos</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>PREPARED</code>, <code>COMMITTED</code>, <code>ABORTED</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>WAIT</code>, <code>PRE-COMMIT</code>, <code>COMMITTED</code>, <code>ABORTED</code></p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Votos necesarios para commit</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Todos los participantes deben estar preparados</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Todos los participantes deben expresar que pueden confirmar</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Coordinador original caído</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Puede bloquear a participantes preparados</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Puede progresar mediante terminación, con hipótesis adicionales</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Timeout después de un YES</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">No autoriza abortar localmente</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">No autoriza por sí solo ninguna decisión local incondicional</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Particiones</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Puede preservar seguridad a costa de bloqueo</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">No ofrece automáticamente seguridad y vivacidad simultáneas</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mensajes didácticos hasta difusión de la decisión</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(3n\\)</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">\\(5n\\)</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Modelo temporal</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La seguridad no requiere tiempos máximos; la vivacidad sí depende de disponibilidad</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La garantía clásica de no bloqueo requiere tiempos y fallas restringidas</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Complejidad operativa</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Menor, pero bloqueante</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mayor; recuperación y elección de autoridad delicadas</p></td>
</tr>
</tbody>
</table>
<div class="sect2">
<h3 id="_por_qué_más_fases_no_implica_más_consenso"><a class="anchor" href="#_por_qué_más_fases_no_implica_más_consenso"></a>Por qué «más fases» no implica «más consenso»</h3>
<div class="paragraph">
<p>La denominación de un protocolo por su número de fases describe su patrón de intercambios, no el problema formal que resuelve ni su tolerancia a fallas. 2PC y 3PC se ocupan de la decisión de una <strong>transacción distribuida</strong>. Paxos y Raft mantienen invariantes de <strong>acuerdo sobre valores o registros replicados</strong>. El hecho de que todos contengan mensajes, coordinadores y votos no los vuelve intercambiables.</p>
</div>
<div class="paragraph">
<p>Asimismo, la noción de <strong>no bloqueo</strong> necesita una formulación matemática: ¿pueden terminar los procesos correctos aunque el coordinador original falle? ¿Cuántos deben seguir conectados? ¿Se permiten particiones? ¿Los mensajes pueden retrasarse arbitrariamente? ¿La elección de un nuevo líder es segura cuando existen candidatos simultáneos? Sin responder estas preguntas, una afirmación absoluta sobre disponibilidad carece de contenido técnico preciso.</p>
</div>
</div>
<div class="sect2">
<h3 id="_mayorías_y_paxos_commit_un_uso_correcto_del_quórum"><a class="anchor" href="#_mayorías_y_paxos_commit_un_uso_correcto_del_quórum"></a>Mayorías y Paxos Commit: un uso correcto del quórum</h3>
<div class="paragraph">
<p>Con esta distinción ya podemos responder la pregunta sobre las mayorías. <strong>Sí existen protocolos que se apoyan en mayorías, pero la mayoría se cuenta sobre el conjunto adecuado</strong>. En Paxos Commit, se utiliza consenso para fijar de manera tolerante a fallas la disposición de <strong>cada participante lógico</strong>. Los aceptadores de Paxos pueden tomar decisiones con un quórum, y no hace falta que todos los aceptadores sigan funcionando; aun así, la transacción completa solamente se confirma si todos los participantes lógicos quedaron preparados <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>.</p>
</div>
<div class="paragraph">
<p>Una opción de ingeniería relacionada es replicar el registro de decisiones del coordinador con Raft o Paxos. Con un líder nuevo y una mayoría disponible, el sistema puede recuperar o continuar una decisión sin depender del regreso de una única máquina, siempre que la interacción con los participantes conserve las propiedades de confirmación atómica. Replicar al coordinador no significa votar nuevamente sobre una transacción ya decidida. La persistencia de la historia y el carácter definitivo de las decisiones siguen siendo esenciales <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_cuando_la_mayoría_corresponde_a_una_partición_replicada"><a class="anchor" href="#_cuando_la_mayoría_corresponde_a_una_partición_replicada"></a>Cuando la mayoría corresponde a una partición replicada</h3>
<div class="paragraph">
<p>Imaginemos una operación que involucra dos servicios, cada uno replicado en tres máquinas. El servicio A puede utilizar una mayoría de sus réplicas para registrar de modo duradero «mi parte está preparada», y el servicio B puede hacer lo mismo dentro de <strong>su propio</strong> grupo. Después, el protocolo de commit global deberá comprobar que <strong>A y B</strong> estén preparados. Es razonable hablar de «dos de tres réplicas» al registrar cada estado, pero <strong>no</strong> de «uno de dos servicios» para confirmar toda la operación.</p>
</div>
<div class="paragraph">
<p>Esta separación entre <strong>réplica física</strong> y <strong>participante lógico</strong> también permite comprender los protocolos de quórums para bases de datos replicadas. Un quórum de escrituras puede dar durabilidad o intersección de conjuntos conforme a un modelo específico; por sí solo no proporciona la atomicidad de una transacción repartida entre recursos independientes. Son capas que se combinan, no términos intercambiables.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_alternativas_quedan_si_no_necesitamos_atomicidad_estricta"><a class="anchor" href="#_qué_alternativas_quedan_si_no_necesitamos_atomicidad_estricta"></a>¿Qué alternativas quedan si no necesitamos atomicidad estricta?</h3>
<div class="paragraph">
<p>Algunas aplicaciones aceptan otra semántica: una operación empresarial se divide en pasos independientes y, cuando uno falla, se ejecutan operaciones de compensación. Este enfoque, comúnmente denominado <strong>saga</strong>, puede ser útil cuando mantener bloqueos globales sería impracticable. Sin embargo, se renuncia a parte de la atomicidad tradicional: los estados intermedios pueden volverse visibles y una compensación no es necesariamente la inversa perfecta de la operación original. No hay que presentar esta alternativa como «2PC con mayoría», porque resuelve un problema distinto <a href="#GarciaMolinaSalem1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GarciaMolinaSalem1987]</a>.</p>
</div>
<div class="paragraph">
<p>Podemos, entonces, tolerar algunas fallas mediante replicación, reemplazar un coordinador mediante consenso o aceptar otras garantías en el diseño de la aplicación. Lo que no podemos hacer es descartar a uno de los recursos necesarios y declarar confirmada la misma transacción atómica simplemente por haber obtenido más del 50 % o dos tercios de votos afirmativos.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_caso_de_estudio_inscripción_a_un_curso_universitario"><a class="anchor" href="#_caso_de_estudio_inscripción_a_un_curso_universitario"></a>Caso de estudio: inscripción a un curso universitario</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Los diagramas anteriores permiten seguir los mensajes del protocolo, pero todavía falta ver qué significan esas decisiones dentro de una aplicación. Consideremos una universidad que ofrece cursos con cupos limitados. Cuando una persona se inscribe, el sistema debe actualizar tres servicios que almacenan información diferente: uno controla los cupos, otro registra las inscripciones y un tercero administra la agenda académica. Cada servicio tiene su propia base de datos y puede ejecutar transacciones locales, pero ninguno controla por sí solo el estado de los otros dos.</p>
</div>
<div class="paragraph">
<p>Supongamos que queremos inscribir a Lucía en el curso <code>K5551</code>, en el turno de los jueves. Para que la operación sea válida, debe quedar un lugar disponible, no debe existir una inscripción duplicada y la agenda de Lucía no puede contener otra actividad en ese horario. Si cualquiera de esas condiciones falla, la universidad quiere que la inscripción completa se aborte. No sería correcto ocupar un lugar sin registrar a la estudiante ni registrar la inscripción sin asignarle un cupo.</p>
</div>
<div class="imageblock text-center center iasc-image">
<div class="content">
<img src="/iasc-book/img/commit/10_caso_estudio_inscripcion.svg" alt="Arquitectura de la inscripción a un curso y decisiones posibles en la transacción distribuida" width="100%">
</div>
</div>
<div class="sect2">
<h3 id="_los_participantes_y_el_contrato_de_la_operación"><a class="anchor" href="#_los_participantes_y_el_contrato_de_la_operación"></a>Los participantes y el contrato de la operación</h3>
<div class="paragraph">
<p>El <strong>servicio de cupos</strong> reserva provisionalmente una plaza en <code>K5551</code>. El <strong>servicio de inscripciones</strong> prepara la creación del registro académico y verifica que no exista otro igual. Por último, el <strong>servicio de agenda</strong> comprueba que el horario esté libre y prepara su incorporación. Son tres <strong>participantes lógicos distintos</strong>, porque cada uno administra una parte necesaria del resultado, no tres copias de la misma información.</p>
</div>
<div class="paragraph">
<p>Para que este ejemplo pueda resolverse con 2PC o con la variante de 3PC estudiada, asumimos algo importante: los tres servicios cuentan con un mecanismo transaccional de preparación, registros persistentes y la capacidad de conservar una reserva hasta recibir la decisión global. Una API HTTP común que simplemente responde «operación realizada» no ofrece necesariamente esas garantías. Además, los cambios preparados deben permanecer bajo control transaccional: enviar un correo de bienvenida antes del commit, por ejemplo, produciría un efecto que no se puede deshacer mediante un aborto de base de datos.</p>
</div>
<div class="paragraph">
<p>Podemos expresar el requisito de la aplicación así: <strong>o se confirma la reserva del cupo, el registro de inscripción y la actualización de agenda, o ninguno de esos tres cambios queda confirmado</strong>. Es una regla de atomicidad global. No garantiza por sí sola aislamiento entre lecturas simultáneas de diferentes servicios; para eso harían falta reglas adicionales de concurrencia y visibilidad.</p>
</div>
</div>
<div class="sect2">
<h3 id="_una_inscripción_exitosa_con_2pc"><a class="anchor" href="#_una_inscripción_exitosa_con_2pc"></a>Una inscripción exitosa con 2PC</h3>
<div class="paragraph">
<p>El coordinador asigna a la operación el identificador <code>T-1042</code> y envía <code>PREPARE(T-1042)</code> a los tres participantes. Cada uno verifica su parte, conserva en su registro persistente la información necesaria para recuperarse y responde <code>YES</code> después de registrar el estado preparado. Hasta este punto todavía no hay una inscripción definitiva, aunque los tres servicios hayan aceptado continuar.</p>
</div>
<div class="paragraph">
<p>Cuando el coordinador reúne los tres votos afirmativos, escribe <code>COMMIT(T-1042)</code> en su propio registro duradero. Solo entonces comunica <code>GLOBAL-COMMIT(T-1042)</code>. Cada servicio hace definitivos sus cambios y, finalmente, libera las reservas y bloqueos que había mantenido durante la preparación.</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="14.2857%">
<col width="42.8571%">
<col width="42.8572%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Momento</th>
<th class="tableblock halign-left valign-top">Qué ocurre</th>
<th class="tableblock halign-left valign-top">Estado que importa</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">1</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">El coordinador solicita preparar <code>T-1042</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La decisión global sigue abierta.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">2</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Cupos prepara una plaza y responde <code>YES</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La plaza está reservada, no confirmada.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">3</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Inscripciones prepara el registro y responde <code>YES</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La nueva inscripción todavía es provisional.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">4</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Agenda verifica el horario, se prepara y responde <code>YES</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Los tres participantes están preparados.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">5</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">El coordinador registra <code>COMMIT</code> y lo comunica.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La decisión global ya es durable.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">6</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Los tres servicios aplican el resultado y confirman recepción.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La inscripción completa queda confirmada.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>La tabla es deliberadamente secuencial para facilitar la lectura. En la práctica, las respuestas de los participantes pueden llegar en cualquier orden y los mensajes suelen enviarse en paralelo. Tampoco debemos confundir el momento de la decisión global con el instante en que todos los observadores externos ven el nuevo estado: la atomicidad del commit no crea automáticamente una lectura simultánea y consistente entre tres bases independientes.</p>
</div>
</div>
<div class="sect2">
<h3 id="_dos_votos_afirmativos_y_un_rechazo"><a class="anchor" href="#_dos_votos_afirmativos_y_un_rechazo"></a>Dos votos afirmativos y un rechazo</h3>
<div class="paragraph">
<p>Ahora imaginemos que Lucía ya tiene otra actividad los jueves. Cupos e Inscripciones responden <code>YES</code>, pero Agenda detecta el conflicto y responde <code>NO</code>. El coordinador registra <code>ABORT(T-1042)</code> y comunica el aborto a los demás. El servicio de cupos libera la plaza provisional; el de inscripciones descarta el registro pendiente; Agenda no agrega la actividad.</p>
</div>
<div class="paragraph">
<p>En este caso, <strong>dos respuestas afirmativas de tres no alcanzan</strong>. No importa que representen una mayoría ni que superen un supuesto umbral del 50 %: si el servicio de agenda no puede cumplir su parte, la inscripción no satisface el contrato de la operación. Confirmarla de todos modos implicaría redefinir el negocio por ejemplo, aceptar inscripciones sin agenda, no modificar simplemente la regla de votación de 2PC.</p>
</div>
</div>
<div class="sect2">
<h3 id="_el_coordinador_deja_de_responder"><a class="anchor" href="#_el_coordinador_deja_de_responder"></a>El coordinador deja de responder</h3>
<div class="paragraph">
<p>Volvamos al caso en que los tres participantes enviaron <code>YES</code>. Esta vez, el coordinador falla cuando los tres ya conservan <code>PREPARED</code>, pero antes de que todos conozcan una decisión global. Cupos mantiene la reserva, Inscripciones conserva el registro pendiente y Agenda preserva su preparación. Ninguno puede deducir, solo por el tiempo transcurrido, si la decisión fue persistida o si un mensaje se perdió.</p>
</div>
<div class="paragraph">
<p>Si el coordinador alcanzó a registrar <code>COMMIT</code>, al recuperarse debe volver a comunicar esa decisión. Si todavía no existía una decisión irreversible, su recuperación seguirá las reglas de terminación del protocolo. Los participantes no pueden asumir por su cuenta que la inscripción terminó correctamente ni abortarla unilateralmente desde <code>PREPARED</code>: podrían contradecir una decisión que otro servicio ya conoce. Esta es una consecuencia concreta del bloqueo de 2PC: mientras falta información, una plaza puede permanecer reservada y afectar a otras inscripciones <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>, <a href="#Bernstein1987" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Bernstein1987]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_el_mismo_caso_bajo_3pc"><a class="anchor" href="#_el_mismo_caso_bajo_3pc"></a>El mismo caso bajo 3PC</h3>
<div class="paragraph">
<p>Con 3PC, el comienzo sería parecido: el coordinador pregunta <code>CAN-COMMIT?</code> y recibe las tres respuestas afirmativas. Antes de decidir <code>COMMIT</code>, envía <code>PRE-COMMIT</code> y espera que cada servicio registre ese estado y lo reconozca. Solo después llega <code>DO-COMMIT</code>. Si el coordinador falla, los participantes y un posible reemplazo cuentan con una señal intermedia adicional que puede ayudar a determinar cómo terminar.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, si el procedimiento de recuperación autorizado comprueba que la transacción llegó a <code>PRE-COMMIT</code> y se cumplen las hipótesis de sincronía, conectividad y fallas que exige la variante utilizada, puede ser posible continuar sin esperar a que regrese el coordinador original. Lo que no sería correcto es permitir que Cupos confirmara mientras Agenda aborta por no haber recibido el mismo mensaje. Ante una partición arbitraria, 3PC no resuelve por sí solo esa dificultad <a href="#Skeen1981" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Skeen1981]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_cambia_si_cada_servicio_está_replicado"><a class="anchor" href="#_qué_cambia_si_cada_servicio_está_replicado"></a>¿Qué cambia si cada servicio está replicado?</h3>
<div class="paragraph">
<p>Supongamos ahora que Cupos, Inscripciones y Agenda guardan cada uno su estado en un grupo de tres réplicas coordinadas por Raft. Para que una partición lógica registre de forma duradera su preparación, puede alcanzar la mayoría correspondiente de <strong>sus propias réplicas</strong>, de acuerdo con las reglas del algoritmo de replicación. Si una réplica de Cupos se desconecta, las otras dos podrían seguir permitiendo que el <strong>servicio de cupos</strong>, considerado como un único participante lógico, se prepare.</p>
</div>
<div class="paragraph">
<p>Pero siguen existiendo <strong>tres decisiones locales necesarias</strong> para la inscripción. Dos réplicas de Cupos no reemplazan al servicio de Agenda, ni una mayoría de los tres servicios justifica ignorar un <code>NO</code>. Este es precisamente el tipo de separación que permite entender Paxos Commit: se puede utilizar consenso para hacer más resistente la información de preparación y decisión, sin cambiar la condición de atomicidad de la operación completa <a href="#GrayLamport2006" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[GrayLamport2006]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="paragraph">
<p>El caso deja además una pregunta útil para una práctica de laboratorio: <strong>¿qué ocurre si la preparación de Agenda tarda indefinidamente, pero Cupos ya reservó la última plaza disponible?</strong> Para contestarla no alcanza con estudiar el resultado <code>COMMIT/ABORT</code>; también hay que medir cuánto tiempo se retienen recursos, qué bloqueos produce la espera y cómo se recupera el sistema después de una caída.</p>
</div>
</div>
<div class="sect2">
<h3 id="_pregunta_comun_tres_yes_implican_commit"><a class="anchor" href="#_pregunta_comun_tres_yes_implican_commit"></a>Pregunta comun: ¿tres YES implican commit?</h3>
<div class="paragraph">
<p>Una transacción tiene tres participantes. Todos enviaron <code>YES</code>. El coordinador no responde y ninguno conoce la decisión global. <strong>¿Pueden los tres votar entre sí y confirmar por unanimidad?</strong></p>
</div>
<div class="paragraph">
<p>No como sustitución directa de 2PC. Los <code>YES</code> indican preparación, pero no prueban que el coordinador no haya tomado o difundido una decisión final incompatible. Incluso un procedimiento que parece razonable debe demostrar que está autorizado a decidir y que no existe un estado persistente oculto que contradiga el resultado.</p>
</div>
</div>
<div class="sect2">
<h3 id="_pregunta_comun_un_timeout_equivale_a_no"><a class="anchor" href="#_pregunta_comun_un_timeout_equivale_a_no"></a>Pregunta comun: ¿un timeout equivale a NO?</h3>
<div class="paragraph">
<p>Un participante tarda demasiado en responder <code>PREPARE</code>. El coordinador aún no ha persistido <code>COMMIT</code>. <strong>¿Puede abortar?</strong></p>
</div>
<div class="paragraph">
<p>Sí, en 2PC puede optar por <code>ABORT</code> antes del punto irreversible de commit y difundirlo, incluso sin saber si el participante está caído o solamente lento. El timeout es una política de vivacidad; no prueba que el participante haya emitido <code>NO</code>. El coordinador debe garantizar que la eventual respuesta tardía no cambie la decisión duradera.</p>
</div>
</div>
<div class="sect2">
<h3 id="_pregunta_comun_3pc_garantiza_vivacidad_con_una_partición"><a class="anchor" href="#_pregunta_comun_3pc_garantiza_vivacidad_con_una_partición"></a>Pregunta comun: ¿3PC garantiza vivacidad con una partición?</h3>
<div class="paragraph">
<p>Una red se divide en dos componentes. Una contiene un participante en <code>PRE-COMMIT</code> y otra contiene un participante en <code>WAIT</code>. <strong>¿Es correcto que cada lado decida por timeout?</strong></p>
</div>
<div class="paragraph">
<p>No en general. Las observaciones son parciales; si cada componente aplica una regla de terminación incompatible puede romperse I1. La respuesta segura puede requerir esperar, formar un quórum apropiado o usar un protocolo de acuerdo robusto para coordinar la autoridad de decisión.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_bibliografía"><a class="anchor" href="#_bibliografía"></a>Bibliografía</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Las referencias se consignan con datos editoriales y enlaces a DOI o a fuentes académicas originales. Se incluyen principalmente artículos originales y obras de referencia sobre recuperación distribuida.</p>
</div>
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="Gray1978"></a>[Gray1978] <strong>GRAY, Jim.</strong> «Notes on Data Base Operating Systems». En: <strong>Operating Systems: An Advanced Course</strong>. Lecture Notes in Computer Science, vol. 60. Springer, 1978. DOI: <a href="https://doi.org/10.1007/3-540-08755-9_9">10.1007/3-540-08755-9_9</a>.</p>
</li>
<li>
<p><a id="Skeen1981"></a>[Skeen1981] <strong>SKEEN, Dale.</strong> «Nonblocking Commit Protocols». En: <strong>Proceedings of the 1981 ACM SIGMOD International Conference on Management of Data</strong>, pp. 133–142. ACM, 1981. DOI: <a href="https://doi.org/10.1145/582318.582339">10.1145/582318.582339</a>.</p>
</li>
<li>
<p><a id="Bernstein1987"></a>[Bernstein1987] <strong>BERNSTEIN, Philip A.; HADZILACOS, Vassos; GOODMAN, Nathan.</strong> <strong>Concurrency Control and Recovery in Database Systems</strong>. Addison-Wesley, 1987. ISBN 0-201-10715-5. Edición electrónica: <a href="https://www.microsoft.com/en-us/research/people/philbe/book/">Microsoft Research</a>.</p>
</li>
<li>
<p><a id="FLP1985"></a>[FLP1985] <strong>FISCHER, Michael J.; LYNCH, Nancy A.; PATERSON, Michael S.</strong> «Impossibility of Distributed Consensus with One Faulty Process». <strong>Journal of the ACM</strong>, 32(2), pp. 374–382, 1985. DOI: <a href="https://doi.org/10.1145/3149.214121">10.1145/3149.214121</a>. Texto académico: <a href="https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf">MIT CSAIL</a>.</p>
</li>
<li>
<p><a id="Dwork1988"></a>[Dwork1988] <strong>DWORK, Cynthia; LYNCH, Nancy; STOCKMEYER, Larry.</strong> «Consensus in the Presence of Partial Synchrony». <strong>Journal of the ACM</strong>, 35(2), pp. 288–323, 1988. DOI: <a href="https://doi.org/10.1145/42282.42283">10.1145/42282.42283</a>.</p>
</li>
<li>
<p><a id="Mohan1992"></a>[Mohan1992] <strong>MOHAN, C.; HADERLE, Don; LINDSAY, Bruce; PIRAHESH, Hamid; SCHWARZ, Peter.</strong> «ARIES: A Transaction Recovery Method Supporting Fine-Granularity Locking and Partial Rollbacks Using Write-Ahead Logging». <strong>ACM Transactions on Database Systems</strong>, 17(1), pp. 94–162, 1992. Fuente institucional: <a href="https://research.ibm.com/publications/aries-a-transaction-recovery-method-supporting-fine-granularity-locking-and-partial-rollbacks-using-write-ahead-logging">IBM Research</a>.</p>
</li>
<li>
<p><a id="ChandraToueg1996"></a>[ChandraToueg1996] <strong>CHANDRA, Tushar D.; TOUEG, Sam.</strong> «Unreliable Failure Detectors for Reliable Distributed Systems». <strong>Journal of the ACM</strong>, 43(2), pp. 225–267, 1996. DOI: <a href="https://doi.org/10.1145/226643.226647">10.1145/226643.226647</a>.</p>
</li>
<li>
<p><a id="Lamport1998"></a>[Lamport1998] <strong>LAMPORT, Leslie.</strong> «The Part-Time Parliament». <strong>ACM Transactions on Computer Systems</strong>, 16(2), pp. 133–169, 1998. DOI: <a href="https://doi.org/10.1145/279227.279229">10.1145/279227.279229</a>.</p>
</li>
<li>
<p><a id="GrayLamport2006"></a>[GrayLamport2006] <strong>GRAY, Jim; LAMPORT, Leslie.</strong> «Consensus on Transaction Commit». <strong>ACM Transactions on Database Systems</strong>, 31(1), pp. 133–160, 2006. DOI: <a href="https://doi.org/10.1145/1132863.1132867">10.1145/1132863.1132867</a>. Versión institucional: <a href="https://www.microsoft.com/en-us/research/publication/consensus-on-transaction-commit/">Microsoft Research</a>.</p>
</li>
<li>
<p><a id="Ongaro2014"></a>[Ongaro2014] <strong>ONGARO, Diego; OUSTERHOUT, John.</strong> «In Search of an Understandable Consensus Algorithm». En: <strong>2014 USENIX Annual Technical Conference</strong>, pp. 305–319, 2014. Disponible en: <a href="https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro">USENIX</a>.</p>
</li>
<li>
<p><a id="Castro1999"></a>[Castro1999] <strong>CASTRO, Miguel; LISKOV, Barbara.</strong> «Practical Byzantine Fault Tolerance». En: <strong>Proceedings of the 3rd Symposium on Operating Systems Design and Implementation (OSDI)</strong>, pp. 173–186. USENIX Association, 1999. Texto original: <a href="https://www.usenix.org/legacy/events/osdi99/full_papers/castro/castro_html/castro.html">USENIX</a>.</p>
</li>
<li>
<p><a id="GarciaMolinaSalem1987"></a>[GarciaMolinaSalem1987] <strong>GARCIA-MOLINA, Hector; SALEM, Kenneth.</strong> «Sagas». En: <strong>Proceedings of the 1987 ACM SIGMOD International Conference on Management of Data</strong>, pp. 249–259. ACM, 1987. DOI: <a href="https://doi.org/10.1145/38713.38742">10.1145/38713.38742</a>.</p>
</li>
</ul>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_apéndice_pseudocódigo_básico_de_coordinación"><a class="anchor" href="#_apéndice_pseudocódigo_básico_de_coordinación"></a>Apendice A: Apéndice. Pseudocódigo básico de coordinación</h2>
<div class="sectionbody">
<div class="listingblock">
<div class="title">Pseudocódigo conceptual de 2PC (coordinador)</div>
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">coordinator_2pc(T, participants):
    send PREPARE(T) to all participants
    await responses or preparation timeout

    if all responses are YES:
        decision = COMMIT
    else:
        decision = ABORT

    durable_log(decision, T)  # antes de comunicarla
    send GLOBAL_DECISION(T, decision) to all participants
    retry until acknowledgements or recovery policy completes</code></pre>
</div>
</div>
<div class="listingblock">
<div class="title">Pseudocódigo conceptual de 3PC (camino sin fallas)</div>
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">coordinator_3pc_happy_path(T, participants):
    send CAN_COMMIT(T) to all participants
    await all responses
    if any response != YES:
        durable_log(ABORT, T)
        send ABORT(T) to all
        return

    durable_log(PRE_COMMIT, T)
    send PRE_COMMIT(T) to all participants
    await all PRE_COMMIT_ACK

    durable_log(COMMIT, T)
    send DO_COMMIT(T) to all participants</code></pre>
</div>
</div>
<div class="paragraph">
<p><strong>Nota:</strong> el pseudocódigo de 3PC describe <strong>solamente la ejecución sin fallas</strong>. No es una implementación completa ni segura ante todos los timeouts: hacen falta las máquinas de estado persistentes, reglas de recuperación y elección de coordinador, y las hipótesis de sincronía/conectividad expuestas en el capítulo 4. El pseudocódigo de 2PC también omite a propósito los detalles de reintento, logging por participante y recuperación.</p>
</div>
</div>
</div>`;export{e as default};