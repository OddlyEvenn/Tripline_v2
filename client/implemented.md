# Frontend - Implemented Features

This document provides an overview of the frontend application structure, pages, and components in the TripLine project.

## 🏗️ Architecture
The frontend is a modern **React** application built with **Vite** and **Tailwind CSS**.
- **Pages**: Located in `src/pages/`, representing the main views.
- **Components**: Reusable UI elements in `src/components/`.
- **API**: Centralized API service layer in `src/api/`.
- **Context**: State management for user sessions and global data.

## 🖼️ Pages & Views

| Page | Description |
| :--- | :--- |
| `LandingPage` | Home page with search functionality. |
| `LoginPage` / `RegisterPage` | User authentication forms. |
| `DashboardPage` | User-specific view for bookings and profile. |
| `SearchResultsPage` | Visual result list for trip searches. |
| `BookingPage` | Seat selection and booking confirmation. |
| `AdminPage` | Comprehensive dashboard for system management. |
| `ForgotPassword` / `ResetPassword` | Account recovery flow. |
| `PaymentSuccessPage` | Post-payment confirmation and ticket view. |

## 🧱 Reusable Components
- **Navbar**: Main navigation with role-based links.
- **SearchBar**: Complex input component for searching trips.
- **JourneyCard**: Summarized view of a single trip option.
- **JourneyTimeline**: Visual representation of the trip route and timing.

## 🎨 Design System
- **Tailwind CSS**: Utility-first styling for a custom, premium look.
- **Lucide React**: Icon system for visual clarity.
- **Framer Motion**: (If used) for smooth transitions and micro-animations.

## 🔌 Integration
- **Axios**: Used for communication with the Spring Boot backend.
- **Context API**: Handles global authentication state.

## 🛠️ Tech Stack
- **React (Vite)**
- **Tailwind CSS**
- **React Router Dom**
- **Axios**
