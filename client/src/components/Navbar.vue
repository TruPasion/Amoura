<template>
  <fwb-navbar class="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900">
    <template #logo>
      <router-link
        to="/"
        class="flex items-center space-x-3 hover:opacity-80 transition-opacity"
      >
        <img
          src="../../src/assets/favicon-32x32.png"
          alt="Amoura Logo"
          class="w-8 h-8"
        />
        <span class="font-pacifico text-2xl text-white">Amoura</span>
      </router-link>
    </template>
    <template #default="{ isShowMenu }">
      <fwb-navbar-collapse :is-show-menu="isShowMenu">
        <div
          @click="handleComingSoonClick"
          class="text-white hover:text-yellow-400 cursor-pointer px-4 py-2 rounded-md font-semibold tracking-wide transition-all duration-200 hover:bg-white hover:bg-opacity-10"
        >
          Home
        </div>
        <div
          @click="handleComingSoonClick"
          class="text-white hover:text-yellow-400 cursor-pointer px-4 py-2 rounded-md font-semibold tracking-wide transition-all duration-200 hover:bg-white hover:bg-opacity-10"
        >
          Features
        </div>
        <div
          @click="handleComingSoonClick"
          class="text-white hover:text-yellow-400 cursor-pointer px-4 py-2 rounded-md font-semibold tracking-wide transition-all duration-200 hover:bg-white hover:bg-opacity-10"
        >
          Premium
        </div>
        <div
          @click="handleContactClick"
          class="text-white hover:text-yellow-400 cursor-pointer px-4 py-2 rounded-md font-semibold tracking-wide transition-all duration-200 hover:bg-white hover:bg-opacity-10"
        >
          Contact
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="handleSignInClick"
            class="text-white hover:text-yellow-400 cursor-pointer px-4 py-2 rounded-md font-semibold tracking-wide transition-all duration-200 hover:bg-white hover:bg-opacity-10 border border-yellow-400 hover:border-yellow-300"
          >
            Sign In
          </button>
        </div>
      </fwb-navbar-collapse>
    </template>
  </fwb-navbar>
</template>

<script setup lang="ts">
import { FwbNavbar, FwbNavbarCollapse } from "flowbite-vue";

const handleComingSoonClick = () => {
  alert(
    "🚀 Coming Soon! This feature will be available when we launch. Stay tuned for something amazing!"
  );
};

const handleContactClick = () => {
  window.open(
    "mailto:hello@amoura.dev?subject=Hello from Amoura visitor&body=Hi! I'm interested in learning more about Amoura. Looking forward to hearing from you!",
    "_blank"
  );
};

const handleSignInClick = () => {
  // Try to find the actual Google login button (rendered by Google)
  const googleButton = document.querySelector(
    '#google-btn div[role="button"]'
  ) as HTMLElement;
  if (googleButton) {
    console.log("✅ Found Google button, clicking...");
    googleButton.click();
    return;
  }

  // Fallback: try to find any clickable element inside google-btn
  const googleBtnContainer = document.querySelector(
    "#google-btn"
  ) as HTMLElement;
  if (googleBtnContainer) {
    const clickableElement = googleBtnContainer.querySelector(
      "div, button, span"
    ) as HTMLElement;
    if (clickableElement) {
      console.log(
        "✅ Found clickable element in Google container, clicking..."
      );
      clickableElement.click();
      return;
    }
  }

  // Last fallback: try to find the wrapper and trigger click on it
  const googleLoginWrapper = document.querySelector(
    ".google-login-button"
  ) as HTMLElement;
  if (googleLoginWrapper) {
    console.log("✅ Found Google login wrapper, clicking...");
    googleLoginWrapper.click();
    return;
  }

  // If nothing found, scroll to the Google login section
  console.log("⚠️ No Google button found, scrolling to login section...");
  const googleLoginSection = document.querySelector("#main-content");
  if (googleLoginSection) {
    googleLoginSection.scrollIntoView({ behavior: "smooth" });
  }
};
</script>
