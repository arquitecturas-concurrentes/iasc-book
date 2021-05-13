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
    <div class="container">
        <div class="inner-content col-sm-8 col-md-10">
            <router-view />
        </div>
    </div>
  </div>
</div>
</template>
<script>
export default {
  name: 'Entry',
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
        console.log(hash)
        const el = document.querySelector(hash)
        el && window.scrollTo(0, el.offsetTop);
      }
    });				
  }
  },
  props: {
    title: String,
    description: String
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
