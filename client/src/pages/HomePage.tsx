// client/src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Property = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  address: string | null;
  pricePerNight: number;
  maxGuests: number;
};

const HomePage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) {
          throw new Error("Errore nel caricamento degli immobili");
        }

        // il backend restituisce { properties: [...] }
        const data = await res.json();
        setProperties(data.properties ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Errore imprevisto");
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Benvenuto su HomyWork</h1>
        <p className="text-sm text-gray-700">
          Qui puoi esplorare subito gli immobili disponibili. Il ruolo guest
          deve almeno poter vedere cosa è prenotabile, quindi eccoli.
        </p>
      </header>

      {loading && <div>Caricamento immobili…</div>}

      {error && (
        <div className="text-red-600">
          Si è verificato un errore: {error}
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div>Al momento non ci sono immobili disponibili.</div>
      )}

      {!loading && !error && properties.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Immobili disponibili</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg shadow-sm overflow-hidden flex flex-col"
              >
                {/* Quando avrai immagini, aggiungi qui un <img /> */}
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg mb-1">{p.title}</h3>

                  {p.city && (
                    <p className="text-sm text-gray-600 mb-1">{p.city}</p>
                  )}

                  {p.address && (
                    <p className="text-xs text-gray-500 mb-2">{p.address}</p>
                  )}

                  <p className="text-sm mb-3">
                    {p.description && p.description.length > 120
                      ? p.description.slice(0, 120) + "..."
                      : p.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between text-sm mb-2">
                    <span>{p.pricePerNight} €/notte</span>
                    <span>{p.maxGuests} ospiti</span>
                  </div>

                  <div className="mt-1">
                    <Link
                      to={`/property/${p.id}`}
                      className="text-sm underline"
                    >
                      Dettagli immobile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
