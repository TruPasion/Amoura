export interface PhotoObject {
  id: number;
  image_url: string;
  is_primary: boolean;
  position: number;
}

export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  date_of_birth: string; // ISO 8601 date string
  gender: string;
  latitude: string;
  longitude: string;
  location_access: boolean;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  bio: string | null;
  height_cm: number | null;
  job_title: string | null;
  company: string | null;
  education: string | null;
  drinking_id: number | null;
  smoking_id: number | null;
  exercise_id: number | null;
  interests: number[];
  profile_photo?: PhotoObject; // Primary photo object
  photos: PhotoObject[]; // Array of photo objects
}

export interface User {
  id: number;
  email: string;
  name: string;
  profile: UserProfile | null;
}

export interface NearbyUserProfile {
  user_id: number;
  full_name: string;
  gender: string;
  bio: string | null;
  job_title: string | null;
  company: string | null;
  education: string | null;
  height_cm: number | null;
  drinking_id: number | null;
  smoking_id: number | null;
  exercise_id: number | null;
  profile_photo: string; // Profile photo URL string
  photos: string[]; // Array of photo URL strings
  interests: number[]; // Array of interest IDs
  created_at: string; // ISO 8601 date string
  latitude: string;
  longitude: string;
  distance: number; // Distance in meters
  age: number; // Calculated age
}

export interface Match {
  user_id: number;
  full_name: string;
  profile_photo: string;
  photos: PhotoObject[];
}

export interface UserStatus {
  user_id: string;
  status: string;
  last_seen: string; // ISO 8601 date string
}

// Message interface
export interface Message {
  client_msg_id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "sending" | "failed" | "received";
  delivered_timestamp: string | null;
  read_timestamp: string | null;
  conversation_id: string | null;
}

// Chat data structure
export interface ChatData {
  messages: Message[];
  unread?: number; // Optional, defaults to 0
}

// Re-export time utilities for easier access
export {
  formatMessageTimeIST,
  formatMessageTimeIST12Hour,
  formatDateTimeIST,
  formatLastSeenIST,
  getCurrentISTTimestamp,
  convertToIST,
  formatMessageDateIST,
} from "./timeUtils";
