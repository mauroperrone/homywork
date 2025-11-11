import cron from 'node-cron';
import { storage } from './storage';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function processScheduledPayouts() {
  console.log('[Scheduler] Starting processScheduledPayouts...');
  
  try {
    const eligibleBookings = await storage.getBookingsForPayout();
    
    if (eligibleBookings.length === 0) {
      console.log('[Scheduler] No eligible bookings for payout');
      return;
    }
    
    console.log(`[Scheduler] Found ${eligibleBookings.length} bookings eligible for payout`);
    
    for (const booking of eligibleBookings) {
      try {
        console.log(`[Scheduler] Processing booking ${booking.id} - Host: ${booking.property?.hostId}, Amount: ${booking.payoutAmount} cents`);
        
        const host = booking.property?.host;
        if (!host) {
          console.error(`[Scheduler] Host not found for booking ${booking.id}`);
          await storage.updateBookingPayout(booking.id, {
            payoutStatus: 'failed',
          });
          continue;
        }
        
        if (!host.stripeAccountId || !host.stripeOnboardingComplete) {
          console.error(`[Scheduler] Host ${host.id} not onboarded to Stripe`);
          await storage.updateBookingPayout(booking.id, {
            payoutStatus: 'failed',
          });
          continue;
        }
        
        const transfer = await stripe.transfers.create({
          amount: booking.payoutAmount!,
          currency: 'eur',
          destination: host.stripeAccountId,
          description: `Payout for booking ${booking.id} - Property: ${booking.property?.title}`,
          metadata: {
            bookingId: booking.id.toString(),
            propertyId: booking.propertyId.toString(),
            hostId: host.id,
          },
        });
        
        console.log(`[Scheduler] Transfer created: ${transfer.id} - Amount: ${transfer.amount} cents`);
        
        await storage.updateBookingPayout(booking.id, {
          payoutStatus: 'completed',
          payoutDate: new Date(),
          stripeTransferId: transfer.id,
        });
        
        console.log(`[Scheduler] Booking ${booking.id} payout completed`);
      } catch (error: any) {
        console.error(`[Scheduler] Failed to process booking ${booking.id}:`, error.message);
        await storage.updateBookingPayout(booking.id, {
          payoutStatus: 'failed',
        });
      }
    }
    
    console.log('[Scheduler] processScheduledPayouts completed');
  } catch (error) {
    console.error('[Scheduler] Error in processScheduledPayouts:', error);
  }
}

export function startScheduler() {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Cron job triggered - running processScheduledPayouts');
    await processScheduledPayouts();
  });
  
  console.log('[Scheduler] Scheduler started - running every 6 hours');
}
