# Design Guidelines - HomyWork (Portale per Smartworkers e Nomadi Digitali)

## Design Approach

**Selected Approach**: Design orientato alla produttività per nomadi digitali

**Rationale**: HomyWork si rivolge a smartworkers e nomadi digitali che cercano alloggi per workation. Il design deve trasmettere professionalità, affidabilità del WiFi e comfort per chi lavora da remoto, con un'esperienza visivamente accattivante che enfatizza connettività, spazi di lavoro e produttività.

**Core Principles**:
- WiFi al centro: la connessione veloce e certificata è il valore primario
- Produttività e comfort: immagini di spazi di lavoro, non solo vacanze
- Fiducia immediata: velocità WiFi verificata, calendari sincronizzati
- Personalità moderna: viola elegante + giallo energetico per brand distintivo

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
- Brand: 'Ubuntu' per il logo HomyWork - carattere distintivo del brand

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
- Logo HomyWork + Search bar centrale + Menu utente destro
- Mobile: drawer menu con overlay scuro

**Property Cards**:
- Immagine full-width con aspect-ratio-[4/3]
- Badge WiFi speed prominente
- Info: località, rating stelle, prezzo/notte, velocità WiFi
- Hover: subtle scale-105 transform

**Search/Filters**:
- Barra ricerca prominente in hero con campi: Dove | Check-in | Check-out | Ospiti
- Filters drawer/modal per: Tipo proprietà, Prezzo, **WiFi speed minima**, Servizi
- Tags attivi visibili e rimovibili

**Booking Flow**:
- Sidebar fissa con riepilogo prezzo
- Calendario inline con date disabilitate (sincronizzazione Airbnb/Booking)
- **Badge WiFi certificato ben visibile**
- CTA primario grande e sempre visibile
- Trust badges: "WiFi Certificato", "Pagamento sicuro Stripe"

**Image Galleries**:
- Hero: Griglia asimmetrica (1 grande + 4 piccole)
- **Includere immagini di spazi di lavoro/desk setup**
- Lightbox fullscreen per visualizzazione
- Thumbnails navigation bottom

**Authentication**:
- Modal centrato con Google/Apple buttons prominenti
- Design minimalista con focus sui provider sociali
- Messaggio "Inizia la tua workation"

**Dashboard Proprietario**:
- Sidebar navigation sinistra
- Cards per metriche: Prenotazioni, Guadagni, Occupazione
- **WiFi Speed Test tool prominente**
- Tabella prenotazioni con stati colorati
- Calendario sincronizzato in evidenza

## Images Strategy

**Hero Section**: 
- Full-width hero image (h-[70vh]) mostrando **smartworker che lavora con vista**
- Overlay gradient scuro (from-black/60 to-transparent)
- Search bar centrata sopra l'immagine

**Property Listings**:
- Ogni card con immagine che mostra **spazio di lavoro/desk quando possibile**
- Ratio 4:3 per consistenza visiva
- Badge WiFi speed overlay sull'immagine
- Lazy loading per performance

**Trust Sections**:
- Foto autentiche di nomadi digitali che lavorano negli alloggi
- Icone illustrative per WiFi, workspace, servizi
- Screenshots WiFi speed test nelle recensioni

**Additional Images**:
- Sezione "Come funziona": illustrazioni step-by-step con focus su WiFi test
- Sezione "Perché HomyWork": immagini di remote workers in location italiane

## Animations

**Essenziali Only**:
- Card hover: subtle scale (scale-105) con transition-transform
- Image loading: fade-in con skeleton placeholder
- Modal/Drawer: slide-in con backdrop fade
- WiFi speed indicator: animated progress bar
- NO scroll animations, NO complex transitions

## Distinctive Elements

**Italian Localization**:
- Copy professionale ma friendly: "Lavora da dove vuoi", "La tua workstation con vista"
- Formati data europei (gg/mm/aaaa)
- Euro currency (€) sempre visibile
- Terminologia workation: "workation", "smartworking", "nomadi digitali"

**Trust Indicators**:
- **Badge "WiFi Certificato" con velocità prominente e colorato**
- "Sincronizzato con Airbnb/Booking" label sui calendari
- "Pagamenti sicuri Stripe" in checkout
- Icone workspace/desk quando disponibili

**Unique Features UI**:
- **WiFi speedtest widget durante registrazione immobile con gauge visual (feature chiave)**
- WiFi speed badge colorato su ogni property card (verde >50Mbps, giallo 20-50, rosso <20)
- Calendar sync status indicators (verde = sincronizzato)
- Workspace amenities checklist (scrivania, sedia ergonomica, luce naturale)

**Target Audience Messaging**:
- Hero: "Lavora da dove vuoi, vivi dove sogni"
- Featured: "Workation in Evidenza"
- CTA: Focus su host che offrono spazi per smartworking
- WiFi sempre in primo piano in ogni comunicazione

Questo design bilancia professionalità per il target smartworker/nomade digitale con l'attrattiva visiva delle location italiane, mantenendo il WiFi certificato come elemento differenziante chiave.
