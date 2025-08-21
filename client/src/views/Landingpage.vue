<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import GoogleloginButton from "../components/Auth/GoogleloginButton.vue";
import TermsContent from "../components/compliencepages/Terms.vue";
import PrivacyContent from "../components/compliencepages/Privacy.vue";
import RefundContent from "../components/compliencepages/Refund.vue";
import ContactContent from "../components/compliencepages/Contact.vue";

import Navbar from "../components/Navbar.vue";
import Appfooter from "../components/Appfooter.vue";
// import { FwbButton } from "flowbite-vue";
const isNavbarVisible = ref(true);
let lastScroll = window.scrollY;
const navbarHeight = ref(0);

const handleScroll = () => {
  const currentScroll = window.scrollY;
  const delta = currentScroll - lastScroll;
  if (Math.abs(delta) < 5) return;
  isNavbarVisible.value = delta < 0 || currentScroll < 10;
  lastScroll = currentScroll;
};

onMounted(() => {
  const el = document.getElementById("navbar");
  if (el) {
    navbarHeight.value = el.offsetHeight;
  }

  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

onMounted(() => {
  const el = document.getElementById("navbar");
  if (el) {
    navbarHeight.value = el.offsetHeight; // Revert navbar height adjustment
  }

  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    id="navbar"
    :class="[
      'fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out',
      isNavbarVisible ? 'translate-y-0' : '-translate-y-full',
    ]"
  >
    <Navbar />
  </div>

  <div
    :style="`padding-top: ${navbarHeight}px; height: 100vh; background-image: url('/bg3.jpg');`"
    class="bg-center bg-cover bg-no-repeat flex items-center justify-center relative overflow-hidden"
  >
    <!-- Overlay for better text readability -->
    <div class="absolute inset-0 bg-black bg-opacity-30"></div>

    <!-- Home Page Content -->
    <div
      v-if="$route.path === '/'"
      class="px-6 text-center relative z-10 w-full h-full flex flex-col py-8"
    >
      <!-- Main Heading - Top -->
      <div>
        <div>
          <div
            class="font-pacifico text-white text-center text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight"
          >
            Boost your Relationship aura ++
          </div>
          <div
            class="font-pacifico text-white text-center mt-3 text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight"
          >
            with Amoura
          </div>
        </div>
      </div>

      <!-- Coming Soon - Middle -->
      <div class="w-full flex justify-center m-4">
        <GoogleloginButton />
      </div>
    </div>

    <!-- Terms and Conditions Content -->
    <TermsContent v-else-if="$route.path === '/terms'" />

    <!-- Privacy Policy Content -->
    <PrivacyContent v-else-if="$route.path === '/privacy'" />

    <!-- Refund Policy Content -->
    <RefundContent v-else-if="$route.path === '/refund'" />

    <!-- Contact Content -->
    <ContactContent v-else-if="$route.path === '/contact'" />

    <!-- Default fallback for other routes -->
    <div
      v-else
      class="px-6 text-center relative z-10 w-full h-full flex flex-col justify-center items-center py-8"
    >
      <div class="bg-white bg-opacity-90 rounded-lg p-8 shadow-lg">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p class="text-gray-700 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <router-link
          to="/"
          class="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Go Home
        </router-link>
      </div>
    </div>
  </div>

  <div>
    <Appfooter />
  </div>
</template>
