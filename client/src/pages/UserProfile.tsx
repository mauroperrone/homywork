import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Calendar, Home, Mail, User, Crown, Briefcase } from "lucide-react";
import type { Booking, Property } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type BookingWithProperty = Booking & { property: Property };

export default function UserProfile() {
  const { user } = useAuth();

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithProperty[]>({
    queryKey: ["/api/guest/bookings"],
  });

  if (!user) {
    return null;
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" /> Admin</Badge>;
      case "host":
        return <Badge variant="secondary" className="gap-1"><Home className="h-3 w-3" /> Host</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><User className="h-3 w-3" /> Ospite</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">Confermata</Badge>;
      case "pending":
        return <Badge variant="secondary">In attesa</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annullata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-bold font-serif" data-testid="text-user-name">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.firstName || user.email}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span data-testid="text-user-email">{user.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {getRoleBadge(user.role)}
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" />
                  ID: {user.id}
                </Badge>
              </div>
            </div>

            {user.role === "guest" && (
              <Button asChild variant="outline" data-testid="button-become-host">
                <Link href="/diventa-host">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Diventa Host
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {user.role === "host" && (
          <>
            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dashboard Host</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full" data-testid="button-view-dashboard">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Le Mie Proprietà
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nuova Proprietà</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" data-testid="button-add-property">
                  <Link href="/proprieta/nuova">
                    <Home className="h-4 w-4 mr-2" />
                    Aggiungi Alloggio
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {user.role === "admin" && (
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pannello Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="default" className="w-full" data-testid="button-view-admin">
                <Link href="/admin">
                  <Crown className="h-4 w-4 mr-2" />
                  Gestione Piattaforma
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cerca Alloggi</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full" data-testid="button-search">
              <Link href="/cerca">
                <Home className="h-4 w-4 mr-2" />
                Trova Workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Bookings Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-serif" data-testid="text-bookings-title">
              Le Mie Prenotazioni
            </h2>
            <p className="text-muted-foreground">
              Gestisci i tuoi soggiorni di workation
            </p>
          </div>
        </div>

        {bookingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-32" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {booking.property.images && booking.property.images.length > 0 && (
                      <img
                        src={booking.property.images[0]}
                        alt={booking.property.title}
                        className="h-32 w-full md:w-48 object-cover rounded-md"
                      />
                    )}

                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-xl font-semibold" data-testid={`text-booking-title-${booking.id}`}>
                            {booking.property.title}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(booking.checkIn), "d MMM yyyy", { locale: it })} - {format(new Date(booking.checkOut), "d MMM yyyy", { locale: it })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Ospiti:</span>{" "}
                          <span className="font-medium">{booking.guests}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div>
                          <span className="text-muted-foreground">Totale:</span>{" "}
                          <span className="font-semibold">€{booking.totalPrice}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div>
                          <span className="text-muted-foreground">Prenotazione ID:</span>{" "}
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{booking.id.slice(0, 8)}</code>
                        </div>
                      </div>

                      <div>
                        <Button asChild variant="outline" size="sm" data-testid={`button-view-property-${booking.id}`}>
                          <Link href={`/proprieta/${booking.property.id}`}>
                            Vedi Dettagli Proprietà
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4" data-testid="text-no-bookings">
                Non hai ancora prenotazioni
              </p>
              <Button asChild data-testid="button-browse-properties">
                <Link href="/cerca">
                  Cerca Alloggi
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
