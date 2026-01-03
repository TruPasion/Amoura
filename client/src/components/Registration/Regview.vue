<template>
  <div
    class="w-screen h-screen bg-gradient-to-r from-blue-500 to-purple-500 flex flex-col items-center"
  >
    <div class="flex items-center gap-4 mt-10">
      <img
        src="../../../src/assets/favicon-32x32.png"
        alt="Amoura logo"
        class="h-16 w-16"
      />
      <span class="font-alegreya text-3xl text-white">Amoura</span>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-lg w-96 mt-10 relative">
      <div v-if="step > 1 && step !== 6" class="absolute top-4 left-4">
        <MoveLeft
          @click="handleBack"
          class="text-blue-500 text-xl cursor-pointer"
        />
      </div>

      <div v-if="step === 1" class="text-center">
        <h2 class="text-xl font-bold mb-4">Enter Your Name</h2>
        <div class="relative">
          <input
            v-model="userData.name"
            type="text"
            placeholder="Your Name"
            maxlength="35"
            class="w-full p-2 border rounded mb-4"
          />
          <div class="absolute bottom-6 right-2 text-xs text-gray-500">
            {{ (userData.name || "").length }}/35
          </div>
        </div>
        <Button
          @click="handleContinue"
          :disabled="!userData.name"
          color="blue"
          class="w-full"
        >
          Continue
        </Button>
      </div>

      <div v-if="step === 2" class="text-center">
        <h2 class="text-xl font-bold mb-4">Date of Birth</h2>
        <input
          v-model="userData.dateOfBirth"
          type="date"
          :max="maxDate"
          class="w-full p-2 border rounded mb-4"
        />
        <p v-if="isUnder18" class="text-red-500 text-sm mb-4">
          You must be 18 or older to continue.
        </p>
        <Button
          @click="handleContinue"
          :disabled="isUnder18 || !userData.dateOfBirth"
          color="blue"
          class="w-full"
        >
          Continue
        </Button>
      </div>

      <div v-if="step === 3" class="text-center">
        <h2 class="text-xl font-bold mb-4">Select Gender</h2>
        <select
          v-model="userData.gender"
          class="w-full p-2 border rounded mb-4"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <Button
          @click="handleContinue"
          :disabled="!userData.gender"
          color="blue"
          class="w-full"
        >
          Continue
        </Button>
      </div>

      <div v-if="step === 4" class="text-center">
        <h2 class="text-xl font-bold mb-4">Upload Photo</h2>
        <input
          type="file"
          @change="handlePhotoChange"
          class="w-full p-2 border rounded mb-4"
        />
        <img
          v-if="photoPreview"
          :src="photoPreview"
          alt="Photo Preview"
          class="w-32 h-32 object-cover rounded-full mx-auto mb-4"
        />
        <Button
          @click="handleContinue"
          :disabled="!userData.photo"
          color="blue"
          class="w-full"
        >
          Continue
        </Button>
      </div>

      <div v-if="step === 5" class="text-center">
        <h2 class="text-xl font-bold mb-4">Allow Location Access</h2>
        <Button @click="requestLocationAccess" color="blue" class="w-full">
          Allow Location Access
        </Button>
        <p v-if="locationWarning" class="text-sm text-gray-700 mt-4">
          Location access granted. Click continue to proceed.
        </p>
      </div>

      <div v-if="step === 6" class="text-center">
        <h2 class="text-xl font-bold mb-4">Welcome to Amoura</h2>
        <p class="text-sm text-gray-700 mb-4">
          Welcome to Amoura! We’re thrilled to be part of your journey. Here, we
          value kindness, respect, and inclusivity for everyone, regardless of
          their background or identity. By joining us, you agree to uphold these
          values and contribute to a safe and welcoming community. Remember,
          we’re here to support you every step of the way!
        </p>
        <Button @click="handleContinue" color="blue" class="w-full">
          Continue
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { FwbButton as Button } from "flowbite-vue";
import { MoveLeft } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useUserStore } from "../../stores/user";

const router = useRouter();
const userStore = useUserStore();

const step = ref(1);
const userData = ref({
  name: "",
  dateOfBirth: "",
  gender: "",
  photo: null as File | null,
  locationAccess: false,
  location: { latitude: null, longitude: null } as {
    latitude: number | null;
    longitude: number | null;
  },
});

const photoPreview = ref<string | null>(null);
const isUnder18 = ref(false);
const maxDate = ref(new Date().toISOString().split("T")[0]);
const locationWarning = ref(false);

watch(
  () => userData.value.dateOfBirth,
  (newDate) => {
    const birthDate = new Date(newDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    isUnder18.value = age < 18;
  }
);

function handlePhotoChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        } else {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          userData.value.photo = new File([blob], file.name, {
            type: file.type,
          });
          photoPreview.value = URL.createObjectURL(blob);
        }
      }, file.type);
    };

    img.src = URL.createObjectURL(file);
  }
}

async function handleContinue() {
  if (step.value === 6) {
    try {
      const formData = {
        user_id: userStore.user?.id,
        full_name: userData.value.name,
        date_of_birth: userData.value.dateOfBirth,
        gender: userData.value.gender,
        profile_photo: "",
        location_access: userData.value.locationAccess,
        latitude: userData.value.location.latitude,
        longitude: userData.value.location.longitude,
      };

      const photoFormData = new FormData();
      photoFormData.append(
        "image",
        userData.value.photo!,
        userData.value.photo!.name
      );

      const requestOptions = {
        method: "POST",
        body: photoFormData,
        redirect: "manual" as RequestRedirect,
      };

      const photoResponse = await fetch("/api/upload", requestOptions);

      if (!photoResponse.ok) {
        throw new Error("Failed to upload photo");
      }

      const photoData = await photoResponse.json();
      formData.profile_photo = photoData.fileUrl;

      const response = await fetch("/api/users/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save user profile");
      }

      const profile = await response.json();
      if (userStore.user) {
        userStore.user.profile = profile;
      }

      router.push("/app");
    } catch (error) {
      console.error("Error saving user profile:", error);
      alert("Failed to save user profile. Please try again.");
    }
  } else {
    step.value++;
  }
}

function handleBack() {
  step.value--;
}

function requestLocationAccess() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userData.value.location.latitude = position.coords.latitude;
        userData.value.location.longitude = position.coords.longitude;
        userData.value.locationAccess = true;
        locationWarning.value = true;
        step.value++;
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Failed to get location. Please enable location access in your browser settings."
        );
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// async function convertToBase64(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = (error) => reject(error);
//     reader.readAsDataURL(file);
//   });
// }
</script>
