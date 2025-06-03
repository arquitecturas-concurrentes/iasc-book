const e=`<div class="sect1">
<h2 id="_anteriormente_en_arquitecturas_concurrentes"><a class="anchor" href="#_anteriormente_en_arquitecturas_concurrentes"></a>Anteriormente&#8230;&#8203; en Arquitecturas Concurrentes</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Hasta ahora trabajamos sobre un modelo de concurrencia basado en un <em>event loop</em>. En este esquema, cada evento se procesa completamente antes de pasar a la ejecución del próximo, y todo esto ocurre en un único thread.</p>
</div>
<div class="paragraph">
<p>Una ventaja que esto implica es que cuando una función se está ejecutando, tenemos la seguridad de que no va a ser interrumpida por el planificador hasta que termine, lo cual evita los problemas de concurrencia tradicionales que habíamos visto al usar <em>threads</em> y <em>locks</em>. Y esto lo logramos gracias a que el event loop le provee un <em>orden</em> a la ejecución concurrente; la serializa.</p>
</div>
<div class="paragraph">
<p>Las corrutinas nos permiten lograr algo similar, sin utilizar (necesariamente) un event loop.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_caso_practico"><a class="anchor" href="#_caso_practico"></a>Caso practico</h2>
<div class="sectionbody">
<div class="paragraph">
<p>En el desarrollo de software muchas veces solemos enfatizar en lograr que los algoritmos sean más eficientes, es decir que completen los cálculos lo más rápido posible. Pero muchos sistemas dedican su tiempo a "no hacer cálculos", sino que mantienen abiertas muchas conexiones que son lentas. Estos programas presentan un desafío muy diferente: atender una gran cantidad de eventos de red de manera eficiente. Un enfoque actual de este problema es la E/S asíncrona o "asincrónica".</p>
</div>
<div class="paragraph">
<p>Tomemos el ejemplo de un crawler (rastreador web) sencillo. El crawler es una aplicación asíncrona que espera muchas respuestas, pero realiza pocos cálculos. Cuantas más páginas pueda extraer a la vez, va a poder terminar antes.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_el_enfoque_tradicional"><a class="anchor" href="#_el_enfoque_tradicional"></a>El enfoque tradicional</h2>
<div class="sectionbody">
<div class="paragraph">
<p>¿Cómo hacemos que el crawler sea concurrente? Tradicionalmente, crearíamos un grupo hilos. Cada uno se encargaría de descargar una página a la vez a través de un socket. Por ejemplo, para descargar una página de bla.com:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import sys
import requests
import threading
from bs4 import BeautifulSoup

def get_urls_from_root(root_url):
    soup = BeautifulSoup(reqs.text, 'html.parser')
    return soup.find_all('a'):

def fetch(url):
    r = requests.get(url)
    parse_response(r.content) #Content of the response, in bytes

def parse_response(response):
    hace_su_magia(response)

if __name__ == '__main__':
    root_url = sys.argv[1]
    urls = [link.get('href') for link in get_urls_from_root(root_url)]

    for url in urls:
        t = threading.Thread(target=fetch, args=(i,))
        t.start()</code></pre>
</div>
</div>
<div class="paragraph">
<p>Este es un ejemplo simple que hace lo mencionado anteriormente. Analicemos con más detalle lo que esta realmente haciendo la función <strong>fetch</strong>, escribámosla de vuelta sin usar la libreria requests.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">def fetch(url):
    sock = socket.socket()
    sock.connect(('bla.com', 80))
    request = 'GET {} HTTP/1.0\\r\\nHost: bla.com\\r\\n\\r\\n'.format(url)
    sock.send(request.encode('ascii'))
    response = b''
    chunk = sock.recv(4096)
    while chunk:
        response += chunk
        chunk = sock.recv(4096)

    parse_response(response)</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Nota: De esa forma la manipulación de sockets, el connect y el recv estan de forma explicita y nos obliga a hablar de estas cosas que vimos en algún pasado lejano programando en C y leyendo la guia Beej :P</p>
</div>
</blockquote>
</div>
<div class="sect2">
<h3 id="_entendiendo_el_problema"><a class="anchor" href="#_entendiendo_el_problema"></a>Entendiendo el problema</h3>
<div class="paragraph">
<p>Si se crea un hilo por cada request (solicitud), a medida que aumente el número de requests simultáneas, aumenta la posibilidad de quedarse sin memoria antes de que se agoten los sockets. Podemos evitar la necesidad de subprocesos (hilos), mediante el uso de E/S asincrónica.</p>
</div>
<div class="paragraph">
<p>Por defecto, las operaciones con sockets son bloqueantes, cuando el hilo llama a un método como connect o recv, se detiene hasta que la operación se completa. En consecuencia, para descargar muchas páginas a la vez, necesitamos muchos hilos. Una aplicación sofisticada amortiza el costo de la creación de hilos al mantener los inactivos en un grupo o pool y luego revisarlos para reutilizarlos para tareas posteriores; se suele hacer lo mismo con los sockets en un grupo de conexiones.</p>
</div>
<div class="paragraph">
<p>Sin embargo, los hilos son costosos y los sistemas operativos imponen una variedad de límites estrictos en la cantidad que se puede tener. Un hilo de Python ocupa alrededor de 50k de memoria y el inicio de decenas de miles de hilos puede provocar fallas. Si escalamos hasta decenas de miles de operaciones simultáneas en sockets concurrentes, nos quedamos sin hilos antes de quedarnos sin sockets. La sobrecarga por hilos o los límites del sistema en subprocesos son el cuello de botella.</p>
</div>
<div class="paragraph">
<p>Dan Kegel en su artículo <a href="http://www.kegel.com/c10k.html" class="bare">www.kegel.com/c10k.html</a> <a href="#c10k" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[c10k]</a>, describe las limitaciones de utilizar multiples hilos para resolver problemas de concurrencia de E/S.</p>
</div>
<div class="paragraph">
<p>Kegel utilizo el término "C10K" en 1999. Diez mil conexiones no suenan ahora como lo sonaban antes, pero el problema ha cambiado sólo en tamaño, no en especie. En aquel entonces, usar un hilo por conexión para C10K no era práctico. Ahora el límite es en órdenes de magnitud más elevado. De hecho, nuestro crawler de juguete funcionaría bien con hilos. Sin embargo, para aplicaciones a gran escala, con cientos de miles de conexiones, el límite permanece; hay un límite más allá del cual la mayoría de los sistemas aún pueden crear sockets, pero se han quedado sin hilos. ¿Cómo podemos superar esto?</p>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_async"><a class="anchor" href="#_async"></a>Async</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Los frameworks de E/S asincrónicos realizan operaciones simultáneas en un solo hilo utilizando sockets no bloqueantes. En nuestro crawler asíncrono, configuramos el socket no bloqueante antes de comenzar a conectarnos al servidor:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">sock = socket.socket()
sock.setblocking(False)
try:
    sock.connect(('bla.com', 80))
except BlockingIOError:
    pass</code></pre>
</div>
</div>
<div class="paragraph">
<p>Un socket no bloqueante genera una excepción al realizar el <em>connect</em>, incluso cuando funciona normalmente. Esta excepción replica el comportamiento irritante de la función C subyacente, que establece <em>errno</em> en <em>EINPROGRESS</em> para indicarle que ha comenzado.</p>
</div>
<div class="paragraph">
<p>Ahora nuestro crawler necesita una forma de saber cuándo se establece la conexión, para poder enviar la solicitud HTTP. Simplemente podríamos seguir intentándolo en un loop. Este método no puede esperar eventos de manera eficiente en múltiples sockets. En la antigüedad, la solución de BSD Unix a este problema era select, una función de C que espera a que ocurra un evento en un socket sin bloqueo o en un pequeño vector de ellos. Hoy en día, la demanda de aplicaciones con un gran número de conexiones ha llevado a reemplazos como poll, luego kqueue en BSD y epoll en Linux. Estas API son similares a las de select, pero funcionan bien con un gran número de conexiones.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">from selectors import DefaultSelector, EVENT_WRITE

selector = DefaultSelector()

sock = socket.socket()
sock.setblocking(False)
try:
    sock.connect(('bla.com', 80))
except BlockingIOError:
    pass

def connected():
    selector.unregister(sock.fileno())
    print('connected!')

selector.register(sock.fileno(), EVENT_WRITE, connected)</code></pre>
</div>
</div>
<div class="paragraph">
<p>Procesamos las notificaciones de E/S a medida que el selector las recibe, en un loop:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">def loop():
    while True:
        events = selector.select()
        for event_key, event_mask in events:
            callback = event_key.data
            callback()</code></pre>
</div>
</div>
<div class="paragraph">
<p>Aquí hemos logrado tener "concurrencia", pero no "paralelismo". Es decir, construimos un pequeño sistema que superpone E/S. Es capaz de iniciar nuevas operaciones mientras otras están "en vuelo". No utiliza varios núcleos para ejecutar cálculos en paralelo. Este sistema está diseñado para problemas I/O-bound, no con CPU-bound.</p>
</div>
<div class="paragraph">
<p><strong>La iteración final en nuestro ejemplo seria refactorizar esto para que use corrutinas, pero antes necesitamos ver rápidamente lo que son para entender en que nos van a ayudar.</strong></p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Nota al margen: las corrutinas no son nada nuevo. C&#43;&#43;, Smalltalk, Erlang y muchos más (¡hasta PHP!) las tienen desde hace mucho. Pero recientemente han conseguido cierta notoriedad en la industria por su uso en lenguajes como Go, Kotlin y Python.</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Para entender como funcionan, primero veamos <strong>iteradores</strong> y <strong>generadores</strong>&#8230;&#8203;</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="https://www.salesoptimize.com/wp-content/uploads/2016/11/76e3344703e128bed674b84014fa01ab.jpg" alt="76e3344703e128bed674b84014fa01ab">
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_iteradores_y_generadores"><a class="anchor" href="#_iteradores_y_generadores"></a>Iteradores y generadores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Un <strong>generador</strong> es un tipo especial de subrutina, pensando en teoría de conjuntos, podemos decir que el conjunto generador es un subconjunto de corrutina.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Esta bien, pero entonces.. ¿qué es un generador?</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>También podemos decir que un <strong>generador</strong> es una función que produce una secuencia de resultados, en lugar de un único valor.</p>
</div>
<div class="paragraph">
<p>Un <strong>iterador</strong> es un objeto que permite al programador recorrer un contenedor (colección de elementos) por ejemplo una lista. Una manera de implementar iteradores es utilizar un <strong>generador</strong>, que como comentamos antes, puede producir valores para quien lo llama varias veces (en lugar de devolver sólo uno).</p>
</div>
<div class="paragraph">
<p>Cuando invocamos a una función generadora se crea un "objeto generador" que permanece en un estado pausado, no se ejecuta automáticamente.</p>
</div>
<div class="paragraph">
<p>Veámoslo con un ejemplo:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">def cuenta_regresiva(numero):
    while numero &gt; 0:
        yield numero
        numero -= 1

for numero in cuenta_regresiva(5):
    print(numero)</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>El resultado de ejecutar el script es:
5
4
3
2
1</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Acá podemos ver a el generador en su estado pausado, por esta propiedad los solemos usar en un for, y si es aplicable en un for, se deduce que el estado pausado es un objeto  iterable. Llamando a next se ejecutan todas las lineas hasta volver al "segundo" yield</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>x = cuenta_regresiva(5)
x</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>&lt;generator object cuenta_regresiva at 0x7fc2a7576890&gt;
next(x)
4</p>
</div>
<div class="paragraph">
<p>A continuación se puede ver un ejemplo de un generador que devuelve los números de Fibonacci:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">def fibonacci():
  a, b = 0, 1
  while True:
    yield a
    a, b = b, a+b

for numero in fibonacci():  # Utilización de generador como iterador
  print(numero)</code></pre>
</div>
</div>
<div class="sect2">
<h3 id="_corrutinas_basadas_en_generadores"><a class="anchor" href="#_corrutinas_basadas_en_generadores"></a>Corrutinas basadas en generadores</h3>
<div class="paragraph">
<p>Es posible implementar corrutinas basadas en generadores, de hecho, hasta Python 2.5 las corrutinas estaban hechas de esta forma, con la ayuda de una rutina de despachador de nivel superior (un trampolín, esencialmente) que pasa el control explícitamente a los generadores secundarios.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">def coro():
  #yield usado de esta forma creamos una corrutina que hace más que generar valores, si no que también consume
  hello = yield "Soy una corrutina"
  yield hello

c = coro()
print(next(c))
print(c.send(", basada en generadores"))</code></pre>
</div>
</div>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_es_una_corrutina"><a class="anchor" href="#_qué_es_una_corrutina"></a>¿Qué es una corrutina?</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Una corrutina es similar a una subrutina tradicional (piensen en las funciones/procedimientos que vieron en Algoritmos), pero con la diferencia de que, mientras que la salida de una subrutina pone fin a su ejecución, una corrutina puede además <strong>suspenderse</strong>, cediendo el control a otra hasta que se le indique que debe <strong>retomar</strong> su ejecución.</p>
</div>
<div class="paragraph">
<p>Para entender mejor a qué nos referimos con esto, veamos un ejemplo en Python, uno de los lenguajes que cuenta con soporte para corrutinas.</p>
</div>
<h4 id="_sin_corrutinas" class="discrete">Sin corrutinas</h4>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import time

def io():
    time.sleep(1)
    print('1')
    time.sleep(1)
    print('2')
    time.sleep(1)
    print('3')

def main(tareas):
    for tarea in tareas:
        io()

if __name__ == '__main__':
    tiempo = time.perf_counter()
    main(range(3))
    tiempo2 = time.perf_counter() - tiempo
    print(f'Tiempo total: {tiempo2:0.2f} segundos')</code></pre>
</div>
</div>
<div class="paragraph">
<p>Este código imprime:</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>1
2
3
1
2
3
1
2
3
Tiempo total: 9.01 segundos</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Podemos ver que cada ciclo de IOs de cada tarea se ejecuta y termina una atrás de la otra. ¿Qué pasa si agregamos corrutinas?</p>
</div>
<h4 id="_con_corrutinas" class="discrete">Con corrutinas</h4>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import time
import asyncio

async def io():
    #Hay un async adelante del def, asi que soy una corrutina :D
    await asyncio.sleep(1)
    print(1)
    await asyncio.sleep(1)
    print(2)
    await asyncio.sleep(1)
    print(3)

async def main():
    await asyncio.gather(io(), io(), io())

if __name__ == '__main__':
    tiempo = time.perf_counter()
    asyncio.run(main())
    tiempo2 = time.perf_counter() - tiempo
    print(f'Tiempo total: {tiempo2:0.2f} segundos')</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>1
1
1
2
2
2
3
3
3
Tiempo total: 3.00 segundos</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>La diferencia en los tiempos es notable. También observamos que el orden de ejecución fue distinto en este caso.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cómo_funcionan"><a class="anchor" href="#_cómo_funcionan"></a>¿Cómo funcionan?</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Cuando usamos corrutinas, no hay intervención del SO. Hay un sólo proceso, un sólo thread. Entonces&#8230;&#8203; ¿qué es lo que esta pasando?</p>
</div>
<div class="paragraph">
<p>Lo que ocurre es que las corrutinas liberan la CPU cuando están en "tiempo de espera" (<code>await</code>), permitiendo que otras puedan usar la CPU.</p>
</div>
<div class="paragraph">
<p>Podemos decir que es como una simultánea de ajedrez, en donde una persona juega contra dos o más. Hace un movimiento y no se queda esperando la respuesta del oponente en ese tablero, sino que pasa al siguiente y realiza un movimiento ahí. De esa forma, trata las partidas (tareas) de forma concurrente, lo que resulta en que se terminen en menos tiempo.</p>
</div>
<div class="imageblock center iasc-image">
<div class="content">
<img src="/iasc-book//img/momento.jpg" alt="momento">
</div>
</div>
<div class="paragraph">
<p>Seguro están pensando:</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Un momento&#8230;&#8203; esto se parece a un thread</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Lo que nos lleva a nuestra próxima sección&#8230;&#8203;</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_corrutinas_vs_threads"><a class="anchor" href="#_corrutinas_vs_threads"></a>Corrutinas vs Threads</h2>
<div class="sectionbody">
<div class="paragraph">
<p>La diferencia fundamental entre corrutinas y threads se da en la forma en la que se lleva a cabo la multitarea.</p>
</div>
<div class="paragraph">
<p>Los threads, como ya vimos, manejan un esquema de <strong>multitarea apropiativa</strong> (en inglés, <em>preemptive multitasking</em>), donde el planificador es el encargado de asignar intervalos de uso de CPU a los threads que se están ejecutando, desalojándolos cuando este termina.</p>
</div>
<div class="paragraph">
<p>Las corrutinas, en contraposición, permiten tener <strong>multitarea cooperativa</strong> (<em>cooperative/non-preemptive multitasking</em>). Esto significa que el cambio de contexto no es controlado por el planificador, sino que cada corrutina es la encargada de ceder el control cuando está inactiva o bloqueda.</p>
</div>
<div class="paragraph">
<p>Otra diferencia, presente al menos en la visión "tradicional" de corrutinas, es que <strong>las corrutinas proveen concurrencia pero no paralelismo</strong>. De esta forma, evitan problemas de concurrencia, ya que corren en un <strong>único contexto de ejecución</strong>, y además <strong>controlan cuándo se suspenden</strong> (en vez de que el planificador las interrumpa en puntos arbitrarios).</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Las corrutinas ocupan menos memoria que los hilos (3k por corrutina vs 50k por hilo).</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Una ventaja más que las corrutinas tienen sobre los hilos es que su funcionamiento no involucra llamadas al sistema bloqueantes para su creación ni para el cambio de contexto, ya que todo se maneja al nivel de la aplicación.</p>
</div>
<div class="paragraph">
<p>Interesante comparación de cuando usar corrutinas y cuando usar threads en Kotlin. <a href="#kot" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[kot]</a></p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_cómo_se_declaran_y_ejecutan_en_python"><a class="anchor" href="#_cómo_se_declaran_y_ejecutan_en_python"></a>¿Cómo se declaran y ejecutan en Python?</h2>
<div class="sectionbody">
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import asyncio

def print_loco(algo):
  return print(algo,'loco')

async def print_re_loco(algo):
  return print(algo,'loco')</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>print_loco</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>&lt;function print_loco at 0x7fe7aa5a9310&gt;</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>print_re_loco</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>&lt;function print_re_loco at 0x7fe7aa5a93a0&gt;</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Las dos funciones lucen similares, la diferencia vamos a notar cuando las usamos:</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>print_loco('bla')</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>bla loco</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Nada fuera de lo esperado.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>print_re_loco('algo')</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>&lt;coroutine object print_re_loco at 0x7fe7aa5e8640&gt;</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Nos retorna un objeto "corrutina" que por defecto no se va a planificar. Entonces, ¿cómo hago que se ejecute? Bueno, hay tres formas distintas para hacer eso.</p>
</div>
<div class="paragraph">
<p><strong>1-</strong> Usando la función <code>run</code> del módulo <code>asyncio</code> <a href="#pythondoc" class="biblioref" class="biblioref" class="biblioref" class="biblioref">[pythondoc]</a></p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>coro = print_re_loco('algo')</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>asyncio.run(coro)</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>algo loco</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p><strong>2-</strong> Usando <code>await</code> en una corrutina</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import asyncio

async def say_after(delay, what):
  await asyncio.sleep(delay)
  print(what)

async def main():
  await say_after(1, 'hello')
  await say_after(2, 'world')</code></pre>
</div>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>asyncio.run(main())</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>hello</p>
</div>
</blockquote>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>world</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p><em>Nota: acá usamos <code>run</code> para ejecutar la corrutina <code>main</code> y <code>await</code> para ejecutar las corrutinas <code>say_after</code>.</em></p>
</div>
<div class="paragraph">
<p><strong>3-</strong> Con la función <code>create_task</code> de <code>asyncio</code>, que ejecuta corrutinas concurrentemente <em>wrappeándolas</em> en <code>Tasks</code>, usando  por detrás un <strong>event loop</strong> para planificarlas.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import asyncio

async def main():
  task1 = asyncio.create_task(say_after(1, 'hello'))
  task2 = asyncio.create_task(say_after(2, 'world'))

  await task1
  await task2</code></pre>
</div>
</div>
<div class="paragraph">
<p><em>Nota: <code>create_task</code> envía la corrutina al event loop, permitiendo que corra en segundo plano. <code>gather</code> hace algo muy parecido, pero podemos decir que es conveniente usarlo cuando nos interesa hacer algo con el resultado de las corrutinas.</em></p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_qué_pasa_si_ejecuto_código_bloqueante_dentro_de_una_corrutina"><a class="anchor" href="#_qué_pasa_si_ejecuto_código_bloqueante_dentro_de_una_corrutina"></a>¿Qué pasa si ejecuto código bloqueante dentro de una corrutina?</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Si observaron con detalle se habrán dado cuenta de que cuando se usa sleep para suspender a la corrutina, se esta usando <code>asyncio.sleep</code> en lugar de <code>time.sleep</code>. Esto es porque el segundo es bloqueante. Entonces como ya dedujeron, las operaciones bloqueantes bloquean todo el thread del sistema operativo subyacente.</p>
</div>
<div class="paragraph">
<p>Pero hay formas de evitarlo :D!, lo que se hace es que correr estas tareas <strong>bloqueantes</strong> y otras que vamos a llamar <strong>CPU-bound-intensive</strong>, sea conveniente ejecutarlas en otro thread. Concretamente en <strong>Python</strong> usando <code>loop.run_in_executor()</code> <a href="https://docs.python.org/3/library/asyncio-dev.html#running-blocking-code">Running Blocking Code</a></p>
</div>
<div class="paragraph">
<p><em>Nota: también es posible setear un timeout para que cuando se cumpla, se corte su ejecución <a href="https://docs.python.org/3/library/asyncio-task.html#timeouts">ver timeouts</a> .</em></p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_corrutinas_vs_generadores"><a class="anchor" href="#_corrutinas_vs_generadores"></a>Corrutinas vs Generadores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Si bien ambos pueden ceder múltiples veces, suspender su ejecución y permitir el reingreso en múltiples puntos de entrada, difieren en que las corrutinas tienen la capacidad para controlar dónde continúa la ejecución inmediatamente después de ceder, mientras que los generadores no pueden, estos transfieren el control de nuevo al generador que lo llamo. Es decir, dado que los generadores se utilizan principalmente para simplificar la escritura de iteradores, la declaración de rendimiento en un generador no especifica una rutina para saltar, sino que devuelve un valor a una rutina principal. <a href="https://docs.python.org/3/reference/expressions.html#yieldexpr">Explicación de yield y comparación con corrutinas</a></p>
</div>
<div class="paragraph">
<p><strong>Bien, entonces ahora somos capaces de retomar el ejemplo y refactorizar lo necesario para implementarlo con corrutinas :D</strong></p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_con_corrutinas_basadas_en_generadores"><a class="anchor" href="#_con_corrutinas_basadas_en_generadores"></a>Con corrutinas basadas en generadores</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Es posible escribir código asincrónico que combine la eficiencia de los callbacks con el buen aspecto clásico de la programación multiproceso/hilo.</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">def fetch(self, url):
        response = yield from self.session.get(url)
        body = yield from response.read()</code></pre>
</div>
</div>
<div class="paragraph">
<p>Ahora, fetch es una función generadora, en lugar de una normal. Creamos un <a href="https://docs.python.org/es/3/library/asyncio-future.html#future-object">future</a> pendiente, luego lo cedemos para pausar la búsqueda hasta que el socket esté listo. La función interna on_connected resuelve el future.</p>
</div>
<div class="quoteblock">
<blockquote>
<div class="paragraph">
<p>Nota: Un future representa un resultado eventual de una operación asincrónica.</p>
</div>
</blockquote>
</div>
<div class="paragraph">
<p>Pero cuando el future se resuelva, ¿qué reanuda el generador? Necesitamos un controlador de rutina. Llamémoslo "tarea":</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">class Task:
    def __init__(self, coro):
        self.coro = coro
        f = Future()
        f.set_result(None)
        self.step(f)

    def step(self, future):
        try:
            next_future = self.coro.send(future.result)
        except StopIteration:
            return

        next_future.add_done_callback(self.step)

fetcher = Fetcher('/333/')
Task(fetcher.fetch())

loop()</code></pre>
</div>
</div>
<div class="paragraph">
<p>Task inicia el generador "fetch" enviando None. Luego, fetch se ejecuta hasta que produce (yield) un future, que la tarea captura como siguiente future. Cuando el socket está conectado, el event loop ejecuta el callback on_connected, que resuelve el future, que llama a step, que reanuda fetch.</p>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_con_corrutinas_2"><a class="anchor" href="#_con_corrutinas_2"></a>Con corrutinas</h2>
<div class="sectionbody">
<div class="paragraph">
<p>Modificando el codigo de las corrutinas basadas en generadores usando async/await, quedaría algo como:</p>
</div>
<div class="listingblock">
<div class="content">
<pre class="highlight"><code class="language-python" data-lang="python">import sys
import asyncio
from bs4 import BeautifulSoup

def get_urls_from_root(root_url):
    soup = BeautifulSoup(reqs.text, 'html.parser')
    return soup.find_all('a'):

async def fetch(url):
    await r = get_non_block(url)
    await parse_response(r.content) #Content of the response, in bytes

async def parse_response(response):
    hace_su_magia(response)

async def main():
    root_url = sys.argv[1]
    urls = [link.get('href') for link in get_urls_from_root(root_url)]

    for url in urls:
        task = asyncio.create_task(fetch(url))
        await task

asyncio.run(main())</code></pre>
</div>
</div>
<div class="paragraph">
<p>Quedaria implementada la solución con corrutinas "nativas" de Python.</p>
</div>
</div>
</div>
<div class="sect1 appendix">
<h2 id="_links_interesantes"><a class="anchor" href="#_links_interesantes"></a>Apendice A: Links interesantes</h2>
<div class="sectionbody">
<div class="ulist">
<ul>
<li>
<p><a href="https://docs.python.org/3.8/library/asyncio-task.html">Corrutinas en Python</a></p>
</li>
<li>
<p><a href="https://www.tornadoweb.org/en/stable/">Framework de Python que levanta un server asincronico con corrutinas planificandolas con un event loop</a></p>
</li>
<li>
<p><a href="http://www.golangpatterns.info/concurrency/coroutines">Corrutinas en Go</a></p>
</li>
<li>
<p><a href="https://tour.golang.org/concurrency/1">Para jugar con Goroutines</a></p>
</li>
<li>
<p><a href="https://kotlinlang.org/docs/reference/coroutines/basics.html">Corrutinas en Kotlin</a></p>
</li>
<li>
<p><a href="https://kotlinlang.org/docs/tutorials/coroutines/async-programming.html">Comparación de técnicas programación asincrónica (threading, callbacks, Promises, corrutinas)</a>. Claramente enfocado para resaltar las ventajas de las corrutinas en Kotlin, pero de todos modos interesante para repasar las técnicas que vimos hasta ahora.</p>
</li>
</ul>
</div>
</div>
</div>
<div class="sect1">
<h2 id="_referencias"><a class="anchor" href="#_referencias"></a>Referencias</h2>
<div class="sectionbody">
<div class="ulist bibliography">
<ul class="bibliography">
<li>
<p><a id="c10k"></a>[c10k] <a href="http://www.kegel.com/c10k.html" class="bare">www.kegel.com/c10k.html</a>. Kegel, Dan. 1999. The C10K problem.</p>
</li>
<li>
<p><a id="pythondoc"></a>[pythondoc] <a href="https://docs.python.org/3.10/library/asyncio-task.html" class="bare">docs.python.org/3.10/library/asyncio-task.html</a>. Python Docs. Coroutines and Tasks</p>
</li>
<li>
<p><a id="kot"></a>[kot] <a href="https://www.baeldung.com/kotlin-threads-coroutines" class="bare">www.baeldung.com/kotlin-threads-coroutines</a>. Baeldung. 2021. Threads vs Coroutines in Kotlin</p>
</li>
</ul>
</div>
</div>
</div>`;export{e as default};
