<template>
  <component :is="layoutComponent">
    <slot />
  </component>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const defaultLayout = 'AppLayoutEntry'
const route = useRoute()

const layouts = import.meta.glob('@/layouts/*.vue')

// Create the computed layout component
const layoutComponent = computed(() => {
  const layoutName = route.meta.layout || defaultLayout
  const layoutPath = `/src/layouts/${layoutName}.vue` // the absolute path
  const layoutImport = layouts[layoutPath]

  if (layoutImport) {
    return defineAsyncComponent(layoutImport)
  } else {
    console.warn(`Layout "${layoutName}" not found, using default layout.`)
    return defineAsyncComponent(layouts[`/src/layouts/${defaultLayout}.vue`])
  }
})
</script>
