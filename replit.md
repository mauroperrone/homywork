# HomyWork - Portale Affitti Brevi

## Overview
HomyWork is a short-term rental portal designed for smartworkers and digital nomads. It enables users to find accommodations with certified WiFi and optimized workspaces, while hosts can manage properties tailored for remote work. The platform aims to provide a reliable and seamless experience for remote workers seeking suitable living and working conditions.

## User Preferences
I prefer detailed explanations. Ask before making major changes. I want iterative development. I prefer simple language. I do not want changes to the existing folder structure unless explicitly requested.

## System Architecture
HomyWork is built as a single-page application (SPA) with a clear separation between frontend and backend.

### UI/UX Decisions
- **Design System**: Modern and consistent, utilizing Shadcn UI and Tailwind CSS with a mobile-first approach.
- **Branding**: Primary color: purple (#9d4edd), accent color: yellow (#ffde59).
- **Typography**: Inter for sans-serif text and Raleway for headings.
- **Accessibility**: Implemented `aria-label` and proper focus trapping.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, and TanStack Query for server state management.
- **Backend**: Express.js with TypeScript.
- **Authentication**: Replit Auth for various login methods, supporting role-based access control (`guest`, `host`, `admin`).
- **Database**: PostgreSQL (Neon) managed with Drizzle ORM.
- **Payments**: Stripe integrated for secure processing, including Stripe Connect Express for host payouts with a 10% platform fee. Payments are held until check-in + 1 day before transfer to hosts.
- **Object Storage**: Used for property images with Uppy for file uploads, including image management features (delete, reorder, primary image).
- **Calendar Synchronization**: Supports iCal URL imports (Airbnb, Booking.com) and native Google Calendar API integration via OAuth.
- **WiFi Speed Test**: Integrated component in property forms for manual input or automated testing. Speeds are persisted and displayed with quality badges.
- **Canonical User Identity**: Implemented a defensive `upsertUser` strategy to handle existing emails with different OIDC `sub` IDs, ensuring stable user identities and preserving referential integrity across provider switches.

### Feature Specifications
- **Guest Features**: Advanced property search, booking system, user profile for managing bookings and favorites.
- **Host Features**: Dedicated onboarding, comprehensive property registration with WiFi speed test, dashboard for property and booking management, synchronizable calendar.
- **Admin Features**: Administration panel for managing users (roles) and properties (activation/deactivation).
- **Security**: Role-based middleware (`isHost`, `isGuest`, `isAdmin`) and `ProtectedRoute` components with granular ownership checks.

### System Design Choices
- **API-driven**: Clear RESTful API endpoints.
- **Scalability**: PostgreSQL with connection pooling.
- **User Experience**: Focus on clear error messages, intuitive workflows, and real-time feedback.

## External Dependencies
- **Replit Auth**: For user authentication.
- **Stripe**: For payment processing and host payouts.
- **Neon (PostgreSQL)**: Managed database service.
- **Google Cloud Storage (GCS)**: For property image storage.
- **Uppy**: Frontend library for file uploads.
- **Airbnb / Booking.com**: iCal URL integration for calendar synchronization.
- **Google Calendar API**: For native calendar synchronization.