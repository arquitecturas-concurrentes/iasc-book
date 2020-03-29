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

>Un momento... esto se parece a un thread

### Coroutines VS Thread

Son similares a los hilos. Sin embargo, las **corrutinas** son **“multitarea cooperativa”** y los **hilos** suelen ser **“multitarea apropiativa”**. Esto significa que **las corrutinas proveen concurrencia pero no paralelismo.**

La ventaja que tienen sobre los hilos es que su funcionamiento **no involucra llamadas al sistema bloqueantes**, ni primitivas de sincronización como semáforos.

### Links interesantes

[Corrutinas en **Python**] (https://docs.python.org/3.8/library/asyncio-task.html)

[Framework de **Python**] que levanta un server asincronico con **corrutinas** planificandolas con un **event loop** (https://www.tornadoweb.org/en/stable/)

[Corrutinas en **Go**] (http://www.golangpatterns.info/concurrency/coroutines)

[Para jugar con **Goroutines**] (https://tour.golang.org/concurrency/1)

>Esto no es nada nuevo, C++, Smalltalk, Erlang y muchos más lo tienen desde hace mucho (hasta PHP!)
