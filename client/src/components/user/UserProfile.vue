<template>
  <div
    class="flex flex-col h-full bg-gray-50 shadow-lg rounded-lg border border-gray-200"
  >
    <!-- Profile Top Bar -->
    <div
      class="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-b border-gray-300 rounded-t-lg relative"
    >
      <div class="flex items-center gap-3 flex-none">
        <fwb-avatar
          bordered
          :img="user?.profile?.profile_photo?.image_url"
          class="w-10 h-10 rounded-full"
        />
        <div>
          <h1 class="text-lg font-semibold text-gray-800">
            {{ user?.profile?.full_name || user?.name }}
          </h1>
        </div>
      </div>
      <div
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <h1 class="text-3xl font-pacifico text-purple-700">Edit Profile</h1>
      </div>
      <div class="flex items-center gap-2 flex-none">
        <!-- Save button (only show when changes exist) -->
        <div class="relative group" v-if="hasUnsavedChanges">
          <button
            @click="saveProfile"
            :disabled="isSaving"
            class="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-all duration-200 disabled:opacity-50"
            title="Save Profile"
          >
            <Save class="w-5 h-5" v-if="!isSaving" />
            <Loader2 class="w-5 h-5 animate-spin" v-else />
          </button>
          <!-- Tooltip -->
          <div
            class="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          >
            Save Profile
            <div
              class="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"
            ></div>
          </div>
        </div>
        <!-- Delete account button -->
        <div class="relative group">
          <button
            @click="deleteAccount"
            class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
            title="Delete Account"
          >
            <Trash2 class="w-5 h-5" />
          </button>
          <!-- Tooltip -->
          <div
            class="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          >
            Delete Account
            <div
              class="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"
            ></div>
          </div>
        </div>

        <!-- Close button -->
        <button
          @click="closeProfile"
          class="text-gray-500 hover:text-gray-800 flex-none ml-2 p-2"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Profile Content Area -->
    <div class="flex-1 bg-white overflow-hidden">
      <div class="flex h-full">
        <!-- Left Side - Photo Grid -->
        <div class="w-2/5 p-6 border-r border-gray-200">
          <PhotoGrid />
        </div>

        <!-- Right Side - Profile Info -->
        <div class="w-3/4 p-6 overflow-y-auto">
          <!-- About You Section - Top Priority -->
          <div class="mb-8">
            <div class="flex items-start gap-6 mb-6">
              <!-- Profile Info (Left Side) -->
              <div class="flex-shrink-0 w-64">
                <div
                  class="flex flex-col items-center text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200"
                >
                  <div class="w-20 h-20 mb-4">
                    <img
                      :src="user?.profile?.profile_photo?.image_url"
                      :alt="user?.profile?.full_name || user?.name"
                      class="w-full h-full rounded-full object-cover shadow-lg border-3 border-white"
                    />
                  </div>
                  <h2
                    class="text-lg font-bold text-gray-900 mb-2 tracking-tight"
                  >
                    {{ user?.profile?.full_name || user?.name }}
                  </h2>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Age:</span>
                      <span class="font-medium text-gray-900">
                        {{
                          calculateAge(user?.profile?.date_of_birth) || "N/A"
                        }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Gender:</span>
                      <span class="font-medium text-gray-900">
                        {{ user?.profile?.gender || "N/A" }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-3 truncate">
                      {{ user?.email }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- About You Title and Bio (Right Side) -->
              <div class="flex-1">
                <h3
                  class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2"
                >
                  <User class="w-5 h-5 text-purple-600" />
                  About You
                </h3>

                <!-- Bio Field -->
                <div class="mb-6">
                  <label
                    class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                  >
                    <FileText class="w-4 h-4 text-gray-500" />
                    Bio
                  </label>
                  <div class="relative">
                    <textarea
                      v-model="profileData.bio"
                      @input="
                        handleInputChange(
                          'bio',
                          ($event.target as HTMLTextAreaElement)?.value
                        )
                      "
                      placeholder="Adventure seeker and coffee enthusiast ☕ Always planning my next trip or trying a new restaurant. Looking for someone to share spontaneous adventures with!"
                      rows="4"
                      maxlength="500"
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                    ></textarea>
                    <div
                      class="absolute bottom-2 right-2 text-xs text-gray-500"
                    >
                      {{ (profileData.bio || "").length }}/500
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Two Column Layout for Other Fields -->
            <div class="grid grid-cols-2 gap-6">
              <!-- Job Title -->
              <div>
                <label
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <Briefcase class="w-4 h-4 text-gray-500" />
                  Job Title
                </label>
                <input
                  v-model="profileData.jobTitle"
                  @input="
                    handleInputChange(
                      'jobTitle',
                      ($event.target as HTMLInputElement).value
                    )
                  "
                  type="text"
                  placeholder="Product Designer"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              <!-- Company -->
              <div>
                <label
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <Building class="w-4 h-4 text-gray-500" />
                  Company
                </label>
                <input
                  v-model="profileData.company"
                  @input="
                    handleInputChange(
                      'company',
                      ($event.target as HTMLInputElement).value
                    )
                  "
                  type="text"
                  placeholder="Spotify"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              <!-- Education -->
              <div>
                <label
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <GraduationCap class="w-4 h-4 text-gray-500" />
                  Education
                </label>
                <input
                  v-model="profileData.education"
                  @input="
                    handleInputChange(
                      'education',
                      ($event.target as HTMLInputElement).value
                    )
                  "
                  type="text"
                  placeholder="Stanford University"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              <!-- Height -->
              <div>
                <label
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <Ruler class="w-4 h-4 text-gray-500" />
                  Height
                </label>
                <select
                  v-model="profileData.height"
                  @change="
                    handleHeightChange(
                      ($event.target as HTMLSelectElement).value
                    )
                  "
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select height</option>
                  <option
                    v-for="height in heightOptions"
                    :key="height"
                    :value="height"
                  >
                    {{ height }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Lifestyle & Interests Side by Side -->
          <div class="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Lifestyle Section -->
            <div>
              <h3
                class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2"
              >
                <Heart class="w-5 h-5 text-purple-600" />
                Lifestyle
              </h3>

              <!-- Lifestyle Cards - 3 Column Layout -->
              <div class="grid grid-cols-3 gap-3">
                <!-- Drinking Card -->
                <div class="relative">
                  <div
                    @click.stop="toggleDropdown('drinking')"
                    class="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-3 cursor-pointer hover:from-purple-100 hover:to-purple-150 hover:border-purple-300 transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center"
                  >
                    <Wine class="w-6 h-6 text-purple-600 mb-2" />
                    <span class="text-sm font-medium text-gray-700 mb-1"
                      >Drinking</span
                    >
                    <span class="text-xs text-gray-600 text-center">
                      {{
                        getOptionLabel(drinkingOptions, profileData.drinking)
                      }}
                    </span>
                    <ChevronDown class="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                  <!-- Dropdown -->
                  <div
                    v-if="activeDropdown === 'drinking'"
                    @click.stop
                    class="absolute inset-0 z-50 bg-white border-2 border-purple-300 rounded-xl shadow-lg overflow-y-auto flex flex-col"
                  >
                    <div
                      v-for="option in drinkingOptions"
                      :key="option.id"
                      @click.stop="selectOption('drinking', option.id)"
                      class="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {{ option.label }}
                    </div>
                  </div>
                </div>

                <!-- Smoking Card -->
                <div class="relative">
                  <div
                    @click.stop="toggleDropdown('smoking')"
                    class="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-3 cursor-pointer hover:from-orange-100 hover:to-orange-150 hover:border-orange-300 transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center"
                  >
                    <Ban class="w-6 h-6 text-orange-600 mb-2" />
                    <span class="text-sm font-medium text-gray-700 mb-1"
                      >Smoking</span
                    >
                    <span class="text-xs text-gray-600 text-center">
                      {{ getOptionLabel(smokingOptions, profileData.smoking) }}
                    </span>
                    <ChevronDown class="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                  <!-- Dropdown -->
                  <div
                    v-if="activeDropdown === 'smoking'"
                    @click.stop
                    class="absolute inset-0 z-50 bg-white border-2 border-orange-300 rounded-xl shadow-lg overflow-y-auto flex flex-col"
                  >
                    <div
                      v-for="option in smokingOptions"
                      :key="option.id"
                      @click.stop="selectOption('smoking', option.id)"
                      class="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {{ option.label }}
                    </div>
                  </div>
                </div>

                <!-- Exercise Card -->
                <div class="relative">
                  <div
                    @click.stop="toggleDropdown('exercise')"
                    class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-3 cursor-pointer hover:from-green-100 hover:to-green-150 hover:border-green-300 transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center"
                  >
                    <Dumbbell class="w-6 h-6 text-green-600 mb-2" />
                    <span class="text-sm font-medium text-gray-700 mb-1"
                      >Exercise</span
                    >
                    <span class="text-xs text-gray-600 text-center">
                      {{
                        getOptionLabel(exerciseOptions, profileData.exercise)
                      }}
                    </span>
                    <ChevronDown class="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                  <!-- Dropdown -->
                  <div
                    v-if="activeDropdown === 'exercise'"
                    @click.stop
                    class="absolute inset-0 z-50 bg-white border-2 border-green-300 rounded-xl shadow-lg overflow-y-auto flex flex-col"
                  >
                    <div
                      v-for="option in exerciseOptions"
                      :key="option.id"
                      @click.stop="selectOption('exercise', option.id)"
                      class="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      {{ option.label }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interests Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3
                  class="text-xl font-semibold text-gray-900 flex items-center gap-2"
                >
                  <Star class="w-5 h-5 text-purple-600" />
                  Interests
                </h3>
                <span
                  class="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                >
                  {{ selectedInterests.length }}/{{ MAX_INTERESTS }}
                </span>
              </div>

              <!-- Interests Tags -->
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="interest in interestsOptions"
                  :key="interest.id"
                  :class="[
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all duration-200',
                    selectedInterests.includes(interest.id)
                      ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-300',
                    !selectedInterests.includes(interest.id) &&
                    selectedInterests.length >= MAX_INTERESTS
                      ? 'opacity-50 cursor-not-allowed'
                      : '',
                  ]"
                  @click="
                    selectedInterests.includes(interest.id)
                      ? null
                      : toggleInterest(interest.id)
                  "
                >
                  <span>{{ interest.label }}</span>
                  <X
                    v-if="selectedInterests.includes(interest.id)"
                    class="w-4 h-4 hover:bg-purple-500 rounded-full p-0.5 transition-colors"
                    @click.stop="toggleInterest(interest.id)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="mt-8">
            <button
              @click="closeProfile"
              class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="showConfirmDialog = false"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100"
      >
        <!-- Dialog Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <AlertTriangle class="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">
            Save Your Changes?
          </h3>
          <p class="text-gray-600 text-center text-sm leading-relaxed">
            You have unsaved changes to your profile photos. Would you like to
            save them before leaving?
          </p>
        </div>

        <!-- Dialog Actions -->
        <div class="px-6 pb-6">
          <div class="flex flex-col gap-3">
            <!-- Save Button -->
            <button
              @click="confirmSave"
              :disabled="isSaving"
              class="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <Save class="w-5 h-5" v-if="!isSaving" />
              <Loader2 class="w-5 h-5 animate-spin" v-else />
              {{ isSaving ? "Saving..." : "Save Changes" }}
            </button>

            <!-- Discard Button -->
            <button
              @click="confirmDiscard"
              :disabled="isSaving"
              class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 class="w-5 h-5" />
              Discard Changes
            </button>

            <!-- Cancel Button -->
            <button
              @click="showConfirmDialog = false"
              :disabled="isSaving"
              class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Account Dialog -->
    <div
      v-if="showDeleteAccountDialog"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="showDeleteAccountDialog = false"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100"
      >
        <!-- Dialog Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center justify-center mb-4">
            <div
              class="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center"
            >
              <AlertTriangle class="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">
            Account Options
          </h3>
          <p class="text-gray-600 text-center text-sm leading-relaxed">
            Choose what you'd like to do with your account. Both actions are
            permanent and cannot be undone.
          </p>
        </div>

        <!-- Dialog Actions -->
        <div class="px-6 pb-6">
          <div class="flex flex-col gap-3">
            <!-- Delete Account Button -->
            <button
              @click="confirmDeleteAccount"
              :disabled="isDeletingAccount || isResettingMatches"
              class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <Trash2 class="w-5 h-5" v-if="!isDeletingAccount" />
              <div
                class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                v-else
              />
              {{
                isDeletingAccount ? "Deleting..." : "Delete Account Permanently"
              }}
            </button>

            <!-- Delete Account Info -->
            <p class="text-xs text-gray-500 text-center -mt-2 mb-2">
              Account will be deactivated with a 10-day cooldown period
            </p>

            <!-- Reset Matches Button -->
            <button
              @click="confirmResetMatches"
              :disabled="isDeletingAccount || isResettingMatches"
              class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <svg
                class="w-5 h-5"
                v-if="!isResettingMatches"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div
                class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                v-else
              />
              {{ isResettingMatches ? "Resetting..." : "Reset Matches Only" }}
            </button>

            <!-- Reset Info -->
            <p class="text-xs text-gray-500 text-center -mt-2 mb-2">
              Clear all your matches and start fresh
            </p>

            <!-- Cancel Button -->
            <button
              @click="showDeleteAccountDialog = false"
              :disabled="isDeletingAccount || isResettingMatches"
              class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onBeforeUnmount,
  onMounted,
  watch,
  computed,
  nextTick,
} from "vue";
import { FwbAvatar } from "flowbite-vue";
import { useUserStore } from "../../stores/user";
import { useActionStore } from "../../stores/actionStore";
import { storeToRefs } from "pinia";
import PhotoGrid from "./PhotoGrid.vue";
import {
  Trash2,
  Save,
  Loader2,
  X,
  AlertTriangle,
  User,
  FileText,
  Briefcase,
  Building,
  GraduationCap,
  Ruler,
  Wine,
  Ban,
  Dumbbell,
  Heart,
  ChevronDown,
  Star,
} from "lucide-vue-next";
import {
  smokingOptions,
  drinkingOptions,
  exerciseOptions,
  interestsOptions,
  MAX_INTERESTS,
  convertHeightToCm,
  heightOptions,
} from "../../utils/profileOptions";
import type { OptionItem } from "../../utils/profileOptions";

const userStore = useUserStore();
const actionStore = useActionStore();
const { user, hasUnsavedChanges } = storeToRefs(userStore);
const { closeUserProfile } = actionStore;

// Local state for managing changes
const isSaving = ref(false);
const showConfirmDialog = ref(false);
const showDeleteAccountDialog = ref(false);
const isDeletingAccount = ref(false);
const isResettingMatches = ref(false);
let pendingCloseAction: (() => void) | null = null;
let isComponentMounted = ref(true);

// Simple reactive refs for form data - no computed setters to avoid loops
const profileData = ref({
  bio: "",
  jobTitle: "",
  company: "",
  education: "",
  height: "",
  drinking: null as number | null,
  smoking: null as number | null,
  exercise: null as number | null,
});

const selectedInterests = ref<number[]>([]);

// =============================================================================
// FORM INPUT HANDLERS
// =============================================================================

const handleInputChange = (field: string, value: string) => {
  (profileData.value as any)[field] = value;
  userStore.updateProfileField(field as any, value || null);
  updateChangeStatus(); // Manually trigger change detection
};

const handleHeightChange = (value: string) => {
  profileData.value.height = value;
  const heightCm = convertHeightToCm(value);
  userStore.updateProfileField("height_cm", heightCm);
  updateChangeStatus(); // Manually trigger change detection
};

const handleDropdownSelect = (field: string, optionId: number) => {
  (profileData.value as any)[field] = optionId;
  userStore.updateProfileField(`${field}_id` as any, optionId);
  activeDropdown.value = "";
  updateChangeStatus(); // Manually trigger change detection
};

const handleInterestToggle = (interestId: number) => {
  const currentInterests = [...selectedInterests.value];
  const index = currentInterests.indexOf(interestId);

  if (index > -1) {
    currentInterests.splice(index, 1);
    console.log(`➖ Removed interest: ${getInterestLabel(interestId)}`);
  } else if (currentInterests.length < MAX_INTERESTS) {
    currentInterests.push(interestId);
    console.log(`➕ Added interest: ${getInterestLabel(interestId)}`);
  } else {
    console.log(`⚠️ Maximum ${MAX_INTERESTS} interests reached`);
    return;
  }

  selectedInterests.value = currentInterests;
  userStore.updateProfileInterests(currentInterests);
  updateChangeStatus(); // Manually trigger change detection
};
// Initialize form data from store when component mounts
const initializeProfileData = () => {
  if (user.value?.profile) {
    const profile = user.value.profile;

    // Convert height_cm back to display format if it exists
    let heightDisplay = "";
    if (profile.height_cm) {
      // Find matching height option by cm value
      const matchingHeight = heightOptions.find(
        (h) => convertHeightToCm(h) === profile.height_cm
      );
      heightDisplay = matchingHeight || "";
    }

    profileData.value = {
      bio: profile.bio || "",
      jobTitle: profile.job_title || "",
      company: profile.company || "",
      education: profile.education || "",
      height: heightDisplay,
      drinking: profile.drinking_id,
      smoking: profile.smoking_id,
      exercise: profile.exercise_id,
    };
    selectedInterests.value = [...(profile.interests || [])];
  }
};

// Call initialization when user data is available
onMounted(() => {
  console.log("🚀 UserProfile component mounted");
  initializeProfileData();
});

// Watch for changes in user data to reinitialize
watch(
  () => user.value?.profile,
  () => {
    if (user.value?.profile) {
      console.log("🔄 User profile data changed, reinitializing...");
      initializeProfileData();
    }
  },
  { deep: true }
);

// =============================================================================
// DEBUG UTILITIES (Development only)
// =============================================================================

// Debug function to log current state
const logCurrentState = () => {
  console.group("📊 Profile Component State");
  console.log("Current data:", profileData.value);
  console.log("Original data:", originalProfileData.value);
  console.log("Selected interests:", selectedInterests.value);
  console.log("Original interests:", originalInterests.value);
  console.log("Has profile changes:", hasProfileFieldChanges.value);
  console.log("Has photo changes:", hasUnsavedChanges.value);
  console.log("Has any changes:", hasAnyUnsavedChanges.value);
  console.groupEnd();
};

// Helper functions to get display text
const getOptionLabel = (options: OptionItem[], id: number | null): string => {
  if (!id) return "Select preference";
  const option = options.find((opt) => opt.id === id);
  return option ? option.label : "Select preference";
};

const getInterestLabel = (id: number): string => {
  const interest = interestsOptions.find((opt) => opt.id === id);
  return interest ? interest.label : "";
};

// =============================================================================
// CHANGE DETECTION SYSTEM
// =============================================================================

// Track if profile fields have changed
const hasProfileFieldChanges = ref(false);

// Store original values for comparison
const originalProfileData = ref({
  bio: "",
  jobTitle: "",
  company: "",
  education: "",
  height: "",
  drinking: null as number | null,
  smoking: null as number | null,
  exercise: null as number | null,
});
const originalInterests = ref<number[]>([]);

// Computed property for combined changes (photos + profile fields)
const hasAnyUnsavedChanges = computed(() => {
  return hasUnsavedChanges.value || hasProfileFieldChanges.value;
});

// Deep comparison utility for change detection
const hasProfileDataChanged = (): boolean => {
  // Compare basic fields
  const dataChanged =
    profileData.value.bio !== originalProfileData.value.bio ||
    profileData.value.jobTitle !== originalProfileData.value.jobTitle ||
    profileData.value.company !== originalProfileData.value.company ||
    profileData.value.education !== originalProfileData.value.education ||
    profileData.value.height !== originalProfileData.value.height ||
    profileData.value.drinking !== originalProfileData.value.drinking ||
    profileData.value.smoking !== originalProfileData.value.smoking ||
    profileData.value.exercise !== originalProfileData.value.exercise;

  // Compare interests arrays
  const interestsChanged =
    JSON.stringify([...selectedInterests.value].sort()) !==
    JSON.stringify([...originalInterests.value].sort());

  return dataChanged || interestsChanged;
};

// Reactive change detection
const updateChangeStatus = () => {
  const hasChanges = hasProfileDataChanged();
  if (hasProfileFieldChanges.value !== hasChanges) {
    hasProfileFieldChanges.value = hasChanges;
    console.log(`📝 Profile changes detected: ${hasChanges}`);
  }
};

// Function removed - now using specific input handlers

// Watch for changes - Temporarily disabled to prevent recursive updates
// The handlers now directly call store methods, so this watch might not be needed
/*
watch(
  [profileData, selectedInterests],
  () => {
    updateChangeStatus();
  },
  { deep: true }
);
*/

// Dropdown state
const activeDropdown = ref("");

const toggleDropdown = (field: string) => {
  console.log("Toggling dropdown for:", field);
  activeDropdown.value = activeDropdown.value === field ? "" : field;
  console.log("Active dropdown now:", activeDropdown.value);
};

const selectOption = (field: string, optionId: number) => {
  handleDropdownSelect(field, optionId);
};

const toggleInterest = (interestId: number) => {
  handleInterestToggle(interestId);
};

// Helper function to truncate base64 URLs for cleaner console output
const truncateBase64InObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Check if it's a base64 data URL
    if (obj.startsWith("data:image/") && obj.includes("base64,")) {
      const [prefix, base64Data] = obj.split("base64,");
      if (base64Data && base64Data.length > 50) {
        return `${prefix}base64,${base64Data.substring(0, 50)}...truncated(${
          base64Data.length
        } chars)`;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => truncateBase64InObject(item));
  }

  if (typeof obj === "object") {
    const truncated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      truncated[key] = truncateBase64InObject(value);
    }
    return truncated;
  }

  return obj;
};

