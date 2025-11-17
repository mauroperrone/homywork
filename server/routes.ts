import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated, isHost, isGuest, isAdmin } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import Stripe from "stripe";
import { eq, and, sql } from "drizzle-orm";
import { processScheduledPayouts } from "./scheduler";
import { z } from "zod";
import { ValidationError } from "./storage";
import { 
  bookings,
  insertPropertySchema, 
  insertBookingSchema, 
  insertCalendarSyncSchema,
  insertReviewSchema 
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth setup
  await setupAuth(app);

  // Object Storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.post("/api/property-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting property image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/become-host', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUserRole(userId, 'host');
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Properties routes
  app.get('/api/properties', async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get('/api/properties/:id', async (req, res) => {
    try {
      const property = await storage.getPropertyWithHost(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post('/api/properties', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPropertySchema.parse({
        ...req.body,
        hostId: userId,
      });
      
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      res.status(400).json({ message: error.message || "Failed to create property" });
    }
  });

  app.patch('/api/properties/:id', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const property = await storage.getProperty(req.params.id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this property" });
      }

      const updated = await storage.updateProperty(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete('/api/properties/:id', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const property = await storage.getProperty(req.params.id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this property" });
      }

      await storage.deleteProperty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Host-specific properties
  app.get('/api/host/properties', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const properties = await storage.getHostProperties(userId);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching host properties:", error);
      res.status(500).json({ message: "Failed to fetch host properties" });
    }
  });

  // Bookings routes
  app.get('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getBookingWithDetails(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get('/api/guest/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getGuestBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching guest bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/host/bookings', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getHostBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Stripe payment intent for booking - Platform holds funds, payout scheduled after check-in
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, propertyId } = req.body;
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          propertyId,
          userId: req.user.claims.sub,
          hostId: property.hostId,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe Connect routes for hosts
  app.post('/api/host/stripe/create-account', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeAccountId) {
        return res.status(400).json({ message: "Stripe account already exists" });
      }

      const account = await stripe.accounts.create({
        country: 'IT',
        type: 'express',
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        email: user.email || undefined,
        individual: {
          email: user.email || undefined,
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
        },
      });

      await storage.updateUserStripeAccount(userId, account.id, false);

      res.json({ accountId: account.id });
    } catch (error: any) {
      console.error("Error creating Stripe account:", error);
      res.status(500).json({ message: "Error creating Stripe account: " + error.message });
    }
  });

  app.post('/api/host/stripe/onboarding-link', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account found. Create one first." });
      }

      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${req.headers.origin}/dashboard?stripe_refresh=true`,
        return_url: `${req.headers.origin}/dashboard?stripe_return=true`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (error: any) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({ message: "Error creating onboarding link: " + error.message });
    }
  });

  app.get('/api/host/stripe/status', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeAccountId) {
        return res.json({ 
          hasAccount: false,
          onboardingComplete: false,
          chargesEnabled: false 
        });
      }

      const account = await stripe.accounts.retrieve(user.stripeAccountId);

      const onboardingComplete = account.details_submitted && account.charges_enabled;

      if (onboardingComplete !== user.stripeOnboardingComplete) {
        await storage.updateUserStripeAccount(user.stripeAccountId, user.stripeAccountId, onboardingComplete);
      }

      res.json({
        hasAccount: true,
        onboardingComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    } catch (error: any) {
      console.error("Error checking Stripe status:", error);
      res.status(500).json({ message: "Error checking Stripe status: " + error.message });
    }
  });

  app.post('/api/host/stripe/dashboard-link', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account found" });
      }

      const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

      res.json({ url: loginLink.url });
    } catch (error: any) {
      console.error("Error creating dashboard link:", error);
      res.status(500).json({ message: "Error creating dashboard link: " + error.message });
    }
  });

  app.delete('/api/host/stripe/delete-account', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account found" });
      }

      const stripeAccountId = user.stripeAccountId;

      try {
        await stripe.accounts.del(stripeAccountId);
      } catch (stripeError: any) {
        console.error("Stripe API error deleting account:", stripeError);
        
        if (stripeError.type === 'StripeInvalidRequestError') {
          return res.status(400).json({ 
            message: "Impossibile eliminare l'account Stripe. Potrebbe avere un saldo in sospeso o transazioni in corso." 
          });
        }
        
        return res.status(500).json({ 
          message: "Errore durante l'eliminazione dell'account Stripe. Riprova più tardi." 
        });
      }

      await storage.updateUserStripeAccount(userId, null, false);

      console.log(`Stripe account ${stripeAccountId} deleted for user ${userId}`);

      res.json({ deleted: true, message: "Account Stripe eliminato con successo" });
    } catch (error: any) {
      console.error("Error deleting Stripe account:", error);
      res.status(500).json({ message: "Errore imprevisto durante l'eliminazione dell'account" });
    }
  });

  // Create booking with payment
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertBookingSchema.parse({
        ...req.body,
        guestId: userId,
      });

      // Check availability
      const isAvailable = await storage.checkAvailability(
        validatedData.propertyId,
        validatedData.checkIn,
        validatedData.checkOut
      );

      if (!isAvailable) {
        return res.status(400).json({ message: "Property not available for selected dates" });
      }

      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  // Confirm booking after payment
  app.post('/api/bookings/:id/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingBooking = await storage.getBooking(req.params.id);
      
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (existingBooking.guestId !== userId) {
        return res.status(403).json({ message: "Not authorized to confirm this booking" });
      }

      const { paymentIntentId } = req.body;
      
      const totalPriceInCents = Math.round(existingBooking.totalPrice * 100);
      const platformFeePercentage = 0.10;
      const platformFee = Math.round(totalPriceInCents * platformFeePercentage);
      const payoutAmount = totalPriceInCents - platformFee;
      
      const update = await db.update(bookings)
        .set({
          status: 'confirmed',
          stripePaymentIntentId: paymentIntentId,
          payoutStatus: 'pending',
          payoutAmount,
          platformFee,
        })
        .where(
          and(
            eq(bookings.id, req.params.id),
            eq(bookings.status, existingBooking.status),
            eq(bookings.payoutStatus, existingBooking.payoutStatus),
            existingBooking.stripePaymentIntentId
              ? eq(bookings.stripePaymentIntentId, existingBooking.stripePaymentIntentId)
              : sql`${bookings.stripePaymentIntentId} IS NULL`
          )
        )
        .returning();
      
      if (!update[0]) {
        console.log("Booking state changed concurrently, aborting confirmation");
        return res.status(409).json({ message: "Booking state changed, please retry" });
      }
      
      res.json(update[0]);
    } catch (error) {
      console.error("Error confirming booking:", error);
      res.status(500).json({ message: "Failed to confirm booking" });
    }
  });

  // Calendar syncs routes
  app.get('/api/properties/:propertyId/calendar-syncs', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const property = await storage.getProperty(req.params.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to access calendar syncs for this property" });
      }

      const syncs = await storage.getCalendarSyncs(req.params.propertyId);
      res.json(syncs);
    } catch (error) {
      console.error("Error fetching calendar syncs:", error);
      res.status(500).json({ message: "Failed to fetch calendar syncs" });
    }
  });

  app.post('/api/properties/:propertyId/calendar-syncs', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const property = await storage.getProperty(req.params.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to create calendar syncs for this property" });
      }

      const validatedData = insertCalendarSyncSchema.parse({
        ...req.body,
        propertyId: req.params.propertyId,
      });

      const sync = await storage.createCalendarSync(validatedData);
      res.status(201).json(sync);
    } catch (error: any) {
      console.error("Error creating calendar sync:", error);
      res.status(400).json({ message: error.message || "Failed to create calendar sync" });
    }
  });

  app.delete('/api/calendar-syncs/:id', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sync = await storage.getCalendarSync(req.params.id);
      
      if (!sync) {
        return res.status(404).json({ message: "Calendar sync not found" });
      }
      
      const property = await storage.getProperty(sync.propertyId);
      if (!property || property.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this calendar sync" });
      }

      await storage.deleteCalendarSync(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting calendar sync:", error);
      res.status(500).json({ message: "Failed to delete calendar sync" });
    }
  });

  // Availability routes
  app.get('/api/properties/:propertyId/availability', async (req, res) => {
    try {
      const { month, year } = req.query;
      const propertyId = req.params.propertyId;
      
      // Get all bookings for the property in the specified month/year
      const bookings = await storage.getPropertyBookings(propertyId);
      const availability = await storage.getPropertyAvailability(propertyId);
      
      // Return both bookings and availability blocks
      res.json({ bookings, availability });
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/properties/:propertyId/availability', isHost, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const propertyId = req.params.propertyId;

      const availabilitySchema = z.object({
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format. Expected ISO date string (e.g., '2025-01-15')",
        }),
        isAvailable: z.boolean(),
      });

      const validatedData = availabilitySchema.parse(req.body);

      const property = await storage.getProperty(propertyId);
      if (!property || property.hostId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify availability for this property" });
      }

      await storage.setDateAvailability(
        propertyId,
        new Date(validatedData.date),
        validatedData.isAvailable,
        'manual'
      );
      res.status(200).json({ message: "Availability updated successfully" });
    } catch (error: any) {
      console.error("Error updating availability:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reviews routes
  app.get('/api/properties/:propertyId/reviews', async (req, res) => {
    try {
      const reviews = await storage.getPropertyReviews(req.params.propertyId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        guestId: userId,
      });

      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/properties', isAdmin, async (req, res) => {
    try {
      const properties = await storage.getAllPropertiesAdmin();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching all properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.patch('/api/admin/properties/:id/status', isAdmin, async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      const property = await storage.updatePropertyStatus(req.params.id, isActive);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error updating property status:", error);
      res.status(500).json({ message: "Failed to update property status" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['guest', 'host', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post('/api/admin/trigger-payouts', isAdmin, async (req, res) => {
    try {
      console.log('[Admin] Manual payout trigger requested');
      const stats = await processScheduledPayouts();
      res.json({ 
        message: "Payout processing completed",
        status: "success",
        stats: {
          processed: stats.processed,
          failed: stats.failed,
          total: stats.total,
        }
      });
    } catch (error) {
      console.error("Error triggering payouts:", error);
      res.status(500).json({ message: "Failed to trigger payouts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
