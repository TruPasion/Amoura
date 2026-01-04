<template>
  <img
    :src="displayUrl"
    :alt="alt"
    :class="imgClass"
    @error="handleError"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGcpImage } from "../../utils/useGcpImage";

interface Props {
  src: string | null | undefined;
  alt?: string;
  imgClass?: string;
  fallback?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "Image",
  imgClass: "",
  fallback: "/avatar.avif",
});

const { signedUrl, loading, error } = useGcpImage(() => props.src);

const displayUrl = computed(() => {
  if (error.value) {
    return props.fallback;
  }
  return signedUrl.value || props.fallback;
});

const handleError = () => {
  console.error("Image failed to load:", props.src);
};
</script>
