<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Navbar from "../components/Navbar.vue";
import Appfooter from "../components/Appfooter.vue";
import { FwbButton } from "flowbite-vue";
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
    :style="`padding-top: ${navbarHeight}px; height: calc(100vh); background-image: url('/bg3.jpg');`"
    class="bg-center bg-cover bg-no-repeat flex justify-center"
  >
  <div class="px-4">
    <div class="font-pacifico text-white text-center pt-7 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
      Boost your Relationship aura ++
    </div>
    <div class="font-pacifico text-white text-center mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
      with Amoura
    </div>
    <div class="text-white text-center mt-8">
      <fwb-button class="text-sm sm:text-base md:text-lg lg:text-xl px-6 py-1 sm:px-8 sm:py-3 lg:px-10 lg:py-4" size="xl" pill>
        Sign In
      </fwb-button>
    </div>
  </div>
  </div>

  <div>
    <Appfooter />
  </div>
</template>
