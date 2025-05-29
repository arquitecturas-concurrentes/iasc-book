import { createRouter, createWebHistory } from 'vue-router'
import EntryAdoc from '@/components/EntryAdoc.vue'
import AdocPage from '@/components/AdocPage.vue'
import ContentPages from '@/static/pages.json'

const pagesRoutes = () => {
  return ContentPages.map((section) => ({
    path: `/tema/${section.path}`,
    component: EntryAdoc,
    props: () => ({
      adocName: section.path,
      title: section.title,
      extra: section.extra || false,
      need_detail: section.need_detail || false,
      description: section.description,
    }),
    meta: {
      title: section.title,
      layout: 'AppLayoutEntry',
    },
  }))
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AdocPage,
    props: () => ({
      adocName: 'main',
    }),
    meta: {
      layout: 'AppLayoutHome',
    },
  },
  ...pagesRoutes(),
  {
    path: '/tema/stm',
    component: () => import('@/views/STM.vue'),
  },
  {
    path: '/tema/efecto_lado_haskell',
    component: () => import('@/views/EfectoLadoHaskell.vue'),
  },
  {
    path: '/:pathMatch(.*)',
    component: () => import('@/views/errors/NotFound.vue'),
    meta: {
      layout: 'AppLayoutError',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, _savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth', // or 'auto' if you prefer instant jump
      }
    }
    return { top: 0 }
  },
})

export default router
