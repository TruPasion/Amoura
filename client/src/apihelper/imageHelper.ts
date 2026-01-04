// Cache for signed URLs to avoid repeated API calls
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Get a signed URL for viewing a GCP image
 * @param imagePath - The GCP object path (e.g., "users/104/16c8c3a8-d904-4105-aea6-c162e52e801b")
 * @returns The signed URL for viewing the image
 */
export async function getImageUrl(
  imagePath: string | null | undefined
): Promise<string> {
  // Return empty string for null/undefined paths
  if (!imagePath) {
    return "";
  }

  // If it's already a full URL (http/https), return it as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's a base64 data URL (newly uploaded, not yet saved), return it as-is
  if (
    imagePath.startsWith("data:image/") ||
    imagePath.startsWith("data:application/")
  ) {
    return imagePath;
  }

  // If it's a blob URL (created by FileReader), return it as-is
  if (imagePath.startsWith("blob:")) {
    return imagePath;
  }

  // If it's a legacy local upload path, return it as-is
  if (imagePath.startsWith("/uploads/")) {
    return imagePath;
  }

  // Check cache first (URLs expire after 4 minutes, we cache for 3)
  const cached = urlCache.get(imagePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const response = await fetch(
      `/api/gcs/view-url/${encodeURIComponent(imagePath)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to get signed URL for ${imagePath}`);
      return "";
    }

    const data = await response.json();

    // Cache the URL for 3 minutes (180000 ms)
    urlCache.set(imagePath, {
      url: data.viewUrl,
      expiresAt: Date.now() + 180000,
    });

    return data.viewUrl;
  } catch (error) {
    console.error("Error fetching signed URL:", error);
    return "";
  }
}

/**
 * Get signed URLs for multiple images in parallel
 * @param imagePaths - Array of GCP object paths
 * @returns Array of signed URLs in the same order
 */
export async function getImageUrls(
  imagePaths: (string | null | undefined)[]
): Promise<string[]> {
  return Promise.all(imagePaths.map((path) => getImageUrl(path)));
}

/**
 * Clear the URL cache (useful when user logs out or changes profile)
 */
export function clearImageCache() {
  urlCache.clear();
}
