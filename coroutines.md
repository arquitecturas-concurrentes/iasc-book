---
layout: default
title: "Corrutinas (coroutines)"
description: "Introduccion a las corrutinas"
---

# Introduccion

Una corrutina es una unidad de tratamiento semejante a una subrutina, con la diferencia de que, mientras que la salida de una subrutina pone fin a esta, la salida de una corrutina puede ser el resultado de una suspensión de su tratamiento hasta que se le indique retomar su ejecución. La suspensión de la corrutina y su reanudación pueden ir acompañadas de una transmisión de datos.

### Ejemplo

#### Sync Code
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
>python3.8 sync_code.py
1
2
3
1
2
3
1
2
3
Tiempo total: 9.01 segundos

Cada ciclo de IOs de cada tarea se ejecuta y termina una atras de la otra

#### Async Code
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
>python3.8 async_code.py
1
1
1
2
2
2
3
3
3
Tiempo total: 3.00 segundos

La diferencia en los tiempos es notable.


### Como funcionan?

Acá no hay intervención del SO, hay un solo proceso, un solo hilo, entonces, que es lo que esta pasando?... simplemente las corrutinas liberan la CPU cuando están en "tiempo de espera" (await), por lo tanto, otras pueden usar la CPU.

Podemos decir que es como una simultanea de ajedrez, en donde una persona juega contra dos o más. Hace un movimiento y no se queda esperando la respuesta del oponente en ese tablero, pasa al siguiente y realiza un movimiento ahí. De esa forma trata las partidas (tareas) de forma concurrente, lo que resulta en que se terminen en menos tiempo.

![](https://i.ytimg.com/vi/Hp6827K1pFE/hqdefault.jpg)

>Un momento... esto se parece a un thread

### Coroutines VS Thread

Son similares a los hilos. Sin embargo, las **corrutinas** son **“multitarea cooperativa”** y los **hilos** suelen ser **“multitarea apropiativa”**. Esto significa que **las corrutinas proveen concurrencia pero no paralelismo.**

La ventaja que tienen sobre los hilos es que su funcionamiento **no involucra llamadas al sistema bloqueantes**, ni primitivas de sincronización como semáforos.

### Cómo se declaran y como se ejecutan?
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

Las dos funciones lucen similares, la diferencia vamos a notar cuando las usamos.

>print_loco('bla')

>bla loco

Nada fuera de lo esperado.

>print_re_loco('algo')

><coroutine object print_re_loco at 0x7fe7aa5e8640>

Nos retorna un objeto "corrutina" que por defecto no va a ser planificar. Entonces cómo hago que se ejecute?, bueno, hay tres formas distintas para hacer eso.

**1-** Simplemente usando la función run del modulo asyncio
>prl = print_re_loco('algo')

>asyncio.run(prl)

>algo loco

**2-** Usando await en una corrutina
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

>Nota aca se usa run para ejecutar la corrutina "main" y await para ejecutar las "corrutinas say_after"

**3-** Con la función create_task() de asyncio que ejecuta corrutinas concurrentemente wrappeandolas en Tasks. Que por detrás maneja un **event loop** para planificarlas.
```python
import asyncio

async def main():
  task1 = asyncio.create_task(say_after(1, 'hello'))
  task2 = asyncio.create_task(say_after(2, 'world'))

  await task1
  await task2
```

>Nota create_task envia la corrutina al event loop, permitiendo que corra en segundo plano. Gather hace algo muy parecido pero podemos decir que es conveniente usarlo cuando nos interesa hacer algo con el resultado de las corrutinas.

### Links interesantes

[Corrutinas en Python](https://docs.python.org/3.8/library/asyncio-task.html)

[Framework de Python que levanta un server asincronico con corrutinas planificandolas con un event loop](https://www.tornadoweb.org/en/stable/)

[Corrutinas en Go](http://www.golangpatterns.info/concurrency/coroutines)

[Para jugar con Goroutines](https://tour.golang.org/concurrency/1)

>Esto no es nada nuevo, C++, Smalltalk, Erlang y muchos más lo tienen desde hace mucho (hasta PHP!)
