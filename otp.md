---
layout: default
title: "Capitulo 7 - Actores"
description: "OTP Elxir"
---

## Modulos de OTP

Existen algunos módulos que fuimos viendo, en mayor o menor medida, o que merecen ser mencionados son:

- GenServer
- Application
- Registry
- Agent
- Supervisor
- Genserver ([Genserver Hexdocs](https://hexdocs.pm/elixir/GenServer.html))

Para una descripcion un poco mas amena de lo que es un Genserver y de lo que hace, junto con ejemplos bastante claros, se puede ver en [hexdocs un poco mas de las especificaciones y temas puntuales de genserver](https://elixir-lang.org/getting-started/mix-otp/genserver.html)

Un servidor OTP es un módulo que nos permite modelar un servidor o un cliente en una comunicación de cliente-servidor, y nos va a poder ayudar a que nuestro proceso pueda recibir tanto llamadas sincronicas como asincrónicas por medio de la convención de OTP.
En su nivel más básico, un GenServer es un proceso único que ejecuta un bucle que maneja un mensaje por iteración y que siempre devuelve un estado que es el en el que queda el proceso, y también ayuda a modelar, mediante una convención, las distintas respuestas al cliente. También tiene las funciones que nos permiten hacer las llamadas a un servidor Genserver, las llamadas son:

- Call: Para realizar llamadas sincrónicas a otro proceso Genserver, que requieren una respuesta del servidor, por medio de un handle_call ([Hexdocs](https://hexdocs.pm/elixir/GenServer.html#call/3))
- Cast: Para realizar llamadas asincronicas a otro proceso Genserver, que no necesariamente require una respuesta del servidor, por medio de un handle_cast ([Hexdocs](https://hexdocs.pm/elixir/GenServer.html#cast/2))

Tenemos tipos de mensajes, tanto asincrónicos como sincronicos, los tipos de mensajes que podemos utilizar son para manejar las llamadas:

- Handle_call: Si bien todos los procesos de Elixir el envio de mensajes son asincrónicos, podemos siempre modelar una llamada asincrónica como sincrónica, mediante una espera activa, esperando una respuesta, handle_call nos permite que un proceso Genserver pueda exponer un callback que requiere una respuesta del cliente, por lo que una vez que se procesa este callback, se debe retornar una respuesta o un :reply que está conformado por la tupla {:reply, response, state}. Podemos ver todas la opciones de lo que puede retornar un handle_call ([Hexdocs](https://hexdocs.pm/elixir/GenServer.html#c:handle_call/3))
- Handle_cast: Permite manejar mensajes asincronicos mediate llamadas cast, y que pueden devolver un resultado o no necesariamente. ([Hexdocs](https://hexdocs.pm/elixir/GenServer.html#c:handle_cast/2))
- Handle_info: Permite manejar cualquier otro tipo de mensajes ([Hexdocs](https://hexdocs.pm/elixir/GenServer.html#c:handle_info/2)))

## Application ([Hexdocs](https://hexdocs.pm/elixir/Application.html))

Este modulo permite modelar procesos que sirvan como un punto de entrada a nuestra aplicacion, sea para inicializar una aplicacion Erlang o de OTP, se puede ver un poco mas de detalle de este modulo en [hexdocs](https://elixir-lang.org/getting-started/mix-otp/supervisor-and-application.html#understanding-applications)

Registry ([Hexdocs](https://hexdocs.pm/elixir/Registry.html))

Son un módulo de OTP que nos permite modelar procesos que nos permiten almacenar valores clave/valor de manera descentralizada. Suelen ser usados para algunas cosas como:

- Dispatching
- Registro de claves clave/valor
- Registro de claves pub/sub

Después hay una manera de tener un sotre pero a lo largo de la instancia llamado ETS ([Hexdocs](https://elixir-lang.org/getting-started/mix-otp/ets.html)) 

Si se quiere tener un proceso que guarde un estado que no sea necesariamente algo del estilo clave/valor, podemos optar por otro tipo de módulo llamado Agent

## Agent ([Hexdocs](https://hexdocs.pm/elixir/Agent.html))

El agent es un módulo que nos permite modelar un proceso que permita almacenar un estado, y en general se usa solo para este propósito, obviamente este almacenamiento, tanto los Agent como los Registry, es solo en memoria y no se persiste en disco. Pueden ver el link en el titulo para mayor información, algo interesante para ver es la sección de cómo supervisar un Agent ([https://hexdocs.pm/elixir/Agent.html#module-how-to-supervise](https://hexdocs.pm/elixir/Agent.html#module-how-to-supervise)).

## Supervisores ([Hexdocs](https://hexdocs.pm/elixir/Supervisor.html))

Un supervisor es un proceso que supervisa otros procesos, a los que nos referimos como procesos secundarios. Los supervisores se utilizan para construir una estructura de proceso jerárquica denominada árbol de supervisión. Los árboles de supervisión proporcionan tolerancia a fallos y resumen cómo se inician y se cierran nuestras aplicaciones. Por lo que podemos reiniciar una lista de procesos por medio de un supervisor en caso de que alguno de esos procesos se caiga, sea por un error o no.. 

Se tiene que tener varias cosas en cuentas sobre un esquema de supervisión...

La especificación de los hijos o procesos que serán especificados

[Documentacion de la especificacion](https://hexdocs.pm/elixir/Supervisor.html#module-child-specification)

Dos de los argumentos de las especificaciones del child spec son:

el valor de [shutdown](https://hexdocs.pm/elixir/Supervisor.html#module-shutdown-values-shutdown), que es la estrategia de cómo se debería cerrar o matar el proceso, cuando falla o se cae.

Y más importante es la del [valor de reinicio de un proceso supervisado](https://hexdocs.pm/elixir/Supervisor.html#module-restart-values-restart)


### Como se define un Supervisor?

Mediante un modulo generalmente ([Hexdocs](https://hexdocs.pm/elixir/Supervisor.html#module-restart-values-restart))

Ahora el supervisor recibe además de un child_spec una [estrategia de supervisión](https://hexdocs.pm/elixir/Supervisor.html#module-start_link-2-init-2-and-strategies), que será la acción que tomará un supervisor cuando se caen los procesos supervisados.

En el child spec siempre vamos no solo a poder supervisar procesos que son hojas, o sea procesos que van a tener lógica de un sistema, o de nuestra aplicación, o pueden ser otros nodos que pueden ser no terminales, o sea, supervisores, por lo que podemos armar un árbol de supervisión de esta manera. 

Hay otras estrategias deprecadas, tales como las :simple_one_for_one, que hoy fueron reemplazadas por otro tipo de supervisores, esto es porque los Supervisor son para modelar procesos que son supervisores estáticos, o sea que una vez inicializado no se pueden agregar procesos supervisados, por lo que al ser estático, si se quieren hacer cambios, se debe cambiar el childspec, levantar de nuevo la aplicación y volver a inicializar el supervisor.

El otro tipo de supervisores que hoy existe en Elixir y que nos permite inicializar dinámicamente procesos supervisados son los Supervisores dinámicos 

Esta es la documentación de los hexdocs con algunos puntos bien puntuales sobre los detalles de los [supervisores dinamicos](https://hexdocs.pm/elixir/DynamicSupervisor.html#content)
Esta es la documentación un poco más [descriptiva de los supervisores dinamicos](https://elixir-lang.org/getting-started/mix-otp/dynamic-supervisor.html)

Recuerden bien que un supervisor no restaura ni guarda el estado del actor supervisado, una vez que muere, si este es reiniciado, vuelve a ser inicializado con el estado inicial, y si tenía un estado distinto antes de su muerte, este se pierde definitivamente, por lo que a veces es bueno tal vez o bien persistirlo o si es algo importante tenerlo en otro actor como puede ser un Agent.

Otros recursos, tal vez un poco desactualizados: 

[Manejo de Errores e Introducción a la supervisión](https://docs.google.com/document/d/1r_E6Hj4F-38dy5tDbxfTBW2XaU8sSRaf9qtC-VuLDIw/edit#heading=h.40vnggga84mq)