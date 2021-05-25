<template>
  <RemoteMarkdown :url="url" />
</template>
<script>
import RemoteMarkdown from '@/components/RemoteMarkdown'

export default {
    name: 'EfectoLadoHaskell',
    components: {
      RemoteMarkdown
    },
     data () {
    return {
      url: 'https://raw.githubusercontent.com/arquitecturas-concurrentes/iasc-stm-haskell-2019/master/00_side_effects/README.md'
      }
    }
}
</script>