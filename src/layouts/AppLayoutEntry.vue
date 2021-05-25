<template>
  <div class="scroll-touch">
    <Navbar/>
    <Entry :title="entry.title" :description="entry.description"/>
    <slot />
  </div>
</template>

<script>
import Entry from '@/components/Entry.vue'
import Navbar from '@/components/Navbar.vue'

export default {
  name: "AppLayoutEntry",
  components: {
    Entry,
    Navbar
  },
  data() {
    return {
      entry: {
        title: this.$route.meta.title,
        description: this.$route.meta.description
      }
    }
  }
}
</script>
<style scoped>
.scroll-touch {
  -webkit-overflow-scrolling: touch; /* Lets it scroll lazy */
}
</style>