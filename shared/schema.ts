import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tabella utenti - gestita tramite Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("guest"), // 'guest', 'host', o 'admin'
  stripeAccountId: varchar("stripe_account_id"), // Stripe Connect Express account ID
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabella proprietà/immobili
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: varchar("host_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  propertyType: text("property_type").notNull(), // 'apartment', 'house', 'villa', 'room'
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("Italia"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  pricePerNight: integer("price_per_night").notNull(),
  maxGuests: integer("max_guests").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  beds: integer("beds").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().notNull().default(sql`ARRAY[]::text[]`), // wifi, parking, kitchen, etc.
  wifiSpeed: integer("wifi_speed"), // Mbps misurati
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabella prenotazioni
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  guestId: varchar("guest_id").notNull().references(() => users.id),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'cancelled', 'completed'
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  payoutStatus: text("payout_status").notNull().default("pending"), // 'pending', 'scheduled', 'completed', 'failed'
  payoutAmount: integer("payout_amount"), // Amount to transfer to host (in cents)
  platformFee: integer("platform_fee"), // Platform commission (in cents)
  payoutDate: timestamp("payout_date"), // When transfer was executed
  stripeTransferId: text("stripe_transfer_id"), // Stripe Transfer ID for audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_booking_payout").on(table.payoutStatus, table.checkIn),
]);

// Tabella disponibilità/blocchi calendario
export const availability = pgTable("availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  source: text("source").notNull().default("manual"), // 'manual', 'airbnb', 'booking', 'google'
});

// Tabella sincronizzazioni calendario
export const calendarSyncs = pgTable("calendar_syncs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  platform: text("platform").notNull(), // 'airbnb', 'booking', 'google'
  icalUrl: text("ical_url"),
  accessToken: text("access_token"), // per Google Calendar
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabella recensioni
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  guestId: varchar("guest_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas per validazione
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  role: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  images: z.array(z.string()).optional().default([]),
  amenities: z.array(z.string()),
  wifiSpeed: z.number()
    .min(1, "Velocità WiFi deve essere almeno 1 Mbps")
    .max(2000, "Velocità WiFi massima: 2000 Mbps")
    .int("Velocità WiFi deve essere un numero intero")
    .optional(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  stripePaymentIntentId: true,
  payoutStatus: true,
  payoutAmount: true,
  platformFee: true,
  payoutDate: true,
  stripeTransferId: true,
}).extend({
  checkIn: z.date(),
  checkOut: z.date(),
});

export const insertCalendarSyncSchema = createInsertSchema(calendarSyncs).omit({
  id: true,
  createdAt: true,
  lastSyncedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertCalendarSync = z.infer<typeof insertCalendarSyncSchema>;
export type CalendarSync = typeof calendarSyncs.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Tipo esteso per proprietà con relazioni
export type PropertyWithHost = Property & {
  host: User;
  reviews?: Review[];
  averageRating?: number;
};

// Tipo per prenotazione con relazioni
export type BookingWithDetails = Booking & {
  property: Property;
  guest: User;
};
