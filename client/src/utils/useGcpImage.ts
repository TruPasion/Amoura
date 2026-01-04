import { ref, watch, onUnmounted } from "vue";
import { getImageUrl } from "../apihelper/imageHelper";

/**
 * Composable for loading GCP images with signed URLs
 * @param imagePath - Reactive or static image path
 * @returns Reactive signed URL
 */
export function useGcpImage(imagePath: any) {
  const signedUrl = ref<string>("");
  const loading = ref<boolean>(false);
  const error = ref<string>("");

  let mounted = true;

  const loadImage = async (path: string | null | undefined) => {
    if (!mounted) return;

    loading.value = true;
    error.value = "";

    try {
      const url = await getImageUrl(path);
      if (mounted) {
        signedUrl.value = url;
      }
    } catch (err) {
      if (mounted) {
        error.value = "Failed to load image";
        console.error("Error loading GCP image:", err);
      }
    } finally {
      if (mounted) {
        loading.value = false;
      }
    }
  };

  // Watch for changes in the image path
  watch(
    () => (typeof imagePath === "function" ? imagePath() : imagePath),
    (newPath) => {
      loadImage(newPath);
    },
    { immediate: true }
  );

  onUnmounted(() => {
    mounted = false;
  });

  return { signedUrl, loading, error };
}
