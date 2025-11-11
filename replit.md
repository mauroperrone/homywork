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
- **WiFi Speed Test**: An integrated component in the property registration form to measure and record WiFi speeds.

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