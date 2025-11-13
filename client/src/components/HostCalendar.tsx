import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Calendar as CalendarIcon, X, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";

interface HostCalendarProps {
  propertyId: string;
}

interface AvailabilityData {
  date: string;
  isAvailable: boolean;
  source: string;
}

interface BookingData {
  checkIn: string;
  checkOut: string;
  status: string;
}

interface CalendarData {
  bookings: BookingData[];
  availability: AvailabilityData[];
}

export function HostCalendar({ propertyId }: HostCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Fetch calendar data (bookings + availability) for property
  const { data: calendarData, isLoading } = useQuery<CalendarData>({
    queryKey: ['/api/properties', propertyId, 'availability'],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/availability`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      return res.json();
    },
    enabled: !!propertyId,
  });

  const bookings = calendarData?.bookings ?? [];
  const availability = calendarData?.availability ?? [];

  // Mutation to toggle availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ date, isAvailable }: { date: Date; isAvailable: boolean }) => {
      return apiRequest('POST', `/api/properties/${propertyId}/availability`, {
        date: format(date, 'yyyy-MM-dd'),
        isAvailable,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties', propertyId, 'availability'] 
      });
      toast({
        title: "Disponibilità aggiornata",
        description: "Il calendario è stato aggiornato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile aggiornare la disponibilità.",
      });
    },
  });

  // Check if date is booked
  const isDateBooked = (date: Date): boolean => {
    return bookings.some(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return date >= checkIn && date <= checkOut && booking.status === 'confirmed';
    });
  };

  // Check if date is blocked
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability.find(a => a.date === dateStr);
    return avail ? !avail.isAvailable : false;
  };

  // Check if date is available
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability.find(a => a.date === dateStr);
    return avail ? avail.isAvailable : true; // Default available if not set
  };

  // Handle date click
  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    
    // Can't modify past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      toast({
        variant: "destructive",
        title: "Data non modificabile",
        description: "Non puoi modificare date passate.",
      });
      return;
    }

    // Can't modify booked dates
    if (isDateBooked(date)) {
      toast({
        variant: "destructive",
        title: "Data prenotata",
        description: "Non puoi modificare una data con prenotazione confermata.",
      });
      return;
    }

    setSelectedDate(date);
  };

  // Toggle selected date
  const handleToggleAvailability = (makeAvailable: boolean) => {
    if (!selectedDate) return;
    
    toggleAvailabilityMutation.mutate({
      date: selectedDate,
      isAvailable: makeAvailable,
    });
    
    setSelectedDate(undefined);
  };

  // Custom modifiers for day styling
  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    blocked: (date: Date) => !isDateBooked(date) && isDateBlocked(date),
    available: (date: Date) => !isDateBooked(date) && isDateAvailable(date),
    selected: (date: Date) => selectedDate ? isSameDay(date, selectedDate) : false,
  };

  const modifiersClassNames = {
    booked: "bg-muted text-muted-foreground cursor-not-allowed",
    blocked: "bg-destructive/20 text-destructive-foreground",
    available: "bg-green-500/20 text-green-700 dark:text-green-400",
    selected: "ring-2 ring-primary ring-offset-2",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="text-xl">Calendario Disponibilità</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              data-testid="button-prev-month"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              data-testid="button-next-month"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            <Badge variant="outline" className="bg-green-500/20 text-green-700 dark:text-green-400">
              <Check className="h-3 w-3 mr-1" />
              Disponibile
            </Badge>
            <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground">
              <X className="h-3 w-3 mr-1" />
              Bloccato
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Prenotato
            </Badge>
          </div>

          {/* Calendar */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateClick}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={it}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border w-full"
                data-testid="calendar-availability"
              />
            </div>
          )}

          {/* Selected Date Actions */}
          {selectedDate && (
            <Card className="bg-accent/50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Data selezionata: {format(selectedDate, 'dd MMMM yyyy', { locale: it })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleToggleAvailability(true)}
                      disabled={toggleAvailabilityMutation.isPending || isDateAvailable(selectedDate)}
                      className="flex-1"
                      data-testid="button-mark-available"
                    >
                      {toggleAvailabilityMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Sblocca
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleToggleAvailability(false)}
                      disabled={toggleAvailabilityMutation.isPending || isDateBlocked(selectedDate)}
                      className="flex-1"
                      data-testid="button-mark-blocked"
                    >
                      {toggleAvailabilityMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Blocca
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="w-full"
                    data-testid="button-cancel-selection"
                  >
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
