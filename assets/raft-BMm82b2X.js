var e=`<div class="sect1">
<h2 id="_resumen"><a class="anchor" href="#_resumen"></a>Resumen</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Raft es un algoritmo de consenso que mantiene un registro de operaciones replicado entre varios servidores. Este capítulo desarrolla la elección de líder, los términos, la replicación del registro, las reglas de confirmación y las garantías de seguridad frente a fallas. También estudia recuperación, instantáneas, cambios de integrantes y un caso de estudio, siguiendo el trabajo de Ongaro y Ousterhout <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_raft_una_estructura_para_comprender_y_administrar_el_consenso"><a class="anchor" href="#_raft_una_estructura_para_comprender_y_administrar_el_consenso"></a>Raft: una estructura para comprender y administrar el consenso</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Aunque Raft utiliza términos como <strong>voto</strong> y <strong>confirmación</strong>, resuelve un problema diferente del que abordan los protocolos de commit atómico, como 2PC o 3PC. En un commit atómico, varios participantes de una transacción deben coordinarse para que todos la confirmen o todos la aborten. Si alguno de los participantes necesarios no puede prepararse, la transacción no debe confirmarse.</p>
</div>
<div class="paragraph">
<p>Raft, en cambio, busca que varias réplicas acuerden una misma secuencia de operaciones. Para avanzar utiliza mayorías de servidores, de modo que no necesita una respuesta de cada réplica en todo momento. Cuando en Raft se dice que una entrada está <strong>confirmada</strong>, significa que el protocolo ya puede considerarla parte estable del registro acordado; no significa, por sí solo, que una transacción distribuida entre distintos recursos haya completado su commit. Por eso Raft puede utilizarse para replicar estado dentro de un servicio, pero no reemplaza automáticamente a un protocolo de commit atómico.</p>
</div>
<div class="paragraph">
<p>Para acompañar la lectura, se puede explorar esta <a href="https://thesecretlivesofdata.com/raft/">visualización gráfica e interactiva del algoritmo de Raft</a>.</p>
</div>
<div class="sect2">
<h3 id="_el_enfoque_de_líder_fuerte"><a class="anchor" href="#_el_enfoque_de_líder_fuerte"></a>El enfoque de líder fuerte</h3>
<div class="paragraph">
<p>Raft fue propuesto por Diego Ongaro y John Ousterhout y presentado en la conferencia USENIX ATC de 2014. Su objetivo es construir y mantener un registro replicado. Los autores organizaron el diseño alrededor de tres asuntos centrales: <strong>elección de líder</strong>, <strong>replicación del registro</strong> y <strong>seguridad</strong>. La idea es reducir la cantidad de situaciones que cada proceso puede generar, de manera que resulte más sencillo comprender por qué el protocolo funciona <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>.</p>
</div>
<div class="paragraph">
<p>Raft utiliza un <strong>líder fuerte</strong>. En condiciones normales, los clientes envían las operaciones al líder, y este es el único que añade nuevas entradas a su registro para reproducirlas en los demás. Los seguidores no incorporan por su cuenta nuevas solicitudes de clientes como comandos acordados; responden a los mensajes del líder y participan de las elecciones. Así, el flujo de nuevas entradas va del líder hacia los seguidores, evitando que múltiples servidores organicen simultáneamente historiales oficiales.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/06_roles_raft.svg" alt="Líder" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_seguidor_candidato_y_líder"><a class="anchor" href="#_seguidor_candidato_y_líder"></a>Seguidor, candidato y líder</h3>
<div class="paragraph">
<p>Cada servidor votante puede estar en uno de tres estados. El <strong>seguidor</strong> espera mensajes del líder y atiende solicitudes de voto. Si pasa demasiado tiempo sin recibir comunicaciones válidas de un líder, se convierte en <strong>candidato</strong> e intenta obtener una mayoría. Si reúne suficientes votos, se convierte en <strong>líder</strong> y comienza a enviar mensajes periódicos a los demás. Ante un término mayor observado en un mensaje válido, un candidato o líder retrocede al estado de seguidor.</p>
</div>
<div class="paragraph">
<p>Los estados describen el rol de un proceso en un momento dado, no tipos de máquinas diferentes. El mismo servidor puede ser seguidor durante horas, candidato por un breve intervalo y luego líder. Lo importante es que la autoridad esté vinculada a un período numerado y que una elección nueva no permita reintroducir una historia que perdió entradas ya confirmadas.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/07_estados.svg" alt="Transiciones entre seguidor candidato y líder" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_términos_y_numeración_de_la_autoridad"><a class="anchor" href="#_términos_y_numeración_de_la_autoridad"></a>Términos y numeración de la autoridad</h3>
<div class="paragraph">
<p>El tiempo lógico de Raft se divide en <strong>términos</strong> (<strong>terms</strong>), identificados con números enteros crecientes. Un término puede contener una elección y, si tiene éxito, un período de liderazgo. También puede terminar sin líder, por ejemplo porque dos candidatos dividieron los votos. Los términos no son intervalos de duración fija ni requieren sincronización de relojes: son una secuencia lógica utilizada para comparar la antigüedad de mensajes y autoridades.</p>
</div>
<div class="paragraph">
<p>Un proceso actualiza su término local al observar uno superior y abandona cualquier autoridad asociada a un término anterior. Las solicitudes con términos antiguos no deben renovar la confianza en un líder obsoleto. Los términos, junto con el voto emitido durante cada uno, deben persistirse antes de responder de un modo que dependa de ellos.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_información_conserva_cada_servidor"><a class="anchor" href="#_qué_información_conserva_cada_servidor"></a>Qué información conserva cada servidor</h3>
<div class="paragraph">
<p>Las variables del algoritmo se dividen entre estado persistente y estado volátil. El estado que sobrevive a reinicios incluye el término actual, el candidato por el que se votó en ese término y las entradas del registro. Cada entrada posee un índice, el término en que fue creada por un líder y el comando correspondiente. Los índices no son números de versión global independientes del contenido: representan posiciones en una secuencia.</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="20%">
<col width="40%">
<col width="40%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Variable</th>
<th class="tableblock halign-left valign-top">Uso</th>
<th class="tableblock halign-left valign-top">Durabilidad</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>currentTerm</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mayor término observado por el servidor.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Persistente.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>votedFor</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Candidato al que concedió su voto en el término actual, si existe.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Persistente.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>log[]</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Entradas <code>(índice, término, comando)</code> en el orden del registro.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Persistente.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>commitIndex</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mayor índice conocido como confirmado.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Volátil en el modelo de referencia; se reconstruye de forma segura.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>lastApplied</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mayor índice aplicado a la máquina de estados.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Volátil en el modelo de referencia; la recuperación exige coordinarlo con el estado de la aplicación.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>nextIndex[f]</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Próxima entrada que el líder intentará enviar al seguidor <code>f</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Volátil; solo del líder.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>matchIndex[f]</code></p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mayor índice conocido como replicado por el seguidor <code>f</code>.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Volátil; solo del líder.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>La distinción entre persistente y volátil depende de la especificación de referencia. Una implementación puede almacenar más información, pero debe mantener las relaciones necesarias entre el registro, los resultados aplicados y los datos visibles para el cliente. Persistir el término y el voto, por ejemplo, evita conceder votos incompatibles después de reiniciar; persistir el registro impide olvidar operaciones que pudieron participar en una confirmación <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_elección_de_líder_cómo_se_obtiene_una_autoridad_compartida"><a class="anchor" href="#_elección_de_líder_cómo_se_obtiene_una_autoridad_compartida"></a>Elección de líder: cómo se obtiene una autoridad compartida</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_el_temporizador_de_elección_y_los_mensajes_de_mantenimiento"><a class="anchor" href="#_el_temporizador_de_elección_y_los_mensajes_de_mantenimiento"></a>El temporizador de elección y los mensajes de mantenimiento</h3>
<div class="paragraph">
<p>Un seguidor espera periódicamente mensajes <code>AppendEntries</code> del líder; cuando no hay entradas nuevas, estos mensajes pueden enviarse vacíos y funcionan como <strong>latidos</strong> (<strong>heartbeats</strong>). También puede mantenerse como seguidor al conceder un voto válido. Si vence el temporizador de elección sin recibir la señal esperada, el servidor sospecha que hace falta un nuevo líder. Entonces incrementa su término, vota por sí mismo y solicita votos a los demás mediante <code>RequestVote</code>.</p>
</div>
<div class="paragraph">
<p>La elección no debe interpretarse como la detección infalible de una falla. Un seguidor con una red lenta puede iniciar una elección aunque el líder siga vivo. Esa situación puede producir un término nuevo, y al conocerlo el líder anterior pierde su autoridad. Raft prioriza reglas que hacen seguras estas transiciones frente a la suposición de que todos los temporizadores serán exactos.</p>
</div>
<div class="paragraph">
<p>Los tiempos de espera aleatorizados reducen la probabilidad de que varios servidores se conviertan en candidatos al mismo tiempo. Si todos usaran exactamente el mismo timeout y comenzaran sincronizados, podrían dividir los votos repetidamente. La aleatorización no constituye por sí sola una prueba de terminación para cualquier ejecución, pero facilita que un candidato termine acumulando una mayoría cuando la red se vuelve estable <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_cómo_se_concede_un_voto"><a class="anchor" href="#_cómo_se_concede_un_voto"></a>Cómo se concede un voto</h3>
<div class="paragraph">
<p>Una solicitud <code>RequestVote</code> incluye el término del candidato y una descripción de la última entrada que conoce: <code>lastLogIndex</code> y <code>lastLogTerm</code>. El receptor no concede un voto si la solicitud pertenece a un término antiguo. Si observa un término nuevo, actualiza su estado local y puede considerar al candidato. Como máximo concede su voto a un candidato por término, y solo si su registro está <strong>al menos tan actualizado</strong> como el del propio servidor.</p>
</div>
<div class="paragraph">
<p>La regla de actualización del registro compara primero el término de la última entrada y, solamente si coincide, compara los índices. Para un candidato \\(C\\) y un votante \\(V\\):</p>
</div>
<div class="stemblock">
<div class="content">
\\[\\operatorname{actualizado}(C,V)
\\iff
(t_C&gt;t_V)\\lor(t_C=t_V\\land i_C\\geq i_V).\\]
</div>
</div>
<div class="paragraph">
<p>Aquí \\(t\\) es el término de la última entrada del registro y \\(i\\) es su índice. Esta comparación no se reemplaza por «tener más entradas»: un registro más largo puede terminar en entradas de un término antiguo y, aun así, ser menos actualizado que otro más corto. La prioridad del término permite conservar la información relevante sobre decisiones confirmadas.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/08_eleccion.svg" alt="Secuencia de RequestVote y elección de líder con mayoría" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_una_mayoría_elige_como_máximo_un_líder_por_término"><a class="anchor" href="#_una_mayoría_elige_como_máximo_un_líder_por_término"></a>Una mayoría elige como máximo un líder por término</h3>
<div class="paragraph">
<p>Con cinco votantes, un candidato necesita tres votos. Cada servidor vota como máximo una vez en un mismo término, incluso si se reinicia. Como dos mayorías se intersectan, dos candidatos diferentes no pueden conseguir, cada uno, tres votos distintos para el mismo término. De aquí surge la propiedad de <strong>seguridad de la elección</strong>: como máximo se elige un líder por término.</p>
</div>
<div class="paragraph">
<p>Un candidato que consigue dos votos sobre cinco todavía no es líder. Si otro recibe los tres votos restantes, será él quien pueda avanzar. Cuando los votos quedan divididos sin mayorías, los candidatos aguardan un nuevo vencimiento del temporizador y vuelven a intentarlo en términos más altos. El resultado puede ser un término sin líder, pero no dos líderes legítimamente elegidos para el mismo término.</p>
</div>
<div class="paragraph">
<p>Es posible, sin embargo, que dos servidores <strong>crean</strong> temporalmente ser líderes de términos diferentes. Uno de ellos puede estar aislado y desconocer la nueva elección. La propiedad relevante no consiste en impedir toda creencia obsoleta, sino en impedir que esa autoridad antigua confirme operaciones incompatibles con las decisiones del líder actual.</p>
</div>
</div>
<div class="sect2">
<h3 id="_la_condición_de_tener_un_registro_actualizado"><a class="anchor" href="#_la_condición_de_tener_un_registro_actualizado"></a>La condición de tener un registro actualizado</h3>
<div class="paragraph">
<p>Exigir un registro suficientemente reciente al candidato es una regla central, no una optimización. Supongamos que el líder anterior había confirmado una operación que se encontraba en la mayoría de los registros. Cualquier mayoría electoral futura debe compartir al menos un servidor con esa mayoría anterior. Sin embargo, la intersección solo sirve si el votante compartido no entrega su voto a un candidato cuyo historial podría omitir esa operación confirmada.</p>
</div>
<div class="paragraph">
<p>El filtro de <code>lastLogTerm</code> y <code>lastLogIndex</code>, junto con las reglas de confirmación, impide que llegue a ser líder un servidor incapaz de preservar las entradas confirmadas. Esta propiedad se conoce como <strong>integridad del líder</strong> (<strong>Leader Completeness</strong>): si una entrada fue confirmada en un término, todo líder de los términos posteriores debe contenerla <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_replicación_del_registro_cómo_se_acuerdan_las_operaciones"><a class="anchor" href="#_replicación_del_registro_cómo_se_acuerdan_las_operaciones"></a>Replicación del registro: cómo se acuerdan las operaciones</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_el_ingreso_de_una_solicitud"><a class="anchor" href="#_el_ingreso_de_una_solicitud"></a>El ingreso de una solicitud</h3>
<div class="paragraph">
<p>Cuando un cliente pide ejecutar un comando, el líder crea una entrada al final de su registro con el término actual. A continuación envía solicitudes <code>AppendEntries</code> para que los seguidores incorporen esa entrada. Cada solicitud incluye el índice y término que preceden a las entradas enviadas, una secuencia de entradas nuevas —posiblemente vacía— y el índice hasta el cual el líder sabe que el registro está confirmado.</p>
</div>
<div class="paragraph">
<p>El seguidor no debe añadir las entradas recibidas sin comprobar el historial. Primero verifica que su registro contiene la entrada previa anunciada con el mismo índice y término. Si no coincide, rechaza la solicitud: el líder tendrá que retroceder y buscar un punto común. Si coincide, elimina las entradas <strong>en conflicto</strong> que ocupan índices iguales con términos distintos y agrega las entradas faltantes del líder. El mecanismo hace converger gradualmente los registros hacia un prefijo común <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/09_replicacion.svg" alt="Replicación de una operación con AppendEntries y confirmación mayoritaria" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_propiedad_de_coincidencia_del_registro"><a class="anchor" href="#_propiedad_de_coincidencia_del_registro"></a>Propiedad de coincidencia del registro</h3>
<div class="paragraph">
<p>La <strong>propiedad de coincidencia del registro</strong> (<strong>Log Matching</strong>) afirma que, si dos registros contienen una entrada con el mismo índice y término, entonces ambos registros contienen las mismas entradas en todos los índices anteriores. La comprobación de <code>prevLogIndex</code> y <code>prevLogTerm</code>, combinada con las reglas para resolver conflictos, permite mantener esta relación.</p>
</div>
<div class="paragraph">
<p>Esto no significa que todos los registros deban tener exactamente la misma longitud en cada instante. Un seguidor lento puede estar muy atrasado, y otro puede contener entradas no confirmadas que fueron generadas por un líder antiguo. La propiedad es más acotada y más poderosa: cuando coincide una entrada identificada por índice y término, también coincide la historia previa a esa posición.</p>
</div>
<div class="paragraph">
<p>Para aplicar los comandos, el servidor procesa únicamente las entradas confirmadas que todavía no haya ejecutado, en orden creciente de índice. Un seguidor utiliza la información sobre <code>leaderCommit</code> enviada por el líder para avanzar su <code>commitIndex</code> hasta el mínimo entre ese valor y el último índice que realmente posee.</p>
</div>
</div>
<div class="sect2">
<h3 id="_los_dos_índices_que_administra_el_líder_por_seguidor"><a class="anchor" href="#_los_dos_índices_que_administra_el_líder_por_seguidor"></a>Los dos índices que administra el líder por seguidor</h3>
<div class="paragraph">
<p>El líder mantiene <code>nextIndex[f]</code>, una estimación del siguiente índice que debería enviar al seguidor <code>f</code>, y <code>matchIndex[f]</code>, el índice más alto que sabe replicado allí. Si un seguidor rechaza una solicitud porque no coincide el prefijo, el líder disminuye o ajusta <code>nextIndex</code> y reintenta. Cuando recibe una respuesta positiva, puede actualizar ambos valores.</p>
</div>
<div class="paragraph">
<p>Esta lógica explica por qué un servidor que estuvo desconectado no necesita reconstruir el historial a mano. Puede reencontrar automáticamente un prefijo compartido y recibir las entradas ausentes. Si el líder ya compactó los datos que necesita ese seguidor, en lugar de enviar todas las entradas antiguas tendrá que recurrir a una instantánea, como veremos después.</p>
</div>
</div>
<div class="sect2">
<h3 id="_confirmación_mediante_mayoría_la_regla_exacta"><a class="anchor" href="#_confirmación_mediante_mayoría_la_regla_exacta"></a>Confirmación mediante mayoría: la regla exacta</h3>
<div class="paragraph">
<p>Una entrada generada por el líder del <strong>término actual</strong> puede declararse confirmada cuando se ha almacenado en una mayoría de servidores votantes. El líder calcula un índice \\(N\\) tal que al menos una mayoría tiene <code>matchIndex &gt;= N</code>, pero solamente avanza directamente su <code>commitIndex</code> hasta \\(N\\) si <code>log[N].term == currentTerm</code>. Esta última comprobación es esencial:</p>
</div>
<div class="stemblock">
<div class="content">
\\[\\#\\{s:\\operatorname{matchIndex}(s)\\geq N\\}\\geq
\\left\\lfloor\\frac{|S|}{2}\\right\\rfloor+1
\\quad\\land\\quad
\\operatorname{term}(\\operatorname{log}[N])=\\operatorname{currentTerm}.\\]
</div>
</div>
<div class="paragraph">
<p>En la expresión se incluye el propio líder al contar los servidores que poseen la entrada. El detalle del término evita aplicar incorrectamente una regla intuitiva pero falsa: <strong>no toda entrada antigua observada en una mayoría puede declararse confirmada por simple recuento de copias</strong>. En escenarios con cambios de líder, una entrada de un término anterior puede estar replicada en una mayoría y todavía existir una ejecución futura legítima que la reemplace.</p>
</div>
<div class="paragraph">
<p>¿Cómo se confirman entonces las entradas antiguas que sobreviven en el registro del nuevo líder? Al confirmar una entrada del término actual, todas las entradas que la preceden en el registro de ese líder quedan confirmadas indirectamente. Es una regla conservadora que impide que las entradas antiguas se interpreten fuera de contexto <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/10_commit_term.svg" alt="La mayoría por sí sola no basta para confirmar directamente una entrada de un término anterior" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_confirmado_aplicado_y_respondido_al_cliente"><a class="anchor" href="#_confirmado_aplicado_y_respondido_al_cliente"></a>Confirmado, aplicado y respondido al cliente</h3>
<div class="paragraph">
<p>Una vez confirmada una entrada, el líder puede aplicarla en orden a su máquina de estados y devolver el resultado al cliente. Un servidor puede haber recibido la entrada sin conocer todavía que está confirmada; cuando se actualiza su <code>commitIndex</code>, puede aplicarla también. De ahí que <strong>replicado</strong>, <strong>confirmado</strong> y <strong>aplicado</strong> describan hechos diferentes.</p>
</div>
<div class="paragraph">
<p>En el caso habitual, una nueva operación necesita un viaje de ida y vuelta entre líder y mayoría de seguidores para alcanzar confirmación, sin exigir que los integrantes más lentos respondan. El costo total de atención al cliente incluye, además, los intercambios con el cliente y el acceso a almacenamiento duradero. Las garantías de rendimiento varían con la implementación, el hardware y las políticas de escritura <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_seguridad_por_qué_un_cambio_de_líder_no_destruye_una_decisión"><a class="anchor" href="#_seguridad_por_qué_un_cambio_de_líder_no_destruye_una_decisión"></a>Seguridad: por qué un cambio de líder no destruye una decisión</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_cinco_propiedades_para_ordenar_el_razonamiento"><a class="anchor" href="#_cinco_propiedades_para_ordenar_el_razonamiento"></a>Cinco propiedades para ordenar el razonamiento</h3>
<div class="paragraph">
<p>El artículo original presenta un conjunto de propiedades que, en conjunto, explican el comportamiento del protocolo. La <strong>seguridad de la elección</strong> impide dos líderes elegidos en un término; la propiedad de <strong>registro de solo anexado por el líder</strong> indica que un líder no elimina ni sobrescribe sus propias entradas mientras mantiene ese rol; la <strong>coincidencia del registro</strong> relaciona los prefijos de registros que comparten una entrada identificada por índice y término; la <strong>integridad del líder</strong> conserva las entradas confirmadas en todos los líderes posteriores; y la <strong>seguridad de la máquina de estados</strong> impide aplicar comandos distintos en la misma posición en máquinas de estados diferentes.</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="25%">
<col width="75%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Propiedad</th>
<th class="tableblock halign-left valign-top">Interpretación</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Seguridad de elección</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">A lo sumo un líder elegido por término.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Registro de solo anexado por el líder</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Un líder no sobrescribe ni elimina entradas de su propio registro.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Coincidencia del registro</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Índice y término iguales implican un prefijo anterior idéntico.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Integridad del líder</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Todo líder posterior contiene las entradas previamente confirmadas.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Seguridad de la máquina de estados</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Dos servidores no aplican comandos diferentes en el mismo índice.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>Estas propiedades se apoyan unas en otras. La elegibilidad del candidato impide que una nueva autoridad pierda una entrada confirmada. La comprobación del prefijo mantiene el orden de las entradas replicadas. La confirmación apropiada evita dar por definitiva una entrada que un líder futuro podría reemplazar. La aplicación secuencial impide que los seguidores ejecuten un historial distinto por adelantado.</p>
</div>
</div>
<div class="sect2">
<h3 id="_un_ejemplo_de_conflicto_después_de_una_falla"><a class="anchor" href="#_un_ejemplo_de_conflicto_después_de_una_falla"></a>Un ejemplo de conflicto después de una falla</h3>
<div class="paragraph">
<p>Supongamos que el servidor A fue líder en el término 4 y escribió una entrada <code>X</code> en el índice 7, pero solo consiguió almacenarla en A y B. Antes de obtener una mayoría de cinco, A deja de responder. Otro servidor puede convertirse en líder de un término posterior, siempre que reúna una mayoría y cumpla la condición de registro actualizado. Si el nuevo líder tiene una entrada distinta y legítima para el índice 7, puede reparar los registros de A y B cuando recuperen la comunicación. La entrada <code>X</code> no era definitiva: había sido almacenada, pero no confirmada.</p>
</div>
<div class="paragraph">
<p>El caso cambia si A logró confirmar <code>X</code> bajo las reglas de Raft. Entonces todo nuevo líder legítimo deberá conservarla. La distinción no depende de que A hubiera respondido al cliente antes de fallar, sino de si la entrada llegó realmente al estado de confirmación definido por el protocolo.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/11_falla_lider.svg" alt="Entrada no confirmada reemplazada y entrada confirmada conservada" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_por_qué_la_intersección_de_quórums_no_alcanza_sola"><a class="anchor" href="#_por_qué_la_intersección_de_quórums_no_alcanza_sola"></a>Por qué la intersección de quórums no alcanza sola</h3>
<div class="paragraph">
<p>Conviene reconstruir el argumento principal. Una entrada confirmada está respaldada por información distribuida en un conjunto que intersectará cualquier mayoría electoral posterior. Al menos un votante de la nueva elección puede contener información relacionada con esa decisión. Pero el protocolo no se limita a confiar en su presencia: el votante evalúa el historial del candidato, y la forma de confirmar entradas permite demostrar que un candidato que consiguiera una mayoría no puede carecer de una entrada ya confirmada.</p>
</div>
<div class="paragraph">
<p>Si ignoráramos la regla del registro actualizado, un servidor atrasado podría ser elegido por una mayoría que desconoce parte de la historia y empezar a producir entradas incompatibles. Si ignoráramos la regla especial para confirmar entradas de términos antiguos, el mero hecho de contar copias podría permitir declarar definitiva una entrada sin que quede protegida frente a elecciones futuras. El diseño de Raft hace que estas dos condiciones trabajen juntas <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_términos_más_altos_y_líderes_obsoletos"><a class="anchor" href="#_términos_más_altos_y_líderes_obsoletos"></a>Términos más altos y líderes obsoletos</h3>
<div class="paragraph">
<p>Un líder desconectado puede seguir creyendo que conserva su función. Aun así, le será imposible confirmar nuevas entradas sin comunicarse con una mayoría válida. Si vuelve a contactar con un servidor que ya conoce un término mayor, recibirá ese dato y abandonará su rol. La seguridad depende de las verificaciones del protocolo y de las mayorías, no de que los líderes detecten instantáneamente su propia obsolescencia.</p>
</div>
<div class="paragraph">
<p>Hay un matiz de implementación importante: los clientes no deberían confiar automáticamente en una lectura local servida por un líder que solo <strong>cree</strong> seguir siendo líder. Para ofrecer lecturas linealizables, la implementación debe comprobar que la autoridad sigue vigente mediante un procedimiento adecuado, por ejemplo una comprobación con quórum basada en <code>ReadIndex</code>, y asegurarse de aplicar lo confirmado hasta el índice pertinente. Esta operación de lectura tiene requisitos propios que no deben confundirse con una consulta cualquiera al disco local <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>, <a href="#RaftWebsite" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[RaftWebsite]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_particiones_persistencia_y_recuperación"><a class="anchor" href="#_particiones_persistencia_y_recuperación"></a>Particiones, persistencia y recuperación</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_qué_ocurre_cuando_la_red_se_divide"><a class="anchor" href="#_qué_ocurre_cuando_la_red_se_divide"></a>Qué ocurre cuando la red se divide</h3>
<div class="paragraph">
<p>En un grupo de cinco servidores, una partición puede dejar tres servidores de un lado y dos del otro. El lado de tres puede elegir un líder y confirmar entradas si sus integrantes se comunican. El lado de dos no reúne suficientes votos para una elección ni suficientes copias para confirmar entradas nuevas. Puede conservar datos y recibir ciertas solicitudes locales, pero no puede afirmar que está realizando nuevas decisiones por consenso.</p>
</div>
<div class="paragraph">
<p>Esta regla protege el acuerdo ante la reconexión. Dos componentes disjuntos no pueden sostener simultáneamente dos mayorías de la misma configuración. Si un líder antiguo estaba en el lado minoritario y otro fue elegido en el lado mayoritario, el antiguo termina reconociendo el término superior cuando vuelve a recibir comunicaciones válidas.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/12_particion.svg" alt="La mayoría puede avanzar mientras la minoría no confirma operaciones" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_qué_se_persiste_antes_de_responder"><a class="anchor" href="#_qué_se_persiste_antes_de_responder"></a>Qué se persiste antes de responder</h3>
<div class="paragraph">
<p>El término, el voto y las entradas del registro forman la memoria crítica de Raft. Un servidor que votó por un candidato en un término no debe olvidar ese voto tras reiniciar y conceder otro incompatible. Del mismo modo, un seguidor que anunció haber almacenado una entrada no puede descartarla arbitrariamente en una recuperación y seguir afirmando que la replicación anterior ocurrió tal como fue reconocida.</p>
</div>
<div class="paragraph">
<p>El problema no se resuelve simplemente con escribir estructuras en memoria. Si el almacenamiento puede perder escrituras después de que el servidor ya las anunció como duraderas, el razonamiento sobre mayorías deja de ser válido. En una implementación real hay que precisar los puntos de persistencia, el comportamiento del sistema de archivos y la relación entre el registro de Raft y el estado materializado de la aplicación.</p>
</div>
</div>
<div class="sect2">
<h3 id="_reincorporación_de_un_seguidor_atrasado"><a class="anchor" href="#_reincorporación_de_un_seguidor_atrasado"></a>Reincorporación de un seguidor atrasado</h3>
<div class="paragraph">
<p>Cuando un seguidor se reconecta, el líder intenta encontrar el punto más reciente en que coinciden los registros y enviar las entradas que faltan. Las solicitudes rechazadas ofrecen evidencia de que el prefijo elegido no coincide; el líder ajusta los índices de envío hasta alcanzar una coincidencia. Las entradas conflictivas no confirmadas pueden desaparecer del seguidor como parte de esta reparación.</p>
</div>
<div class="paragraph">
<p>La operación es segura porque el líder legítimo contiene las entradas confirmadas y nunca elimina sus propias entradas. El seguidor no necesita negociar la historia mediante preferencias personales: aplica las reglas de comparación de índices y términos y termina adoptando el prefijo correspondiente al líder actual.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_compactación_del_registro_y_cambios_de_integrantes"><a class="anchor" href="#_compactación_del_registro_y_cambios_de_integrantes"></a>Compactación del registro y cambios de integrantes</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_instantáneas_conservar_el_estado_sin_almacenar_toda_la_historia"><a class="anchor" href="#_instantáneas_conservar_el_estado_sin_almacenar_toda_la_historia"></a>Instantáneas: conservar el estado sin almacenar toda la historia</h3>
<div class="paragraph">
<p>Con el tiempo, un registro puede contener millones de comandos. Conservar cada uno indefinidamente encarece almacenamiento, recuperación y transferencia a nuevos servidores. Raft permite compactar un prefijo ya aplicado mediante una <strong>instantánea</strong> (<strong>snapshot</strong>) que contiene el estado de la máquina y los metadatos necesarios para identificar hasta dónde llega ese estado: el último índice incluido y su término.</p>
</div>
<div class="paragraph">
<p>La instantánea debe representar un estado consistente de la aplicación. Si un seguidor está tan atrasado que el líder ya descartó las entradas que necesitaría para ponerse al día, el líder puede transmitirle una instantánea mediante <code>InstallSnapshot</code>. El receptor instala el estado y conserva, cuando corresponde, la parte del registro que sigue siendo compatible con la instantánea. Después continúa recibiendo entradas normales <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/13_snapshot.svg" alt="Compactación del prefijo y recuperación de un seguidor mediante instantánea" width="100%">
</div>
</div>
<div class="paragraph">
<p>La compactación no elimina las reglas del consenso. El índice y el término que identifican el límite de la instantánea preservan la información necesaria para comparar historiales. La aplicación debe coordinar el almacenamiento de snapshots con la recuperación del registro para evitar aplicar un comando dos veces o perder efectos que debían quedar representados en el estado persistente.</p>
</div>
</div>
<div class="sect2">
<h3 id="_la_dificultad_de_cambiar_la_configuración"><a class="anchor" href="#_la_dificultad_de_cambiar_la_configuración"></a>La dificultad de cambiar la configuración</h3>
<div class="paragraph">
<p>Hasta ahora supusimos un conjunto fijo de votantes. En sistemas reales es necesario añadir, sustituir o retirar servidores. No basta con cambiar una lista de direcciones en todos los nodos: si dos grupos utilizan configuraciones incompatibles durante la transición, podrían formarse mayorías distintas que no se intersecten. La reconfiguración debe ser una operación del propio protocolo, no una modificación externa arbitraria.</p>
</div>
<div class="paragraph">
<p>El artículo de 2014 describe el <strong>consenso conjunto</strong> (<strong>joint consensus</strong>). Durante una fase transitoria coexisten la configuración antigua y la nueva, y las decisiones relevantes requieren satisfacer las mayorías exigidas por ambas. Después se confirma la nueva configuración. Esta estrategia evita que dos configuraciones independientes sostengan autoridades incompatibles mientras se completa la transición <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>.</p>
</div>
<div class="paragraph">
<p>La tesis doctoral de Ongaro presenta además una estrategia simplificada que cambia un servidor por vez, con reglas específicas que preservan la seguridad. No son dos pasos que deban mezclarse sin cuidado: son variantes de reconfiguración, cada una con sus propias condiciones. Una implementación debe elegir y respetar un mecanismo completo <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/14_reconfiguracion.svg" alt="Transición de configuración mediante consenso conjunto" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_puede_seguir_atendiendo_clientes_durante_la_reconfiguración"><a class="anchor" href="#_puede_seguir_atendiendo_clientes_durante_la_reconfiguración"></a>¿Puede seguir atendiendo clientes durante la reconfiguración?</h3>
<div class="paragraph">
<p>En una reconfiguración correctamente implementada, un sistema puede continuar atendiendo operaciones mientras cambian sus integrantes, siempre que alcance los quórums requeridos en cada etapa. Sin embargo, la vivacidad puede verse afectada si faltan servidores de una configuración que todavía participa de las reglas de decisión. Por eso, al planificar cambios operativos, el orden de incorporación, puesta al día y retiro de servidores forma parte del razonamiento de disponibilidad.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_interacción_con_clientes_y_límites_prácticos"><a class="anchor" href="#_interacción_con_clientes_y_límites_prácticos"></a>Interacción con clientes y límites prácticos</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_reintentos_respuestas_perdidas_e_idempotencia"><a class="anchor" href="#_reintentos_respuestas_perdidas_e_idempotencia"></a>Reintentos, respuestas perdidas e idempotencia</h3>
<div class="paragraph">
<p>Supongamos que un cliente envía una operación, el líder la confirma y ejecuta, pero la respuesta se pierde en la red. El cliente no sabe si la solicitud se procesó. Si vuelve a enviarla como una operación nueva, podría aplicarse dos veces. Raft conserva el orden y la durabilidad de las entradas confirmadas, pero una aplicación que quiera ofrecer semántica de ejecución exactamente una vez debe añadir un mecanismo de identificación y deduplicación de solicitudes.</p>
</div>
<div class="paragraph">
<p>Una estrategia habitual consiste en asignar a cada cliente un identificador estable y un número de secuencia monotónico. La máquina de estados registra la última solicitud aplicada para ese cliente y su resultado. Si vuelve a recibir el mismo identificador, devuelve el resultado anterior sin repetir el efecto. Esta tabla debe formar parte del estado replicado o de la instantánea recuperable; de otro modo, un reinicio podría hacer que se olvidaran las solicitudes ya ejecutadas <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_escrituras_lecturas_y_linealizabilidad"><a class="anchor" href="#_escrituras_lecturas_y_linealizabilidad"></a>Escrituras, lecturas y linealizabilidad</h3>
<div class="paragraph">
<p>Un registro ordenado facilita construir una máquina de estados linealizable: las operaciones pueden observarse como si ocurrieran atómicamente en un orden compatible con el tiempo real. Pero la linealizabilidad no aparece automáticamente por leer desde cualquier réplica. Un seguidor atrasado puede devolver un valor viejo, y un líder aislado que aún no conoce su reemplazo puede responder con información obsoleta.</p>
</div>
<div class="paragraph">
<p>Las escrituras deben reconocerse tras la confirmación apropiada y la aplicación correspondiente. Las lecturas que pretendan reflejar las escrituras ya completadas necesitan comprobar una barrera de autoridad y de estado; una vía es obtener evidencia reciente de una mayoría y esperar hasta aplicar el índice de confirmación correspondiente. En el procedimiento del artículo extendido también se contempla que un líder recién elegido confirme una entrada de su término antes de responder lecturas linealizables, para asegurarse de conocer las decisiones anteriores. Las lecturas desde seguidores requieren mecanismos adicionales <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_garantiza_y_qué_no_garantiza_raft"><a class="anchor" href="#_qué_garantiza_y_qué_no_garantiza_raft"></a>Qué garantiza y qué no garantiza Raft</h3>
<div class="paragraph">
<p>Raft ofrece un orden replicado seguro de comandos bajo el modelo de fallas no bizantinas y los requisitos de persistencia. No convierte en deterministas operaciones que no lo son: si un comando consulta un reloj local o utiliza números aleatorios no acordados, los servidores podrían divergir aunque aplicaran exactamente el mismo registro. Tampoco vuelve automáticamente atómicas operaciones distribuidas que afectan sistemas externos ajenos al registro ni evita los efectos duplicados sobre otros servicios.</p>
</div>
<div class="paragraph">
<p>La tolerancia a fallas también tiene un costo: si no queda una mayoría comunicada, las nuevas decisiones deben detenerse. Para un grupo fijo de \\(N=2f+1\\) servidores, puede mantenerse la vivacidad con hasta \\(f\\) fallas o servidores inaccesibles, siempre que la mayoría restante pueda comunicarse y el período de ejecución resulte suficientemente estable. El hecho de que existan cinco réplicas no reemplaza una estrategia de despliegue, monitoreo y recuperación apropiada.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_caso_de_estudio_etcd_un_sistema_real_que_utiliza_raft"><a class="anchor" href="#_caso_de_estudio_etcd_un_sistema_real_que_utiliza_raft"></a>Caso de estudio: etcd, un sistema real que utiliza Raft</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_un_almacén_distribuido_que_necesita_acordar_escrituras"><a class="anchor" href="#_un_almacén_distribuido_que_necesita_acordar_escrituras"></a>Un almacén distribuido que necesita acordar escrituras</h3>
<div class="paragraph">
<p><strong>etcd</strong> es un sistema de almacenamiento distribuido de pares clave-valor, escrito en Go, que se utiliza para conservar información crítica de otros sistemas. Entre sus usos más conocidos está el almacenamiento del estado de los clústeres de Kubernetes. Su implementación utiliza Raft para mantener un registro replicado de operaciones: las escrituras se ordenan y se confirman con la participación de una mayoría, en vez de depender de que un único servidor conserve la información <a href="#EtcdProyecto" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdProyecto]</a>, <a href="#EtcdGlosario" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdGlosario]</a>.</p>
</div>
<div class="paragraph">
<p>Para observar el protocolo en un contexto concreto, imaginemos un clúster de <strong>tres integrantes de etcd</strong>, llamados <code>etcd-1</code>, <code>etcd-2</code> y <code>etcd-3</code>. El sistema real es etcd, y los pasos que siguen describen su funcionamiento documentado; los nombres de los nodos, los términos, los índices del registro y las fallas simuladas son <strong>valores didácticos</strong>, no una traza obtenida de un incidente real. Suponemos un grupo fijo, sin integrantes no votantes ni cambios de membresía durante el ejemplo.</p>
</div>
<div class="paragraph">
<p>Una aplicación guarda el indicador <code>/app/config/auditoria</code> para informar si debe registrar eventos de auditoría. Se puede enviar una escritura mediante la interfaz real de etcd:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-bash" data-lang="bash">etcdctl put /app/config/auditoria habilitada</code></pre>
</div>
</div>
<div class="paragraph">
<p>Esta es una operación ordinaria del almacén de claves, pero representa una decisión que las réplicas deben conservar de manera consistente. Que las tres máquinas tengan una copia del dato no basta por sí solo: hace falta acordar su posición dentro del registro para que futuras elecciones y nuevas escrituras respeten el mismo orden.</p>
</div>
</div>
<div class="sect2">
<h3 id="_una_escritura_exitosa_con_dos_de_tres_integrantes"><a class="anchor" href="#_una_escritura_exitosa_con_dos_de_tres_integrantes"></a>Una escritura exitosa con dos de tres integrantes</h3>
<div class="paragraph">
<p>Supongamos que <code>etcd-1</code> es el líder del término 12 y que la nueva operación se añade en un índice del registro que, solamente para esta explicación, llamaremos 207. El líder persiste la propuesta y la envía a los seguidores mediante los mecanismos de replicación de Raft. <code>etcd-2</code> la almacena de forma duradera y confirma su recepción. <code>etcd-3</code> está experimentando demoras, por lo que todavía no responde.</p>
</div>
<div class="paragraph">
<p>La operación se encuentra entonces en el líder y en un seguidor: <strong>dos de tres integrantes</strong>. Como pertenece al término del líder actual, esta mayoría satisface la regla de confirmación. La entrada ya puede considerarse parte del historial acordado; después se aplica al estado del almacén y se devuelve el resultado al cliente, sin esperar a que <code>etcd-3</code> termine de actualizarse. La documentación de etcd distingue precisamente entre el registro persistido para Raft y la aplicación de las operaciones al motor de almacenamiento <a href="#EtcdAlmacenamiento" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdAlmacenamiento]</a>, <a href="#EtcdGarantiasAPI" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdGarantiasAPI]</a>.</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="14.2857%">
<col width="42.8571%">
<col width="42.8572%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Instante</th>
<th class="tableblock halign-left valign-top">Qué sucede</th>
<th class="tableblock halign-left valign-top">Qué puede afirmarse</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">T1</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>etcd-1</code> incorpora y persiste una entrada de escritura.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Aún no hay mayoría; no se informa que la operación haya terminado.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">T2</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>etcd-2</code> persiste la entrada y responde al líder.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La entrada está replicada en dos de tres integrantes.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">T3</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">El líder confirma la entrada y la operación se aplica.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">La escritura puede completarse y devolverse al cliente.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">T4</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock"><code>etcd-3</code> se pone al día.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">El grupo converge, aunque el tercer integrante haya llegado tarde.</p></td>
</tr>
</tbody>
</table>
<div class="paragraph">
<p>Hay dos números distintos que conviene no confundir. El <strong>índice del registro de Raft</strong> identifica una entrada en la historia replicada. La <strong>revisión de etcd</strong> identifica una modificación del almacén de claves y sirve, por ejemplo, para observar su orden lógico. No son contadores equivalentes ni deben utilizarse indistintamente <a href="#EtcdGarantiasAPI" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdGarantiasAPI]</a>.</p>
</div>
<div class="imageblock text-center center">
<div class="content">
<img src="/iasc-book/img/raft/15_caso_etcd.svg" alt="Ejemplo basado en etcd: escritura con mayoría" width="100%">
</div>
</div>
</div>
<div class="sect2">
<h3 id="_el_líder_se_cae_después_de_confirmar_la_escritura"><a class="anchor" href="#_el_líder_se_cae_después_de_confirmar_la_escritura"></a>El líder se cae después de confirmar la escritura</h3>
<div class="paragraph">
<p>Poco después de la confirmación, <code>etcd-1</code> deja de funcionar. Los dos integrantes restantes todavía pueden comunicarse: <code>etcd-2</code> conserva la entrada confirmada y <code>etcd-3</code>, aun si estaba atrasado, puede participar en una elección. Si <code>etcd-2</code> reúne los votos necesarios y satisface la condición de registro actualizado, pasa a ser líder de un término posterior y completa la puesta al día de <code>etcd-3</code>.</p>
</div>
<div class="paragraph">
<p>El nuevo líder no puede reemplazar la escritura que ya había quedado confirmada. Esta garantía no depende de que el cliente haya recibido el mensaje de éxito: deriva de la relación entre la mayoría que confirmó la entrada y la mayoría que eligió al nuevo líder, reforzada por la condición de actualización del registro para votar. Este es el efecto práctico de la propiedad de integridad del líder estudiada en las secciones anteriores <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>, <a href="#Ongaro2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Ongaro2014]</a>.</p>
</div>
<div class="paragraph">
<p>El caso sería diferente si <code>etcd-1</code> hubiera fallado <strong>antes de conseguir la mayoría</strong>. Una entrada que solo estaba persistida en el antiguo líder no es todavía una decisión del grupo y podría ser sustituida por el registro de un líder posterior. Almacenar una propuesta y confirmarla son hechos distintos.</p>
</div>
</div>
<div class="sect2">
<h3 id="_una_partición_una_réplica_aislada_no_puede_confirmar_nuevas_escrituras"><a class="anchor" href="#_una_partición_una_réplica_aislada_no_puede_confirmar_nuevas_escrituras"></a>Una partición: una réplica aislada no puede confirmar nuevas escrituras</h3>
<div class="paragraph">
<p>Supongamos ahora que <code>etcd-1</code> queda incomunicado mientras <code>etcd-2</code> y <code>etcd-3</code> se mantienen conectados. Los dos últimos reúnen el quórum de un clúster de tres y pueden avanzar tras elegir un líder legítimo. La réplica aislada no tiene una mayoría que respalde nuevas decisiones. Por eso, aunque durante un intervalo todavía crea que conserva el liderazgo, no puede confirmar por sí sola nuevas escrituras.</p>
</div>
<div class="paragraph">
<p>Desde el punto de vista de la aplicación, algunas solicitudes pueden fallar o exceder su plazo de espera. La ausencia de respuesta no permite deducir siempre si la operación fue aplicada: una escritura podría haberse confirmado y haberse perdido solamente la respuesta. La documentación de etcd advierte expresamente esta incertidumbre frente a interrupciones de comunicación, y también distingue las lecturas linealizables de las lecturas <code>serializable</code>, que pueden devolver datos atrasados <a href="#EtcdGarantiasAPI" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdGarantiasAPI]</a>.</p>
</div>
<div class="paragraph">
<p>Una medida práctica para una aplicación es consultar nuevamente la clave usando una lectura que ofrezca las garantías de consistencia requeridas. Cuando la semántica exige que una modificación se aplique solo si el valor o la revisión anterior siguen siendo los esperados, etcd dispone de transacciones con condiciones de comparación. Esto resuelve un problema de concurrencia en la aplicación; no constituye una fase adicional de Raft.</p>
</div>
</div>
<div class="sect2">
<h3 id="_qué_permite_observar_este_ejemplo_real"><a class="anchor" href="#_qué_permite_observar_este_ejemplo_real"></a>Qué permite observar este ejemplo real</h3>
<div class="paragraph">
<p>El caso muestra por qué etcd puede seguir atendiendo escrituras con una réplica demorada o caída, siempre que quede un quórum. Al mismo tiempo, aclara el costo de esa garantía: si el clúster pierde su mayoría, las escrituras no deben continuar confirmándose como si hubiera una sola autoridad. En un despliegue real, la latencia de la red y la persistencia en disco afectan directamente la velocidad de confirmación; etcd documenta ambos factores como parte de su rendimiento <a href="#EtcdRendimiento" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[EtcdRendimiento]</a>.</p>
</div>
<div class="paragraph">
<p>Para discutir en clase, vale la pena preguntarse qué sucede si se pierde la respuesta de <code>etcdctl put</code> después de T3, por qué <code>etcd-3</code> puede ponerse al día sin invalidar lo anterior y qué ocurriría si dos de los tres integrantes quedaran inaccesibles. Las respuestas dependen de distinguir entre <strong>replicación local, confirmación distribuida y observación del resultado por parte del cliente</strong>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_pseudocódigo_y_trazas_para_acompañar_el_estudio"><a class="anchor" href="#_pseudocódigo_y_trazas_para_acompañar_el_estudio"></a>Pseudocódigo y trazas para acompañar el estudio</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_elección_lógica_simplificada_del_candidato"><a class="anchor" href="#_elección_lógica_simplificada_del_candidato"></a>Elección: lógica simplificada del candidato</h3>
<div class="paragraph">
<p>El siguiente pseudocódigo sintetiza la elección sin describir todos los aspectos de la temporización ni las respuestas de error. Representa las reglas del protocolo original, no una implementación lista para producción.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">al vencer el temporizador de elección:
    rol := candidato
    currentTerm := currentTerm + 1
    votedFor := mi_identificador
    persistir(currentTerm, votedFor)
    votos := 1
    enviar RequestVote(currentTerm, ultimoIndice, ultimoTermino)

al recibir RequestVote(t, candidato, ultimoIndice, ultimoTermino):
    si t &lt; currentTerm:
        responder voto_rechazado
    si t &gt; currentTerm:
        currentTerm := t
        votedFor := ninguno
        rol := seguidor
        persistir(currentTerm, votedFor)
    si (votedFor es ninguno o votedFor == candidato)
       y registro_del_candidato_suficientemente_actualizado:
        votedFor := candidato
        persistir(votedFor)
        responder voto_concedido
    si no:
        responder voto_rechazado

al reunir mayoría de votos para mi término actual:
    rol := líder
    inicializar nextIndex y matchIndex
    enviar AppendEntries vacíos para anunciar liderazgo</code></pre>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_replicación_lógica_simplificada_del_seguidor"><a class="anchor" href="#_replicación_lógica_simplificada_del_seguidor"></a>Replicación: lógica simplificada del seguidor</h3>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">al recibir AppendEntries(t, prevIndex, prevTerm, entries, leaderCommit):
    si t &lt; currentTerm:
        responder fracaso
    si t &gt; currentTerm:
        actualizar término, abandonar candidatura/liderazgo
        persistir término y voto si corresponde
    reconocer al líder válido del término actual
    si no existe log[prevIndex] con término prevTerm:
        responder fracaso
    para cada entrada recibida que entre en conflicto con log local:
        eliminar la entrada conflictiva y todo el sufijo posterior
    anexar las entradas nuevas todavía ausentes
    persistir los cambios antes de reconocer su almacenamiento
    si leaderCommit &gt; commitIndex:
        commitIndex := min(leaderCommit, ultimo_indice_local)
    aplicar en orden las entradas confirmadas todavía pendientes
    responder éxito</code></pre>
</div>
</div>
</div>
<div class="sect2">
<h3 id="_confirmación_la_condición_del_líder"><a class="anchor" href="#_confirmación_la_condición_del_líder"></a>Confirmación: la condición del líder</h3>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-text" data-lang="text">para cada índice N mayor que commitIndex, en orden descendente:
    copias := 1 + cantidad_de_seguidores_con(matchIndex &gt;= N)
    si copias &gt;= mayoría y log[N].term == currentTerm:
        commitIndex := N
        aplicar las entradas pendientes en orden
        notificar el nuevo commitIndex a los seguidores
        terminar la búsqueda</code></pre>
</div>
</div>
<div class="paragraph">
<p>Es importante conservar en este fragmento la condición <code>log[N].term == currentTerm</code>. El pseudocódigo que confirma cualquier entrada antigua por simple mayoría no representa correctamente la regla de seguridad de Raft. Las entradas anteriores se vuelven confirmadas <strong>indirectamente</strong> cuando se confirma una entrada posterior del término actual <a href="#OngaroOusterhout2014" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[OngaroOusterhout2014]</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_costos_ventajas_y_limitaciones_de_raft"><a class="anchor" href="#_costos_ventajas_y_limitaciones_de_raft"></a>Costos, ventajas y limitaciones de Raft</h2>
<div class="sectionbody">
<div class="sect2">
<h3 id="_por_qué_resulta_útil_en_sistemas_reales"><a class="anchor" href="#_por_qué_resulta_útil_en_sistemas_reales"></a>Por qué resulta útil en sistemas reales</h3>
<div class="paragraph">
<p>La principal ventaja de Raft es que organiza la coordinación alrededor de una autoridad reconocible y de un historial lineal de operaciones. La elección mediante quórum, los términos crecientes y las comprobaciones del registro forman un diseño que se puede analizar por partes. El líder evita negociar por separado el orden de cada operación entre todos los participantes; los seguidores adoptan las entradas que satisfacen las condiciones de consistencia.</p>
</div>
<div class="paragraph">
<p>El protocolo conserva la seguridad frente a retrasos, duplicación de mensajes, particiones y reinicios que respeten las condiciones de persistencia. Además, permite continuar cuando una minoría no está disponible. La compactación mediante snapshots reduce el almacenamiento histórico y los mecanismos de reconfiguración permiten modificar el conjunto de servidores sin interrumpir necesariamente todo el servicio.</p>
</div>
</div>
<div class="sect2">
<h3 id="_costos_y_decisiones_de_diseño"><a class="anchor" href="#_costos_y_decisiones_de_diseño"></a>Costos y decisiones de diseño</h3>
<div class="paragraph">
<p>La contrapartida del liderazgo fuerte es que las nuevas escrituras dependen de la disponibilidad y capacidad del líder. Cuando este falla, el grupo necesita elegir otro antes de volver a confirmar operaciones. Las elecciones repetidas, los discos lentos y las redes inestables pueden degradar sensiblemente el rendimiento. Un servidor situado en la minoría de una partición puede seguir accesible para algunos clientes, pero no debe continuar confirmando operaciones.</p>
</div>
<div class="paragraph">
<p>Raft tampoco elimina el trabajo de ingeniería alrededor del consenso. La aplicación tiene que hacer deterministas sus efectos, deduplicar solicitudes cuando corresponda, administrar lecturas consistentes, coordinar snapshots con el estado de la máquina y asegurar que las escrituras anunciadas como duraderas resistan reinicios. Los cambios de integrantes requieren protocolos precisos; una modificación improvisada de la configuración puede invalidar la intersección de quórums.</p>
</div>
<table class="tableblock frame-all grid-all stretch">
<colgroup>
<col width="20%">
<col width="40%">
<col width="40%">
</colgroup>
<thead>
<tr>
<th class="tableblock halign-left valign-top">Aspecto</th>
<th class="tableblock halign-left valign-top">Ventaja</th>
<th class="tableblock halign-left valign-top">Costo o condición</th>
</tr>
</thead>
<tbody>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Líder fuerte</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Simplifica el orden de nuevas entradas.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Puede convertirse en cuello de botella y requiere elecciones ante fallas.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Mayorías</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Permite avanzar sin esperar a todos los servidores.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Una minoría aislada no puede confirmar nuevas operaciones.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Términos e historial</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Evitan que una autoridad antigua contradiga decisiones confirmadas.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Exigen persistencia correcta y reglas cuidadosas de elección.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reparación del registro</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Permite recuperar seguidores atrasados.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Puede requerir transferencias grandes o instantáneas.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Instantáneas</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reduce el costo de mantener y transferir historia.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Debe coordinarse con el estado persistente de la máquina.</p></td>
</tr>
<tr>
<td class="tableblock halign-left valign-top"><p class="tableblock">Reconfiguración</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Permite incorporar o retirar votantes con seguridad.</p></td>
<td class="tableblock halign-left valign-top"><p class="tableblock">Necesita una secuencia de cambios controlada por el protocolo.</p></td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_bibliografía"><a class="anchor" href="#_bibliografía"></a>Bibliografía</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="OngaroOusterhout2014"></a>[OngaroOusterhout2014] Ongaro, Diego y Ousterhout, John. «In Search of an Understandable Consensus Algorithm». <em>2014 USENIX Annual Technical Conference (USENIX ATC '14)</em>, pp. 305–319. USENIX Association, 2014. <a href="https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro">Publicación y PDF</a>.</p>
</li>
<li>
<p><a id="Ongaro2014"></a>[Ongaro2014] Ongaro, Diego. <em>Consensus: Bridging Theory and Practice</em>. Tesis doctoral, Stanford University, 2014. <a href="https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf">Texto completo</a>.</p>
</li>
<li>
<p><a id="RaftWebsite"></a>[RaftWebsite] Ongaro, Diego y colaboradores. <em>Raft Consensus Algorithm</em>. Sitio del proyecto, referencias, material docente y visualizaciones. <a href="https://raft.github.io/">raft.github.io</a>.</p>
</li>
<li>
<p><a id="FischerLynchPaterson1985"></a>[FischerLynchPaterson1985] Fischer, Michael J.; Lynch, Nancy A.; y Paterson, Michael S. «Impossibility of Distributed Consensus with One Faulty Process». <em>Journal of the ACM</em>, 32(2), pp. 374–382, 1985. <a href="https://doi.org/10.1145/3149.214121">DOI</a>.</p>
</li>
<li>
<p><a id="DworkLynchStockmeyer1988"></a>[DworkLynchStockmeyer1988] Dwork, Cynthia; Lynch, Nancy A.; y Stockmeyer, Larry. «Consensus in the Presence of Partial Synchrony». <em>Journal of the ACM</em>, 35(2), pp. 288–323, 1988. <a href="https://doi.org/10.1145/42282.42283">DOI</a>.</p>
</li>
<li>
<p><a id="Schneider1990"></a>[Schneider1990] Schneider, Fred B. «Implementing Fault-Tolerant Services Using the State Machine Approach: A Tutorial». <em>ACM Computing Surveys</em>, 22(4), pp. 299–319, 1990. <a href="https://doi.org/10.1145/98163.98167">DOI</a>.</p>
</li>
<li>
<p><a id="Lynch1996"></a>[Lynch1996] Lynch, Nancy A. <em>Distributed Algorithms</em>. Morgan Kaufmann, 1996. ISBN 978-1-55860-348-6.</p>
</li>
<li>
<p><a id="ChandraToueg1996"></a>[ChandraToueg1996] Chandra, Tushar D. y Toueg, Sam. «Unreliable Failure Detectors for Reliable Distributed Systems». <em>Journal of the ACM</em>, 43(2), pp. 225–267, 1996. <a href="https://doi.org/10.1145/226643.226647">DOI</a>.</p>
</li>
<li>
<p><a id="Wilcox2015"></a>[Wilcox2015] Wilcox, James R.; Woos, Doug; Panchekha, Pavel; Tatlock, Zachary; Wang, Xi; Ernst, Michael D.; y Anderson, Thomas. «Verdi: A Framework for Implementing and Verifying Distributed Systems». <em>PLDI</em>, 2015. <a href="https://doi.org/10.1145/2737924.2737958">DOI</a>.</p>
</li>
<li>
<p><a id="RaftTLA"></a>[RaftTLA] Ongaro, Diego. <em>Raft TLA+ specification</em>. Repositorio de la especificación formal vinculada a la tesis. <a href="https://github.com/ongardie/raft.tla">Repositorio</a>.</p>
</li>
<li>
<p><a id="EtcdProyecto"></a>[EtcdProyecto] Proyecto etcd. <em>etcd: Distributed reliable key-value store</em>. Repositorio oficial y descripción de la arquitectura. <a href="https://github.com/etcd-io/etcd">Repositorio oficial</a>.</p>
</li>
<li>
<p><a id="EtcdGlosario"></a>[EtcdGlosario] Proyecto etcd. <em>Glossary</em>, documentación de etcd v3.7. Definiciones de integrante, propuesta, quórum, término y revisión. <a href="https://etcd.io/docs/v3.7/learning/glossary/">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="EtcdAlmacenamiento"></a>[EtcdAlmacenamiento] Proyecto etcd. <em>etcd persistent storage files</em>, documentación de etcd v3.7. Persistencia de propuestas, WAL y estado de Raft. <a href="https://etcd.io/docs/v3.7/learning/persistent-storage-files/">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="EtcdGarantiasAPI"></a>[EtcdGarantiasAPI] Proyecto etcd. <em>etcd API guarantees</em>, documentación de etcd v3.7. Linealizabilidad, revisiones y operaciones con respuesta incierta. <a href="https://etcd.io/docs/v3.7/learning/api_guarantees/">Documentación oficial</a>.</p>
</li>
<li>
<p><a id="EtcdRendimiento"></a>[EtcdRendimiento] Proyecto etcd. <em>Performance</em>, documentación de etcd v3.7. Costos de red y almacenamiento en la replicación. <a href="https://etcd.io/docs/v3.7/op-guide/performance/">Documentación oficial</a>.</p>
</li>
</ul>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_apéndice_a_glosario"><a class="anchor" href="#_apéndice_a_glosario"></a>Apéndice A. Glosario</h2>
<div class="sectionbody">
<div class="ulist">
<ul>
<li>
<p><strong>Candidato:</strong> servidor que solicita votos para convertirse en líder de un término.</p>
</li>
<li>
<p><strong>Confirmado (<code>committed</code>):</strong> entrada que satisface la regla de confirmación y no puede desaparecer del historial de decisiones.</p>
</li>
<li>
<p><strong>Entrada del registro:</strong> operación identificada por un índice y el término en el que fue añadida.</p>
</li>
<li>
<p><strong>Índice aplicado (<code>lastApplied</code>):</strong> última entrada ejecutada por la máquina de estados local.</p>
</li>
<li>
<p><strong>Índice confirmado (<code>commitIndex</code>):</strong> límite de entradas que el servidor conoce como confirmadas.</p>
</li>
<li>
<p><strong>Líder:</strong> servidor que coordina la incorporación de nuevas entradas al registro.</p>
</li>
<li>
<p><strong>Quórum:</strong> conjunto suficiente de participantes; en el grupo fijo básico de Raft, una mayoría estricta de votantes.</p>
</li>
<li>
<p><strong>Seguidor:</strong> servidor que replica el registro y atiende solicitudes de voto.</p>
</li>
<li>
<p><strong>Snapshot:</strong> instantánea del estado aplicado y los metadatos de su posición en el registro.</p>
</li>
<li>
<p><strong>Término (<code>term</code>):</strong> época lógica numerada en la que se organizan una elección y, eventualmente, el liderazgo.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};