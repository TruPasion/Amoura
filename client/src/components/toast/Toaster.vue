<template>
  <fwb-toast
    v-if="visible"
    :type="type"
    :closable="true"
    @close="visible = false"
    class="fixed top-5 left-5 z-[9999]"
  >
    {{ message }}
  </fwb-toast>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { FwbToast } from "flowbite-vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "../../stores/user";

const userStore = useUserStore();
const { message, type, duration } = storeToRefs(userStore);
const { resetMessage } = userStore;

const visible = ref(false);

watch(duration, (newDuration) => {
  if (newDuration > 0) {
    visible.value = true;
    console.log("Toast message:", message.value);
    setTimeout(() => {
      visible.value = false;
      resetMessage();
    }, newDuration);
  } else {
    visible.value = false;
  }
});
</script>
