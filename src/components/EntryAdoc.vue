<template>
  <div class="wrapper">
    <div class="container header">
      <div class="titulo-heading">
        <div class="container-background">
          <div class="titulo">
            <h3 class="Title">
              {{ props.title }}
            </h3>
            <br />
            <h4>
              {{ props.description }}
            </h4>
          </div>
        </div>
      </div>
      <div v-if="props.need_detail">
        <NeedMoreDetail />
      </div>
      <div v-if="props.extra">
        <AdditionalContent />
      </div>
      <div class="container">
        <div class="inner-content col-sm-8 col-md-10">
          <AdocPage :adocName="props.adocName" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import AdocPage from '@/components/AdocPage.vue'
import NeedMoreDetail from '@/components/NeedMoreDetail.vue'
import AdditionalContent from '@/components/AdditionalContent.vue'

const props = defineProps({
  adocName: String,
  title: String,
  description: String,
  extra: Boolean,
  need_detail: Boolean,
})
</script>
<style scoped>
.container-background {
  background-image: url('../assets/images/home-bg.jpg');
  min-height: 150px;
}

.titulo {
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 40px;
  font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #fafafa;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
}
</style>
<style>
.warning {
  background-color: #ff8;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  margin-top: 20px;
}
</style>
