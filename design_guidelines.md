# Design Guidelines - Portale Affitti Brevi (Stile Airbnb)

## Design Approach

**Selected Approach**: Reference-Based Design ispirato ad Airbnb

**Rationale**: Il settore hospitality richiede un'esperienza visualmente accattivante che trasmetta fiducia, calore e desiderio. Airbnb definisce il gold standard per le piattaforme di affitto brevi con il suo design pulito, orientato alle immagini e focalizzato sull'esperienza utente.

**Core Principles**:
- Primato visivo: le immagini delle proprietà guidano ogni decisione di design
- Fiducia immediata: elementi di social proof e sicurezza ben visibili
- Semplicità funzionale: ricerca e prenotazione senza attriti
- Personalità moderna: viola elegante + giallo energetico, tipografia amichevole

## Color Palette

**Light Mode**:
- Primary Brand: 274 68% 59% (viola moderno #9d4edd)
- Accent: 48 100% 67% (giallo vibrante #ffde59)
- Surface: 0 0% 100% (bianco puro)
- Surface Secondary: 0 0% 98% (grigio chiaro)
- Text Primary: 0 0% 13% (quasi nero)
- Text Secondary: 0 0% 40% (grigio medio)
- Border: 0 0% 88% (grigio bordi)
- Accent Success: 142 76% 36% (verde conferma)

**Dark Mode**:
- Primary Brand: 274 68% 65% (viola più chiaro)
- Accent: 48 100% 72% (giallo più luminoso)
- Surface: 0 0% 10% (grigio scuro)
- Surface Secondary: 0 0% 15% (grigio secondario)
- Text Primary: 0 0% 95% (bianco sporco)
- Text Secondary: 0 0% 65% (grigio chiaro)
- Border: 0 0% 25% (bordi scuri)

## Typography

**Font Families**:
- Primary: 'Inter' via Google Fonts - moderna, leggibile, professionale
- Secondary: 'Raleway' per titoli hero e sezioni speciali

**Type Scale**:
- Hero: text-6xl (60px) font-bold tracking-tight
- Section Headings: text-4xl (36px) font-semibold
- Card Titles: text-xl (20px) font-semibold
- Body: text-base (16px) font-normal leading-relaxed
- Small/Meta: text-sm (14px) font-medium

## Layout System

**Spacing Primitives**: Tailwind units di 2, 4, 6, 8, 12, 16
- Micro spacing (componenti interni): p-2, gap-4
- Standard spacing (card padding): p-6, p-8
- Section spacing: py-12 (mobile), py-16 (tablet), py-24 (desktop)

**Grid System**:
- Container: max-w-7xl mx-auto px-4 md:px-6 lg:px-8
- Property Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Feature Sections: grid-cols-1 md:grid-cols-2 gap-8

## Component Library

**Navigation**:
- Sticky header (sticky top-0 z-50) con backdrop blur
- Logo + Search bar centrale + Menu utente destro
- Mobile: drawer menu con overlay scuro

**Property Cards**:
- Immagine full-width con aspect-ratio-[4/3]
- Overlay gradient per prezzo in alto
- Cuore preferiti in alto a destra
- Info: località, rating stelle, prezzo/notte
- Hover: subtle scale-105 transform

**Search/Filters**:
- Barra ricerca prominente in hero con campi: Dove | Check-in | Check-out | Ospiti
- Filters drawer/modal per: Tipo proprietà, Prezzo, WiFi speed, Servizi
- Tags attivi visibili e rimovibili

**Booking Flow**:
- Sidebar fissa con riepilogo prezzo
- Calendario inline con date disabilitate (sincronizzazione Airbnb/Booking)
- CTA primario grande e sempre visibile
- Trust badges: "Cancellazione flessibile", "Pagamento sicuro Stripe"

**Image Galleries**:
- Hero: Griglia asimmetrica (1 grande + 4 piccole)
- Lightbox fullscreen per visualizzazione
- Thumbnails navigation bottom

**Authentication**:
- Modal centrato con Google/Apple buttons prominenti
- Design minimalista con focus sui provider sociali
- Illustrazione fiducia a lato (desktop)

**Dashboard Proprietario**:
- Sidebar navigation sinistra
- Cards per metriche: Prenotazioni, Guadagni, Occupazione
- Tabella prenotazioni con stati colorati
- Calendario sincronizzato in evidenza

## Images Strategy

**Hero Section**: 
- Full-width hero image (h-[70vh]) mostrando destinazione iconica italiana
- Overlay gradient scuro (from-black/50 to-transparent)
- Search bar centrata sopra l'immagine

**Property Listings**:
- Ogni card con immagine proprietà di alta qualità
- Ratio 4:3 per consistenza visiva
- Lazy loading per performance

**Trust Sections**:
- Foto autentiche di host e ospiti nelle recensioni
- Icone illustrative per servizi e caratteristiche
- Screenshots dashboard per sezione proprietari

**Additional Images**:
- Sezione "Come funziona": illustrazioni step-by-step del processo
- Footer: mappa Italia stilizzata mostrando copertura

## Animations

**Essenziali Only**:
- Card hover: subtle scale (scale-105) con transition-transform
- Image loading: fade-in con skeleton placeholder
- Modal/Drawer: slide-in con backdrop fade
- NO scroll animations, NO complex transitions

## Distinctive Elements

**Italian Localization**:
- Copy warm e accogliente: "Trova la tua casa perfetta", "Benvenuto nella community"
- Formati data europei (gg/mm/aaaa)
- Euro currency (€) sempre visibile

**Trust Indicators**:
- Badge "WiFi Certificato" con speedtest results prominente
- "Sincronizzato con Airbnb/Booking" label sui calendari
- "Pagamenti sicuri Stripe" in checkout

**Unique Features UI**:
- WiFi speedtest widget durante registrazione immobile (gauge visual)
- Calendar sync status indicators (verde = sincronizzato)
- Google Calendar quick-add CTA nel dashboard

Questo design bilancia l'ispirazione Airbnb con elementi unici per differenziare la piattaforma nel mercato italiano degli affitti brevi.