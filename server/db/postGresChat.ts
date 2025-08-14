import { Pool } from "pg";

export const poolChat = new Pool({
  connectionString:
    process.env.DATABASE_URL_CHAT ||
    "postgres://chat_admin:chat_pass@localhost:5433/chatdb",
});
