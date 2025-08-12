# Multi-User AI Chat Web Application

## Overview

This is a real-time multi-user AI chat web application built with a modern full-stack architecture. The application displays group conversations with a configurable AI assistant and receives messages from external systems via webhooks. It features a clean, minimal interface with real-time message updates using Server-Sent Events (SSE).

The system is designed as a chat interface that connects to external workflow systems (like n8n) and displays conversations between users and an AI assistant identified by configurable event types. Messages are aligned based on their event type - user messages appear on the left, while assistant messages appear on the right.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (December 2024)

### Voice Recording Improvements
- **Audio Format**: Changed to prioritize WAV format over WebM as requested
- **Raw Audio Upload**: Switched from base64 JSON to multipart form data for better webhook compatibility
- **UI Improvements**: Larger voice button with visual press feedback, removed persistent recording indicator
- **Mobile Optimization**: Enhanced touch events and haptic feedback for mobile devices
- **Audio Message Handling**: Audio-only messages play directly without appearing in chat interface

### Deployment Setup
- Added Git repository integration with GitHub (https://github.com/sreejitheg/DFES)
- Created comprehensive README.md with setup and API documentation
- Configured .gitignore for clean repository management

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: EventSource API for Server-Sent Events

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Data Storage**: In-memory storage with ring buffer pattern (100 message limit)
- **Real-time Communication**: Server-Sent Events for broadcasting messages to connected clients
- **API Design**: RESTful endpoints with webhook support for external integrations

### Database and Data Management
- **Primary Storage**: In-memory storage using a custom ring buffer implementation
- **Database ORM**: Drizzle ORM configured for PostgreSQL (configured but not actively used)
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Message Model**: Structured around event types, speaker labels, message content, session IDs, and timestamps

### Authentication and Authorization
- **Webhook Security**: Optional secret-based authentication for incoming webhook requests
- **Client Sessions**: Session management using connect-pg-simple for PostgreSQL session storage
- **Access Control**: Bearer token and header-based webhook authentication

### Development and Build Architecture
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development Server**: Hot module replacement with error overlay integration
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Code Organization**: Monorepo structure with shared schemas and clear separation of concerns

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **@tanstack/react-query**: Server state management and caching for React

### UI and Styling
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Tool for creating variant-based component APIs
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Development tooling for Replit environment

### Validation and Forms
- **zod**: Runtime type validation and schema definition
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Integration between react-hook-form and validation libraries

### External Integrations
- **Webhook Endpoints**: Configured to receive messages from n8n or similar workflow automation tools
- **Server-Sent Events**: Real-time message broadcasting to connected clients
- **Environment Configuration**: Support for configurable assistant events, webhook URLs, and security tokens