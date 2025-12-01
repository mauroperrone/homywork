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
import { z } from "zod";

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
 * Booking – lo prepariamo, anche se non lo usiamo ancora
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

// Tipi Drizzle
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Property = InferSelectModel<typeof properties>;
export type NewProperty = InferInsertModel<typeof properties>;

export type Booking = InferSelectModel<typeof bookings>;
export type NewBooking = InferInsertModel<typeof bookings>;

/**
 * Schema Zod per il form di creazione/modifica proprietà.
 * Questo è quello che si aspetta PropertyForm.tsx:
 *  - insertPropertySchema
 *  - type InsertProperty
 *
 * ATTENZIONE: qui lavoriamo in EURO, non in centesimi.
 * La conversione in centesimi la fa il backend.
 */
export const insertPropertySchema = z.object({
  title: z
    .string()
    .min(3, "Il titolo deve avere almeno 3 caratteri")
    .max(255, "Il titolo è troppo lungo"),
  description: z
    .string()
    .max(2000, "La descrizione è troppo lunga")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(120, "La città è troppo lunga")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(255, "L'indirizzo è troppo lungo")
    .optional()
    .nullable(),
  pricePerNight: z
    .number({
      required_error: "Il prezzo per notte è obbligatorio",
      invalid_type_error: "Il prezzo per notte deve essere un numero",
    })
    .positive("Il prezzo per notte deve essere maggiore di zero"),
  maxGuests: z
    .number({
      required_error: "Il numero massimo di ospiti è obbligatorio",
      invalid_type_error: "Il numero massimo di ospiti deve essere un numero",
    })
    .int("Il numero massimo di ospiti deve essere un intero")
    .positive("Il numero massimo di ospiti deve essere maggiore di zero"),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
