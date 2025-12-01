// server/db/schema/users.ts
import { pgTable, text } from "drizzle-orm/pg-core";

export type UserRole = "guest" | "host" | "admin";

export const users = pgTable("users", {
  // id esterno (es. sub Google)
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  picture: text("picture"),
  role: text("role").$type<UserRole>().default("guest"),
});
