# 🚀 TripLine: The Future of Multi-Modal Travel

![TripLine Banner](file:///C:/Users/admin/.gemini/antigravity/brain/24b92e0c-03bf-4485-bf6b-88c9e47a8db9/tripline_banner_1773751657379.png)

> **TripLine** is a premium, full-stack travel booking ecosystem designed for seamless journey planning across **Flights, Trains, and Buses**. Built with a robust **Spring Boot** backend and a high-performance **React** frontend, it offers a state-of-the-art experience for modern travelers.

---

## 🎨 Human-Computer Interaction (HCI) Perspective

TripLine is engineered with **User-Centric Design** at its core. Our interface adheres to industry-standard HCI principles to ensure maximum usability and delight.

### 🧠 Core HCI Principles Applied
*   **Visibility of System Status**: Real-time seat availability and booking progress indicators (e.g., interactive seat maps).
*   **Consistency & Standards**: A unified design language across all transport modes, ensuring users don't have to relearn the interface for different bookings.
*   **Error Prevention**: Smart validation on search inputs (e.g., date pickers that prevent past-date selection) and confirmation modals before financial transactions.
*   **Aesthetic & Minimalist Design**: A "Premium Dark/Light" theme that prioritizes essential information, reducing cognitive load during complex trip planning.
*   **Help & Documentation**: Integrated "DocPage" providing clear guidance on system features.

---

## 🗄️ Database Management System (DBMS) Perspective

The system architecture is backed by a highly normalized relational schema designed for **Data Integrity** and **High-Performance Querying**.

### 📊 Entity-Relationship (ER) Diagram
```mermaid
erDiagram
    USER ||--o{ BOOKING : makes
    USER {
        Long id PK
        String name
        String email UK
        String password
        String role
        String phone_number
        Boolean is_verified
    }
    BOOKING ||--|{ TICKET : contains
    BOOKING {
        Long id PK
        Long user_id FK
        BigDecimal total_price
        String status
        String stripe_session_id
        String stripe_payment_intent_id
    }
    TRIP ||--o{ TICKET : generates
    TICKET {
        Long id PK
        Long booking_id FK
        Long trip_id FK
        String passenger_name
        String passenger_email
        String passenger_phone
        String seat_number
        String coach_number
        String seat_class
        String berth_type
        BigDecimal leg_price
        Integer leg_order
    }
    CARRIER ||--o{ VEHICLE : owns
    CARRIER {
        Long id PK
        String name
        String contact_email
        String contact_phone
        Boolean is_active
    }
    VEHICLE ||--o{ TRIP : operates
    VEHICLE {
        Long id PK
        Long carrier_id FK
        String name
        String vehicle_number
        String transport_mode
        Integer capacity
        Integer total_seats
        Boolean is_active
    }
    STATION ||--o{ TRIP : origin_of
    STATION ||--o{ TRIP : destination_of
    STATION {
        Long id PK
        String name
        String city
        String state
        String country
        String type
        Boolean is_active
    }
    TRIP {
        Long id PK
        Long vehicle_id FK
        Long origin_station_id FK
        Long destination_station_id FK
        DateTime departure_time
        DateTime arrival_time
        BigDecimal price
        Double distance
        String transport_mode
        Integer available_seats
        Boolean is_active
    }
    TRIP ||--o{ FLIGHT_SEAT : has
    FLIGHT_SEAT {
        Long id PK
        Long trip_id FK
        String seat_no
        Integer row_no
        String column_no
        String seat_class
        String status
        BigDecimal price
        DateTime locked_until
    }
    TRIP ||--o{ TRAIN_SEAT : has
    TRAIN_SEAT {
        Long id PK
        Long trip_id FK
        String coach_no
        String seat_no
        String berth_type
        String seat_class
        String status
        BigDecimal price
        DateTime locked_until
    }
    TRIP ||--o{ BUS_SEAT : has
    BUS_SEAT {
        Long id PK
        Long trip_id FK
        String seat_no
        Integer row_no
        String column_no
        String seat_type
        String status
        BigDecimal price
        DateTime locked_until
    }
    SYSTEM_CONFIG {
        Long id PK
        String config_key UK
        String config_value
        String description
    }
```

### 🔐 Data Integrity & Scalability
- **Transactional Integrity**: ACID properties are strictly maintained during the seat reservation process using Spring Data JPA's `@Transactional` scope.
- **Indexing Strategy**: Optimized lookup for scheduled trips using composite indexes on `(origin_station_id, destination_station_id, departure_time)`.
- **Constraint Management**: Foreign key constraints ensure referential integrity across Stations, Vehicles, and Trips.

---

## 🏗️ System Architecture

TripLine follows a decoupled **Client-Server Architecture** optimized for scalability and security.

```mermaid
graph TD
    subgraph "Frontend (React + Vite)"
        UI[User Interface] --> State[Context API / Hooks]
        State --> API_Client[Axios Service Layer]
    end

    subgraph "Backend (Spring Boot)"
        API_Client -- "RESTful API (JSON)" --> Controller[REST Controllers]
        Controller --> Service[Business Logic Layer]
        Service --> Security[Spring Security / JWT]
        Service --> Repo[JPA Repository Layer]
    end

    subgraph "Database (Oracle/H2)"
        Repo --> DB[(Relational DB)]
    end

    subgraph "External Integrations"
        Service --> Stripe[Stripe Payment Gateway]
        Service --> Mail[SMTP Email Service]
    end
```

---

## 🚀 Key Features
- **Multi-Modal Search**: Single search bar for Flights, Trains, and Buses.
- **Interactive Seat Selection**: Visual SVG-based seat selection for all vehicles.
- **Dynamic Pricing**: Real-time fare calculation based on journey distance and mode.
- **Admin Command Center**: Complete dashboard for managing carriers, vehicles, and system configurations.
- **JWT Security**: Robust authentication with secure cookie-based session management.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Java 17, Spring Boot 3.x, Spring Security, JWT, Lombok.
- **Persistence**: Hibernate/JPA, Oracle SQL / PostgreSQL.
- **Infrastructure**: Vercel (Frontend), Render (Backend), Maven.

---

## 📦 Installation & Setup

### Prerequisites
- JDK 17+
- Node.js 18+
- Maven 3.x

### Backend Setup
1. Navigate to `/backend`
2. Configure `.env` with your DB credentials and Stripe keys.
3. Run `mvn spring-boot:run`

### Frontend Setup
1. Navigate to `/frontend`
2. Run `npm install`
3. Run `npm run dev`

---
*Developed with ❤️ by the TripLine Team.*
