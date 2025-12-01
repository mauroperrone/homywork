// client/src/App.tsx
import React, { useEffect, useState, FormEvent } from "react";
import { useAuth } from "./AuthContext";
import {
  fetchHostProperties,
  createHostProperty,
  type Property,
} from "./api";

function LoginScreen() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>HomyWork</h1>
        <a
          href="/auth/google"
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "none",
            background: "#a855f7",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Accedi
        </a>
      </header>

      <p>
        Effettua il login con Google per accedere alla tua dashboard (guest, host
        o admin).
      </p>
    </div>
  );
}

function GuestDashboard() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Benvenuto su HomyWork</h1>
      <p>
        Il tuo ruolo attuale è <strong>guest</strong>.
      </p>
      <p>
        Puoi navigare il sito e in futuro richiedere il ruolo di host per
        pubblicare immobili.
      </p>
    </div>
  );
}

type HostFormState = {
  title: string;
  description: string;
  city: string;
  address: string;
  pricePerNight: string; // in euro, come testo nel form
  maxGuests: string; // come testo nel form
};

function HostDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<HostFormState>({
    title: "",
    description: "",
    city: "",
    address: "",
    pricePerNight: "",
    maxGuests: "",
  });

  // carica gli immobili dell'host al mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const props = await fetchHostProperties();
        setProperties(props);
      } catch (err) {
        console.error("Error loading host properties", err);
        setError("Errore nel caricamento degli immobili.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // validazione semplice
    if (!form.title.trim()) {
      setError("Il titolo è obbligatorio.");
      return;
    }
    if (!form.pricePerNight.trim()) {
      setError("Il prezzo per notte è obbligatorio.");
      return;
    }
    if (!form.maxGuests.trim()) {
      setError("Il numero massimo di ospiti è obbligatorio.");
      return;
    }

    const price = Number(form.pricePerNight.replace(",", "."));
    const guests = Number(form.maxGuests);

    if (Number.isNaN(price) || price <= 0) {
      setError("Il prezzo per notte deve essere un numero positivo.");
      return;
    }
    if (!Number.isInteger(guests) || guests <= 0) {
      setError("Il numero massimo di ospiti deve essere un intero positivo.");
      return;
    }

    try {
      setSaving(true);
      const newProperty = await createHostProperty({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        pricePerNight: price,
        maxGuests: guests,
      });

      // aggiungiamo il nuovo immobile in cima alla lista
      setProperties((prev) => [newProperty, ...prev]);

      // reset form
      setForm({
        title: "",
        description: "",
        city: "",
        address: "",
        pricePerNight: "",
        maxGuests: "",
      });
    } catch (err: any) {
      console.error("Error creating property", err);
      setError(
        err?.message ??
          "Si è verificato un errore durante la creazione dell'immobile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard Host</h1>
      <p>Qui gestirai immobili, calendari e prenotazioni.</p>

      <section
        style={{
          marginTop: "2rem",
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Crea un nuovo immobile</h2>
        {error && (
          <p style={{ color: "red", marginBottom: "0.5rem" }}>{error}</p>
        )}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <div>
            <label>
              Titolo*{" "}
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
              />
            </label>
          </div>

          <div>
            <label>
              Descrizione{" "}
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label style={{ flex: 1 }}>
              Città{" "}
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.4rem",
                  marginTop: "0.25rem",
                }}
              />
            </label>
            <label style={{ flex: 2 }}>
              Indirizzo{" "}
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.4rem",
                  marginTop: "0.25rem",
                }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label style={{ flex: 1 }}>
              Prezzo per notte (EUR)*{" "}
              <input
                type="text"
                name="pricePerNight"
                value={form.pricePerNight}
                onChange={handleChange}
                placeholder="es. 80"
                style={{
                  width: "100%",
                  padding: "0.4rem",
                  marginTop: "0.25rem",
                }}
              />
            </label>
            <label style={{ flex: 1 }}>
              Ospiti max*{" "}
              <input
                type="text"
                name="maxGuests"
                value={form.maxGuests}
                onChange={handleChange}
                placeholder="es. 3"
                style={{
                  width: "100%",
                  padding: "0.4rem",
                  marginTop: "0.25rem",
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: saving ? "#9ca3af" : "#10b981",
              color: "white",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              marginTop: "0.5rem",
              alignSelf: "flex-start",
            }}
          >
            {saving ? "Salvataggio..." : "Salva immobile"}
          </button>
        </form>
      </section>

      <section>
        <h2>I tuoi immobili</h2>
        {loading ? (
          <p>Caricamento immobili...</p>
        ) : properties.length === 0 ? (
          <p>Non hai ancora pubblicato immobili.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
            {properties.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <h3 style={{ margin: 0 }}>{p.title}</h3>
                {p.city && (
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    {p.city} {p.address ? `- ${p.address}` : ""}
                  </p>
                )}
                <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                  {p.pricePerNight.toFixed(2)} € / notte · max {p.maxGuests}{" "}
                  ospiti
                </p>
                {p.description && (
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    {p.description}
                  </p>
                )}
                {!p.isActive && (
                  <p style={{ margin: "0.25rem 0", color: "#f97316" }}>
                    (Annuncio non attivo)
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard Admin</h1>
      <p>Monitoraggio globale della piattaforma HomyWork.</p>
      <ul>
        <li>👤 Lista utenti (guest / host / admin)</li>
        <li>🏠 Lista immobili pubblicati</li>
        <li>📖 Prenotazioni globali</li>
      </ul>
      {/* In seguito aggiungeremo vere tabelle e filtri */}
    </div>
  );
}

export default function App() {
  const { user, loading, isAdmin, isHost, isGuest } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <p>Caricamento sessione...</p>
      </div>
    );
  }

  // Nessun utente autenticato
  if (!user) {
    return <LoginScreen />;
  }

  if (isAdmin) return <AdminDashboard />;
  if (isHost) return <HostDashboard />;
  if (isGuest) return <GuestDashboard />;

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <p>Ruolo utente non riconosciuto.</p>
    </div>
  );
}
