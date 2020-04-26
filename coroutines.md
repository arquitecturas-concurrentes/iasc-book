---
layout: default
title: "Corrutinas (coroutines)"
description: "Introduccion a las corrutinas"
---

## Anteriormente... en Arquitecturas Concurrentes

Hasta ahora trabajamos sobre un modelo de concurrencia basado en un _event loop_. En este esquema, cada evento se procesa completamente antes de pasar a la ejecución del próximo, y todo esto ocurre en un único contexto de ejecución.

Una ventaja que esto implica es que cuando una función se está ejecutando, tenemos la seguridad de que no va a ser interrumpida por el planificador hasta que termine, lo cual evita los problemas de concurrencia tradicionales que habíamos visto al usar _threads_ y _locks_. Y esto lo logramos gracias a que el event loop le provee un _orden_ a la ejecución concurrente; la serializa.

Las corrutinas nos permiten lograr algo similar, sin utilizar (necesariamente) un event loop.

>Nota al margen: las corrutinas no son nada nuevo. C++, Smalltalk, Erlang y muchos más (¡hasta PHP!) las tienen desde hace mucho. Pero recientemente han conseguido cierta notoriedad en la industria por su uso en lenguajes como Go, Kotlin y Python.

## ¿Qué es una corrutina?

Una corrutina es similar a una subrutina tradicional (piensen en las funciones/procedimientos que vieron en Algoritmos), pero con la diferencia de que, mientras que la salida de una subrutina pone fin a su ejecución, una corrutina puede además **suspenderse** (`yield`, en inglés), cediendo el control a otra hasta que se le indique que debe **retomar** (`resume`) su ejecución.

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

Una ventaja más que las corrutinas tienen sobre los hilos es que su funcionamiento no involucra llamadas al sistema bloqueantes para su creación ni para el cambio de contexto, ya que todo se maneja al nivel de la aplicación.

## ¿Cómo se declaran y ejecutan en Python?
Veamos nuevamente un ejemplo con corrutinas  y otro sin:
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
>prl = print_re_loco('algo')

>asyncio.run(prl)

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

## Bonus!

### Corrutinas y Generadores

Si bien ambos pueden ceder múltiples veces, suspender su ejecución y permitir el reingreso en múltiples puntos de entrada, difieren en que las corrutinas tienen la capacidad para controlar dónde continúa la ejecución inmediatamente después de ceder, mientras que los generadores no pueden, estos transfieren el control de nuevo al generador que lo llamo. Es decir, dado que los generadores se utilizan principalmente para simplificar la escritura de iteradores, la declaración de rendimiento en un generador no especifica una rutina para saltar, sino que devuelve un valor a una rutina principal. [Explicación de yield y comparación con corrutinas](https://docs.python.org/3/reference/expressions.html#yieldexpr)

>Esta bien, pero entonces.. ¿qué es un generador?

![](https://i.pinimg.com/originals/1f/77/16/1f77165fb96f852cbda141164e18a04a.jpg)

Un **generador** es un tipo especial de subrutina, pensando en teoría de conjuntos, podemos decir que el conjunto generador es un subconjunto de corrutina, por eso a veces son llamados como "semicorutinas".

Un **iterador** es un objeto que permite al programador recorrer un contenedor (colección de elementos) por ejemplo una lista. Una manera de implementar iteradores es utilizar un **generador**, que puede producir valores para quien lo llama varias veces (en lugar de devolver sólo uno).

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

Sin embargo, todavía es posible implementar corutinas basadas en generadores, de hecho, hasta Python 2.5 las corrutinas estaban hechas de esta forma, con la ayuda de una rutina de despachador de nivel superior (un trampolín, esencialmente) que pasa el control explícitamente a los generadores secundarios.
```python
def coro():
  hello = yield "Soy una corrutina"
  yield hello

c = coro()
print(next(c))
print(c.send(", basada en generadores"))
```

## Links interesantes

[Corrutinas en Python](https://docs.python.org/3.8/library/asyncio-task.html)

[Framework de Python que levanta un server asincronico con corrutinas planificandolas con un event loop](https://www.tornadoweb.org/en/stable/)

[Corrutinas en Go](http://www.golangpatterns.info/concurrency/coroutines)

[Para jugar con Goroutines](https://tour.golang.org/concurrency/1)

[Corrutinas en Kotlin](https://kotlinlang.org/docs/reference/coroutines/basics.html)

[Comparación de técnicas programación asincrónica (threading, callbacks, Promises, corrutinas)](https://kotlinlang.org/docs/tutorials/coroutines/async-programming.html). Claramente enfocado para resaltar las ventajas de las corrutinas en Kotlin, pero de todos modos interesante para repasar las técnicas que vimos hasta ahora.
