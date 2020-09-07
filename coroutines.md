---
layout: default
title: "Corrutinas (coroutines)"
description: "Introduccion a las corrutinas"
---

## Anteriormente... en Arquitecturas Concurrentes

Hasta ahora trabajamos sobre un modelo de concurrencia basado en un _event loop_. En este esquema, cada evento se procesa completamente antes de pasar a la ejecución del próximo, y todo esto ocurre en un único thread.

Una ventaja que esto implica es que cuando una función se está ejecutando, tenemos la seguridad de que no va a ser interrumpida por el planificador hasta que termine, lo cual evita los problemas de concurrencia tradicionales que habíamos visto al usar _threads_ y _locks_. Y esto lo logramos gracias a que el event loop le provee un _orden_ a la ejecución concurrente; la serializa.

Las corrutinas nos permiten lograr algo similar, sin utilizar (necesariamente) un event loop.

>Nota al margen: las corrutinas no son nada nuevo. C++, Smalltalk, Erlang y muchos más (¡hasta PHP!) las tienen desde hace mucho. Pero recientemente han conseguido cierta notoriedad en la industria por su uso en lenguajes como Go, Kotlin y Python.

Para entender como funcionan, primero veamos **iteradores** y **generadores**...

![](https://www.salesoptimize.com/wp-content/uploads/2016/11/76e3344703e128bed674b84014fa01ab.jpg)

## Iteradores y generadores

Un **generador** es un tipo especial de subrutina, pensando en teoría de conjuntos, podemos decir que el conjunto generador es un subconjunto de corrutina.

>Esta bien, pero entonces.. ¿qué es un generador?

También podemos decir que un **generador** es una función que produce una secuencia de resultados, en lugar de un único valor.

Un **iterador** es un objeto que permite al programador recorrer un contenedor (colección de elementos) por ejemplo una lista. Una manera de implementar iteradores es utilizar un **generador**, que como comentamos antes, puede producir valores para quien lo llama varias veces (en lugar de devolver sólo uno).

Cuando invocamos a una función generadora se crea un "objeto generador" que permanece en un estado pausado, no se ejecuta automáticamente.

Veamos lo con un ejemplo:

```python
def cuenta_regresiva(numero):
    while numero > 0:
        yield numero
        numero -= 1

for numero in cuenta_regresiva(5):
    print(numero)
```
>El resultado de ejecutar el script es:
5
4
3
2
1

Acá podemos ver a el generador en su estado pausado, por esta propiedad los solemos usar en un for, y si es aplicable en un for, se deduce que el estado pausado es un objeto  iterable. Llamando a next se ejecutan todas las lineas hasta volver al "segundo" yield
>x = cuenta_regresiva(5)
x
<generator object cuenta_regresiva at 0x7fc2a7576890>
next(x)
4

A continuación se puede ver un ejemplo de un generador que devuelve los números de Fibonacci:
```python
def fibonacci():
  a, b = 0, 1
  while True:
    yield a
    a, b = b, a+b

for numero in fibonacci():  # Utilización de generador como iterador
  print(numero)
```

### Corrutinas basadas en generadores

Es posible implementar corrutinas basadas en generadores, de hecho, hasta Python 2.5 las corrutinas estaban hechas de esta forma, con la ayuda de una rutina de despachador de nivel superior (un trampolín, esencialmente) que pasa el control explícitamente a los generadores secundarios.
```python
def coro():
  #yield usado de esta forma creamos una corrutina que hace más que generar valores, si no que también consume
  hello = yield "Soy una corrutina"
  yield hello

c = coro()
print(next(c))
print(c.send(", basada en generadores"))
```

## ¿Qué es una corrutina?

Una corrutina es similar a una subrutina tradicional (piensen en las funciones/procedimientos que vieron en Algoritmos), pero con la diferencia de que, mientras que la salida de una subrutina pone fin a su ejecución, una corrutina puede además **suspenderse**, cediendo el control a otra hasta que se le indique que debe **retomar** su ejecución.

Para entender mejor a qué nos referimos con esto, veamos un ejemplo en Python, uno de los lenguajes que cuenta con soporte para corrutinas.

#### Sin corrutinas
```python
import time

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
    print(f'Tiempo total: {tiempo2:0.2f} segundos')
```
Este código imprime:
>1
2
3
1
2
3
1
2
3
Tiempo total: 9.01 segundos

Podemos ver que cada ciclo de IOs de cada tarea se ejecuta y termina una atrás de la otra. ¿Qué pasa si agregamos corrutinas?

#### Con corrutinas
```python
import time
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
    print(f'Tiempo total: {tiempo2:0.2f} segundos')
```
>1
1
1
2
2
2
3
3
3
Tiempo total: 3.00 segundos

La diferencia en los tiempos es notable. También observamos que el orden de ejecución fue distinto en este caso.

## ¿Cómo funcionan?

Cuando usamos corrutinas, no hay intervención del SO. Hay un sólo proceso, un sólo thread. Entonces... ¿qué es lo que esta pasando?

Lo que ocurre es que las corrutinas liberan la CPU cuando están en "tiempo de espera" (`await`), permitiendo que otras puedan usar la CPU.

Podemos decir que es como una simultánea de ajedrez, en donde una persona juega contra dos o más. Hace un movimiento y no se queda esperando la respuesta del oponente en ese tablero, sino que pasa al siguiente y realiza un movimiento ahí. De esa forma, trata las partidas (tareas) de forma concurrente, lo que resulta en que se terminen en menos tiempo.

![](https://i.ytimg.com/vi/Hp6827K1pFE/hqdefault.jpg)

Seguro están pensando:
>Un momento... esto se parece a un thread

Lo que nos lleva a nuestra próxima sección...

## Corrutinas vs Threads

La diferencia fundamental entre corrutinas y threads se da en la forma en la que se lleva a cabo la multitarea.

Los threads, como ya vimos, manejan un esquema de **multitarea apropiativa** (en inglés, _preemptive multitasking_), donde el planificador es el encargado de asignar intervalos de uso de CPU a los threads que se están ejecutando, desalojándolos cuando este termina.

Las corrutinas, en contraposición, permiten tener **multitarea cooperativa** (_cooperative/non-preemptive multitasking_). Esto significa que el cambio de contexto no es controlado por el planificador, sino que cada corrutina es la encargada de ceder el control cuando está inactiva o bloqueda.

Otra diferencia, presente al menos en la visión "tradicional" de corrutinas, es que **las corrutinas proveen concurrencia pero no paralelismo**. De esta forma, evitan problemas de concurrencia, ya que corren en un **único contexto de ejecución**, y además **controlan cuándo se suspenden** (en vez de que el planificador las interrumpa en puntos arbitrarios).

Las corrutinas ocupan menos memoria que los hilos (3k por corrutina vs 50k por hilo).

Una ventaja más que las corrutinas tienen sobre los hilos es que su funcionamiento no involucra llamadas al sistema bloqueantes para su creación ni para el cambio de contexto, ya que todo se maneja al nivel de la aplicación.

[Interesante comparación de cuando usar corrutinas y cuando usar threads en Kotlin](https://www.baeldung.com/kotlin-threads-coroutines)

## ¿Cómo se declaran y ejecutan en Python?

```python
import asyncio

def print_loco(algo):
  return print(algo,'loco')

async def print_re_loco(algo):
  return print(algo,'loco')
```
>print_loco

><function print_loco at 0x7fe7aa5a9310>

>print_re_loco

><function print_re_loco at 0x7fe7aa5a93a0>

Las dos funciones lucen similares, la diferencia vamos a notar cuando las usamos:

>print_loco('bla')

>bla loco

Nada fuera de lo esperado.

>print_re_loco('algo')

><coroutine object print_re_loco at 0x7fe7aa5e8640>

Nos retorna un objeto "corrutina" que por defecto no se va a planificar. Entonces, ¿cómo hago que se ejecute? Bueno, hay tres formas distintas para hacer eso.

**1-** Usando la función `run` del módulo `asyncio`
>coro = print_re_loco('algo')

>asyncio.run(coro)

>algo loco

**2-** Usando `await` en una corrutina
```python
import asyncio

async def say_after(delay, what):
  await asyncio.sleep(delay)
  print(what)

async def main():
  await say_after(1, 'hello')
  await say_after(2, 'world')
```
>asyncio.run(main())

>hello

>world

_Nota: acá usamos `run` para ejecutar la corrutina `main` y `await` para ejecutar las corrutinas `say_after`._

**3-** Con la función `create_task` de `asyncio`, que ejecuta corrutinas concurrentemente _wrappeándolas_ en `Tasks`, usando  por detrás un **event loop** para planificarlas.
```python
import asyncio

async def main():
  task1 = asyncio.create_task(say_after(1, 'hello'))
  task2 = asyncio.create_task(say_after(2, 'world'))

  await task1
  await task2
```

_Nota: `create_task` envía la corrutina al event loop, permitiendo que corra en segundo plano. `gather` hace algo muy parecido, pero podemos decir que es conveniente usarlo cuando nos interesa hacer algo con el resultado de las corrutinas._

## ¿Qué pasa si ejecuto código bloqueante dentro de una corrutina?

Si observaron con detalle se habrán dado cuenta de que cuando se usa sleep para suspender a la corrutina, se esta usando `asyncio.sleep` en lugar de `time.sleep`. Esto es porque el segundo es bloqueante. Entonces como ya dedujeron, las operaciones bloqueantes bloquean todo el thread del sistema operativo subyacente.

Pero hay formas de evitarlo :D!, lo que se hace es que correr estas tareas **bloqueantes** y otras que vamos a llamar **CPU-bound-intensive**, sea conveniente ejecutarlas en otro thread. Concretamente en **Python** usando `loop.run_in_executor()` [Running Blocking Code](https://docs.python.org/3/library/asyncio-dev.html#running-blocking-code)

_Nota: también es posible setear un timeout para que cuando se cumpla, se corte su ejecución [ver timeouts](https://docs.python.org/3/library/asyncio-task.html#timeouts) ._

## Corrutinas vs Generadores

Si bien ambos pueden ceder múltiples veces, suspender su ejecución y permitir el reingreso en múltiples puntos de entrada, difieren en que las corrutinas tienen la capacidad para controlar dónde continúa la ejecución inmediatamente después de ceder, mientras que los generadores no pueden, estos transfieren el control de nuevo al generador que lo llamo. Es decir, dado que los generadores se utilizan principalmente para simplificar la escritura de iteradores, la declaración de rendimiento en un generador no especifica una rutina para saltar, sino que devuelve un valor a una rutina principal. [Explicación de yield y comparación con corrutinas](https://docs.python.org/3/reference/expressions.html#yieldexpr)

## Caso practico

En el desarrollo de software muchas veces solemos enfatizar en lograr que los algoritmos sean más eficientes, es decir que completen los cálculos lo más rápido posible. Pero muchos sistemas dedican su tiempo a "no hacer cálculos", sino que mantienen abiertas muchas conexiones que son lentas. Estos programas presentan un desafío muy diferente: atender una gran cantidad de eventos de red de manera eficiente. Un enfoque actual de este problema es la E/S asíncrona o "asincrónica".

Tomemos el ejemplo de un crawler (rastreador web) sencillo. El crawler es una aplicación asíncrona que espera muchas respuestas, pero realiza pocos cálculos. Cuantas más páginas pueda extraer a la vez, va a poder terminar antes. Si se crea un hilo por cada request (solicitud), a medida que aumente el número de requests simultáneas, aumenta la posibilidad de quedarse sin memoria antes de que se agoten los sockets. Podemos evitar la necesidad de subprocesos (hilos), mediante el uso de E/S asincrónica.

Podemos pensar en 3 formas de resolver esto.

**1-** Un crawler con un event loop asincrónico con callbacks: es muy eficiente, pero extenderlo a problemas más complejos conduciría a un código espagueti inmanejable.

![](https://miro.medium.com/max/721/0*iiecmuTLPBqbxd5V.jpeg)

**2-** Usando generadores, que con ellos podemos implementar corrutinas, por lo tanto, mostramos que las corrutinas son tanto eficientes como extensibles y proveen un código más legible.

**3-** Usando las corrutinas que provee la librería estándar "asyncio" de Python, y las coordinamos usando una cola asíncrona.

### Entendiendo el problema

Un crawler busca y descarga todas las páginas de un sitio web, quizás para archivarlas o indexarlas. Comenzando con una URL raíz, busca cada página, la analiza (parsea) en busca de links a páginas no vistas y las agrega a una cola.

Podemos acelerar este proceso descargando muchas páginas al mismo tiempo. A medida que el crawler encuentra nuevos enlaces, inicia operaciones de búsqueda simultáneas para las nuevas páginas en sockets separados. Analiza las respuestas a medida que llegan y agrega nuevos links a la cola. Puede llegar a algún punto en el que el rendimiento decaiga un poco si hay demaciadas solicitudes concurrentes, por lo que limitamos el número de solicitudes simultáneas y dejamos los links restantes en la cola hasta que se completen las solicitudes en curso.

## El enfoque tradicional

¿Cómo hacemos que el crawler sea concurrente? Tradicionalmente, crearíamos un grupo hilos. Cada uno se encargaría de descargar una página a la vez a través de un socket. Por ejemplo, para descargar una página de bla.com:

```python
def fetch(url):
    sock = socket.socket()
    sock.connect(('bla.com', 80))
    request = 'GET {} HTTP/1.0\r\nHost: bla.com\r\n\r\n'.format(url)
    sock.send(request.encode('ascii'))
    response = b''
    chunk = sock.recv(4096)
    while chunk:
        response += chunk
        chunk = sock.recv(4096)

    # Pagina descargada satisfactoriamente
    links = parse_links(response)
    q.add(links)
```

>Nota: no se esta usando la libreria request de python para que la manipulación de sockets, el connect y el recv sean explicitas y hablar de estas cosas que vimos en algún pasado lejano programando en C y leyendo la guia Beej :P

Por defecto, las operaciones con sockets son bloqueantes, cuando el hilo llama a un método como connect o recv, se detiene hasta que la operación se completa. En consecuencia, para descargar muchas páginas a la vez, necesitamos muchos hilos. Una aplicación sofisticada amortiza el costo de la creación de hilos al mantener los inactivos en un grupo o pool y luego revisarlos para reutilizarlos para tareas posteriores; se suele hacer lo mismo con los sockets en un grupo de conexiones.

Sin embargo, los hilos son costosos y los sistemas operativos imponen una variedad de límites estrictos en la cantidad que se puede tener. Un hilo de Python ocupa alrededor de 50k de memoria y el inicio de decenas de miles de hilos puede provocar fallas. Si escalamos hasta decenas de miles de operaciones simultáneas en sockets concurrentes, nos quedamos sin hilos antes de quedarnos sin sockets. La sobrecarga por hilos o los límites del sistema en subprocesos son el cuello de botella.

Dan Kegel en su artículo [The C10K problem](http://www.kegel.com/c10k.html), describe las limitaciones de utilizar multiples hilos para resolver problemas deconcurrencia de E/S.

Kegel utilizo el término "C10K" en 1999. Diez mil conexiones no suenan ahora como lo sanaban antes, pero el problema ha cambiado sólo en tamaño, no en especie. En aquel entonces, usar un hilo por conexión para C10K no era práctico. Ahora el límite es en órdenes de magnitud más elevado. De hecho, nuestro crawler de juguete funcionaría bien con hilos. Sin embargo, para aplicaciones a gran escala, con cientos de miles de conexiones, el límite permanece; hay un límite más allá del cual la mayoría de los sistemas aún pueden crear sockets, pero se han quedado sin hilos. ¿Cómo podemos superar esto?

## Async

Los frameworks de E/S asincrónicos realizan operaciones simultáneas en un solo hilo utilizando sockets no bloqueantes. En nuestro crawler asíncrono, configuramos el socket no bloqueante antes de comenzar a conectarnos al servidor:

```python
sock = socket.socket()
sock.setblocking(False)
try:
    sock.connect(('bla.com', 80))
except BlockingIOError:
    pass
```

Un socket no bloqueante genera una excepción al realizar el _connect_, incluso cuando funciona normalmente. Esta excepción replica el comportamiento irritante de la función C subyacente, que establece _errno_ en _EINPROGRESS_ para indicarle que ha comenzado.

Ahora nuestro crawler necesita una forma de saber cuándo se establece la conexión, para poder enviar la solicitud HTTP. Simplemente podríamos seguir intentándolo en un loop. Este método no puede esperar eventos de manera eficiente en múltiples sockets. En la antigüedad, la solución de BSD Unix a este problema era select, una función de C que espera a que ocurra un evento en un socket sin bloqueo o en un pequeño vector de ellos. Hoy en día, la demanda de aplicaciones con un gran número de conexiones ha llevado a reemplazos como poll, luego kqueue en BSD y epoll en Linux. Estas API son similares a las de select, pero funcionan bien con un gran número de conexiones.

```python
from selectors import DefaultSelector, EVENT_WRITE

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

selector.register(sock.fileno(), EVENT_WRITE, connected)
```

Procesamos las notificaciones de E/S a medida que el selector las recibe, en un loop:

```python
def loop():
    while True:
        events = selector.select()
        for event_key, event_mask in events:
            callback = event_key.data
            callback()
```

Aquí hemos logrado tener "concurrencia", pero no "paralelismo". Es decir, construimos un pequeño sistema que superpone E/S. Es capaz de iniciar nuevas operaciones mientras otras están "en vuelo". No utiliza varios núcleos para ejecutar cálculos en paralelo. Este sistema está diseñado para problemas I/O-bound, no con CPU-bound.

## Con callbacks

Obtener una página requerirá una serie de callbacks. Se activa cuando se conecta un socket y se envía una solicitud GET al servidor. Pero luego debe esperar una respuesta, por lo que registra otro callback. Si, cuando se activa esa callback, todavía no puede leer la respuesta completa, se registra de nuevo, y así sucesivamente.

Recopilamos estas callbacks en un objeto Fetcher. Necesita una URL, un socket y un lugar para acumular los bytes de respuesta:

```python
class Fetcher:
    def __init__(self, url):
        self.response = b''  # Empty array of bytes.
        self.url = url
        self.sock = None

    def fetch(self):
        self.sock = socket.socket()
        self.sock.setblocking(False)
        try:
            self.sock.connect(('bla.com', 80))
        except BlockingIOError:
            pass

        #Se registra el proximo callback.
        selector.register(self.sock.fileno(),EVENT_WRITE,self.connected)
```

El método de búsqueda comienza conectando un socket. Pero el método regresa antes de que se establezca la conexión. Debe devolver el control al event loop para esperar la conexión. Para entender por qué, imagine que toda nuestra aplicación está estructurada de esta manera:

```python
# fetching http://bla.com/333/
fetcher = Fetcher('/333/')
fetcher.fetch()

while True:
    events = selector.select()
    for event_key, event_mask in events:
        callback = event_key.data
        callback(event_key, event_mask)
```

Todas las notificaciones de eventos se procesan en el event loop cuando llama a select. Por lo tanto, la fetch debe controlar el event loop para que el programa sepa cuándo se ha conectado el socket. Solo entonces el bucle ejecuta el callback connected, que se registró al final de la fetch anterior.

Aquí está la implementación de connected:

```python
# Metodo de la clase Fetcher
    def connected(self, key, mask):
        print('connected!')
        selector.unregister(key.fd)
        request = 'GET {} HTTP/1.0\r\nHost: xkcd.com\r\n\r\n'.format(self.url)
        self.sock.send(request.encode('ascii'))

        selector.register(key.fd,EVENT_READ,  self.read_response)
```
El siguiente callback read_response, procesa la respuesta del server:

```python
# Metodo de la clase Fetcher
    def read_response(self, key, mask):
        global stopped

        chunk = self.sock.recv(4096)  # 4k chunk size.
        if chunk:
            self.response += chunk
        else:
            selector.unregister(key.fd)  # Done reading.
            links = self.parse_links()

            for link in links.difference(seen_urls):
                urls_todo.add(link)
                Fetcher(link).fetch()  # <- New Fetcher.

            seen_urls.update(links)
            urls_todo.remove(self.url)
            if not urls_todo:
                stopped = True
```

Tenga en cuenta una buena característica de la programación asíncrona callbacks, no necesitamos mutex alrededor de los cambios en los datos compartidos. No hay multitarea apropiativa, por lo que no podemos ser interrumpidos en puntos arbitrarios de nuestro código. Agregamos una variable detenida global y la usamos para controlar el ciclo.

Entonces, incluso aparte del largo debate sobre las eficiencias relativas de multiprocesos/miltihilos y asíncronismo, existe otro debate sobre cuál es el más propenso a errores: los subprocesos son susceptibles a las condiciones de carrera si comete un error al sincronizarlos, pero las callbacks son más dificiles de debuguear debido al stack que suelen mostrarnos.

## Con corrutinas basadas en generadores

Es posible escribir código asincrónico que combine la eficiencia de los callbacks con el buen aspecto clásico de la programación multiproceso/hilo.

```python
def fetch(self, url):
        response = yield from self.session.get(url)
        body = yield from response.read()
```

Ahora, fetch es una función generadora, en lugar de una normal. Creamos un future pendiente, luego lo cedemos para pausar la búsqueda hasta que el socket esté listo. La función interna on_connected resuelve el future.

Pero cuando el future se resuelva, ¿qué reanuda el generador? Necesitamos un controlador de rutina. Llamémoslo "tarea":

```python
class Task:
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

loop()
```

Task inicia el generador "fetch" enviando None. Luego, fetch se ejecuta hasta que produce (yield) un future, que la tarea captura como siguiente future. Cuando el socket está conectado, el event loop ejecuta el callback on_connected, que resuelve el future, que llama a step, que reanuda fetch.

## Con corrutinas

Modificando el codigo de las corrutinas basadas en generadores usando async/await, y utilizando algo como:

```python
loop = asyncio.get_event_loop()

crawler = crawling.Crawler('http://bla.com',max_redirect=10)

loop.run_until_complete(crawler.crawl())
```

Quedaria implementada la solución con corrutinas "nativas" de Python.

## Links interesantes

[Corrutinas en Python](https://docs.python.org/3.8/library/asyncio-task.html)

[Framework de Python que levanta un server asincronico con corrutinas planificandolas con un event loop](https://www.tornadoweb.org/en/stable/)

[Corrutinas en Go](http://www.golangpatterns.info/concurrency/coroutines)

[Para jugar con Goroutines](https://tour.golang.org/concurrency/1)

[Corrutinas en Kotlin](https://kotlinlang.org/docs/reference/coroutines/basics.html)

[Comparación de técnicas programación asincrónica (threading, callbacks, Promises, corrutinas)](https://kotlinlang.org/docs/tutorials/coroutines/async-programming.html). Claramente enfocado para resaltar las ventajas de las corrutinas en Kotlin, pero de todos modos interesante para repasar las técnicas que vimos hasta ahora.
