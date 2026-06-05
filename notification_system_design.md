# Campus Notifications Microservice - Design Document

## 1. Architecture Overview
The Campus Notifications Microservice is built using **Node.js** and the **Express.js** framework. It follows a modular microservice architecture designed for high availability and low-latency message delivery.

## 2. Technical Stack
- **Backend:** Node.js, Express.js
- **Data Exchange:** JSON (RESTful APIs)
- **Utilities:** UUID (for unique record identification), Axios (for external service integration)
- **Logging:** Custom middleware for real-time request/response auditing.

## 3. Implementation Stages (1-6)

### Stage 1: Setup & Initial Design
- Project initialization with `npm` and dependency management.
- Implementation of mandatory logging middleware to track API health.

### Stage 2: Data Model Implementation
- Notification records are structured with the following schema:
  - `id`: (UUID) Unique Identifier.
  - `title`: String.
  - `message`: String.
  - `type`: Category (e.g., event, alert, news).
  - `recipient`: Intended target user or group.
  - `timestamp`: ISO-8601 creation date.
  - `status`: Delivery state (pending/sent).

### Stage 3: Retrieval Strategy
- Implemented `GET /notifications` with query-string support.
- Supports filtering by `type` and `recipient` for targeted history lookup.

### Stage 4: Filtering Efficiency
- Optimized local data structures to handle concurrent read requests with minimal overhead.

### Stage 5: User Preferences Management
- Added `POST /notifications/preferences/:userId` to allow granular control.
- Stores allowed notification types and delivery frequency.

### Stage 6: Real-time Analytics
- Implemented an aggregation engine to provide system-wide insights:
  - Total notifications sent.
  - Distribution breakdown by notification type.
  - "Recent Activity" feed for administrators.

## 4. Scalability & High Availability
- **Statelessness:** The API is designed to be stateless, allowing it to scale horizontally behind a load balancer.
- **Failover:** Integrated timeout and retry logic for connections to the external Depot/Vehicle servers.
- **Data Integrity:** Used UUID v4 to prevent ID collisions across multiple service instances.
