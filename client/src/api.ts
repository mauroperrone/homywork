// client/src/api.ts

export type UserRole = "guest" | "host" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role: UserRole;
}

/**
 * Recupera l'utente corrente dal backend.
 * Il backend risponde con un JSON del tipo:
 * {
 *   "user": {
 *     "id": "...",
 *     "email": "...",
 *     "name": "...",
 *     "picture": "...",
 *     "role": "guest" | "host" | "admin"
 *   }
 * }
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      // 401 o altro → nessun utente loggato
      return null;
    }

    const data = (await res.json()) as { user: CurrentUser | null };

    if (!data || !data.user) {
      return null;
    }

    return data.user;
  } catch (err) {
    console.error("fetchCurrentUser error", err);
    return null;
  }
}


