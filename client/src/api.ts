// client/src/api.ts

export type UserRole = "guest" | "host" | "admin";

/** Utente corrente */
export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role: UserRole;
}

/** Modello immobile come ritorna il backend */
export interface Property {
  id: string;
  hostId: string;
  title: string;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  pricePerNight: number; // in euro
  maxGuests: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Payload per creare un nuovo immobile lato host */
export interface CreatePropertyInput {
  title: string;
  description?: string;
  city?: string;
  address?: string;
  pricePerNight: number; // in euro
  maxGuests: number;
}

/**
 * Normalizza un qualsiasi oggetto grezzo in un CurrentUser,
 * accettando sia { user: {...} } sia { ... }.
 */
function normalizeCurrentUser(raw: any): CurrentUser | null {
  if (!raw) return null;

  // Se il backend manda { user: {...} }, prendiamo raw.user
  const candidate = raw.user ?? raw;

  if (!candidate || typeof candidate !== "object") return null;
  if (!candidate.email || !candidate.id) return null;

  const rawRole = (candidate.role ?? "guest") as string;
  let role: UserRole;

  switch (rawRole) {
    case "guest":
    case "host":
    case "admin":
      role = rawRole;
      break;
    default:
      // qualunque altra cosa la consideriamo guest
      role = "guest";
      break;
  }

  return {
    id: String(candidate.id),
    email: String(candidate.email),
    name: candidate.name ?? null,
    picture: candidate.picture ?? null,
    role,
  };
}

/**
 * Legge l'utente corrente da /api/me
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const user = normalizeCurrentUser(data);
    return user;
  } catch (err) {
    console.error("fetchCurrentUser error", err);
    return null;
  }
}

/**
 * Legge gli immobili dell'host loggato da /api/host/properties
 */
export async function fetchHostProperties(): Promise<Property[]> {
  try {
    const res = await fetch("/api/host/properties", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      console.error("fetchHostProperties error status", res.status);
      return [];
    }

    const data = (await res.json()) as { properties: Property[] };
    return data.properties ?? [];
  } catch (err) {
    console.error("fetchHostProperties error", err);
    return [];
  }
}

/**
 * Crea un nuovo immobile per l'host loggato
 * chiama POST /api/host/properties
 */
export async function createHostProperty(
  input: CreatePropertyInput,
): Promise<Property> {
  const res = await fetch("/api/host/properties", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `createHostProperty failed: ${res.status} ${res.statusText} - ${text}`,
    );
  }

  const data = (await res.json()) as { property: Property };
  if (!data.property) {
    throw new Error("Invalid response from server: missing property");
  }
  return data.property;
}
