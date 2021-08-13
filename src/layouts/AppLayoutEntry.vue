<template>
  <div class="scroll-touch">
    <Navbar/>
    <Entry :title="entry.title" :description="entry.description" :extra="entry.extra" :need_detail="entry.need_detail" />
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
        need_detail: this.$route.meta.need_detail,
        extra: this.$route.meta.extra,
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