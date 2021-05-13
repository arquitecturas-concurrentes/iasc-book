<template>
<div id="app"
   :class="[{'collapsed' : collapsed}, {'onmobile' : isOnMobile}]">
    <div class="wrapper">
      <div class="container header">
          <div
            v-if="isOnMobile && !collapsed"
            class="sidebar-overlay"
            @click="collapsed = true"
          />
          <AppLayout>
            <slot />
          </AppLayout>
          <sidebar-menu         
            :menu="menu"
            :width="sidebarWidth"
            :collapsed="this.collapsed"
            @toggle-collapse="onToggleCollapse"
          >
            <span slot="toggle-icon" class="fa fa-bars"></span>
          </sidebar-menu>
      </div>
    </div>
    <Footer /> 
    </div>
</template>

<script>
import Footer from '@/components/Footer.vue'
import AppLayout from '@/layouts/AppLayout'
import { sidearContent } from '@/static/SidebarContent.js'
import { SidebarMenu } from 'vue-sidebar-menu'

export default {
  name: 'IASCBook',
  components: {
    AppLayout,
    Footer,
    SidebarMenu
  },
  data () {
    return {
      sidebarWidth: '300px',
      menu: sidearContent,
    collapsed: false,
    isOnMobile: false
    }
  },
  mounted () {
    this.onResize()
    window.addEventListener('resize', this.onResize)
  },
  methods: {
    onToggleCollapse (collapsed) {
      this.collapsed = collapsed
    },
    onResize () {
      if (window.innerWidth <= 767) {
        this.isOnMobile = true
        this.collapsed = true
      } else {
        this.isOnMobile = false
        this.collapsed = false
      }
    }
  }
}
</script>
<style>
.app {
  padding: 70px;
}
#app {
  padding-left: 300px;
  transition: 0.3s ease;
}
#app.collapsed {
  padding-left: 50px;
}
#app.onmobile {
  padding-left: 50px;
}

.container {
  max-width: 900px;
}

.sidebar-overlay {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: #000;
  opacity: 0.5;
  z-index: 900;
}
/* sidebar */
.bm-menu {
    background: #6B7A8F;
    color: #fff;
}

.bm-menu .components {
    padding: 20px 0;
    border-bottom: 1px solid #6B7A8F;
}

.bm-menu ul p {
    color: #fff;
    padding: 10px;
}

.bm-menu ul li a {
    padding: 10px;
    font-size: 1.1em;
    display: block;
}
.bm-menu ul li a:hover {
    color: #7187a7;
    background: #fff;
}

.bm-menu ul li.active > a, a[aria-expanded="true"] {
    color: #fff;
    background: #7187a7;
}
</style>
<style lang="scss" scoped>
.sidebar.v-sidebar-menu .vsm-arrow:after {
  content: '\f105';
  font-family: 'FontAwesome';
}

.sidebar.v-sidebar-menu .collapse-btn:after {
  content: '\f07e';
  font-family: 'FontAwesome';
}
</style>