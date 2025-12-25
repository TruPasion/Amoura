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
  age: string; // ISO 8601 date string
  gender: string;
  latitude: string;
  longitude: string;
  profile_photo: PhotoObject;
  created_at: string; // ISO 8601 date string
  distance: number; // Distance in meters
  photos: PhotoObject[]; // Array of photo objects
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
