import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Plus, Home, Calendar as CalendarIcon, Euro, TrendingUp } from "lucide-react";
import type { Property, Booking } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { StripeConnectOnboarding } from "@/components/StripeConnectOnboarding";
import { HostCalendar } from "@/components/HostCalendar";

export default function Dashboard() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/host/properties"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/host/bookings"],
  });

  // Auto-select first property when properties load (useEffect to avoid setState in render)
  if (!selectedPropertyId && properties && properties.length > 0) {
    setTimeout(() => setSelectedPropertyId(properties[0].id), 0);
  }

  const stats = {
    totalProperties: properties?.length || 0,
    totalBookings: bookings?.length || 0,
    totalEarnings: bookings?.reduce((sum, b) => sum + b.totalPrice, 0) || 0,
    occupancyRate: 75, // TODO: Calculate real occupancy rate
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-chart-2";
      case "pending": return "bg-chart-4";
      case "cancelled": return "bg-destructive";
      case "completed": return "bg-chart-3";
      default: return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confermata";
      case "pending": return "In Attesa";
      case "cancelled": return "Cancellata";
      case "completed": return "Completata";
      default: return status;
    }
  };

  const normalizePayoutStatus = (payoutStatus: string | null | undefined): string => {
    if (!payoutStatus || payoutStatus === "") {
      return "pending";
    }
    const validStatuses = ["completed", "pending", "failed"];
    if (!validStatuses.includes(payoutStatus)) {
      console.warn(`Unexpected payout status: ${payoutStatus}, defaulting to pending`);
      return "pending";
    }
    return payoutStatus;
  };

  const getPayoutStatusColor = (payoutStatus: string): string => {
    switch (payoutStatus) {
      case "completed": return "bg-chart-2";
      case "pending": return "bg-chart-4";
      case "failed": return "bg-destructive";
      default: return "bg-chart-4";
    }
  };

  const getPayoutStatusLabel = (payoutStatus: string): string => {
    switch (payoutStatus) {
      case "completed": return "Pagato";
      case "pending": return "In Attesa Payout";
      case "failed": return "Payout Fallito";
      default: return "In Attesa Payout";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2" data-testid="text-dashboard-title">
            Dashboard Host
          </h1>
          <p className="text-muted-foreground">Gestisci le tue proprietà e prenotazioni</p>
        </div>
        <Button asChild data-testid="button-new-property">
          <Link href="/proprieta/nuova">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Proprietà
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proprietà</p>
              <p className="text-2xl font-bold" data-testid="text-stat-properties">{stats.totalProperties}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-chart-3/10 rounded-full">
              <Calendar className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prenotazioni</p>
              <p className="text-2xl font-bold" data-testid="text-stat-bookings">{stats.totalBookings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-chart-2/10 rounded-full">
              <Euro className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guadagni Totali</p>
              <p className="text-2xl font-bold" data-testid="text-stat-earnings">€{stats.totalEarnings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-chart-4/10 rounded-full">
              <TrendingUp className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasso Occupazione</p>
              <p className="text-2xl font-bold" data-testid="text-stat-occupancy">{stats.occupancyRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stripe Connect Onboarding */}
      <div className="mb-8">
        <StripeConnectOnboarding />
      </div>

      {/* Tabs for Calendario, Proprietà, Prenotazioni */}
      <Tabs defaultValue="properties" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-dashboard">
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="properties" data-testid="tab-properties">
            <Home className="h-4 w-4 mr-2" />
            Proprietà
          </TabsTrigger>
          <TabsTrigger value="bookings" data-testid="tab-bookings">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Prenotazioni
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          {properties && properties.length > 0 ? (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <label htmlFor="property-select" className="text-sm font-medium whitespace-nowrap">
                    Seleziona Proprietà:
                  </label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger id="property-select" className="w-full" data-testid="select-property-calendar">
                      <SelectValue placeholder="Seleziona una proprietà" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
              
              {selectedPropertyId && (
                <HostCalendar propertyId={selectedPropertyId} />
              )}
            </>
          ) : (
            <Card className="p-6">
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4" data-testid="text-no-properties-calendar">
                  Non hai ancora proprietà da gestire
                </p>
                <Button asChild>
                  <Link href="/proprieta/nuova">Pubblica la Prima Proprietà</Link>
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Le Tue Proprietà</h2>
            
            {propertiesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-24 w-32" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover-elevate"
                data-testid={`property-item-${property.id}`}
              >
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full sm:w-32 h-48 sm:h-24 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{property.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {property.city}, {property.country}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">€{property.pricePerNight}/notte</Badge>
                    {property.isActive ? (
                      <Badge variant="default" className="bg-chart-2">Attiva</Badge>
                    ) : (
                      <Badge variant="secondary">Non Attiva</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-initial">
                    <Link href={`/proprieta/${property.id}/modifica`}>Modifica</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-initial">
                    <Link href={`/proprieta/${property.id}`}>Visualizza</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4" data-testid="text-no-properties">
              Non hai ancora pubblicato proprietà
            </p>
            <Button asChild>
              <Link href="/proprieta/nuova">Pubblica la Prima Proprietà</Link>
            </Button>
          </div>
        )}
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Prenotazioni Recenti</h2>
            
            {bookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`booking-item-${booking.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">Prenotazione #{booking.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.checkIn).toLocaleDateString("it-IT")} - {new Date(booking.checkOut).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">€{booking.totalPrice}</p>
                  <Badge className={getStatusColor(booking.status)} data-testid={`badge-status-${booking.id}`}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                  <Badge className={getPayoutStatusColor(normalizePayoutStatus(booking.payoutStatus))} data-testid={`badge-payout-${booking.id}`}>
                    {getPayoutStatusLabel(normalizePayoutStatus(booking.payoutStatus))}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground" data-testid="text-no-bookings">
              Nessuna prenotazione ancora
            </p>
          </div>
        )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
