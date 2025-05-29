<template>
  <nav class="navbar navbar-expand-lg navbar-light">
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ml-auto">
        <li class="nav-item active">
          <router-link class="nav-link" to="/">Home</router-link>
        </li>
        <li class="nav-item">
          <a class="nav-link navbar-button" href="http://arquitecturas-concurrentes.github.io/"
            >IASC</a
          >
        </li>
      </ul>
    </div>
  </nav>
</template>
<style lang="css">
.navbar {
  padding: 15px 10px;
  background: #fff;
  border: none;
  border-radius: 0;
  margin-bottom: 2px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.navbar-btn {
  box-shadow: none;
  border: none;
}

.navbar-button,
.navbar-button:hover {
  background: #f7882f;
  color: #fff;
}
</style>