const closeProfile = () => {
  if (hasUnsavedChanges.value) {
    pendingCloseAction = () => {
      actionStore.openProfile = false;
    };
    showConfirmDialog.value = true;
  } else {
    actionStore.openProfile = false;
  }
};

// Helper function to convert base64 to file and upload
const uploadBase64AsFile = async (base64Data: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();

    // Create FormData
    const formData = new FormData();
    formData.append("image", blob, "photo.jpg");

    // Upload file
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image");
    }

    const result = await uploadResponse.json();
    return result.fileUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Process delta to upload base64 images first
const processDeltaWithFileUploads = async (delta: any) => {
  const processedDelta = { ...delta };

  // Process profile photo change
  if (
    processedDelta.profile_photo_change?.image_url?.startsWith("data:image/")
  ) {
    console.log("Uploading profile photo...");
    processedDelta.profile_photo_change.image_url = await uploadBase64AsFile(
      processedDelta.profile_photo_change.image_url
    );
    console.log(
      "✅ Profile photo uploaded:",
      processedDelta.profile_photo_change.image_url
    );
  }

  // Process added photos
  if (processedDelta.added_photos?.length > 0) {
    for (const photo of processedDelta.added_photos) {
      if (photo.image_url?.startsWith("data:image/")) {
        console.log(`Uploading added photo at position ${photo.position}...`);
        photo.image_url = await uploadBase64AsFile(photo.image_url);
        console.log("✅ Added photo uploaded:", photo.image_url);
      }
    }
  }

  return processedDelta;
};

