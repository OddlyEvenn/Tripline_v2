# TRIPLINE V3 - LIVE MULTI-MODAL TRANSPORT INTEGRATION

You are a Senior Staff Software Engineer and System Architect.

Your task is to upgrade an EXISTING production-grade project called TripLine.

IMPORTANT:
DO NOT rebuild the project.
DO NOT replace existing features.
DO NOT create a new architecture from scratch.

You must first analyze the current codebase and then incrementally integrate live transport providers into the existing system.

---

## PROJECT OVERVIEW

Current Stack:

Frontend:

* React 18
* Vite
* Tailwind CSS
* Axios

Backend:

* Node.js
* Express.js

Database:

* Oracle Database
* Oracle Spatial

Caching:

* Redis

Authentication:

* JWT
* HttpOnly Cookies

Payments:

* Stripe

Notifications:

* Brevo

Current Features:

✔ Authentication
✔ Role-based Access
✔ Admin Dashboard
✔ Stations Management
✔ Routes Management
✔ Trips Management
✔ Vehicle Management
✔ Seat Management
✔ Seat Locking
✔ Booking Flow
✔ Stripe Payments
✔ PDF Tickets
✔ QR Codes
✔ Redis Locks

---

## CRITICAL RULES

Before writing any code:

1. Analyze entire backend architecture.
2. Analyze entire frontend architecture.
3. Analyze Oracle schema.
4. Analyze all APIs.
5. Analyze booking flow.
6. Analyze seat locking flow.
7. Analyze Stripe webhook flow.
8. Analyze admin dashboard.

Generate a complete project audit.

Identify:

* Bugs
* Technical debt
* Missing validations
* Security issues
* Scalability issues
* Refactoring opportunities

DO NOT modify anything until audit is completed.

---

## PRIMARY GOAL

Integrate REAL LIVE DATA providers:

Flights:
Amadeus API

Trains:
RapidAPI Railway APIs

Buses:
RapidAPI Bus APIs

while preserving all existing functionality.

---

## TARGET ARCHITECTURE

Current Admin Trips
+
Live Flight Data
+
Live Train Data
+
Live Bus Data

must be searchable through a single search endpoint.

Current Oracle booking system remains untouched.

---

## IMPLEMENTATION PHASES

PHASE 0
SYSTEM AUDIT

Deliver:

* Current architecture diagram
* Existing API flow
* Existing DB flow
* Existing booking flow
* Existing admin flow

Generate:

AUDIT_REPORT.md

Do not proceed until audit is completed.

---

PHASE 1
BACKEND REFACTORING

Create enterprise folder structure.

src/

modules/
auth/
booking/
stations/
routes/
trips/
flights/
trains/
buses/
search/
admin/

providers/
amadeus/
railway/
bus/

services/
cache/
middleware/
jobs/
utils/
config/

Move logic into:

Controller
→ Service
→ Provider

architecture.

No business logic inside controllers.

---

PHASE 2
LIVE FLIGHT INTEGRATION

Provider:
Amadeus

Implement:

OAuth Token Management

Airport Search

Flight Offers Search

Flight Pricing

Token Refresh

Caching

Retry Logic

Rate Limiting

Circuit Breaker

Environment Variables:

AMADEUS_CLIENT_ID

AMADEUS_CLIENT_SECRET

---

PHASE 3
LIVE TRAIN INTEGRATION

Provider:
RapidAPI Railway APIs

Implement:

Train Search

Train Between Stations

Train Schedule

PNR Status

Availability Search

Caching

Retry Logic

Rate Limiting

Circuit Breaker

Environment Variables:

RAPIDAPI_KEY

RAPIDAPI_RAILWAY_HOST

---

PHASE 4
LIVE BUS INTEGRATION

Provider:
RapidAPI Bus APIs

Implement:

Bus Search

Operator Search

Schedule Search

Seat Availability

Caching

Retry Logic

Rate Limiting

Circuit Breaker

Environment Variables:

RAPIDAPI_BUS_KEY

RAPIDAPI_BUS_HOST

---

PHASE 5
SEARCH AGGREGATOR

Create:

SearchAggregatorService

Input:

origin
destination
travelDate

Process:

1. Oracle Trips
2. Amadeus Flights
3. Railway APIs
4. Bus APIs

Normalize everything into one response DTO.

Unified DTO:

{
type,
provider,
source,
tripId,
carrier,
origin,
destination,
departureTime,
arrivalTime,
duration,
price,
availableSeats
}

Sorting:

Cheapest

Fastest

Earliest

Latest

---

PHASE 6
DATABASE IMPROVEMENTS

Review existing schema.

Create migrations.

Add:

provider_health_status

external_provider_logs

external_search_cache

api_usage_metrics

audit_logs

Store:

provider

endpoint

response_time

status

request_payload

response_payload

created_at

---

PHASE 7
CACHE ARCHITECTURE

Redis First

Fallback Oracle Cache

Fallback Live Request

TTL:

Flights:
15 mins

Trains:
10 mins

Buses:
10 mins

Airports:
24 hrs

Stations:
24 hrs

---

PHASE 8
ADMIN DASHBOARD V2

Add:

API Settings Page

Provider Monitoring

Health Status

Usage Metrics

Latency Metrics

Failure Metrics

Cache Hit Ratio

Provider Quotas

Provider Usage Charts

---

PHASE 9
SECURITY REVIEW

Review:

Authentication

Authorization

JWT

Cookies

Stripe

Admin APIs

Apply:

Helmet

Rate Limits

Validation

Sanitization

Encryption

Audit Logs

Security Headers

---

PHASE 10
FRONTEND INTEGRATION

Search UI

Filters:

All

Flights

Trains

Buses

Source:

Internal

Live

Provider Badge:

Oracle

Amadeus

Railway

Bus

Loading States

Error States

Retry States

Empty States

---

PHASE 11
BOOKING COMPATIBILITY

Current Oracle Trips:

Continue existing booking flow.

Live Provider Trips:

Search Only

Read Only

Display:

"External booking integration coming soon"

DO NOT break current booking flow.

DO NOT modify Stripe booking process.

DO NOT modify ticket generation process.

---

PHASE 12
OBSERVABILITY

Implement:

Winston Logging

Request Tracing

Error Tracking

Health Checks

Metrics Dashboard

Cron Jobs

Provider Health Monitoring

---

PHASE 13
FINAL VALIDATION

Run full validation.

Verify:

Authentication

Admin

Stations

Routes

Trips

Bookings

Payments

Seat Locks

PDF Tickets

Emails

Live Flight Search

Live Train Search

Live Bus Search

Unified Search

Generate:

MIGRATION_GUIDE.md

DEPLOYMENT_GUIDE.md

ARCHITECTURE_V3.md

API_DOCUMENTATION.md

---

## IMPORTANT

At the end of each phase:

1. Explain all changes.
2. Show modified files.
3. Show created files.
4. Show migration steps.
5. Show testing steps.
6. Verify existing functionality still works.

Never jump phases.

Complete Phase 0 fully before starting Phase 1.

Treat this as a production-grade enterprise travel platform.
