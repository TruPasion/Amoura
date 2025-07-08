<template>
  <fwb-navbar>
    <template #logo>
      <fwb-navbar-logo alt="Amoura logo" image-url="../../src/assets/favicon-32x32.png" link="#">
        Amoura
      </fwb-navbar-logo>
    </template>
    <template #default="{isShowMenu}">
      <fwb-navbar-collapse :is-show-menu="isShowMenu">
        <fwb-navbar-link is-active link="#">
          Home
        </fwb-navbar-link>
        <fwb-navbar-link link="#">
          Services
        </fwb-navbar-link>
        <fwb-navbar-link link="#">
          Pricing
        </fwb-navbar-link>
        <fwb-navbar-link link="#">
          Contact
        </fwb-navbar-link>
        <fwb-navbar-link link="#">
          Sign In
        </fwb-navbar-link>
      </fwb-navbar-collapse>
    </template>
  </fwb-navbar>
</template>

<script setup lang="ts">
import {
  FwbNavbar,
  FwbNavbarCollapse,
  FwbNavbarLink,
  FwbNavbarLogo,
} from 'flowbite-vue'
</script>