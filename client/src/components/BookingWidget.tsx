import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import type { Property } from "@shared/schema";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingWidgetProps {
  property: Property;
}

export function BookingWidget({ property }: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState<number>(1);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const subtotal = nights * property.pricePerNight;
  const serviceFee = Math.round(subtotal * 0.12); // 12% service fee
  const total = subtotal + serviceFee;

  const handleReserve = () => {
    // TODO: Navigate to checkout with booking details
    console.log("Reserve", { checkIn, checkOut, guests });
  };

  return (
    <Card className="p-6 space-y-6 sticky top-24" data-testid="card-booking-widget">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold" data-testid="text-price">
            €{property.pricePerNight}
          </span>
          <span className="text-muted-foreground ml-1">/ notte</span>
        </div>
        {property.averageRating && (
          <Badge variant="secondary" className="gap-1">
            ★ {property.averageRating.toFixed(1)}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Check-in</label>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => {}}
              data-testid="button-checkin-widget"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {checkIn ? format(checkIn, "d MMM", { locale: it }) : "Seleziona"}
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Check-out</label>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => {}}
              data-testid="button-checkout-widget"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {checkOut ? format(checkOut, "d MMM", { locale: it }) : "Seleziona"}
            </Button>
          </div>
        </div>

        <Calendar
          mode="range"
          selected={{ from: checkIn, to: checkOut }}
          onSelect={(range) => {
            setCheckIn(range?.from);
            setCheckOut(range?.to);
          }}
          disabled={(date) => date < new Date()}
          numberOfMonths={1}
          locale={it}
          className="rounded-md border"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Ospiti</label>
          <Select value={guests.toString()} onValueChange={(v) => setGuests(parseInt(v))}>
            <SelectTrigger data-testid="select-guests-widget">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "ospite" : "ospiti"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {nights > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>€{property.pricePerNight} x {nights} notti</span>
            <span data-testid="text-subtotal">€{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Commissione servizio</span>
            <span data-testid="text-service-fee">€{serviceFee}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Totale</span>
            <span data-testid="text-total">€{total}</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleReserve}
        className="w-full"
        size="lg"
        disabled={!checkIn || !checkOut || nights <= 0}
        data-testid="button-reserve"
      >
        Prenota
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Non ti verrà addebitato nulla in questo momento
      </p>
    </Card>
  );
}
