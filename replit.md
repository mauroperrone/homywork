# HomyWork - Portale Affitti Brevi

## Panoramica
HomyWork è un portale per affitti brevi specializzato per smartworkers e nomadi digitali, con frontend completamente in italiano. L'applicazione permette di trovare alloggi con WiFi certificato e spazi ottimizzati per il lavoro da remoto, mentre gli host possono registrare e gestire proprietà pensate per chi lavora viaggiando.

## 🔧 Bug Fix Critici (Novembre 2025)

### Problema: Flusso Registrazione Host Rotto
**Issue**: Utenti guest che tentavano di pubblicare proprietà ricevevano errore 403 generico senza capire il motivo.

**Root Cause**: 
- L'API `/api/properties` richiede ruolo 'host' (middleware `isHost`)
- Gli utenti si registravano come 'guest' (ruolo default)
- Il pulsante "Diventa Host" portava direttamente al form proprietà
- Il form falliva al submit senza spiegare perché

**Fix Implementata**:
1. **Creata pagina `/diventa-host`**: Pagina informativa con vantaggi e pulsante "Diventa Host Ora"
   - Mostra benefici (guadagno extra, pagamenti sicuri, gestione calendario, WiFi certificato)
   - Chiama `/api/auth/become-host` per upgrade del ruolo
   - Reindirizza automaticamente a `/proprieta/nuova` dopo upgrade
2. **Migliorati messaggi errore**: PropertyForm ora riconosce errore 403 e reindirizza a `/diventa-host`
3. **Test end-to-end**: Verificato intero flusso guest → host → pubblica proprietà

### Problema: Route Conflict `/proprieta/nuova`
**Issue**: Navigando a `/proprieta/nuova`, l'app mostrava "Proprietà non trovata" (404)

**Root Cause**:
- Route dinamica `/proprieta/:id` veniva PRIMA della route statica `/proprieta/nuova` 
- Wouter matchava `/proprieta/:id` interpretando "nuova" come ID
- Server cercava proprietà con id="nuova" → 404

**Fix Implementata**:
- Riordinato le route in `App.tsx`: route statica `/proprieta/nuova` ora viene PRIMA di `/proprieta/:id`
- Questo previene che "nuova" venga interpretato come parametro dinamico

**Impact**: 
- ✅ Flusso registrazione host completamente funzionante
- ✅ Messaggi di errore chiari e informativi
- ✅ UX migliorata con pagina onboarding dedicata
- ✅ Zero errori 404 sulla creazione proprietà

## 🔐 Sistema di Sicurezza Implementato (Ottobre 2025)

### Middleware Role-Based
- **`isHost`**: Verifica che l'utente abbia ruolo 'host' prima di accedere a risorse host
- **`isGuest`**: Verifica che l'utente abbia ruolo 'guest'
- **`isAdmin`**: Verifica che l'utente abbia ruolo 'admin' per operazioni amministrative

### Ruoli Utente
- **guest** (predefinito) - Utente che può cercare e prenotare alloggi
- **host** - Utente che può pubblicare e gestire proprietà
- **admin** - Amministratore con accesso a pannello di gestione

### Route Guards Frontend
Implementati controlli di accesso lato client usando componente `ProtectedRoute`:
- `/proprieta/nuova` → solo host
- `/dashboard` → solo host
- `/admin` → solo admin
- `/checkout` → richiede autenticazione

### Protezione Granulare (Ownership)
Tutte le operazioni sensibili verificano che l'utente sia il proprietario della risorsa:
- ✅ Modifica/eliminazione proprietà → verifica `hostId === userId`
- ✅ Gestione calendar syncs → verifica ownership proprietà
- ✅ Conferma prenotazioni → verifica `guestId === userId`

### Pannello Amministrazione
Accessibile solo ad admin su `/admin`:
- Gestione utenti (visualizza e modifica ruoli)
- Gestione proprietà (visualizza tutte, attiva/disattiva)
- Statistiche piattaforma

## Funzionalità Principali

### Per gli Ospiti
- **Ricerca Avanzata**: Cerca proprietà per località, numero ospiti, prezzo, velocità WiFi
- **Prenotazione**: Sistema di prenotazione con pagamenti Stripe
- **Profilo Utente**: Gestione prenotazioni e preferiti

### Per gli Host
- **Flusso Onboarding**: Pagina dedicata `/diventa-host` che guida gli utenti da guest a host con upgrade esplicito del ruolo
- **Registrazione Proprietà**: Form completo con test velocità WiFi integrato
- **Dashboard**: Visualizzazione proprietà, prenotazioni e statistiche
- **Calendario Sincronizzabile**: Supporto per sync con Airbnb, Booking.com e Google Calendar

## Stack Tecnologico

### Frontend
- React 18 con TypeScript
- Wouter per routing
- TanStack Query per state management
- Shadcn UI + Tailwind CSS per UI
- Design moderno con branding HomyWork (colori: viola #9d4edd e giallo #ffde59)

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
- `GET /api/properties` - Lista tutte le proprietà (pubblico)
- `GET /api/properties/:id` - Dettagli proprietà con host e reviews (pubblico)
- `POST /api/properties` - Crea nuova proprietà (richiede ruolo **host**)
- `PATCH /api/properties/:id` - Aggiorna proprietà (richiede ruolo **host** + ownership)
- `DELETE /api/properties/:id` - Elimina proprietà (richiede ruolo **host** + ownership)
- `GET /api/host/properties` - Proprietà dell'host (richiede ruolo **host**)

### Bookings
- `GET /api/guest/bookings` - Prenotazioni ospite (richiede auth)
- `GET /api/host/bookings` - Prenotazioni host (richiede ruolo **host**)
- `POST /api/bookings` - Crea prenotazione (richiede auth)
- `POST /api/bookings/:id/confirm` - Conferma prenotazione dopo pagamento (richiede auth + ownership)
- `POST /api/create-payment-intent` - Crea Stripe payment intent (richiede auth)

### Calendar Syncs
- `GET /api/properties/:propertyId/calendar-syncs` - Lista sync (richiede ruolo **host** + ownership)
- `POST /api/properties/:propertyId/calendar-syncs` - Crea sync (richiede ruolo **host** + ownership)
- `DELETE /api/calendar-syncs/:id` - Elimina sync (richiede ruolo **host** + ownership)

### Reviews
- `GET /api/properties/:propertyId/reviews` - Reviews proprietà (pubblico)
- `POST /api/reviews` - Crea review (richiede auth)

### Admin (richiede ruolo **admin**)
- `GET /api/admin/users` - Lista tutti gli utenti
- `GET /api/admin/properties` - Lista tutte le proprietà (anche inattive)
- `PATCH /api/admin/users/:id/role` - Modifica ruolo utente
- `PATCH /api/admin/properties/:id/status` - Attiva/disattiva proprietà

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
