<template>
  <div v-if="adocHtml" ref="adocContainer" class="adoc-container" v-html="adocHtml"></div>
</template>
<script setup>
import axios from 'axios'
import Asciidoctor from 'asciidoctor'
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { clearMathJax, typesetMathJax } from '@/composables/useMathJax'

const adocHtml = ref('<p>Loading...</p>')
const adocContainer = ref(null)

let renderize_adoc = (src) => {
  const asciidoctor = Asciidoctor()

  // Register custom extension to add biblioref class
  // Register a postprocessor to add 'biblioref' class to xrefs (like <<pp>>)
  asciidoctor.Extensions.register(function () {
    this.postprocessor(function () {
      this.process(function (doc, output) {
        // Add class to anchor links matching bibliography references
        return output.replace(/<a href="#(.*?)">(\[(.*?)\])<\/a>/g, (match, id, text, inner) => {
          return `<a href="#${id}" class="biblioref">${text}</a>`
        })
      })
    })
  })

  const html = asciidoctor.convert(src, {
    safe: 'safe',
    catalog_assets: true,
    doctype: 'article',
    attributes: {
      icons: 'font',
      'hide-uri-scheme': true,
      sectids: true,
      sectanchors: true,
    },
  })
  return html
}

const props = defineProps({
  url: String,
})

onBeforeUnmount(() => {
  if (adocContainer.value) clearMathJax(adocContainer.value)
})

watch(
  adocHtml,
  async () => {
    const container = adocContainer.value
    if (!container) return

    clearMathJax(container)
    await nextTick()

    try {
      await typesetMathJax(container)
    } catch (error) {
      console.error('Error rendering AsciiDoc math:', error)
    }
  },
)

onMounted(() => {
  axios.get(props.url).then((result) => {
    adocHtml.value = renderize_adoc(result.data)
  })
})
</script>
