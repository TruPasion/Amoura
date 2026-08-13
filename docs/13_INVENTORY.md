# Amoura --- Source Inventory

## Frontend

### Entry/config

-   `client/src/main.ts`
-   `client/src/App.vue`
-   `client/vite.config.ts`
-   `client/tsconfig.json`
-   `client/tsconfig.app.json`
-   `client/tsconfig.node.json`
-   `client/postcss.config.js`

### Views

-   `client/src/views/Home.vue`
-   `client/src/views/Landingpage.vue`

### Router

-   `client/src/router/index.ts`

### Stores

-   `client/src/stores/user.ts`
-   `client/src/stores/actionStore.ts`
-   `client/src/stores/chatStore.ts`
-   `client/src/stores/geoStore.ts`

### API/helper

-   `client/src/apihelper/geohelper.ts`

### Types

-   `client/src/utils/types.ts`

### Utilities

-   `client/src/utils/geo.ts`
-   `client/src/utils/timeUtils.ts`
-   `client/src/utils/profileOptions.ts`
-   `client/src/utils/IST_UTILITIES_GUIDE.md`

### Auth

-   `client/src/components/Auth/GoogleloginButton.vue`

### Registration

-   `client/src/components/Registration/Regview.vue`

### Home

-   `client/src/components/Home/Feed.vue`
-   `client/src/components/Home/FilterBox.vue`
-   `client/src/components/Home/Sidenav.vue`
-   `client/src/components/HomeContent.vue`

### Profile

-   `client/src/components/Profile/UserProfile.vue`
-   `client/src/components/user/UserProfile.vue`
-   `client/src/components/user/PhotoGrid.vue`

### Matches

-   `client/src/components/user/Matches.vue`

### Chat

-   `client/src/components/Chat/userChat.vue`

### Toast

-   `client/src/components/toast/Toaster.vue`

### Public/compliance

-   `client/src/components/Navbar.vue`
-   `client/src/components/Appfooter.vue`
-   `client/src/components/compliencepages/Contact.vue`
-   `client/src/components/compliencepages/Privacy.vue`
-   `client/src/components/compliencepages/Refund.vue`
-   `client/src/components/compliencepages/Terms.vue`
-   `client/src/compliencePages/termsAndCon.vue`

------------------------------------------------------------------------

## Backend

### Entry

-   `server/index.ts`

### Controllers

-   `server/controllers/authController.ts`
-   `server/controllers/chatController.ts`
-   `server/controllers/feedController.ts`
-   `server/controllers/geoController.ts`
-   `server/controllers/userController.ts`

### Routes

-   `server/routes/auth.ts`
-   `server/routes/chat.ts`
-   `server/routes/feedRoutes.ts`
-   `server/routes/georoutes.ts`
-   `server/routes/userRoutes.ts`

### Middleware

-   `server/middlewares/authMiddleware.ts`

### DB

-   `server/db/postGres.ts`
-   `server/db/postGresChat.ts`
-   `server/db/redisClient.ts`

### Utilities

-   `server/utils/googleAuth.ts`
-   `server/utils/jwt.ts`

------------------------------------------------------------------------

## Database

-   `db/init.sql`
-   `db/migrations/001_convert_to_utc.sql`
-   `db/docker-compose.yml`
-   `db/readme.md`

## Root

-   `package.json`
-   `package-lock.json`
-   `tsconfig.json`
-   `tailwind.config.ts`
-   `README.md`
-   `UTC_CONVERSION_SUMMARY.md`

## Non-source material intentionally excluded from migration audit

-   `node_modules/`
-   `.git/`

These are dependency/history artifacts, not application source.
