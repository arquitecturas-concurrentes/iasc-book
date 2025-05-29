<template>
  <div class="footer">
    <div class="container-fluid">
      <div class="row">
        <div class="year footer-col-rt col-md-6 col-lg-6 col-sm-6">
          © {{ new Date().getFullYear() }}- IASC
        </div>
        <div class="fork-me footer-col-lf col-md-6 col-lg-6 col-sm-6 right-flex">
          <a href="https://github.com/arquitecturas-concurrentes/iasc-book">
            Fork me at github
            <img :src="github_logo" class="github-icon" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import github_logo from '../assets/images/github_logo.png'
</script>
<style scoped>
@media only screen and (max-width: 767px) {
  .footer {
    font-size: 0.8rem !important;
  }
  .year {
    width: 30%;
  }
  .fork-me {
    width: 70%;
  }
}

.footer {
  height: 2em;
  bottom: 0;
  color: #aaa;
  background-color: #333333;
  font-size: 0.9rem;
}

.github-icon {
  height: 15px;
  display: inline-block;
  margin-top: -5px;
}
</style>
