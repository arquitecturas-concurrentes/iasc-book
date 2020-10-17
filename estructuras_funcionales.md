---
layout: default
title: "Estructuras Funcionales y Mónadas"
description: ""
---

# Introducción

## ¿Paradigma Funcional? ¿Qué es eso?

Es irónico que aunque el paradigma funcional es muy anterior al paradigma de objetos, lo que le ha dado la posibilidad de construir sólidas bases, es difícil dar una definición del mismo. Por ejemplo, la definición más obvia reza que
funcional es un paradigma en el que las soluciones a los problemas se estructuran en términos de aplicación de funciones
y, si bien es correcta, hay tantos elementos fundamentales que se desprenden de ésta y que no son evidentes que resulta de poca utilidad.

Quizás sea más útil pensarlo a partir de las características más frecuentemente evocadas cuando se piensa en éste:

- Pureza: las funciones, al igual que en matemática, no presentan efectos colaterales, sino que tan sólo reciben, operan y devuelven valores
- Evaluación diferida: ciertas partes del código no se evaluarán salvo que sea necesario
- Funciones de primer orden: las funciones son valores, y por tanto pueden ser pasadas por parámetro
- Pattern matching: los valores pueden ser descompuestos estructuralmente, en un proceso inverso a la construcción: la deconstrucción. Y además podemos usar a esta herramienta como mecanismo de control de flujo: según encaje un valor con un patrón u otro, podremos tomar acciones diferentes.
- Expresiones lambda: Es posible escribir valores de función de forma literal, sin asignarle un nombre.
- Inmutabilidad: las variables son meras etiquetas, que una vez unificadas contra un valor, no pueden ser cambiadas.

Sin embargo, ¿son las anteriores ideas propias del paradigma funcional? Miremos más en detalle:

- No todos los lenguajes funcionales son realmente puros. LISP y sus derivados, por ejemplo, no lo son normalmente: permiten hacer input-ouput (IO) imperativo, modificar variables, etc.
- No todos los lenguajes funcionales presentan evaluación diferida. Para ser justos, ni siquiera Haskell: éste ofrece evaluación no-estricta, lo cual es ligeramente diferente.

Por un lado muchos lenguajes (funcionales o no) presentan algún tipo de operación de deconstrucción: Ruby, ECMAScript6, Clojure, etc, que es la base para implementar pattern-matching. Y por otro lado, la idea de Pattern matching no figura en Cálculo Lambda, la base teórica de funcional.

Virtualmente todos los lenguajes modernos presentan lambdas, closures o bloques de código, que permiten cosificar una porción de código.

Si nada de lo que parece tan propio de funcional es realmente exclusivo del mismo, entonces, volvemos a la pregunta: ¿qué es eso? Simple: es la forma particular en que combinamos estas herramientas, razonando declarativamente en términos de valores y transformaciones sobre los mismos.
Nuevamente, el todo es más que la suma de las partes.

Durante las próximas clases vamos a estar viendo por qué el paradigma funcional puede ser una herramienta muy útil a la hora de trabajar con concurrencia y paralelismo. En particular, vamos a estar trabajando con Haskell, uno de los exponentes más notables de este paradigma. Pero antes, vamos a necesitar aprender (o repasar) algunos conceptos que nos van a ser de utilidad más adelante.

## Sobre pureza en funcional

Haskell es un lenguaje puro; toda operación es similar a una función matemática, donde el resultado de dicha función depende únicamente de sus argumentos. Tanto es así, que hasta los efectos están modelados como valores de tipo IO, que representa un efecto, el cual puede ser operado como cualquier otro valor: podemos pasar efectos por parámetros, colocarlos en listas, ordenarlos, etc.
De hecho, un programa ejecutable es una función que devuelve un valor de tipo IO. El runtime de Haskell ejecuta el efecto representado por este valor, produciendo así los efectos en el mundo real deseados.
Moraleja: un programa Haskell no tiene efectos, pero es capaz de devolver un valor que los representa, pudiendo así hacer todo lo que un programa imperativo podría hacer, y más.

## Simplicidad

La sintaxis e ideas fundamentales de Haskell son realmente simples, y el resto de las ideas más complejas se construyen normalmente sobre las más simples.

**TODO: Completar o eliminar sección.**

## Tipos en Haskell

A diferencia de otros lenguajes, como Ruby o Smalltalk, Haskell tiene un sistema de tipos estático. Esto significa que el tipo de cada expresión es conocido en tiempo de compilación.
 
Ilustrémoslo con un ejemplo: si tenemos una función que suma dos números, y le pasamos un string que se sume a un int, en un lenguaje dinámico solo fallaría en tiempo de ejecución, mientras que en un lenguaje con un sistema de tipos estático, no compilaría. Esto permite que puedan capturarse errores en tiempo de compilación en vez de que tengan que aparecer en ejecución.

En Haskell todo tiene un tipo, y a diferencia de otros lenguajes similares como Java, Haskell tiene además inferencia de tipos. Si escribimos un número, no tenemos que decirle a Haskell que es un número, sino que puede inferirlo solo. El tipo de un valor se puede conocer por medio del comando `:t`:

