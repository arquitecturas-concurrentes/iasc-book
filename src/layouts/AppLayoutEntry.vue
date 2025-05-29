<template>
  <div class="scroll-touch">
    <Navbar />
    <router-view />
    <slot />
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'

export default {
  name: 'AppLayoutEntry',
  components: {
    Navbar,
  },
}
</script>
<style scoped>
.scroll-touch {
  -webkit-overflow-scrolling: touch; /* Lets it scroll lazy */
}
</style>
