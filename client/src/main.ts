import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' 

// ✅ Core Tailwind + Flowbite styles
import './assets/main.css'
import 'flowbite'

// ✅ Import Flowbite Vue components
import * as FlowbiteVue from 'flowbite-vue'

const app = createApp(App)
app.use(createPinia())
app.use(router) // if using router

// ✅ Register all Flowbite Vue components globally
for (const [name, component] of Object.entries(FlowbiteVue)) {
  app.component(name, component)
}

app.mount('#app')