```haskell
Prelude> :t 'a'
'a' :: Char
Prelude> :t True
True :: Bool
```

Como vemos en el GhCI, cuando ejecutamos el comando `:t` junto con un valor, nos dice de qué tipo es. `x :: T` puede leerse como "x es del tipo T".

Con expresiones más complejas podemos ver algo como lo siguiente:

```haskell
Prelude> :t 4 + 3
4 + 3 :: Num a => a
```

Simple, todas las expresiones generan un valor con un tipo asociado.

Las funciones son otra cosa que también necesita una declaración de tipos, y es una buena práctica que ayuda al sistema de inferencia de tipos, y es recomendado a menos que se necesite crear funciones muy chicas. Empecemos con un ejemplo bien simple:

```haskell
Prelude> let succ a = a + 1
Prelude> :t succ
succ :: Num a => a -> a 
```
Esto se vería así en un código que no sea ghci

```haskell
succ :: Int -> Int
succ a = a + 1
```

Veamos un poco más en detalle otro prototipo de función, por ej. `head` y `tail`

```haskell
Prelude> :t head
head :: [a] -> a

Prelude> :t tail
tail :: [a] -> [a]
```

Este ejemplo es bien conocido por tomar el primer elemento de una lista, head. Pero veamos la declaración de tipos, head toma un parámetro, que es del tipo lista de a. Pero a no es un tipo... ¿qué es entonces? En este caso es un tipo genérico. Puede ser un `Int`, `String`, etc., pero el tipo va a ser consistente; es decir, si tenemos una función que va de `[a] -> a`, entonces si a es un `Int`, la función va a tomar una lista de `Int`, y devolver un `Int`. Esto es porque la función es polimórfica y puede tomar cualquier lista de un tipo, y devolver el primer elemento, sin importar de qué tipo es la lista.

Nuestra función `succ`, en cambio, solo toma un `Int` y devuelve otro `Int`. Si le pasamos algo de tipo `String`, fallaría en tiempo de compilación.

En el ejemplo de `head`, en la declaración de tipos, a es llamado type variable.

Tomemos otro ejemplo, `fst`

```haskell
Prelude> :t fst
fst :: (a, b) -> a
```

En este caso se puede ver cómo la función toma una tupla y devuelve el primer elemento, y tenemos dos type variables, a y b, que si bien son diferentes, no significa que sean de tipos distintos. También podemos ver que el primer elemento y lo que devuelve la función son del mismo tipo, tal como ocurre con `head`.

## Typeclases

Una Typeclass es como una especie de interfaz que define un comportamiento. Si un tipo es parte de una typeclass, el tipo soporta e implementa el comportamiento que describe dicha typeclass. Haciendo una comparación con el paradigma de objetos, podríamos decir que las typeclases son como las interfaces de Java, pero implementando el comportamiento, no solo definiendo su contrato.

Veamos la operación suma de `succ`
```haskell
Prelude> :t (+)
(+) :: Num a => a -> a -> a
```

Antes que nada vemos que ahora está el símbolo `=>`. La lectura hacia la derecha es como las funciones que vimos hasta ahora: la función toma dos elementos de tipo a y devuelve otro de tipo a. A la izquierda del `=>` se indica que el tipo de los dos valores y el retorno deben ser miembros de la clase `Num`. Esto último se conoce como **class constraint**.

Veamos otro ejemplo
```haskell
Prelude> :t (<=)
(<=) :: Ord a => a -> a -> Bool
```

`Ord` es otra typeclass, que define la interfaz para ordenamiento (<, >, <= y >=, entre otras), por lo que cualquier tipo que requiera ordenamiento de dos o más elementos, debe ser un miembro de `Ord`.

Volviendo a la suma, vimos que `Num` es un typeclass numérico, y permite que un tipo actúe como número, por ej:
```haskell
Prelude> :t 42
42 :: Num a => a
```

Por lo que los números pueden actuar como constantes polimórficas, por lo que podemos definir un 42 numérico, flotante o doble, pero hay operaciones que si bien son parte del typeclass, su contrato debe ser cumplido, por ej. si sumamos un doble con un interfaces

```haskell
Prelude> (42 :: Integer) + (2 :: Double)

<interactive>:25:20:
    Couldn't match expected type ‘Integer’ with actual type ‘Double’
    In the second argument of ‘(+)’, namely ‘(2 :: Double)’
    In the expression: (42 :: Integer) + (2 :: Double)
    In an equation for ‘it’: it = (42 :: Integer) + (2 :: Double)
Prelude> (42 :: Integer) + (2 :: Integer)
44
```

## Dualidad en estructuras de tipos

Cada una de ellas presenta una dualidad, pudiendo ser pensada tanto como una estructura de datos, como una estructura de control. Dicho de otra forma, a las estructuras funcionales podemos verlas tanto como contenedores (cajas que almacenan valores) como computaciones (operaciones que al ejecutarlas producen valores).
