# Amoura --- Data Model Audit

## Core tables

### `users`

Identity/account table.

Key fields:

-   `id`
-   `provider`
-   `provider_user_id`
-   `email`
-   `name`
-   `profile_picture`
-   `active`
-   login timestamps
-   lifecycle timestamps

Unique:

-   `(provider, provider_user_id)`
-   `email`

### `user_profiles`

One-to-one profile.

Contains:

-   name
-   DOB
-   gender
-   location access
-   coordinates
-   bio
-   height
-   job
-   company
-   education
-   drinking
-   smoking
-   exercise
-   timestamps

### `user_locations`

Current geographic location.

Contains PostGIS geography point:

``` text
GEOGRAPHY(Point, 4326)
```

Unique per user.

GIST spatial index exists.

### `user_seen_profiles`

Records discovery actions:

``` text
user_id
seen_user_id
action
seen_at
```

Actions constrained to:

-   like
-   dislike

### `user_matches`

Mutual match.

Uses UUID match ID.

Invariant:

``` text
user_id_1 < user_id_2
```

Unique pair prevents duplicate matches.

### `user_profile_pictures`

Photo gallery.

Contains:

-   user
-   image URL
-   position
-   primary flag
-   timestamps

Unique:

``` text
(user_id, position)
```

Partial unique index:

``` text
one primary photo per user
```

### `drinking_habits`

Lookup values.

### `smoking_habits`

Lookup values.

### `exercise_habits`

Lookup values.

### `interests`

Lookup values.

### `user_interests`

Many-to-many relation between users and interests.

## Persistence domains

``` text
main PostgreSQL
  users
  profiles
  locations
  discovery
  matches
  interests

chat PostgreSQL
  messages/conversations

Redis
  realtime/auxiliary state
```

## Time model

The migration file `001_convert_to_utc.sql` converts timestamps from
assumed Asia/Kolkata local time to UTC and changes defaults to UTC.

Frontend time utilities provide IST presentation helpers.

## Migration implication

The React frontend should not introduce new timezone conversion rules.

Use the existing utilities as the behavioral reference.
