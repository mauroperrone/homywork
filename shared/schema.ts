// shared/schema.ts
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Utenti dell'app:
 * - id: string (id Google o uuid)
 * - role: guest | host | admin
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  picture: text("picture"),
  role: varchar("role", { length: 20 }).notNull().default("guest"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Immobili in stile Airbnb.
 * Prezzo in centesimi (evitiamo casini con i float).
 */
export const properties = pgTable("properties", {
  id: text("id").primaryKey(),
  hostId: text("host_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 120 }),
  address: varchar("address", { length: 255 }),
  pricePerNightCents: integer("price_per_night_cents").notNull(),
  maxGuests: integer("max_guests").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * (Prepariamo già i booking per dopo, anche se ora non li usiamo)
 */
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  guestId: text("guest_id")
    .notNull()
    .references(() => users.id),
  checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
  checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
  totalPriceCents: integer("total_price_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Property = InferSelectModel<typeof properties>;
export type NewProperty = InferInsertModel<typeof properties>;

export type Booking = InferSelectModel<typeof bookings>;
export type NewBooking = InferInsertModel<typeof bookings>;
