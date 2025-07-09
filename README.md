# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# Project Setup Instructions

## Prerequisites
Ensure you have the following installed on your system:
- Node.js (v16 or higher)
- npm (v8 or higher)
- Docker (for database setup)

## Steps to Set Up the Project Locally

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Amoura
```

### 2. Install Dependencies
Navigate to the `client` and `server` directories and install dependencies:
```bash
# For the client
cd client
npm install

# For the server
cd ../server
npm install
```

### 3. Configure Environment Variables
Create `.env` files in the `server` and `client` directories based on the provided `.env.example` files.

#### Example `.env` for Server:
```
GOOGLE_CLIENT_ID=<your-google-client-id>
JWT_SECRET=<your-jwt-secret>
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=amoura
```

#### Example `.env` for Client:
```
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### 4. Set Up the Database
Use Docker to set up the PostgreSQL database:
```bash
cd db
docker-compose up -d
```
Run migrations:
```bash
cd migrations
# Apply migrations (use your migration tool or SQL scripts)
```

### 5. Start the Development Servers
Start the client and server:
```bash
# Start the client
cd client
npm run dev

# Start the server
cd ../server
npm run dev
```

### 6. Access the Application
- Frontend: [http://localhost:3000](http://localhost:3000) proxies the vite endpoint 5173
- Backend: [http://localhost:3000/api](http://localhost:3000/api)

### 7. Verify Authentication
Test the Google login and token verification endpoints:
- `/api/auth/google` for login
- `/api/auth/verify` for token verification

## Additional Notes
- Ensure Docker is running for the database.
- Use HTTPS for production environments.
- Follow best practices for securing environment variables and sensitive data.
