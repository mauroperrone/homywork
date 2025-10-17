import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Calendar as CalendarIcon, Users } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch?: (params: SearchParams) => void;
  variant?: "hero" | "compact";
}

export interface SearchParams {
  location: string;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
}

export function SearchBar({ onSearch, variant = "compact" }: SearchBarProps) {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState<number>(1);

  const handleSearch = () => {
    onSearch?.({ location, checkIn, checkOut, guests });
  };

  if (variant === "hero") {
    return (
      <div className="w-full max-w-4xl bg-background rounded-lg shadow-lg p-2">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 border-r border-border">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Dove vuoi andare?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-0 focus-visible:ring-0 p-0"
              data-testid="input-location"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 justify-start text-left font-normal px-4",
                  !checkIn && "text-muted-foreground"
                )}
                data-testid="button-checkin"
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {checkIn ? format(checkIn, "d MMM", { locale: it }) : "Check-in"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={it}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 justify-start text-left font-normal px-4",
                  !checkOut && "text-muted-foreground"
                )}
                data-testid="button-checkout"
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {checkOut ? format(checkOut, "d MMM", { locale: it }) : "Check-out"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => date < (checkIn || new Date())}
                initialFocus
                locale={it}
              />
            </PopoverContent>
          </Popover>

          <Select value={guests.toString()} onValueChange={(v) => setGuests(parseInt(v))}>
            <SelectTrigger className="flex-1 border-0 px-4" data-testid="select-guests">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" />
              <SelectValue placeholder="Ospiti" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "ospite" : "ospiti"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} size="lg" className="md:w-auto" data-testid="button-search">
            <Search className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Cerca</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="Cerca destinazione..."
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="max-w-xs"
        data-testid="input-location-compact"
      />
      <Button onClick={handleSearch} data-testid="button-search-compact">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