// Photo handlers are now managed in PhotoGrid via the store

const saveProfile = async () => {
  if (!hasAnyUnsavedChanges.value) return;

  isSaving.value = true;

  try {
    // Collect profile field changes
    const profileChanges: any = {};

    if (hasProfileFieldChanges.value) {
      // Text fields
      if (profileData.value.bio !== (user.value?.profile?.bio || "")) {
        profileChanges.bio = profileData.value.bio;
      }
      if (
        profileData.value.jobTitle !== (user.value?.profile?.job_title || "")
      ) {
        profileChanges.job_title = profileData.value.jobTitle;
      }
      if (profileData.value.company !== (user.value?.profile?.company || "")) {
        profileChanges.company = profileData.value.company;
      }
      if (
        profileData.value.education !== (user.value?.profile?.education || "")
      ) {
        profileChanges.education = profileData.value.education;
      }

      // Height - convert to cm
      const heightCm = convertHeightToCm(profileData.value.height);
      if (heightCm !== user.value?.profile?.height_cm) {
        profileChanges.height_cm = heightCm;
      }

      // Lifestyle IDs
      if (profileData.value.drinking !== user.value?.profile?.drinking_id) {
        profileChanges.drinking_id = profileData.value.drinking;
      }
      if (profileData.value.smoking !== user.value?.profile?.smoking_id) {
        profileChanges.smoking_id = profileData.value.smoking;
      }
      if (profileData.value.exercise !== user.value?.profile?.exercise_id) {
        profileChanges.exercise_id = profileData.value.exercise;
      }

      // Interests - array of IDs
      const currentInterests = user.value?.profile?.interests || [];
      if (
        JSON.stringify(selectedInterests.value.sort()) !==
        JSON.stringify(currentInterests.sort())
      ) {
        profileChanges.interests = selectedInterests.value;
      }
    }

    // Call store's save function for photos
    const photoDelta = userStore.saveProfileChanges();

    // Combine photo and profile changes
    const allChanges = {
      ...photoDelta,
      ...profileChanges,
    };

    console.log("=== PROFILE SAVE OPERATION ===");
    console.log("Profile changes:", profileChanges);
    console.log("Photo changes:", photoDelta);
    console.log("All changes to send:", allChanges);

    // TODO: Send allChanges to backend API
    // For now, just logging the changes as requested

    // Reset change tracking
    hasProfileFieldChanges.value = false;

    console.log("Profile saved successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
  } finally {
    isSaving.value = false;
  }
};

const calculateAge = (dateOfBirth: string | null | undefined) => {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const confirmSave = async () => {
  try {
    await saveProfile();
    showConfirmDialog.value = false;
    if (pendingCloseAction) {
      pendingCloseAction();
      pendingCloseAction = null;
    }
  } catch (error) {
    // Error handling is already done in saveProfile
  }
};

const confirmDiscard = () => {
  console.log("🗑️ Discarding all changes...");

  // Use store's revert function which handles both photos and profile fields
  userStore.revertToOriginalData();

  showConfirmDialog.value = false;

  if (pendingCloseAction) {
    pendingCloseAction();
    pendingCloseAction = null;
  }

  console.log("✅ All changes discarded");
};

// Handle page navigation/refresh
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value && isComponentMounted.value) {
    event.preventDefault();
    event.returnValue =
      "You have unsaved changes to your profile. Are you sure you want to leave?";
    return event.returnValue;
  }
};

