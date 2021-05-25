# Material formal de Arquitecturas Concurrentes

Este repositorio contiene el codigo y material formal de la materia de Arquitecturas Concurentes.

La idea de este repositorio es la de proveer un lugar donde se describan los conceptos y otro material adicional de la materia y que el mismo se pueda ir actualizando y mejorando iterativamente.

## Branches

Este repo tiene un par de branches importantes para tener en cuenta al momento de editar o cambiar algo.

- gh-pages: No tocar! lo usa el CI para publicar los cambios
- Source: Este es el branch default donde va a estar el codigo fuente de la pagina


## Workflow

Actualmente usamos vue.js, por lo que se necesita el CI de github para buildear los assets y los componentes de vue.js para que directamente puedan funcionar con github pages.

Por lo que hay que siempre hacer los cambios sobre source, y una vez que se pusheen los cambios a este repo, el CI hara la ejecucion y la publicacion de la pagina, lista para que sea servida por Github Pages en el branch master

## Got typo?

Si alguno detecta algun problema o error puede levantar un nuevo issue y veremos de arreglar el mismo lo antes posible.

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).






