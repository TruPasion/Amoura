// Profile options for backend communication
// All options include id and label for easy backend mapping

export interface OptionItem {
  id: number;
  label: string;
}

// Smoking habits options
export const smokingOptions: OptionItem[] = [
  { id: 1, label: "Never" },
  { id: 2, label: "Socially" },
  { id: 3, label: "Regularly" },
  { id: 4, label: "Trying to quit" },
  { id: 5, label: "Prefer not to say" },
];

// Drinking habits options
export const drinkingOptions: OptionItem[] = [
  { id: 1, label: "Never" },
  { id: 2, label: "Rarely" },
  { id: 3, label: "Socially" },
  { id: 4, label: "Regularly" },
  { id: 5, label: "Prefer not to say" },
];

// Exercise habits options
export const exerciseOptions: OptionItem[] = [
  { id: 1, label: "Never" },
  { id: 2, label: "Rarely" },
  { id: 3, label: "Sometimes" },
  { id: 4, label: "Often" },
  { id: 5, label: "Daily" },
];

// Interests options
export const interestsOptions: OptionItem[] = [
  { id: 1, label: "Travel" },
  { id: 2, label: "Music" },
  { id: 3, label: "Movies" },
  { id: 4, label: "Reading" },
  { id: 5, label: "Cooking" },
  { id: 6, label: "Fitness" },
  { id: 7, label: "Photography" },
  { id: 8, label: "Art" },
  { id: 9, label: "Gaming" },
  { id: 10, label: "Hiking" },
  { id: 11, label: "Dancing" },
  { id: 12, label: "Yoga" },
  { id: 13, label: "Coffee" },
  { id: 14, label: "Wine" },
  { id: 15, label: "Dogs" },
  { id: 16, label: "Cats" },
  { id: 17, label: "Sports" },
  { id: 18, label: "Beach" },
];

export const MAX_INTERESTS = 5;

// Height conversion utility - converts height strings to cm
export const convertHeightToCm = (height: string): number | null => {
  if (!height) return null;

  // Extract cm value from strings like "5'8" (173 cm)" or "173 cm"
  const cmMatch = height.match(/\((\d+)\s*cm\)|(\d+)\s*cm/);
  if (cmMatch) {
    return parseInt(cmMatch[1] || cmMatch[2]);
  }

  return null;
};

// Height options with cm values
export const heightOptions = [
  "4'10\" (147 cm)",
  "4'11\" (150 cm)",
  "5'0\" (152 cm)",
  "5'1\" (155 cm)",
  "5'2\" (157 cm)",
  "5'3\" (160 cm)",
  "5'4\" (163 cm)",
  "5'5\" (165 cm)",
  "5'6\" (168 cm)",
  "5'7\" (170 cm)",
  "5'8\" (173 cm)",
  "5'9\" (175 cm)",
  "5'10\" (178 cm)",
  "5'11\" (180 cm)",
  "6'0\" (183 cm)",
  "6'1\" (185 cm)",
  "6'2\" (188 cm)",
  "6'3\" (191 cm)",
  "6'4\" (193 cm)",
  "6'5\" (196 cm)",
  "6'6\" (198 cm)",
  "6'7\" (201 cm)",
];
