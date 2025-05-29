<template>
  <div v-if="adocHtml" class="adoc-container" v-html="adocHtml"></div>
</template>

<script setup>
import { ref, watch, onUpdated } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const adocHtml = ref('<p>Loading...</p>')
import { useScrollToHash } from '@/composables/useScrollToHash'

const { scrollToHash } = useScrollToHash()

const props = defineProps({
  adocName: String,
})

// Watch for changes in the meta param
watch(
  () => props.adocName,
  async (adocName) => {
    try {
      const htmlModule = await import(`@/adocs/${adocName}.adoc`)
      adocHtml.value = htmlModule.default
    } catch (error) {
      console.error('Error loading AsciiDoc:', error)
      adocHtml.value = '<p>Document not found.</p>'
    }
  },
  { immediate: true },
)

onUpdated(() => {
  scrollToHash(route.hash)
})
</script>
<style>
.highlight-ref {
  background-color: rgba(255, 255, 0, 0.4); /* Light yellow highlight */
  transition: background-color 0.5s ease;
}
</style>
