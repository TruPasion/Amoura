<template>
  <fwb-footer
    footer-type="logo"
    class="!rounded-none bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900"
  >
    <div class="w-full max-w-screen-xl mx-auto p-6 md:py-12">
      <!-- Main Footer Content -->
      <div class="flex flex-col md:flex-row justify-between gap-8 mb-8">
        <!-- Brand Section -->
        <div class="flex-1 max-w-md">
          <div class="mb-4 flex items-center space-x-3">
            <img
              src="../../src/assets/favicon-32x32.png"
              alt="Amoura Logo"
              class="w-8 h-8"
            />
            <router-link
              to="/"
              class="font-pacifico text-white text-2xl hover:text-yellow-400 transition-colors"
            >
              Amoura
            </router-link>
          </div>
          <div class="text-center">
            <p class="text-gray-300 text-lg mb-4 leading-relaxed font-light">
              🌟 The revolutionary platform that's about to transform how we
              connect, love, and grow together. Get ready for something
              extraordinary!
            </p>
            <div class="flex justify-center space-x-4">
              <span
                class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
              >
                ✨ Coming Soon
              </span>
              <span
                class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg"
              >
                🚀 Revolutionary
              </span>
            </div>
          </div>
        </div>

        <!-- Compliances Section -->
        <div>
          <h3 class="text-white font-bold text-xl mb-4 tracking-wide">
            Compliances
          </h3>
          <div class="flex flex-col space-y-2">
            <a
              @click.prevent="$emit('navigate', '/terms')"
              href="#"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              Terms & Conditions
            </a>
            <a
              @click.prevent="$emit('navigate', '/privacy')"
              href="#"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              Privacy Policy
            </a>
            <a
              @click.prevent="$emit('navigate', '/refund')"
              href="#"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              Refund Policy
            </a>
            <a
              @click.prevent="$emit('navigate', '/userguide')"
              href="#"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              User Protection & Rights
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-white font-bold text-xl mb-4 tracking-wide">
            Quick Links
          </h3>
          <div class="flex flex-col space-y-2">
            <div
              @click="handleComingSoonClick"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              Home
            </div>
            <div
              @click="handleComingSoonClick"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              Features
            </div>
            <div
              @click="handleComingSoonClick"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              Premium
            </div>
            <div
              @click="handleComingSoonClick"
              class="text-gray-300 hover:text-yellow-400 cursor-pointer py-1 text-left font-medium hover:translate-x-1 transform transition-all duration-200"
            >
              About Us
            </div>
          </div>
        </div>

        <!-- Contact & Launch Info -->
        <div>
          <h3 class="text-white font-bold text-xl mb-4 tracking-wide">
            Get in Touch
          </h3>
          <div class="space-y-4">
            <div class="text-gray-300">
              <span
                class="block text-sm font-bold text-yellow-400 uppercase tracking-wider"
                >Early Access</span
              >
              <a
                href="mailto:hello@amoura.dev"
                class="text-white hover:text-yellow-400 transition-colors font-semibold text-lg"
              >
                hello@amoura.dev
              </a>
            </div>
            <div class="text-gray-300">
              <span
                class="block text-sm font-bold text-yellow-400 uppercase tracking-wider"
                >Official Domain</span
              >
              <a
                href="https://www.amoura.dev"
                class="text-white hover:text-yellow-400 transition-colors font-semibold text-lg"
              >
                www.amoura.dev
              </a>
            </div>
            <div class="mt-6">
              <button
                @click="handleNotifyClick"
                class="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                🔔 Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Separator -->
      <hr class="my-6 border-gray-700 sm:mx-auto lg:my-8" />

      <!-- Bottom Section -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <fwb-footer-copyright
          href="https://www.amoura.dev"
          by="Amoura - Launching Soon 🚀"
          class="text-gray-400 font-medium"
        />
        <div class="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
          <span
            class="text-yellow-400 font-bold text-sm tracking-wide animate-pulse"
          >
            💫 Something magical is coming...
          </span>
        </div>
      </div>
    </div>
  </fwb-footer>
</template>

<script setup lang="ts">
import { FwbFooter, FwbFooterCopyright } from "flowbite-vue";

const handleComingSoonClick = () => {
  alert(
    "🚀 Coming Soon! This feature will be available when we launch. Stay tuned!"
  );
};

const handleNotifyClick = () => {
  window.open(
    "mailto:hello@amoura.dev?subject=Notify me when Amoura launches&body=Hi! I'm excited about Amoura and would love to be notified when you launch. Please add me to your early access list!",
    "_blank"
  );
};
</script>
