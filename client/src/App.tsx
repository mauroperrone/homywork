// client/src/App.tsx
import React from "react";
import { useAuth } from "./AuthContext";

function LoginScreen() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem"
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
            fontWeight: 600
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

function HostDashboard() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard Host</h1>
      <p>Qui gestirai immobili, calendari e prenotazioni.</p>
      <ul>
        <li>🏠 Elenco immobili</li>
        <li>➕ Aggiungi nuovo immobile</li>
        <li>🗓️ Gestisci disponibilità e calendari</li>
        <li>📖 Prenotazioni ricevute</li>
      </ul>
      {/* In seguito collegheremo queste sezioni alle tue API esistenti */}
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

