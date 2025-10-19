import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Menu, User as UserIcon, Heart, Home } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import homyWorkLogo from "@assets/no FONDO yellow solo logo homywork PICCOLO_1760886467797.png";

import type { User } from "@shared/schema";

interface NavbarProps {
  user?: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

export function Navbar({ user, onAuthClick, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-home">
            <img src={homyWorkLogo} alt="HomyWork Logo" className="h-8 w-8" />
            <span className="text-xl font-bold font-ubuntu">HomyWork</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link href="/" className={`text-sm font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2 ${location === "/" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-home-nav">
              Home
            </Link>
            <Link href="/cerca" className={`text-sm font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2 ${location === "/cerca" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-search">
              Cerca
            </Link>
            {user?.role === "host" && (
              <Link href="/dashboard" className={`text-sm font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2 ${location === "/dashboard" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-dashboard">
                Dashboard
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" className={`text-sm font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2 ${location === "/admin" ? "text-foreground" : "text-muted-foreground"}`} data-testid="link-admin">
                Admin
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  asChild
                  data-testid="button-favorites"
                >
                  <Link href="/preferiti">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                
                {user.role === "guest" && (
                  <Button
                    variant="outline"
                    className="hidden md:flex"
                    asChild
                    data-testid="button-become-host"
                  >
                    <Link href="/diventa-host">Diventa Host</Link>
                  </Button>
                )}
              </>
            )}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || 'User'} />
                      <AvatarFallback>
                        {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium" data-testid="text-user-name">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email?.split('@')[0] || 'Utente'}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-email">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profilo" data-testid="link-profile">Il mio profilo</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/prenotazioni" data-testid="link-bookings">Le mie prenotazioni</Link>
                  </DropdownMenuItem>
                  {user.role === "host" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" data-testid="link-dashboard-menu">Dashboard Host</Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" data-testid="link-admin-menu">Pannello Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} data-testid="button-logout">
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={onAuthClick} data-testid="button-login">
                Accedi
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    href="/"
                    className="text-lg font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-home-mobile"
                  >
                    Home
                  </Link>
                  <Link
                    href="/cerca"
                    className="text-lg font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-search-mobile"
                  >
                    Cerca
                  </Link>
                  {user?.role === "host" && (
                    <Link
                      href="/dashboard"
                      className="text-lg font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-dashboard-mobile"
                    >
                      Dashboard
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="text-lg font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-admin-mobile"
                    >
                      Admin
                    </Link>
                  )}
                  {user && (
                    <>
                      <Link
                        href="/preferiti"
                        className="text-lg font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="link-favorites-mobile"
                      >
                        Preferiti
                      </Link>
                      {user.role === "guest" && (
                        <Link
                          href="/diventa-host"
                          className="text-lg font-medium hover-elevate active-elevate-2 rounded-md px-3 py-2"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid="link-become-host-mobile"
                        >
                          Diventa Host
                        </Link>
                      )}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
