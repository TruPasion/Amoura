<template>
  <fwb-avatar
    :bordered="bordered"
    :img="displayUrl"
    :class="avatarClass"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FwbAvatar } from "flowbite-vue";
import { useGcpImage } from "../../utils/useGcpImage";

interface Props {
  src: string | null | undefined;
  bordered?: boolean;
  avatarClass?: string;
  fallback?: string;
}

const props = withDefaults(defineProps<Props>(), {
  bordered: false,
  avatarClass: "",
  fallback: "/avatar.avif",
});

const { signedUrl, error } = useGcpImage(() => props.src);

const displayUrl = computed(() => {
  if (error.value) {
    return props.fallback;
  }
  return signedUrl.value || props.fallback;
});
</script>
