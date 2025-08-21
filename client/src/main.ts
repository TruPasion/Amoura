import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
// ✅ Core Tailwind + Flowbite styles
import "./assets/main.css";
// ✅ Custom styles including beautiful scrollbars
import "./style.css";
import "flowbite";

// ✅ Import Flowbite Vue components
import * as FlowbiteVue from "flowbite-vue";

const app = createApp(App);
app.use(createPinia());
app.use(router); // if using router

import { useUserStore } from "./stores/user";
const userStore = useUserStore();
const { flush } = userStore;

// ✅ Register all Flowbite Vue components globally
for (const [name, component] of Object.entries(FlowbiteVue)) {
  app.component(name, component);
}

app.mount("#app");

window.addEventListener("beforeunload", () => {
  flush();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flush();
  }
});
