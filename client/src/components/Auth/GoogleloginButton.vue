<template>
  <div>
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
        const error = await res.json();
        throw new Error(error.error || "Failed to authenticate");
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
      }
      else {
        router.push("/registration");
      }
    })
    .catch((err) => {
      console.error("❌ Authentication failed:", err.message);
    });
}

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
