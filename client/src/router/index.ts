// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import LandingPage from "../views/Landingpage.vue";
import Home from "../views/Home.vue";
import Registration from "../components/Registration/Regview.vue";
import { useUserStore } from "../stores/user";

import { getDistanceInMeters } from "../utils/geo";

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
      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      } catch (error: any) {
        userStore.setMessage(
          "Please allow location access to continue.",
          "warning",
          5000
        );
        return;
      }

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let location = {};

      const locationStr = localStorage.getItem("location");
      const stored = locationStr ? JSON.parse(locationStr) : {};

      let hasMovedFar = true;

      if (stored.latitude && stored.longitude) {
        const distance = getDistanceInMeters(
          stored.latitude,
          stored.longitude,
          latitude,
          longitude
        );

        hasMovedFar = distance > 50000; // 50 km
      } else {
        hasMovedFar = true; // Default to true if stored location is invalid
      }

      if (hasMovedFar) {
        location = { latitude, longitude };
      } else {
        location = {}; // keep the old one
      }

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      });

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

      // Check and set location in local storage
      if (user.location.latitude && user.location.longitude) {
        localStorage.setItem("location", JSON.stringify(user.location));
      }

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
