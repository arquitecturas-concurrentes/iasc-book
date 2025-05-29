<template>
  <div v-if="adocHtml" class="adoc-container" v-html="adocHtml"></div>
</template>
<script setup>
import axios from 'axios'
import Asciidoctor from 'asciidoctor'
import { ref, onMounted } from 'vue'

const adocHtml = ref('<p>Loading...</p>')

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

onMounted(() => {
  axios.get(props.url).then((result) => {
    adocHtml.value = renderize_adoc(result.data)
  })
})
</script>
