var e=`<div id="preamble">
<div class="sectionbody">
<div class="paragraph">
<p><strong>Replicar</strong> consiste en conservar copias de los mismos datos en más de un nodo. Las copias pueden estar en máquinas o regiones diferentes. Esto permite repartir lecturas, acercar datos a los usuarios y continuar ante algunas fallas, pero introduce una pregunta central: <strong>¿cómo se mantienen coordinadas las copias cuando los datos cambian?</strong></p>
</div>
<div class="paragraph">
<p>Replicación y particionamiento no son sinónimos. La replicación agrega redundancia; el particionamiento divide un conjunto de datos entre nodos. Un sistema puede usar ambas estrategias: primero separar los datos en particiones y luego replicar cada partición. La página sobre <a href="https://arquitecturas-concurrentes.github.io/iasc-book/particionamiento/">particionamiento</a> desarrolla esa segunda estrategia.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_se_replica_y_para_qué"><a class="anchor" href="#_qué_se_replica_y_para_qué"></a>Qué se replica y para qué</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema replicado, varios nodos almacenan total o parcialmente la misma información. Las réplicas pueden cumplir funciones distintas: una recibe escrituras y las propaga, mientras otras atienden lecturas; o varias aceptan operaciones y coordinan sus cambios.</p>
</div>
<div class="paragraph">
<p>Las motivaciones frecuentes son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Tolerar fallas de nodos:</strong> si una copia deja de estar disponible, otras pueden seguir atendiendo algunas operaciones. Esto depende de detectar la falla y poder usar una copia suficientemente actualizada.</p>
</li>
<li>
<p><strong>Aumentar la capacidad de lectura:</strong> distintas réplicas pueden responder consultas en paralelo.</p>
</li>
<li>
<p><strong>Reducir latencia geográfica:</strong> mantener copias cerca de los usuarios puede evitar que cada lectura viaje hasta una región distante.</p>
</li>
<li>
<p><strong>Mejorar la recuperación:</strong> una copia o un registro de cambios puede ayudar a reconstruir el estado de un nodo.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Ninguno de estos beneficios es automático. Las copias consumen almacenamiento y ancho de banda; cada escritura debe propagarse y, según la garantía elegida, puede necesitar esperar a otras réplicas. La replicación puede mejorar la disponibilidad de lectura, pero no garantiza por sí sola que toda escritura siga disponible ni que una operación confirmada sobreviva a cualquier conjunto de fallas.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_replicación_no_es_un_backup"><a class="anchor" href="#_replicación_no_es_un_backup"></a>Replicación no es un backup</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una réplica mantiene otra copia operativa del estado actual; por eso los cambios no deseados también pueden propagarse. Si una persona borra datos por error, una aplicación escribe valores incorrectos o un atacante modifica registros, las réplicas pueden copiar esa eliminación o corrupción. La replicación ayuda a continuar ante ciertos fallos de nodos, pero no permite necesariamente volver a un estado anterior.</p>
</div>
<div class="paragraph">
<p>Para recuperar datos borrados o dañados se necesitan <strong>backups</strong> con historial y un procedimiento probado de restauración, idealmente con copias aisladas de los cambios normales de producción. La replicación y los backups resuelven problemas distintos y suelen complementarse: las primeras ayudan a mantener servicio; los segundos, a recuperar versiones anteriores.</p>
</div>
<div class="imageblock center">
<div class="content">
<img src="/iasc-book/img/distribucion/replicacion-lider-seguidores.svg" alt="Replicación basada en un líder y seguidores" width="760">
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_replicación_basada_en_líder"><a class="anchor" href="#_replicación_basada_en_líder"></a>Replicación basada en líder</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un diseño común elige una réplica como <strong>líder</strong> para recibir escrituras. Las demás, llamadas <strong>seguidores</strong> o <strong>réplicas secundarias</strong>, reciben el registro de cambios y aplican las operaciones en el mismo orden. Los nombres varían entre sistemas; lo importante es identificar quién puede aceptar escrituras y cómo se elige o reemplaza esa autoridad.</p>
</div>
<div class="paragraph">
<p>Una escritura típica sigue estos pasos:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>El cliente envía la operación al líder.</p>
</li>
<li>
<p>El líder la valida y registra el cambio, por ejemplo, en un log ordenado.</p>
</li>
<li>
<p>El cambio se envía a uno o más seguidores.</p>
</li>
<li>
<p>Según la política de confirmación, el líder espera o no las respuestas de esos seguidores.</p>
</li>
<li>
<p>El líder responde al cliente; los seguidores aplican el cambio cuando lo reciben.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>Centralizar escrituras puede simplificar el orden de las operaciones, pero el líder puede convertirse en un cuello de botella o en un punto de interrupción temporal. Elegir otro líder requiere que los nodos acuerden qué cambios llegaron a registrarse y cómo evitar que el líder anterior siga aceptando escrituras.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cuándo_confirmar_propagación_síncrona_y_asíncrona"><a class="anchor" href="#_cuándo_confirmar_propagación_síncrona_y_asíncrona"></a>Cuándo confirmar: propagación síncrona y asíncrona</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La diferencia principal es si el cliente espera a que otras réplicas confirmen el cambio antes de recibir éxito.</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Replicación síncrona:</strong> el líder espera la confirmación de una o más réplicas definidas por la política del sistema antes de confirmar la escritura. Esto puede reducir la posibilidad de perder una escritura ante la falla del líder, a cambio de más latencia y dependencia de que esas réplicas respondan. «Síncrona» no necesariamente significa esperar a todas las réplicas: el conjunto requerido depende del protocolo.</p>
</li>
<li>
<p><strong>Replicación asíncrona:</strong> el líder confirma la escritura antes de que los seguidores necesariamente la hayan aplicado. La respuesta puede ser más rápida y no depende de que cada seguidor esté disponible, pero durante un intervalo las copias divergen. Si el líder falla antes de propagar el cambio, el nuevo líder podría no tener una escritura que el cliente ya consideraba exitosa.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Algunos sistemas combinan ambos comportamientos, por ejemplo, esperando a un seguidor cercano y propagando en segundo plano a los restantes. Hay que consultar qué significa exactamente «confirmada» en la implementación: cuándo se persiste el cambio, cuántas réplicas lo tienen y cuáles de ellas podrían ser promovidas. Esperar una confirmación reduce el riesgo solo si las reglas de elección de líder y recuperación preservan ese cambio.</p>
</div>
<div class="imageblock center">
<div class="content">
<img src="/iasc-book/img/distribucion/replicacion-sincrona-asincrona.svg" alt="Comparación temporal de confirmación síncrona y asíncrona" width="760">
</div>
</div>
<div class="paragraph">
<p>Una consecuencia de la propagación asíncrona es el <strong>retraso de replicación</strong>. Una lectura desde un seguidor puede devolver un valor viejo, incluso después de que una escritura haya sido confirmada por el líder. Entre las estrategias posibles están leer del líder cuando se necesita el dato más reciente, esperar hasta que el seguidor aplique cierto cambio, o aceptar explícitamente lecturas que pueden estar atrasadas.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_replicación_entre_múltiples_centros_de_datos"><a class="anchor" href="#_replicación_entre_múltiples_centros_de_datos"></a>Replicación entre múltiples centros de datos</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Cuando las réplicas están en centros de datos distintos, la distancia agrega latencia y la comunicación puede interrumpirse de forma independiente en cada región. Replicar entre centros de datos puede servir para:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Tolerar la caída de un centro completo:</strong> un incendio, un corte de energía o una falla de conectividad regional no necesariamente deja inaccesibles todas las copias.</p>
</li>
<li>
<p><strong>Atender usuarios desde una región cercana:</strong> las lecturas pueden viajar menos distancia y reducir su latencia.</p>
</li>
<li>
<p><strong>Mantener los datos en una ubicación determinada:</strong> por razones regulatorias, de residencia de datos u operación, puede ser necesario tener copias en regiones específicas.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Estas metas no implican que cada escritura deba confirmarse en todos los centros. La distancia entre regiones suele hacer más costosa la coordinación síncrona. Un diseño habitual replica cambios de forma asíncrona entre centros, aunque puede usar una política más fuerte dentro de cada centro. Así, una escritura local no espera necesariamente a una confirmación intercontinental, pero una caída repentina de la región escritora puede dejar a la región de recuperación temporalmente atrasada.</p>
</div>
<div class="paragraph">
<p>La topología depende de quién acepta escrituras:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Un único líder global:</strong> todas las escrituras pasan por una región líder. Simplifica la elección del orden, pero los usuarios lejanos pueden tener mayor latencia de escritura. Si esa región queda aislada, la aplicación debe decidir si bloquea escrituras o permite un cambio de autoridad con las garantías de recuperación correspondientes.</p>
</li>
<li>
<p><strong>Líder por partición:</strong> cada conjunto de datos o partición tiene una región responsable de escrituras, y sus copias se mantienen en otras regiones. Puede distribuir la carga de escritura entre centros sin permitir que todos modifiquen los mismos datos, pero necesita enrutar cada operación a su región líder.</p>
</li>
<li>
<p><strong>Varios líderes que aceptan escrituras:</strong> cada centro puede aceptar cambios localmente. Esto reduce la dependencia de un líder remoto y puede permitir continuar durante ciertos cortes, pero escrituras concurrentes de dos regiones pueden entrar en conflicto. La sección sobre replicación multi-líder desarrolla cómo detectar y resolver esos conflictos.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Las lecturas locales también requieren una política explícita. Si una escritura se confirmó en una región y luego se lee desde otra, la copia remota puede no haber recibido aún ese cambio. La aplicación puede tolerar ese retraso, dirigir ciertas lecturas a la región que aceptó la escritura, esperar a que la región remota alcance una versión mínima o exigir coordinación más fuerte para operaciones seleccionadas. La cercanía geográfica reduce la latencia de acceso a una copia; no garantiza que esa copia esté actualizada.</p>
</div>
<div class="sect2">
<h3 id="_pérdida_de_una_región_y_recuperación"><a class="anchor" href="#_pérdida_de_una_región_y_recuperación"></a>Pérdida de una región y recuperación</h3>
<div class="paragraph">
<p>Si un centro deja de responder, las demás regiones deben distinguir entre una caída real y una interrupción de red. Promover una región secundaria permite recuperar servicio, pero hay que decidir qué datos se consideran confirmados y si la réplica elegida tiene todos esos cambios. Con replicación asíncrona puede haber una ventana de pérdida de datos: escrituras reconocidas por la región caída quizá todavía no llegaron a la región promovida.</p>
</div>
<div class="paragraph">
<p>La recuperación de la región original también requiere coordinación. No debe reanudar escrituras sobre una historia vieja ni convertirse en una segunda autoridad. Primero debe reconocer qué región quedó activa, recibir los cambios faltantes y reconciliar su estado; luego puede volver a incorporarse como réplica o asumir otra función. Los pasos concretos dependen del protocolo de failover y failback y de cómo se protegen las escrituras confirmadas.</p>
</div>
<div class="paragraph">
<p>Por eso, un objetivo de recuperación debe especificar al menos:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>RPO</strong> (<strong>recovery point objective</strong>): la antigüedad máxima de los datos que la organización acepta perder, expresada como un intervalo de tiempo. Por ejemplo, un RPO de cinco minutos significa que, ante el escenario de falla definido, se acepta que la copia recuperada no incluya hasta los últimos cinco minutos de cambios.</p>
</li>
<li>
<p><strong>RTO</strong> (<strong>recovery time objective</strong>): cuánto tiempo se acepta que el servicio tarde en recuperar una operación o volver a estar disponible.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Un RPO de cero expresa que no se acepta perder cambios confirmados para el escenario acordado; no promete protección frente a cualquier desastre ni reemplaza los backups. RPO y RTO no son garantías que la replicación proporcione automáticamente: se derivan de la política de confirmación, la frecuencia y retraso de propagación, el procedimiento de promoción y las pruebas de recuperación.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cómo_se_envían_los_cambios"><a class="anchor" href="#_cómo_se_envían_los_cambios"></a>Cómo se envían los cambios</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Las réplicas necesitan recibir una descripción de las escrituras y aplicarlas de forma compatible. Hay varias formas de representar ese flujo:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Replicación basada en sentencias:</strong> el líder envía la operación que ejecutó, como una consulta o comando. Es compacta y legible, pero puede ser difícil reproducirla exactamente si depende de la hora, números aleatorios, efectos externos o del orden en que se ejecuta.</p>
</li>
<li>
<p><strong>Envío de un log físico:</strong> se transmiten los registros que el motor usa para persistir su estado. Es eficiente para recuperar una copia compatible, aunque suele acoplar más al seguidor con la versión y los detalles internos del almacenamiento.</p>
</li>
<li>
<p><strong>Log lógico o basado en cambios:</strong> se publican modificaciones a nivel de filas, documentos u objetos del dominio. Permite que consumidores distintos procesen los cambios, pero requiere definir el formato, el orden, la evolución del esquema y cómo manejar eventos repetidos.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>No existe una representación universalmente mejor. Un flujo ordenado puede ser suficiente para seguidores del mismo motor; una integración entre sistemas puede requerir eventos lógicos. En ambos casos, los reintentos pueden duplicar mensajes, así que los consumidores y las operaciones deben tener una política para reconocer o tolerar duplicados.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_consistencia_percibe_quien_consulta"><a class="anchor" href="#_qué_consistencia_percibe_quien_consulta"></a>Qué consistencia percibe quien consulta</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La existencia de varias copias no determina por sí sola las garantías de lectura. Dependen de dónde se lee, qué orden siguen los cambios y qué espera el cliente.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, una persona actualiza su perfil en el líder y enseguida consulta su perfil desde un seguidor que todavía no aplicó la escritura. El resultado parece contradecir la actualización, aunque el seguidor simplemente esté retrasado. El sistema puede ofrecer garantías como:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Lecturas desde el líder:</strong> evitan el retraso propio de consultar a un seguidor, si el protocolo ejecuta esas lecturas sobre un estado actualizado del líder. La garantía exacta depende de cómo se ordenan y confirman lecturas y escrituras; también agrega carga y latencia hacia el líder.</p>
</li>
<li>
<p><strong>Lecturas propias de las escrituras:</strong> dirigir las consultas posteriores de un cliente a una réplica que ya aplicó su cambio, o hacerlas esperar hasta alcanzarlo.</p>
</li>
<li>
<p><strong>Lecturas monotónicas:</strong> evitar que un mismo cliente vea retroceder el estado entre dos lecturas sucesivas, aunque la segunda consulta se atienda en otra réplica.</p>
</li>
<li>
<p><strong>Prefijo consistente:</strong> evitar mostrar los cambios en un orden que contradiga sus dependencias. Si una operación B se realizó como consecuencia de A, una lectura no debería mostrar B y ocultar A.</p>
</li>
<li>
<p><strong>Lecturas eventualmente convergentes:</strong> permitir que distintas réplicas respondan con estados temporalmente diferentes y esperar que converjan cuando se propaguen los cambios, siempre que no haya nuevas escrituras que sigan separándolas.</p>
</li>
</ul>
</div>
<div class="sect2">
<h3 id="_lecturas_monotónicas_en_detalle"><a class="anchor" href="#_lecturas_monotónicas_en_detalle"></a>Lecturas monotónicas en detalle</h3>
<div class="paragraph">
<p>La garantía de <strong>lecturas monotónicas</strong> es relativa a la secuencia de lecturas de un mismo cliente o sesión: una vez que una lectura devuelve cierto estado, una lectura posterior no debe devolver un estado anterior a ese. En términos de versiones, si una consulta observó la versión <code>v</code>, las consultas posteriores de esa sesión deben observar <code>v</code> o una versión posterior. Terry y sus coautores la formalizan como una de las garantías de sesión para datos replicados con consistencia débil <a href="#Terry1994" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[Terry1994]</a>.</p>
</div>
<div class="paragraph">
<p>Por ejemplo, una persona abre una conversación cuando el seguidor A ya recibió el mensaje número 42. Luego vuelve a consultar y el balanceador envía la solicitud al seguidor B, que solo aplicó hasta el mensaje 39. Sin una garantía de lecturas monotónicas, el mensaje 42 puede desaparecer momentáneamente de la pantalla. Con esa garantía, el sistema evita responder con un estado anterior al que esa sesión ya observó: podría enviar la lectura a una réplica suficientemente actualizada, hacerla esperar a que B alcance la versión 42 o, si no puede cumplir la garantía, informar que no puede completar la lectura con ese nivel de consistencia.</p>
</div>
<div class="imageblock center">
<div class="content">
<img src="/iasc-book/img/distribucion/replicacion-lecturas-monotonicas.svg" alt="Una sesión conserva su progreso al consultar réplicas con distintos retrasos" width="760">
</div>
</div>
<div class="paragraph">
<p>Para implementarla, el sistema necesita recordar algún punto de progreso que haya observado la sesión. Puede mantener afinidad con una réplica, propagar un token o posición mínima de versión entre solicitudes, o enrutar la lectura a una réplica que haya alcanzado ese punto. La afinidad por sí sola es una solución incompleta si la réplica se reinicia, pierde estado o se reemplaza por otra atrasada; el cambio de nodo debe conservar o volver a satisfacer el progreso requerido.</p>
</div>
<div class="paragraph">
<p>Esta garantía <strong>no equivale a leer siempre lo más reciente</strong>. Si la primera consulta llega a una réplica atrasada, puede devolver un dato viejo; la garantía solo evita que una lectura posterior retroceda respecto de lo que ya vio esa misma sesión. Tampoco obliga a que dos usuarios diferentes vean el mismo estado al mismo tiempo, ni implica por sí sola lecturas propias de las escrituras o consistencia linealizable.</p>
</div>
<div class="paragraph">
<p>Conviene distinguir las garantías:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Lecturas monotónicas:</strong> lo que una sesión ya observó no retrocede en sus lecturas siguientes.</p>
</li>
<li>
<p><strong>Lecturas propias de las escrituras:</strong> una sesión ve sus propias escrituras confirmadas en las lecturas posteriores.</p>
</li>
<li>
<p><strong>Linealizabilidad:</strong> todas las lecturas y escrituras respetan un único orden compatible con el tiempo real, también entre clientes distintos.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Una aplicación puede ofrecer una de estas garantías sin ofrecer las otras. Por ejemplo, mantener lecturas monotónicas puede evitar que una interfaz «deshaga» información ya mostrada, aunque todavía permita que dos personas vean versiones distintas durante un breve período.</p>
</div>
<div class="paragraph">
<p>Estas garantías deben expresarse por operación y por cliente. «La base replica los datos» no alcanza para saber si una lectura inmediata verá una escritura reciente. Las garantías pueden combinarse; por ejemplo, una aplicación puede asegurar que cada persona vea sus propias escrituras sin exigir que todas las regiones observen cada cambio inmediatamente. Para relacionar estas decisiones con las garantías ante una partición de red, véase <a href="https://arquitecturas-concurrentes.github.io/iasc-book/cap/">CAP</a>.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_crear_y_recuperar_seguidores"><a class="anchor" href="#_crear_y_recuperar_seguidores"></a>Crear y recuperar seguidores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un nodo nuevo no puede empezar a seguir al líder copiando archivos de datos arbitrariamente mientras recibe escrituras: la copia podría mezclar estados de momentos distintos y omitir cambios. Un procedimiento de incorporación debe establecer un punto consistente y continuar desde allí:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>Obtener una instantánea (<strong>snapshot</strong>) coherente de los datos en un punto conocido del log.</p>
</li>
<li>
<p>Copiarla al nodo nuevo.</p>
</li>
<li>
<p>Reproducir los cambios posteriores a ese punto desde el log o desde otro mecanismo de captura.</p>
</li>
<li>
<p>Verificar que el seguidor alcanzó al líder antes de usarlo para las lecturas o promoverlo.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>El mismo principio ayuda a recuperar un seguidor que estuvo desconectado: primero se determina qué cambios le faltan, se aplican en orden y recién entonces se considera que está al día. Si el log ya no conserva los cambios necesarios, puede hacer falta una nueva instantánea.</p>
</div>
<div class="imageblock center">
<div class="content">
<img src="/iasc-book/img/distribucion/replicacion-alta-seguidor.svg" alt="Instantánea inicial y reproducción del log para poner al día un seguidor" width="760">
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_fallas_y_cambio_de_líder"><a class="anchor" href="#_fallas_y_cambio_de_líder"></a>Fallas y cambio de líder</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema con líder y seguidores, una falla no afecta a todas las réplicas de la misma manera. El comportamiento depende de qué nodo falló, qué datos había persistido y qué política de confirmación se usa.</p>
</div>
<div class="sect2">
<h3 id="_falla_de_un_seguidor"><a class="anchor" href="#_falla_de_un_seguidor"></a>Falla de un seguidor</h3>
<div class="paragraph">
<p>Si un seguidor deja de responder, el líder y los demás seguidores pueden continuar. Que las escrituras sigan siendo aceptadas depende de la política de confirmación: si el líder necesita la respuesta de ese seguidor para completar el quórum o la confirmación síncrona, algunas escrituras podrían esperar o fallar. En un modo asíncrono, el líder quizá pueda responder sin él, aunque queda menos redundancia hasta que la réplica se recupere.</p>
</div>
<div class="paragraph">
<p>El seguidor que vuelve no debe considerarse automáticamente listo para atender lecturas. Puede haberse perdido escrituras, conservar cambios parciales o haber quedado atrás respecto del log. El procedimiento normal es:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>Recuperar su estado persistido y determinar hasta qué posición del log llegó.</p>
</li>
<li>
<p>Comparar su historial con el de la autoridad vigente; el log local no debe asumirse correcto solo porque sobrevivió al reinicio.</p>
</li>
<li>
<p>Obtener desde otra réplica los cambios que faltan, si todavía están disponibles, y descartar o reemplazar las entradas no compatibles según las reglas del protocolo.</p>
</li>
<li>
<p>Aplicarlos en el orden correcto y comprobar que alcanzó un punto suficientemente reciente.</p>
</li>
<li>
<p>Reincorporarlo gradualmente al servicio; por ejemplo, primero como seguidor y luego como destino de lecturas si cumple las garantías requeridas.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>Si el historial necesario ya no está disponible, se genera o copia una instantánea coherente y después se reproducen las entradas posteriores. Durante la recuperación, el nodo puede consumir ancho de banda y recursos de disco; conviene limitar o priorizar esa transferencia para que no perjudique las solicitudes normales. El diagrama de la sección anterior resume cómo volver a poner al día un seguidor.</p>
</div>
</div>
<div class="sect2">
<h3 id="_falla_del_líder"><a class="anchor" href="#_falla_del_líder"></a>Falla del líder</h3>
<div class="paragraph">
<p>Cuando el líder deja de responder, los seguidores no saben de inmediato si se apagó, está lento o quedó aislado por la red. Un timeout permite sospechar una falla, pero no la prueba. Si otro nodo asume el liderazgo mientras el anterior todavía puede aceptar escrituras, ambos podrían operar como líderes y crear historias divergentes (<strong>split brain</strong>).</p>
</div>
<div class="paragraph">
<p>Un cambio de líder suele incluir estas decisiones, aunque los detalles varían entre protocolos:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p><strong>Detectar la sospecha:</strong> los nodos observan timeouts o pierden contacto con el líder.</p>
</li>
<li>
<p><strong>Elegir una autoridad nueva:</strong> las réplicas disponibles usan el mecanismo de elección del sistema, que puede requerir votos, quórums o una coordinación externa.</p>
</li>
<li>
<p><strong>Comprobar el estado:</strong> el nuevo líder debe tener una historia compatible con las escrituras que el sistema considera confirmadas. La réplica con el log más largo no es necesariamente la más actual o la que contiene todas las escrituras confirmadas.</p>
</li>
<li>
<p><strong>Aislar la autoridad anterior:</strong> se evita que el líder viejo siga escribiendo, por ejemplo, mediante épocas o términos crecientes, leases o mecanismos de <strong>fencing</strong>. La técnica concreta depende del sistema.</p>
</li>
<li>
<p><strong>Reanudar el servicio:</strong> los clientes redirigen las escrituras y los seguidores reconocen la nueva autoridad.</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>La garantía de no perder escrituras depende de lo que significaba «éxito» antes de la falla. En replicación asíncrona, el líder podía haber respondido antes de que otros nodos persistieran el cambio; si ese líder se pierde, el nuevo podría no conocerlo. En una política que espera una confirmación más fuerte, el riesgo puede reducirse, pero solo si la elección y la recuperación preservan la intersección necesaria entre las réplicas que confirmaron y las candidatas a líder. La palabra <strong>síncrona</strong> por sí sola no especifica ese conjunto ni garantiza la recuperación.</p>
</div>
</div>
<div class="sect2">
<h3 id="_cuando_vuelve_el_líder_anterior"><a class="anchor" href="#_cuando_vuelve_el_líder_anterior"></a>Cuando vuelve el líder anterior</h3>
<div class="paragraph">
<p>El nodo que fue líder puede reiniciarse o recuperar conectividad después de que ya se eligió otro. No debe reanudar escrituras basándose únicamente en que su proceso anterior todavía cree ser líder. Primero debe reconocer la nueva época o autoridad y reconciliar su log.</p>
</div>
<div class="paragraph">
<p>Si su historial contiene entradas que no fueron confirmadas, el protocolo puede descartarlas o reemplazarlas para que el nodo converja con el líder vigente. Si contiene escrituras confirmadas que la nueva autoridad no conserva, la política del sistema debe determinar cómo evitar perderlas; una elección correcta debería impedir esa contradicción bajo sus supuestos. El nodo solo vuelve a ser candidato a atender lecturas o a participar de decisiones después de ponerse al día.</p>
</div>
<div class="paragraph">
<p>Estos mecanismos protegen propiedades distintas: la elección y el aislamiento evitan líderes concurrentes; la replicación y las reglas de confirmación determinan qué escrituras sobreviven; la recuperación hace que cada copia vuelva a estar sincronizada. Resolver una de esas tareas no resuelve automáticamente las otras.</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_replicación_multi_líder"><a class="anchor" href="#_replicación_multi_líder"></a>Replicación multi-líder</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En la replicación <strong>multi-líder</strong>, más de un nodo acepta escrituras y propaga los cambios a los demás. Es habitual en sistemas con varias regiones: un usuario puede escribir en el centro de datos cercano, en vez de enviar cada operación a un líder remoto.</p>
</div>
<div class="paragraph">
<p>La ventaja de reducir viajes de red tiene un costo: dos líderes pueden modificar el mismo dato sin conocer la escritura del otro. Cuando se reanuda la comunicación, aparece un <strong>conflicto de escritura</strong> que debe resolverse.</p>
</div>
<div class="paragraph">
<p>Algunas políticas de resolución son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Última escritura gana:</strong> se conserva una versión según una marca de tiempo o un orden asignado. Es simple, pero puede descartar una actualización que la aplicación consideraba importante; además, los relojes de máquinas distintas pueden no estar perfectamente sincronizados.</p>
</li>
<li>
<p><strong>Regla de dominio:</strong> combinar cambios si existe una operación válida para la aplicación; por ejemplo, sumar incrementos independientes en vez de reemplazar un contador completo.</p>
</li>
<li>
<p><strong>Conflicto explícito:</strong> conservar ambas versiones y pedir a la aplicación o a una persona que decida cuál corresponde.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La resolución no debe confundirse con la propagación. Que las réplicas terminen guardando el mismo resultado no garantiza que el resultado respete las reglas del dominio. Para operaciones como reservar la última unidad de un recurso, aceptar dos escrituras locales y reconciliarlas después podría ser inaceptable.</p>
</div>
<div class="paragraph">
<p>La replicación multi-líder también requiere evitar ciclos de propagación, reconocer cambios ya aplicados y decidir qué hacer con un nodo que vuelve después de un período desconectado. No es simplemente «tener dos líderes»; hacen falta reglas explícitas de origen, orden y resolución de conflictos.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_replicación_sin_líder_y_quórums"><a class="anchor" href="#_replicación_sin_líder_y_quórums"></a>Replicación sin líder y quórums</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En un sistema <strong>sin líder</strong>, cualquier réplica puede recibir una lectura o escritura y el cliente o el coordinador se comunica con varias copias. Para decidir cuándo una operación tiene suficientes respuestas, se usan <strong>quórums</strong>.</p>
</div>
<div class="paragraph">
<p>Supongamos que hay <code>N</code> réplicas, que una escritura espera confirmación de <code>W</code> y una lectura consulta <code>R</code>. Si <code>R + W &gt; N</code>, los grupos que responden a una lectura y a una escritura necesariamente se intersectan <strong>cuando ambas operaciones usan el mismo conjunto de N réplicas</strong>. Por ejemplo, con <code>N = 3</code>, <code>W = 2</code> y <code>R = 2</code>, al menos una réplica consultada por la lectura también recibió la escritura.</p>
</div>
<div class="paragraph">
<p>Ese solapamiento ayuda a encontrar una versión reciente, pero <strong>no demuestra por sí solo linealizabilidad</strong>. Pueden existir escrituras concurrentes, réplicas atrasadas, fallas durante la operación o reglas de coordinación adicionales que cambien el resultado. La versión que una lectura debe devolver y cómo se comparan las versiones son parte del protocolo.</p>
</div>
<div class="paragraph">
<p>Algunos sistemas también priorizan responder con las réplicas accesibles durante una falla, aunque no sean las réplicas habituales del dato. Eso puede mejorar la disponibilidad, pero después hay que reconciliar las copias temporales con las réplicas permanentes; las condiciones de quórum simples ya no se aplican sin considerar esos mecanismos.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_reparar_copias_divergentes"><a class="anchor" href="#_reparar_copias_divergentes"></a>Reparar copias divergentes</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Responder desde varias réplicas no garantiza que todas reciban cada cambio. Las copias pueden divergir por retrasos, mensajes perdidos o indisponibilidad temporal. Los sistemas pueden reparar esa divergencia durante las operaciones o en segundo plano:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Reparación durante una lectura:</strong> si el coordinador detecta que una réplica devolvió una versión vieja, puede devolver el dato más reciente y enviar la actualización a la réplica atrasada. Este mecanismo corrige datos que se leen, pero no necesariamente encuentra claves que nunca se consultan.</p>
</li>
<li>
<p><strong>Comparación de réplicas en segundo plano:</strong> el sistema revisa periódicamente subconjuntos de datos entre copias y transmite las diferencias. Los árboles de Merkle u otras estructuras resumen pueden ayudar a localizar qué partes difieren sin comparar todo el contenido registro por registro.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>La reparación debe respetar el orden y la semántica de las versiones. Una marca de tiempo por sí sola puede no establecer un orden confiable entre eventos de nodos distintos; si se elige «el valor más reciente» con relojes no sincronizados, podría descartarse el cambio equivocado. Por eso la estrategia debe corresponder al tipo de datos y a las garantías que necesita la aplicación.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_operación_y_monitoreo"><a class="anchor" href="#_operación_y_monitoreo"></a>Operación y monitoreo</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La replicación también requiere comprobar continuamente que las copias puedan cumplir su función. Algunas señales útiles son:</p>
</div>
<div class="ulist">
<ul>
<li>
<p><strong>Retraso de replicación:</strong> cuánto tarda un seguidor en aplicar cambios del líder, medido en tiempo o en posiciones del log. Un aumento puede hacer que las lecturas queden muy atrasadas o que una promoción implique mayor pérdida de datos.</p>
</li>
<li>
<p><strong>Réplicas disponibles y confirmaciones:</strong> cuántas réplicas están sanas y cuántas reconocen las escrituras. Un sistema puede seguir atendiendo solicitudes mientras pierde redundancia; por eso conviene alertar antes de quedar sin margen para otra falla.</p>
</li>
<li>
<p><strong>Cola de cambios pendientes y errores de aplicación:</strong> una réplica puede estar conectada pero no avanzar si acumula mensajes, se queda sin espacio o no puede aplicar una operación.</p>
</li>
<li>
<p><strong>Duración y resultado de la recuperación:</strong> cuánto tarda una réplica en ponerse al día o una región en volver al servicio, y si el proceso termina sin intervención manual inesperada.</p>
</li>
</ul>
</div>
<div class="paragraph">
<p>Los umbrales dependen de la garantía del sistema y del impacto en la aplicación. Por ejemplo, si se necesitan lecturas propias de las escrituras, el retraso aceptable para esas lecturas puede ser prácticamente cero; para un catálogo público podría tolerarse una ventana mayor. Las métricas deben conducir a alertas y procedimientos de respuesta claros.</p>
</div>
<div class="paragraph">
<p>Además de observar métricas, hay que ensayar la promoción de un seguidor, la pérdida de conectividad entre regiones, la recuperación de un nodo atrasado y la restauración de un backup. Una arquitectura no tiene un RTO conocido hasta que se mide en ejercicios realistas; una réplica que nunca se probó como candidata de recuperación puede no estar lista cuando haga falta.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_preguntas_para_elegir_una_estrategia"><a class="anchor" href="#_preguntas_para_elegir_una_estrategia"></a>Preguntas para elegir una estrategia</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Antes de replicar datos, conviene precisar:</p>
</div>
<div class="olist arabic">
<ol class="arabic">
<li>
<p>¿Qué se busca: continuar ante fallas, escalar lecturas, reducir latencia geográfica o una combinación?</p>
</li>
<li>
<p>¿Cuántas réplicas deben persistir una escritura antes de confirmarla?</p>
</li>
<li>
<p>¿Qué puede devolver una lectura secundaria y cuánto retraso es aceptable?</p>
</li>
<li>
<p>¿Qué cambios se pierden si cae el líder inmediatamente después de responder?</p>
</li>
<li>
<p>¿Cómo se evita promover una copia incompleta o permitir dos líderes?</p>
</li>
<li>
<p>¿Cómo se pone al día una réplica y cómo se comprueba que realmente está sincronizada?</p>
</li>
<li>
<p>¿Se aceptan varios escritores? Si sí, ¿cómo se resuelven cambios concurrentes sin violar invariantes?</p>
</li>
<li>
<p>¿Cómo detecta y repara el sistema una divergencia que ninguna lectura frecuente descubre?</p>
</li>
</ol>
</div>
<div class="paragraph">
<p>La replicación es una herramienta para ofrecer garantías y capacidad, no una garantía en sí misma. Esas respuestas deben alinearse con las operaciones y las invariantes del dominio; por ejemplo, una lectura de catálogo puede tolerar cierto retraso, mientras que confirmar dos veces una reserva no.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="Kleppmann2017"></a>[Kleppmann2017] KLEPPMANN, Martin. <strong>Designing Data-Intensive Applications</strong>. O&#8217;Reilly Media, 2017, capítulo 5: «Replication».</p>
</li>
<li>
<p><a id="Terry1994"></a>[Terry1994] TERRY, Douglas B.; DEMERS, Alan J.; PETERSEN, Karin; SPREITZER, Mike J.; THEIMER, Marvin M.; y WELCH, Brent B. «Session Guarantees for Weakly Consistent Replicated Data». <strong>Proceedings of the 3rd International Conference on Parallel and Distributed Information Systems (PDIS)</strong>, 1994, pp. 140–149. <a href="https://doi.org/10.1109/PDIS.1994.331722">DOI</a>.</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};