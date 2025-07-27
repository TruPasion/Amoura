export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  age: string; // ISO 8601 date string
  gender: string;
  latitude: number;
  longitude: number;
  location_access: boolean;
  profile_photo?: string; // Optional, as it's not provided in the example
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
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
  profile_photo: string;
  created_at: string; // ISO 8601 date string
  distance: number; // Distance in meters
}

export interface Match {
  user_id: number;
  full_name: string;
  profile_photo: string;
}
