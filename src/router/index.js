import Vue from "vue";
import VueRouter from "vue-router";
import { publicPath } from '@/../vue.config'
import ContentPages from '@/static/pages.json'

Vue.use(VueRouter);

const pagesRoutes = () => {
  return ContentPages.map(section => (
    {
      path: `/${section.path}`,
      component: () => import(`@/content/${section.page}.md`),
      meta: {
        title: section.title,
        description: section.description
      }
    }
  ))
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/content/main.md'),
    meta: {
      layout: 'AppLayoutHome'
    }
  },
  ...pagesRoutes(),
  {
    path: '/stm',
    component: () => import('@/views/STM.vue'),
    meta: {
      title: 'STM',
      description: 'Memoria Transaccional'
    },
  },
  {
    path: '/efecto_lado_haskell',
    component: () => import('@/views/EfectoLadoHaskell.vue'),
    meta: {
      title: 'Efectos de Lado en Haskell',
      description: 'Una intro a memoria transaccional en Haskell'
    },
  },
  {
    path:"*",
    component: () => import('../views/errors/NotFound.vue'),
    meta: {
      layout: 'AppLayoutError'
    }
  }
];

const router = new VueRouter({
  mode: 'history',
  base: publicPath,
  routes,
  scrollBehavior (to, _from, savedPosition) {
    if (to.hash) {
        return { selector: to.hash }
    } else if (savedPosition) {
        return savedPosition;
    } else {
        return { x: 0, y: 0 }
    }
  }
});

export default router;
