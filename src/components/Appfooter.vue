<template>
  <fwb-footer footer-type="logo" class="!rounded-none">
    <div class="w-full max-w-screen-xl mx-auto p-4 md:py-8">
      <div class="sm:flex sm:items-center sm:justify-between">
        <fwb-footer-brand href="https://Amoura.com" src="../../src/assets/favicon-32x32.png" alt="Amoura Logo" name="Amoura" />
        <fwb-footer-link-group class="flex flex-wrap items-center mb-6 text-sm text-gray-500 sm:mb-0 dark:text-gray-400">
          <fwb-footer-link href="/">
            About
          </fwb-footer-link>
          <fwb-footer-link href="/">
            Privacy Policy
          </fwb-footer-link>
          <fwb-footer-link href="/">
            Licensing
          </fwb-footer-link>
          <fwb-footer-link href="/">
            Contact
          </fwb-footer-link>
        </fwb-footer-link-group>
      </div>
      <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8">
      <fwb-footer-copyright href="/" by="Amoura" />
    </div>
  </fwb-footer>
</template>

<script setup lang="ts">
import {
  FwbFooter,
  FwbFooterCopyright,
  FwbFooterLink,
  FwbFooterLinkGroup,
} from 'flowbite-vue'
</script>