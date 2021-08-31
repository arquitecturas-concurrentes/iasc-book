<template>
  <div>
    <p v-html="parsed_md"></p>
  </div>
</template>
<script>
import axios from "axios";
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor'
const uslug = require('uslug')

const uslugify = s => uslug(s)

let renderize_md = (input) => {
  const md = MarkdownIt().use(MarkdownItAnchor, {
            level: 1,
            // slugify: string => string,
            permalink: true,
            // renderPermalink: (slug, opts, state, permalink) => {},
            permalinkClass: 'header-anchor',
            permalinkSymbol: '¶',
            permalinkBefore: false,
            slugify: uslugify
  })
  return md.render(input)
}

export default {
  name: 'RemoteMarkdown',
  components: {
  },
  data() {
    return {
      parsed_md: null
    }
  },
  props: {
    url: String,
  },
  mounted() {
    axios.get(this.url).then((result) => {
      this.parsed_md = renderize_md(result.data);
    })
  }
}
</script>