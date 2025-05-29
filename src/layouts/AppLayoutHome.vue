<template>
  <div>
    <Navbar />
    <MainImage />
    <div class="container">
      <div class="inner-content col-sm-10 col-md-12">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import MainImage from '@/components/MainImage.vue'
import Navbar from '@/components/Navbar.vue'

export default {
  name: 'AppLayoutHome',
  components: {
    MainImage,
    Navbar,
  },
}
</script>
<style scoped></style>
