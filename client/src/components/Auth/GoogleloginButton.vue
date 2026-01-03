<template>
  <div class="google-login-button" @click="handleWrapperClick">
    <div id="google-btn" class="my-4"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useUserStore } from "../../stores/user"; // Adjust the path as necessary
import router from "../../router";
const userStore = useUserStore();

function handleCredentialResponse(
  response: google.accounts.id.CredentialResponse
) {
  console.log("📥 Google callback fired:", response);

  const token = response.credential;

  if (!token) {
    console.error("❌ No credential received");
    return;
  }

  // Send token to your backend
  fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();

        // Handle cooldown specifically
        if (errorData.cooldown) {
          alert(
            `${errorData.message}\n\nIf you have any issues, please report them to hello@amoura.dev`
          );
          return Promise.reject(new Error("Cooldown handled"));
        }

        // Handle other specific errors
        if (errorData.error === "Account deactivated") {
          alert(
            `${errorData.message}\n\nIf you have any issues, please report them to hello@amoura.dev`
          );
          return Promise.reject(new Error("Account deactivated"));
        }

        throw new Error(errorData.error || "Failed to authenticate");
      }
      return res.json();
    })
    .then(({ user }) => {
      console.log("✅ User verified:", user);
      // Store user data in the user store
      userStore.setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      });

      // Optional: redirect or update UI
      if (user.profile) {
        router.push("/app");
      } else {
        router.push("/registration");
      }
    })
    .catch((err) => {
      console.error("❌ Authentication failed:", err.message);

      // Only show alert for generic errors (cooldown and deactivated are handled above)
      if (
        err.message !== "Cooldown handled" &&
        err.message !== "Account deactivated"
      ) {
        alert(
          `Authentication failed: ${err.message}\n\nIf you continue to experience issues, please report them to hello@amoura.dev`
        );
      }
    });
}

const handleWrapperClick = () => {
  // When the wrapper is clicked, try to click the actual Google button
  const googleButton = document.querySelector(
    '#google-btn div[role="button"]'
  ) as HTMLElement;
  if (googleButton) {
    console.log("✅ Wrapper clicked, triggering Google button...");
    googleButton.click();
  }
};

onMounted(() => {
  const interval = setInterval(() => {
    if (window.google && window.google.accounts?.id) {
      console.log("✅ Google script loaded");

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-btn")!,
        {
          theme: "outline",
          size: "large",
        }
      );

      clearInterval(interval);
    }
  }, 100);
});
</script>
