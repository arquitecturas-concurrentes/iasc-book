<template>
  <RemoteMarkdown :url="url" />
</template>
<script>
import RemoteMarkdown from '@/components/RemoteMarkdown'

export default {
    name: 'STM',
    components: {
      RemoteMarkdown
    },
     data () {
    return {
      url: 'https://raw.githubusercontent.com/arquitecturas-concurrentes/iasc-stm-haskell-2019/master/01_semaphores_and_philosophers/README.md'
      }
    }
}
</script>