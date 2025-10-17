# CasaVacanza - Portale Affitti Brevi

## Panoramica
Portale per affitti brevi in stile Airbnb con frontend completamente in italiano. L'applicazione permette agli utenti di cercare e prenotare proprietà, e agli host di registrare e gestire i propri immobili.

## Funzionalità Principali

### Per gli Ospiti
- **Ricerca Avanzata**: Cerca proprietà per località, numero ospiti, prezzo, velocità WiFi
- **Prenotazione**: Sistema di prenotazione con pagamenti Stripe
- **Profilo Utente**: Gestione prenotazioni e preferiti

### Per gli Host
- **Registrazione Proprietà**: Form completo con test velocità WiFi integrato
- **Dashboard**: Visualizzazione proprietà, prenotazioni e statistiche
- **Calendario Sincronizzabile**: Supporto per sync con Airbnb, Booking.com e Google Calendar

## Stack Tecnologico

### Frontend
- React 18 con TypeScript
- Wouter per routing
- TanStack Query per state management
- Shadcn UI + Tailwind CSS per UI
- Design Airbnb-inspired (colore primario: rosso 350° 85% 50%)

### Backend
- Express.js con TypeScript
- PostgreSQL (Neon) con Drizzle ORM
- Replit Auth (Google, Apple, GitHub, Email/Password)
- Stripe per pagamenti
- Object Storage per immagini

## Database Schema

### Tabelle Principali
- `users`: Gestita da Replit Auth (id, email, firstName, lastName, profileImageUrl, role)
- `properties`: Immobili (id, hostId, title, description, images, amenities, wifiSpeed, ecc.)
- `bookings`: Prenotazioni (id, propertyId, guestId, checkIn, checkOut, totalPrice, status)
- `calendar_syncs`: Sincronizzazioni calendario (id, propertyId, platform, icalUrl, accessToken)
- `reviews`: Recensioni (id, propertyId, guestId, rating, comment)
- `availability`: Disponibilità date (id, propertyId, date, isAvailable, source)

## API Endpoints

### Auth
- `GET /api/login` - Inizia flow di login
- `GET /api/logout` - Logout utente
- `GET /api/auth/user` - Ottieni utente corrente
- `POST /api/auth/become-host` - Diventa host

### Properties
- `GET /api/properties` - Lista tutte le proprietà
- `GET /api/properties/:id` - Dettagli proprietà con host e reviews
- `POST /api/properties` - Crea nuova proprietà (richiede auth)
- `PATCH /api/properties/:id` - Aggiorna proprietà (richiede auth)
- `DELETE /api/properties/:id` - Elimina proprietà (richiede auth)
- `GET /api/host/properties` - Proprietà dell'host (richiede auth)

### Bookings
- `GET /api/bookings/:id` - Dettagli prenotazione
- `GET /api/guest/bookings` - Prenotazioni ospite (richiede auth)
- `GET /api/host/bookings` - Prenotazioni host (richiede auth)
- `POST /api/bookings` - Crea prenotazione (richiede auth)
- `POST /api/bookings/:id/confirm` - Conferma prenotazione dopo pagamento
- `POST /api/create-payment-intent` - Crea Stripe payment intent

### Calendar Syncs
- `GET /api/properties/:propertyId/calendar-syncs` - Lista sync
- `POST /api/properties/:propertyId/calendar-syncs` - Crea sync
- `DELETE /api/calendar-syncs/:id` - Elimina sync

### Reviews
- `GET /api/properties/:propertyId/reviews` - Reviews proprietà
- `POST /api/reviews` - Crea review (richiede auth)

## Caratteristiche Speciali

### Test Velocità WiFi
Componente integrato nel form di registrazione proprietà che permette di misurare la velocità WiFi in tempo reale. Mostra download/upload speed e salva i risultati nel database.

### Sincronizzazione Calendario
Sistema per sincronizzare disponibilità con:
- **Airbnb/Booking.com**: Via URL iCal
- **Google Calendar**: Via OAuth e API nativa

### Design System
- **Colori**: Viola primario (#9d4edd / 274° 68% 59%), Giallo accent (#ffde59 / 48° 100% 67%), scala di grigi neutri
- **Tipografia**: Inter (sans-serif), Raleway (serif/headings)
- **Componenti**: Sistema consistente con hover/active states
- **Responsive**: Mobile-first con breakpoints ottimizzati

## Configurazione Ambiente

### Variabili d'Ambiente Richieste
```
DATABASE_URL=<Neon PostgreSQL URL>
SESSION_SECRET=<secret>
STRIPE_SECRET_KEY=<sk_...>
VITE_STRIPE_PUBLIC_KEY=<pk_...>
REPLIT_DOMAINS=<domains>
REPL_ID=<repl_id>
```

### Object Storage
```
DEFAULT_OBJECT_STORAGE_BUCKET_ID=<bucket_id>
PUBLIC_OBJECT_SEARCH_PATHS=<paths>
PRIVATE_OBJECT_DIR=<dir>
```

## Esecuzione

```bash
# Installare dipendenze
npm install

# Push database schema
npm run db:push

# Sviluppo
npm run dev

# Build produzione
npm run build

# Avvio produzione
npm start
```

## Prossimi Passi

### Features da Completare
1. Implementazione upload immagini con Object Storage
2. Logica sincronizzazione calendario iCal (parsing e aggiornamento availability)
3. Sistema messaggistica host-guest
4. Filtri avanzati ricerca (amenities, date availability)
5. Pagina recensioni e rating system completo
6. Dashboard analytics per host
7. Email notifications per prenotazioni

### Ottimizzazioni
1. Caching con React Query
2. Image optimization e lazy loading
3. SEO optimization
4. Performance monitoring
5. Error boundary e fallback UI

## Note Tecniche

- **Auth**: Usa Replit Auth (OpenID Connect) invece di implementazione custom
- **Payments**: Stripe in modalità EUR per mercato italiano
- **Database**: Neon PostgreSQL con connection pooling via @neondatabase/serverless
- **File Upload**: Configurare Uppy per object storage quando necessario
- **Calendar Sync**: Implementare parser iCal per Airbnb/Booking, OAuth flow per Google
