// client/src/api.ts

export type UserRole = "guest" | "host" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role: UserRole;
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/me", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as CurrentUser;
    return data;
  } catch (err) {
    console.error("fetchCurrentUser error", err);
    return null;
  }
}