// Override the close action to check for unsaved changes
const originalCloseUserProfile = closeUserProfile;
const interceptedCloseUserProfile = () => {
  if (hasUnsavedChanges.value && isComponentMounted.value) {
    pendingCloseAction = originalCloseUserProfile;
    showConfirmDialog.value = true;
  } else {
    originalCloseUserProfile();
  }
};

// Lifecycle hooks
onMounted(() => {
  isComponentMounted.value = true;
  window.addEventListener("beforeunload", handleBeforeUnload);
  // Temporarily disabled: document.addEventListener("click", closeDropdowns);
  // Replace the action store method temporarily
  actionStore.closeUserProfile = interceptedCloseUserProfile;
});

// Handle component unmount
onBeforeUnmount(() => {
  // Restore original method
  actionStore.closeUserProfile = originalCloseUserProfile;
  isComponentMounted.value = false;
  window.removeEventListener("beforeunload", handleBeforeUnload);
  // Temporarily disabled: document.removeEventListener("click", closeDropdowns);

  // If there are unsaved changes when component is being unmounted
  if (hasUnsavedChanges.value && isComponentMounted.value) {
    console.warn("⚠️ Profile component unmounted with unsaved changes!");
    console.log(
      "📝 Profile field changes:",
      userStore.profileChanges.profile_fields_changed
    );
    console.log(
      "📷 Photo changes:",
      userStore.profileChanges.profile_photo_changed
    );
    console.log(
      "Changes will be preserved in store until user returns or saves."
    );
    // Note: We don't revert here to allow user to return and save changes
  }

  // Clean up pending actions
  if (pendingCloseAction) {
    pendingCloseAction = null;
  }
});

const deleteAccount = () => {
  showDeleteAccountDialog.value = true;
};

// Delete account dialog functions
const confirmDeleteAccount = async () => {
  if (isDeletingAccount.value) return;

  isDeletingAccount.value = true;
  try {
    console.log("Deleting account permanently with 10-day cooldown");
    // Add your delete account API call here
    // Example: await userStore.deleteAccount();

    showDeleteAccountDialog.value = false;
    // Handle account deletion success (maybe redirect to login)
  } catch (error) {
    console.error("Failed to delete account:", error);
  } finally {
    isDeletingAccount.value = false;
  }
};

const confirmResetMatches = async () => {
  if (isResettingMatches.value) return;

  isResettingMatches.value = true;
  try {
    console.log("Resetting user matches");
    // Add your reset matches API call here
    // Example: await userStore.resetMatches();

    showDeleteAccountDialog.value = false;
    // Handle reset success
  } catch (error) {
    console.error("Failed to reset matches:", error);
  } finally {
    isResettingMatches.value = false;
  }
};
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
