<template>
  <div class="wrap-banner">
    <div class="main-title titulo-heading">
      <h2>IASC BOOK</h2>
      <p class="subtitle">Pagina con el material de la materia de IASC</p>
    </div>
    <vue-particles
      color="#dedede"
      :particleOpacity="0.7"
      :particlesNumber="80"
      shapeType="circle"
      :particleSize="4"
      linesColor="#dedede"
      :linesWidth="1"
      :lineLinked="true"
      :lineOpacity="0.4"
      :linesDistance="150"
      :moveSpeed="3"
      :hoverEffect="true"
      hoverMode="grab"
      :clickEffect="true"
      clickMode="push"
      class="particle-js"
    >
    </vue-particles>
  </div>
</template>
<style scoped>
.wrap-banner {
  position: relative;
  -ms-flex-align: center;
  -webkit-box-align: center;
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  min-height: 300px;
}
.main-title {
  color: #fff;
  z-index: 999;
}
.main-title h2 {
  font-size: 5rem;
  font-family: Teko, sans-serif;
  text-shadow: 5px 5px #000;
  text-transform: uppercase;
  margin: 0;
}

.main-title p.subtitle {
  color: #fff;
  font-size: 1rem;
  font-family: Teko, sans-serif;
  text-shadow: 1px 1px #000;
  padding-left: 5px;
  margin: 0;
}
.titulo-heading {
  margin-bottom: 15px;
}

.particle-js {
  background-image: url(../assets/images/iasc-home.jpg);
  background-size: cover;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
