import './plugins/bootstrap-vue.js'
import './plugins/styles.js'

import { createApp } from 'vue'
import router from './router'
import IASCBook from './IASCBook.vue'

const app = createApp(IASCBook)
app.use(router)
app.mount('#app')
