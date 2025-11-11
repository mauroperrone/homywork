import { db } from "./db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { 
  users, properties, bookings, availability, calendarSyncs, reviews,
  type User, type InsertUser, type UpsertUser,
  type Property, type InsertProperty, type PropertyWithHost,
  type Booking, type InsertBooking, type BookingWithDetails,
  type CalendarSync, type InsertCalendarSync,
  type Review, type InsertReview
} from "@shared/schema";

export interface IStorage {
  // Users - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserStripeAccount(userId: string, stripeAccountId: string, onboardingComplete: boolean): Promise<User | undefined>;

  // Admin - User Management
  getAllUsers(): Promise<User[]>;

  // Properties
  getProperty(id: string): Promise<Property | undefined>;
  getPropertyWithHost(id: string): Promise<PropertyWithHost | undefined>;
  getProperties(filters?: { city?: string; maxPrice?: number }): Promise<Property[]>;
  getHostProperties(hostId: string): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<void>;

  // Admin - Property Management
  getAllPropertiesAdmin(): Promise<Property[]>;
  updatePropertyStatus(id: string, isActive: boolean): Promise<Property | undefined>;

  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingWithDetails(id: string): Promise<BookingWithDetails | undefined>;
  getPropertyBookings(propertyId: string): Promise<Booking[]>;
  getGuestBookings(guestId: string): Promise<Booking[]>;
  getHostBookings(hostId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking | undefined>;
  
  // Availability
  checkAvailability(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean>;
  getPropertyAvailability(propertyId: string): Promise<any[]>;
  blockDates(propertyId: string, dates: Date[], source: string): Promise<void>;
  
  // Calendar Syncs
  getCalendarSync(id: string): Promise<CalendarSync | undefined>;
  getCalendarSyncs(propertyId: string): Promise<CalendarSync[]>;
  createCalendarSync(sync: InsertCalendarSync): Promise<CalendarSync>;
  updateCalendarSync(id: string, sync: Partial<InsertCalendarSync>): Promise<CalendarSync | undefined>;
  deleteCalendarSync(id: string): Promise<void>;

  // Reviews
  getPropertyReviews(propertyId: string): Promise<any[]>;
  createReview(review: InsertReview): Promise<Review>;
  getPropertyAverageRating(propertyId: string): Promise<number>;
}

export class DbStorage implements IStorage {
  // Users - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserStripeAccount(userId: string, stripeAccountId: string, onboardingComplete: boolean): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        stripeAccountId, 
        stripeOnboardingComplete: onboardingComplete 
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Admin - User Management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Properties
  async getProperty(id: string): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result[0];
  }

  async getPropertyWithHost(id: string): Promise<PropertyWithHost | undefined> {
    const result = await db
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.hostId, users.id))
      .where(eq(properties.id, id))
      .limit(1);

    if (!result[0] || !result[0].users) return undefined;

    const propertyReviews = await this.getPropertyReviews(id);
    const averageRating = await this.getPropertyAverageRating(id);

    return {
      ...result[0].properties,
      host: result[0].users,
      reviews: propertyReviews,
      averageRating,
    };
  }

  async getProperties(filters?: { city?: string; maxPrice?: number }): Promise<Property[]> {
    let query = db.select().from(properties).where(eq(properties.isActive, true));
    
    // Note: Drizzle's where chaining isn't straightforward, so we build conditions
    return await query;
  }

  async getHostProperties(hostId: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.hostId, hostId));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const result = await db.insert(properties).values(property).returning();
    return result[0];
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  async deleteProperty(id: string): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Admin - Property Management
  async getAllPropertiesAdmin(): Promise<Property[]> {
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async updatePropertyStatus(id: string, isActive: boolean): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getBookingWithDetails(id: string): Promise<BookingWithDetails | undefined> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(users, eq(bookings.guestId, users.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!result[0] || !result[0].properties || !result[0].users) return undefined;

    return {
      ...result[0].bookings,
      property: result[0].properties,
      guest: result[0].users,
    };
  }

  async getPropertyBookings(propertyId: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.propertyId, propertyId))
      .orderBy(desc(bookings.createdAt));
  }

  async getGuestBookings(guestId: string): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(eq(bookings.guestId, guestId))
      .orderBy(desc(bookings.createdAt));
  }

  async getHostBookings(hostId: string): Promise<Booking[]> {
    const result = await db
      .select({ booking: bookings })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(properties.hostId, hostId))
      .orderBy(desc(bookings.createdAt));

    return result.map(r => r.booking);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking | undefined> {
    const updates: any = { status };
    if (paymentIntentId) {
      updates.stripePaymentIntentId = paymentIntentId;
    }
    
    const result = await db.update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  // Availability
  async checkAvailability(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean> {
    // Check if there are any conflicting bookings
    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.propertyId, propertyId),
          eq(bookings.status, "confirmed"),
          sql`${bookings.checkIn} < ${checkOut}`,
          sql`${bookings.checkOut} > ${checkIn}`
        )
      );

    return conflictingBookings.length === 0;
  }

  async getPropertyAvailability(propertyId: string): Promise<any[]> {
    return await db.select().from(availability)
      .where(eq(availability.propertyId, propertyId))
      .orderBy(availability.date);
  }

  async blockDates(propertyId: string, dates: Date[], source: string): Promise<void> {
    const values = dates.map(date => ({
      propertyId,
      date,
      isAvailable: false,
      source,
    }));

    if (values.length > 0) {
      await db.insert(availability).values(values);
    }
  }

  // Calendar Syncs
  async getCalendarSync(id: string): Promise<CalendarSync | undefined> {
    const result = await db.select().from(calendarSyncs).where(eq(calendarSyncs.id, id)).limit(1);
    return result[0];
  }

  async getCalendarSyncs(propertyId: string): Promise<CalendarSync[]> {
    return await db.select().from(calendarSyncs).where(eq(calendarSyncs.propertyId, propertyId));
  }

  async createCalendarSync(sync: InsertCalendarSync): Promise<CalendarSync> {
    const result = await db.insert(calendarSyncs).values(sync).returning();
    return result[0];
  }

  async updateCalendarSync(id: string, sync: Partial<InsertCalendarSync>): Promise<CalendarSync | undefined> {
    const result = await db.update(calendarSyncs)
      .set(sync)
      .where(eq(calendarSyncs.id, id))
      .returning();
    return result[0];
  }

  async deleteCalendarSync(id: string): Promise<void> {
    await db.delete(calendarSyncs).where(eq(calendarSyncs.id, id));
  }

  // Reviews
  async getPropertyReviews(propertyId: string): Promise<any[]> {
    const result = await db
      .select({
        review: reviews,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.guestId, users.id))
      .where(eq(reviews.propertyId, propertyId))
      .orderBy(desc(reviews.createdAt));

    return result.map(r => ({
      ...r.review,
      user: r.user,
    }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async getPropertyAverageRating(propertyId: string): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`AVG(${reviews.rating})` })
      .from(reviews)
      .where(eq(reviews.propertyId, propertyId));

    return result[0]?.avg ? Math.round(result[0].avg * 10) / 10 : 0;
  }
}

export const storage = new DbStorage();
