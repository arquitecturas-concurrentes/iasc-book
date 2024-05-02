(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-2d0c0352"],{4198:function(e,a,o){"use strict";o.r(a);var n=function(){var e=this,a=e.$createElement;e._self._c;return e._m(0)},s=[function(){var e=this,a=e.$createElement,o=e._self._c||a;return o("section",[o("h2",{attrs:{id:"bonus-mitos-de-la-distribución"}},[e._v("Bonus: Mitos de la distribución "),o("a",{staticClass:"header-anchor",attrs:{href:"#bonus-mitos-de-la-distribución"}},[e._v("¶")])]),o("p",[e._v("Durante muchos tiempo, existieron 8 leyes o enunciados principales que son falacias y que son difíciles de manejar y la gente de erlang tomó algunas decisiones cuando se diseñó el lenguaje en sí.")]),o("ul",[o("li",[o("p",[e._v("La red es confiable: Esta es la primera falacia que hay en la computación distribuida, pueden existir fallos de red bastante más frecuente de lo que uno cree, más acá que en otros lados incluso por muchas razones (cortes de luz, falla de hardware, cable roto, etc). Entonces ya de por si no es verdadero que uno puede interconectar dos nodos en una red y siempre esperar que uno desde un nodo se puede conectar y hablar normalmente con otro nodo. Erlang en si no tiene un mecanismo especial para eso, lo mejor que nos provee es que haya una comunicación asincrónica en la que se manden mensajes asincrónicamente y después de un timeout se reintente o falle, entonces si un nodo se cae, lo manejaremos como si fuese un fallo local.")])]),o("li",[o("p",[e._v("No hay latencia: Esta es otra falacia ya que de por sí a menos que estén todos los nodos en una sola máquina, siempre existe la conocida latencia de red, e incluso si los nodos estuviesen localmente existe una pequeña latencia. Erlang de la manera en la que es, teniendo nodos como procesos aislados e independientes, mensajes asincrónicos, timeouts, monitores, nos permite ir manejando y viendo cómo ir tratando de manejar la latencia entre los distintos nodos e ir ajustando esto dependiendo de la red.")])]),o("li",[o("p",[e._v("El ancho de banda es infinito: Si bien el ancho de banda es mucho mayor que hace unos años, no hay que ir pasando exceso de información o gran cantidad de información entre dos nodos, siempre hay que tener en consideración que una comunicación entre dos nodos pasa en general mediante una conexión de TCP y solo una. Entonces todos los mensajes que mandemos pasarán por un solo canal entre dos nodos, entonces pasar un mensaje muy grande puede generar un bloqueo para otros mensajes consecuentes en este canal y crear un cuello de botella. Además Erlang/Elixir tienen un mecanismo para saber que los nodos están aún vivos que se lo conoce como heartbeat, y funciona de manera en el que los nodos conectados mandan mensajes cortos entre sí para avisar que aún están vivos y levantados y pueden hablar entre sí llamados beats. Estos mensajes se pasan por el mismo canal que los mensajes comunes entonces bloquear el canal con un mensaje muy grande puede generar que se bloquee el mensaje de beat y luego de pasado un tiempo que se rompa el vínculo entre los nodos.")])]),o("li",[o("p",[e._v("La red es segura. Acá no hay mucho que explicar, sabemos que la red es bastante insegura hoy por hoy. En general las aplicaciones se arman en clusters en una red local, y en general hacerlo en nodos en diferentes lugares físicos no está recomendado, de tener que hacerlo, debería implementar algún mecanismo que no viene por default en Erlang/Elixir, mediante ssl, o implementar el protocolo de comunicación entre los nodos. Hay algunos links que después pasaremos de esto.")])]),o("li",[o("p",[e._v("La Topología no cambia. Uno puede diseñar una aplicación distribuida en una LAN o intranet con una cantidad de máquinas con IP fija y una red pre-establecida, pero la realidad es que.. el hardware cambia con el tiempo, se hacen migraciones de red, o se cambia como era la topología de la LAN o inranet. Entonces sucede que no se puede hardcodear la ip de las máquinas al interconectarlas, para eso, Erlang identifica mendiante username a los nodos, hay un mecanismo que no veremos pero que existe llamado cookies que permite que se pueda identificar a un nodo con un username, no hay que confundirlo con las cookies de http pero son algo similares, aunque nunca deben considerarse un mecanismo de seguridad.")])]),o("li",[o("p",[e._v("Solo hay un administrador. Esto se cae muy rápido en los caso que tengamos una gran cantidad de servidores o incluso cuando nuestro sistema empieza a escalar, como vimos para volver a levantar procesos en Erlang es dentro de todo bastante simple aunque debe hacerse por medio de un administrador o persona si el nodo se cae definitivamente.")])]),o("li",[o("p",[e._v("El costo de transporte es cero. Lease esto como costo de transporte de datos de un nodo a otro en términos de tiempos y/o dinero. Serializar los datos no es gratis o rápido a veces, y la red posee una latencia también como mencionamos que acarrea un costo. En cuanto a costo monetario, siempre hay costo de mantenimiento de la red, servicio de ISP, hardware, personal.")])]),o("li",[o("p",[e._v("La red es homogenea. Esto último se refiere a que siempre usamos los mismos formatos para operar todo junto. Esto se refiere a que siempre se usa un mismo estándar y no siempre es así, se usan distintos lenguajes y estándares (XML, JSON, no no vamos a compararlos aca), pero en Erlang se tiene en cuenta que siempre nos vamos a comunicar y hablar con nodos y nuestro sistema está en el mismo lenguaje y que hablan el mismo protocolo. Entonces volvemos a un concepto como duck typing, en la que si tenemos un nodo que está implementado en otro lenguaje pero usa el mismo protocolo que erlang, entonces podrá hablar con otros nodos, un caso es cnode. Otra manera de intercambiar información es mediante BERT-RPC, cualquier otro sistema que use esta implementación podrá pasar información a un nodo erlang/elixir.")])])])])}],r=o("2877"),i={},t=Object(r["a"])(i,n,s,!1,null,null,null);a["default"]=t.exports}}]);
//# sourceMappingURL=chunk-2d0c0352.7bd22141.js.map