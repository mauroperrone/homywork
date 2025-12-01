// shared/schema.ts

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Tabella sessioni - usata da connect-pg-simple per la sessione Express
 */
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { withTimezone: false }).notNull(),
  },
  (table) => [index("idx_session_expire").on(table.expire)],
);

/**
 * Utenti applicativi (agganciati a Google OAuth)
 *
 * ATTENZIONE: le colonne qui sono MINIME e coerenti con
 * l'uso che ne facciamo ora (email, name, picture, role).
 */
export type UserRole = "guest" | "host" | "admin";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // es. sub Google
  email: text("email").notNull().unique(),
  name: text("name"),
  picture: text("picture"),
  role: text("role").$type<UserRole>().default("guest"),
});

/**
 * Immobili (properties) - MVP stile Airbnb
 * hostId = users.id dell'host proprietario
 *
 * NOTA: usiamo isActive perché è quello che server/storage.ts si aspetta
 * (getProperties, updatePropertyStatus, ecc.).
 */
export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey(), // per ora lo genereremo lato app (es. nanoid/uuid)
    hostId: text("host_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    city: varchar("city", { length: 100 }),
    address: text("address"),
    pricePerNightCents: integer("price_per_night_cents").notNull(), // prezzo in centesimi di euro
    maxGuests: integer("max_guests").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    hostIdx: index("idx_properties_host_id").on(table.hostId),
    cityIdx: index("idx_properties_city").on(table.city),
    activeIdx: index("idx_properties_active").on(table.isActive),
  }),
);

/**
 * Bookings - prenotazioni
 * Schema minimale ricostruito a partire dall'uso in server/storage.ts
 */
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  guestId: text("guest_id")
    .notNull()
    .references(() => users.id),
  status: varchar("status", { length: 50 }).notNull(), // es: pending, confirmed, cancelled
  checkIn: timestamp("check_in", { withTimezone: false }).notNull(),
  checkOut: timestamp("check_out", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .notNull()
    .defaultNow(),

  // Dati per payout / Stripe
  payoutStatus: varchar("payout_status", { length: 50 })
    .notNull()
    .default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  payoutAmount: integer("payout_amount"), // in centesimi
  platformFee: integer("platform_fee"), // in centesimi
  payoutDate: timestamp("payout_date", { withTimezone: false }),
  stripeTransferId: text("stripe_transfer_id"),
});

/**
 * Availability - blocchi di disponibilità per singola data
 */
export const availability = pgTable(
  "availability",
  {
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    date: timestamp("date", { withTimezone: false }).notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    source: varchar("source", { length: 50 }).notNull(), // es: "manual", "ical"
  },
  (table) => ({
    pk: primaryKey({ columns: [table.propertyId, table.date] }),
    propertyIdx: index("idx_availability_property").on(table.propertyId),
  }),
);

/**
 * Calendar Syncs - collegamenti a calendari esterni (es. iCal Booking/Airbnb)
 */
export const calendarSyncs = pgTable(
  "calendar_syncs",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    url: text("url").notNull(),
    lastSyncedAt: timestamp("last_synced_at", {
      withTimezone: false,
    }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => ({
    propertyIdx: index("idx_calendar_syncs_property").on(table.propertyId),
  }),
);

/**
 * Reviews - recensioni degli ospiti sugli immobili
 */
export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    guestId: text("guest_id")
      .notNull()
      .references(() => users.id),
    rating: integer("rating").notNull(), // es: 1..5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    propertyIdx: index("idx_reviews_property").on(table.propertyId),
    guestIdx: index("idx_reviews_guest").on(table.guestId),
  }),
);

// In futuro, se ci serve validazione input, possiamo usare:
// export const insertPropertySchema = createInsertSchema(properties);
// etc.
