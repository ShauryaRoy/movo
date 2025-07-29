# Partiful - Event Planning Platform

## Overview

Partiful is a modern event planning platform designed to replace the chaos of WhatsApp group coordination. It provides comprehensive event management with RSVP tracking, polls, expense splitting, and real-time updates. The application uses a full-stack TypeScript architecture with React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom gaming-themed design system
- **Build Tool**: Vite with ESM modules

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with consistent error handling
- **Authentication**: OpenID Connect with Replit Auth integration
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Connection Pooling**: Neon serverless pooling with WebSocket support

## Key Components

### Authentication System
- **Provider**: Replit OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies with secure flag in production
- **User Management**: Automatic user creation/updates from OIDC claims

### Event Management
- **Event Types**: Support for both online and offline events
- **Host Controls**: Event creation, editing, and deletion by hosts
- **Public/Private**: Configurable event visibility
- **Media Support**: Image uploads for event branding
- **Guest Limits**: Optional maximum guest capacity

### RSVP System
- **Status Options**: Going, Maybe, Not Going responses
- **Plus Ones**: Support for additional guests per RSVP
- **Real-time Updates**: Live RSVP count updates
- **Guest List**: Public visibility of attendee responses

### Interactive Features
- **Polls**: Real-time voting on event decisions
- **Expense Tracking**: Shared expense management and splitting
- **Event Feed**: Post updates and comments on events
- **Notifications**: Toast-based user feedback system

### UI/UX Design
- **Theme**: Dark gaming-inspired design with neon accents
- **Responsive**: Mobile-first design with adaptive navigation
- **Accessibility**: ARIA compliance through Radix UI primitives
- **Performance**: Optimized with React Query caching and Vite bundling

## Data Flow

### Client-Server Communication
1. **API Requests**: Centralized through custom `apiRequest` function
2. **Authentication**: Session cookies sent with all requests
3. **Error Handling**: Unified error boundaries with user-friendly messages
4. **Caching**: TanStack Query provides intelligent cache invalidation

### Database Operations
1. **Type Safety**: Drizzle ORM ensures compile-time type checking
2. **Transactions**: Atomic operations for data consistency
3. **Relationships**: Proper foreign key constraints and cascading deletes
4. **Indexing**: Optimized queries with strategic database indexes

### Real-time Updates
1. **Polling**: Query invalidation triggers fresh data fetches
2. **Optimistic Updates**: Immediate UI updates with server confirmation
3. **Cache Synchronization**: Consistent state across components

## External Dependencies

### Authentication
- **Replit OIDC**: Primary authentication provider
- **OpenID Client**: OAuth 2.0/OpenID Connect implementation

### Database
- **Neon**: Serverless PostgreSQL hosting
- **Connection Pooling**: Automatic scaling and connection management

### UI Framework
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Consistent icon system

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code quality enforcement
- **Vite**: Fast development and build tooling

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite development server with HMR
- **Type Checking**: Real-time TypeScript compilation
- **Database**: Development database with schema synchronization

### Production Build
- **Frontend**: Static asset generation via Vite
- **Backend**: ESBuild compilation to single bundle
- **Environment**: Environment variable configuration
- **Process Management**: Single Node.js process serving both API and static files

### Database Management
- **Migrations**: Drizzle Kit for schema versioning
- **Seeding**: Manual data seeding through API endpoints
- **Backup**: Managed by Neon infrastructure

### Security Considerations
- **HTTPS**: Required for production cookie security
- **CORS**: Configured for allowed domains
- **Session Security**: Secure, HTTP-only cookies with appropriate expiration
- **Environment Variables**: Sensitive data stored securely