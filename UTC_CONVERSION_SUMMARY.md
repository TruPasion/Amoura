# UTC Timestamp Conversion Summary

## Overview

All database operations in the server have been updated to use UTC timestamps instead of server local time. This ensures consistent timestamp handling regardless of server location or timezone settings.

## Changes Made

### 1. Controller Updates

#### `server/controllers/userController.ts`

- **createUser**: Changed `now()` to `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
- **updateUser**: Changed `now()` to `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
- **deleteUser**: Changed `now()` to `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`

#### `server/controllers/authController.ts`

- **googleAuthHandler**: Updated both login time update and user creation to use `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`
- **verifyTokenHandler**: Updated location upsert to use `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`

#### `server/controllers/feedController.ts`

- **feedUserAction**: Changed `NOW()` to `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'` in seen_profiles insertion

### 2. Database Schema Updates

#### `db/init.sql`

Updated all table definitions to use UTC defaults:

- `users` table: `created_at`, `updated_at`
- `user_profiles` table: `created_at`, `updated_at`
- `user_locations` table: `updated_at`
- `user_seen_profiles` table: `seen_at`
- `user_matches` table: `matched_at`

### 3. Migration Script

#### `db/migrations/001_convert_to_utc.sql`

- Converts existing timestamps from server timezone to UTC
- Updates column defaults to use UTC
- Creates utility function `utc_now()` for future use
- **Important**: Adjust the timezone in the migration script based on your server's previous timezone

## Frontend Changes

#### `client/src/components/Chat/userChat.vue`

- Updated `formatLastSeen` function to automatically detect user's browser timezone
- Converts UTC timestamps from database to user's local timezone for display
- Added reactive timer that updates every minute
- Removed hardcoded IST timezone dependency

## Key Benefits

1. **Timezone Independence**: Server operations are now timezone-independent
2. **Global Compatibility**: Users in different timezones see accurate local times
3. **Daylight Saving Time**: Automatic handling of DST changes
4. **Consistency**: All timestamps stored in UTC for consistent calculations
5. **Future-Proof**: Easy to add new timezone features

## Important Notes

1. **Migration Required**: Existing databases need to run the migration script
2. **WebSocket Server**: If you have a separate WebSocket server handling user status/last_seen, ensure it also uses UTC timestamps
3. **Timezone Assumption**: The migration script assumes previous timestamps were in Asia/Kolkata timezone - adjust as needed
4. **Testing**: Verify that all timestamp operations work correctly after migration

## Functions to Use Going Forward

- **Database**: Use `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'` for all new timestamp operations
- **Alternative**: Use the new `utc_now()` function created in the migration
- **Avoid**: Don't use `now()`, `NOW()`, or `CURRENT_TIMESTAMP` without timezone specification

## Client-Side Handling

The frontend now automatically:

- Detects user's browser timezone
- Converts UTC timestamps to local time for display
- Shows relative time (1m ago, 2h ago, etc.) that updates automatically
- Handles all timezone conversions transparently
