# HomyWork - Portale Affitti Brevi

## Overview
HomyWork is a short-term rental portal specifically designed for smartworkers and digital nomads, with a frontend entirely in Italian. The application helps users find accommodations with certified WiFi and optimized workspaces for remote work. Hosts can register and manage properties tailored for individuals who work while traveling. The project aims to provide a reliable platform for remote workers, ensuring suitable working conditions and a seamless booking experience.

## User Preferences
I prefer detailed explanations. Ask before making major changes. I want iterative development. I prefer simple language. I do not want changes to the existing folder structure unless explicitly requested.

## System Architecture
HomyWork is built as a single-page application (SPA) with a clear separation between frontend and backend.

### UI/UX Decisions
- **Design System**: Modern and consistent, utilizing Shadcn UI and Tailwind CSS.
- **Branding**: Primary color is purple (#9d4edd), accent color is yellow (#ffde59), with a neutral grayscale palette.
- **Typography**: Inter for sans-serif text and Raleway for headings.
- **Responsiveness**: Mobile-first approach with optimized breakpoints.
- **Accessibility**: Implemented `aria-label` for icon-only buttons and proper focus trapping.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript. Wouter is used for routing, and TanStack Query manages server state.
- **Backend**: Built with Express.js and TypeScript.
- **Authentication**: Utilizes Replit Auth for Google, Apple, GitHub, and Email/Password logins, with role-based access control (`guest`, `host`, `admin`).
- **Database**: PostgreSQL (Neon) managed with Drizzle ORM.
- **Payments**: Stripe is integrated for secure payment processing.
- **Object Storage**: Used for storing property images.
- **File Uploads**: Uppy library is used for image uploads, refactored for Safari compatibility using Shadcn Dialog and Uppy's inline Dashboard.
- **Image Management**: Includes features for deleting, reordering, and setting primary images with visual feedback.
- **Calendar Synchronization**: Supports iCal URL imports (Airbnb, Booking.com) and native Google Calendar API integration via OAuth for availability management.
- **WiFi Speed Test**: Integrated component in property forms supporting both manual input and automated testing. Hosts can enter known WiFi speeds directly or run simulated speed tests. Values persist permanently in the database and display on property detail pages with quality badges.

## Recent Feature Implementations

### WiFi Speed Persistence (November 2025)
**Status**: ✅ Completed and Tested

**Problem Solved:**
WiFi speed test results were not persisting in the database. When hosts edited properties, the WiFi speed value would reset, and it didn't appear in property detail pages.

**Implementation:**

1. **WiFiSpeedTest Component Refactored** (`client/src/components/WiFiSpeedTest.tsx`):
   - Transformed into controlled component with `value` and `onChange` props
   - Added visible numeric input field (data-testid="input-wifi-speed")
   - Validation: min="0", max="2000", type="number", integer values only
   - Supports **two input methods**:
     - **Manual Entry**: Direct input for known WiFi speeds
     - **Automatic Test**: Simulated speed test (20-170 Mbps random)
   - Real-time quality feedback with colored badges:
     - ≥100 Mbps: "Eccellente" (green)
     - 50-99 Mbps: "Buona" (blue)
     - <50 Mbps: "Sufficiente" (yellow)

2. **PropertyForm Integration** (`client/src/pages/PropertyForm.tsx`):
   - WiFiSpeedTest receives `value={wifiSpeed}` and `onChange={setWifiSpeed}`
   - Pre-populates wifiSpeed from existingProperty when editing
   - Submit includes wifiSpeed **only if defined**: `...(wifiSpeed !== undefined && { wifiSpeed })`
   - This prevents overwriting existing values with `undefined` during edits

3. **Database Schema** (`shared/schema.ts`):
   - Field: `wifiSpeed: integer("wifi_speed")` (nullable)
   - Validation: Zod schema with min=1, max=2000, integer-only
   - Backend storage auto-handles via spread operator

4. **PropertyDetail Display** (`client/src/pages/PropertyDetail.tsx`):
   - WiFi speed badge appears when property.wifiSpeed is truthy
   - Shows: `<Wifi icon> {wifiSpeed} Mbps`
   - Badge color matches quality rating
   - data-testid="badge-wifi-speed"

**Behavior:**
- ✅ **Create property**: WiFi speed saved if entered (manual or test)
- ✅ **Edit property without touching WiFi**: Previous value persists
- ✅ **Edit property with new WiFi value**: Updates to new value
- ✅ **Manual input**: Type speed directly (e.g., 150)
- ✅ **Automatic test**: Click button, progress bar, result auto-fills input
- ✅ **Display**: Badge visible on property page with icon and quality label

**Testing:**
- End-to-end test passed all scenarios:
  - Property creation with manual WiFi (150 Mbps) → persisted
  - Property edit changing WiFi (150 → 200) → persisted
  - Property edit without touching WiFi → value retained
  - Automatic test (resulted in 136 Mbps) → persisted
  - Badge display verified on property detail page

**User Experience:**
- Input field always visible for transparency
- Helper text: "Velocità minima raccomandata: 50 Mbps per smart working"
- Dual options clearly explained: "Inserisci la velocità manualmente o esegui un test automatico"
- Button label changes based on state: "Avvia Test Automatico" / "Ripeti Test Automatico"
- Input disabled during test to prevent conflicts

**Technical Notes:**
- Component follows React controlled component pattern
- Form state is single source of truth (react-hook-form compatible)
- Conditional payload inclusion prevents null overwrites
- Validation enforced at component, schema, and database levels

### Feature Specifications
- **Guest Features**: Advanced property search (location, guests, price, WiFi speed), booking system, user profile for managing bookings and favorites.
- **Host Features**: Dedicated onboarding page (`/diventa-host`) to upgrade user role, comprehensive property registration form with WiFi speed test, dashboard for property and booking management, synchronizable calendar.
- **Admin Features**: An administration panel (accessible via `/admin`) for managing users (roles) and properties (activation/deactivation).
- **Security**: Role-based middleware (`isHost`, `isGuest`, `isAdmin`) on the backend and `ProtectedRoute` components on the frontend. Granular ownership checks for all sensitive operations (property modification/deletion, calendar syncs, booking confirmations).

### System Design Choices
- **API-driven**: Clear RESTful API endpoints for all functionalities.
- **Scalability**: PostgreSQL with connection pooling (Neon) and a microservices-oriented approach where applicable.
- **User Experience**: Focus on clear error messages, intuitive workflows (e.g., host onboarding, property editing), and real-time feedback (skeletons, toasts).

## External Dependencies
- **Replit Auth**: For user authentication (Google, Apple, GitHub, Email/Password).
- **Stripe**: For payment processing (creating payment intents, handling payments).
- **Neon (PostgreSQL)**: Managed database service.
- **Google Cloud Storage (GCS)**: Used for storing property images.
- **Uppy**: Frontend library for file uploads.
- **Airbnb / Booking.com**: iCal URL integration for calendar synchronization.
- **Google Calendar API**: For native calendar synchronization.