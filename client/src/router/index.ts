// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "../views/Landingpage.vue";
import Home from "../views/Home.vue";
import Registration from "../components/Registration/Regview.vue";
import { useUserStore } from "../stores/user";

const routes = [
  {
    path: "/",
    component: LandingPage,
  },
  {
    path: "/app",
    component: Home,
  },
  {
    path: "/registration",
    component: Registration,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// router/index.ts
router.beforeEach(async (to, _, next) => {
  const userStore = useUserStore();

  if (to.path.startsWith("/app") || to.path.startsWith("/registration")) {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        return next("/");
      }

      const user = await res.json();
      userStore.setUser({
        id: user.user.id,
        email: user.user.email,
        name: user.user.name,
        profile: user.profile,
      });

      if (to.path.startsWith("/app")) {
        if (user.profile) {
          return next();
        } else {
          return next("/registration");
        }
      }

      if (to.path.startsWith("/registration")) {
        if (!user.profile) {
          return next();
        } else {
          return next("/app");
        }
      }
    } catch {
      return next("/");
    }
  }

  return next();
});

export default router;
