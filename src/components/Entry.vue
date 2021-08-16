<template>
  <div class="wrapper">
    <div class="container header">
      <div class="titulo-heading">
        <div class="container-background">
            <div class="titulo">
                <h3 class="Title">
                    {{this.title}}
                </h3>
                <br>
                <h4>
                  {{this.description}}
                </h4>
            </div>
        </div>
      </div>
      <div v-if="this.need_detail">
        <NeedMoreDetail />
      </div>
      <div v-if="this.extra">
        <AdditionalContent />
      </div>
      <div class="container">
          <div class="inner-content col-sm-8 col-md-10">
              <router-view />
          </div>
      </div>
    </div>
  </div>
</template>
<script>
import NeedMoreDetail from '@/components/NeedMoreDetail.vue'
import AdditionalContent from '@/components/AdditionalContent.vue'

export default {
  name: 'Entry',
  components: {
    NeedMoreDetail,
    AdditionalContent
  },
  mounted() {
    this.scrollToAnchor();
  },
  updated () {
    this.scrollToAnchor();
  },
  methods: {
    scrollToAnchor () {
    this.$nextTick(() => {
      if(this.$route.hash) {
        const hash = this.$route.hash
        const el = document.querySelector(hash)
        el && window.scrollTo(0, el.offsetTop);
      }
    });				
  }
  },
  props: {
    title: String,
    description: String,
    need_detail: Boolean,
    extra: Boolean
  }
}
</script>
<style scoped>
.container-background {
    background-image: url('~@/assets/home-bg.jpg');
    min-height: 150px;
}

.titulo {
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 40px;
    font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #fafafa;
    text-shadow: 2px 2px 5px rgba(0,0,0,0.5);
}
</style>
<style>
.warning {
    background-color: #ff8;
    padding: 20px;
    border-radius: 6px;
}
</style>