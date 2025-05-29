<template>
  <div id="main" :class="{ collapsed, onmobile: isOnMobile }">
    <div class="wrapper">
      <div class="content">
        <div class="container header">
          <div v-if="isOnMobile && !collapsed" class="sidebar-overlay" @click="collapsed = true" />
          <AppLayout>
            <slot />
          </AppLayout>
          <sidebar-menu
            :menu="menu"
            :width="sidebarWidth"
            :collapsed="collapsed"
            @update:collapsed="onToggleCollapse"
            @item-click="collapseMenu"
          >
            <template v-slot:toggle-icon>
              <span class="fa fa-bars"></span>
            </template>
          </sidebar-menu>
        </div>
      </div>
    </div>
    <FooterComponent />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import FooterComponent from '@/components/FooterComponent.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { sidearContent } from '@/static/SidebarContent.js'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'
import { SidebarMenu } from 'vue-sidebar-menu'

// Sidebar state
const sidebarWidth = ref('300px')
const menu = sidearContent
const collapsed = ref(false)
const isOnMobile = ref(false)

// Handle collapse toggle
const onToggleCollapse = (value) => {
  collapsed.value = value
}

const collapseMenu = () => {
  collapsed.value = true
}

// Handle resize
const onResize = () => {
  if (window.innerWidth <= 767) {
    isOnMobile.value = true
    collapsed.value = true
  } else {
    isOnMobile.value = false
    collapsed.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})
</script>
<style>
.main {
  padding: 70px;
}
#main {
  padding-left: 300px;
  transition: 0.3s ease;
}
#main.collapsed {
  padding-left: 65px;
}
#main.onmobile {
  padding-left: 50px;
}

.container {
  max-width: 1-px;
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
  background: #6b7a8f;
  color: #fff;
}

.bm-menu .components {
  padding: 20px 0;
  border-bottom: 1px solid #6b7a8f;
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

.bm-menu ul li.active > a,
a[aria-expanded='true'] {
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
