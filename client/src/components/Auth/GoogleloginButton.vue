<template>
  <div>
    <div id="google-btn" class="my-4"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

function handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
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
    .then(({ user, token }) => {
      console.log("✅ User verified:", user);

      // Store token and user locally
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Optional: redirect or update UI
      // router.push("/dashboard");
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
