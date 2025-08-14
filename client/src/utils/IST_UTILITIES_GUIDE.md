# IST Time Utilities Documentation

This document explains how to use the IST (Indian Standard Time) conversion utilities throughout the application.

## Available Functions

All functions are available in `src/utils/timeUtils.ts` and re-exported from `src/utils/types.ts` for convenience.

### 1. `formatMessageTimeIST(timestamp: string): string`

Converts UTC timestamp to IST and formats as HH:MM (24-hour format).

```typescript
import { formatMessageTimeIST } from "../utils/types";

const timestamp = "2025-08-15T10:30:00.000Z"; // UTC
const istTime = formatMessageTimeIST(timestamp); // "16:00"
```

### 2. `formatMessageTimeIST12Hour(timestamp: string): string`

Converts UTC timestamp to IST and formats as 12-hour format with AM/PM.

```typescript
import { formatMessageTimeIST12Hour } from "../utils/types";

const timestamp = "2025-08-15T10:30:00.000Z"; // UTC
const istTime = formatMessageTimeIST12Hour(timestamp); // "4:00 PM"
```

### 3. `formatDateTimeIST(timestamp: string): string`

Converts UTC timestamp to IST and formats as date and time.

```typescript
import { formatDateTimeIST } from "../utils/types";

const timestamp = "2025-08-15T10:30:00.000Z"; // UTC
const istDateTime = formatDateTimeIST(timestamp); // "15 Aug, 4:00 PM"
```

### 4. `formatLastSeenIST(timestamp: string): string`

Converts UTC timestamp to IST and formats as relative time (e.g., "2 minutes ago").

```typescript
import { formatLastSeenIST } from "../utils/types";

const lastSeen = "2025-08-15T10:25:00.000Z"; // UTC (5 minutes ago)
const relativeTime = formatLastSeenIST(lastSeen); // "5 minutes ago"
```

### 5. `getCurrentISTTimestamp(): string`

Gets the current timestamp in IST as an ISO string.

```typescript
import { getCurrentISTTimestamp } from "../utils/types";

const now = getCurrentISTTimestamp(); // Current time in IST format
```

### 6. `convertToIST(timestamp: string): Date`

Low-level function to convert UTC timestamp to IST Date object.

```typescript
import { convertToIST } from "../utils/types";

const utcTimestamp = "2025-08-15T10:30:00.000Z";
const istDate = convertToIST(utcTimestamp); // Date object in IST
```

## Usage Examples

### In Vue Components

```vue
<template>
  <div>
    <p>Message sent at: {{ formatTime(message.timestamp) }}</p>
    <p>Last seen: {{ formatLastSeen(user.lastSeen) }}</p>
  </div>
</template>

<script setup lang="ts">
import { formatMessageTimeIST, formatLastSeenIST } from "../utils/types";

const formatTime = (timestamp: string) => {
  return formatMessageTimeIST(timestamp);
};

const formatLastSeen = (timestamp: string) => {
  return formatLastSeenIST(timestamp);
};
</script>
```

### In Stores (Pinia)

```typescript
import { getCurrentISTTimestamp, formatMessageTimeIST } from "../utils/types";

export const useChatStore = defineStore("chat", () => {
  const sendMessage = (content: string) => {
    const message = {
      content,
      timestamp: getCurrentISTTimestamp(), // Use IST timestamp
      // ... other properties
    };

    // Process message...
  };

  const getFormattedTime = (timestamp: string) => {
    return formatMessageTimeIST(timestamp);
  };

  return {
    sendMessage,
    getFormattedTime,
  };
});
```

## Migration Guide

### Before (using browser local time):

```typescript
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
```

### After (using IST):

```typescript
import { formatMessageTimeIST } from "../utils/types";

const formatTime = (timestamp: string) => {
  return formatMessageTimeIST(timestamp);
};
```

## Key Benefits

1. **Consistent Timezone**: All users see times in IST regardless of their device timezone
2. **Modular**: Easy to import and use across components
3. **Flexible**: Multiple formatting options available
4. **Type Safe**: Full TypeScript support
5. **Reusable**: Single source of truth for time formatting

## Notes

- All input timestamps should be in UTC format (ISO 8601)
- The backend should store all timestamps in UTC
- IST is UTC+5:30 (5 hours 30 minutes ahead of UTC)
- Functions handle timezone conversion automatically
