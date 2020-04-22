# Material formal de Arquitecturas Concurrentes

Circle CI status => [![CircleCI](https://circleci.com/gh/arquitecturas-concurrentes/iasc-book/tree/source.svg?style=svg)](https://circleci.com/gh/arquitecturas-concurrentes/iasc-book/tree/source)

Este repositorio contiene el codigo y material formal de la materia de Arquitecturas Concurentes.

La idea de este repositorio es la de proveer un lugar donde se describan los conceptos y otro material adicional de la materia y que el mismo se pueda ir actualizando y mejorando iterativamente.

## Branches

Este repo tiene un par de branches importantes para tener en cuenta al momento de editar o cambiar algo.

- Master: No tocar! lo usa el CI para publicar los cambios
- Source: Este es el branch default donde va a estar el codigo fuente de la pagina

## Workflow

Como tenemos algunos componentes extra que no los trae ni jekyll ni los tiene GithubPages, hay que buildear estos addons custom desde la linea de comandos primero. Para eso se tiene un CI (Circle CI) que permite hacer un build y un par de validaciones y luego publicarlo en el branch master.

Por lo que hay que siempre hacer los cambios sobre source, y una vez que se pusheen los cambios a este repo, el CI hara la ejecucion y la publicacion de la pagina, lista para que sea servida por Github Pages en el branch master

## Got typo?

Si alguno detecta algun problema o error puede levantar un nuevo issue y veremos de arreglar el mismo lo antes posible.


