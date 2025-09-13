# MIND-MERGE

## Overview

MIND-MERGE is a learning platform that connects students with study communities, enabling real-time chat, knowledge sharing through articles, and collaborative learning. The application is built as a full-stack web application with a React frontend and Express.js backend, designed to foster educational communities and peer-to-peer learning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing
- **Authentication**: Firebase Authentication with Google OAuth integration
- **Real-time Communication**: WebSocket client for live chat functionality
- **UI Components**: Comprehensive component library using Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with WebSocket support for real-time features
- **Authentication**: Firebase token validation with fallback user creation
- **Real-time Features**: WebSocket server using 'ws' library for chat functionality
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Users table with profile information and skills
  - Communities table with metadata and member counts
  - Community members junction table for many-to-many relationships
  - Messages table supporting both community and direct messaging
  - Articles table for knowledge sharing content
- **Migrations**: Drizzle Kit for schema management and migrations

### Authentication & Authorization
- **Primary Auth**: Firebase Authentication with Google OAuth
- **Token Handling**: Firebase ID tokens validated server-side
- **User Management**: Automatic user creation in local database upon first login
- **Session Persistence**: Express sessions for WebSocket authentication
- **Authorization**: Header-based user identification for API requests

### Real-time Communication
- **WebSocket Implementation**: Custom WebSocket client and server using 'ws' library
- **Connection Management**: User-based connection mapping with automatic reconnection
- **Message Broadcasting**: Event-driven message distribution to relevant users
- **Chat Types**: Support for both community group chat and direct messaging

## External Dependencies

### Authentication Services
- **Firebase**: Complete authentication solution with Google OAuth integration
- **Google OAuth**: Social login for user authentication

### Database Services
- **Neon**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

### Development Tools
- **Vite**: Frontend build tool with React plugin and development server
- **Replit Plugins**: Development environment integration with error overlay and cartographer
- **ESBuild**: Server-side bundling for production deployment

### Frontend Dependencies
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives for UI construction
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Wouter**: Lightweight React router
- **React Hook Form**: Form state management and validation

### Backend Dependencies
- **Express.js**: Web application framework
- **WebSocket (ws)**: Real-time bidirectional communication
- **connect-pg-simple**: PostgreSQL session store for Express
- **Zod**: Runtime type validation for API endpoints