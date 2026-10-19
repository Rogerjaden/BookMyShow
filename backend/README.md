# BookMyShow Clone

A movie ticket booking backend built from scratch using **Java, Spring Boot, Spring Data JPA, and MySQL**. The project models movie discovery, theatres and screens, show schedules, per-show seat inventory, bookings, payments, and notifications.

> **Repository rule:** This is a separate project in the `BMS-Clone` repository. Keep the original Event Management System repository and working project unchanged. Use it only as a reference when useful.

## Architecture

![BookMyShow Clone backend architecture](D:\SpringBoot\BookMyShowClone\BMS-Clone\architecture.png)

The first version is a **modular monolith**. Keep the code organized by responsibility and avoid introducing microservices or Kafka before there is a clear need.

### Request and booking flow

1. A client calls a REST endpoint.
2. Spring Security authenticates the request and checks authorization.
3. The controller validates input DTOs and delegates to a service.
4. The service applies business rules and runs database operations transactionally.
5. Spring Data JPA repositories read or update MySQL.
6. Booking-related events are persisted to an outbox in the same transaction when reliable asynchronous work is needed.
7. A background worker processes outbox events, sends email, and retries transient failures.

### Core booking rule

A physical `Seat` belongs to a `Screen`. A `ShowSeat` represents that seat's inventory for one particular `MovieShow`, including show-specific price and availability. Booking logic must prevent two concurrent requests from successfully reserving the same show seat.

## Technology stack

- [x] Java 17 or later
- [x] Spring Boot
- [x] Spring Web
- [x] Spring Data JPA / Hibernate
- [x] Spring Security with JWT authentication
- [x] MySQL
- [x] Flyway database migrations
- [ ] Bean Validation
- [x] Swagger / OpenAPI
- [ ] JUnit 5, Mockito, and Spring Boot integration tests
- [ ] Docker and Docker Compose
- [ ] Spring Boot Mail or a transactional email provider
- [ ] Optional later: Redis for caching/short-lived coordination; Kafka only if asynchronous event volume or service boundaries justify it

## Package structure

```text
com.rogerjaden.bookmyshow
├── config
├── security
├── controller
├── dto
│   ├── request
│   └── response
├── entity
│   └── enums
├── repository
├── service
│   ├── interfaces
│   └── impl
├── mapper
├── exception
├── notification
│   ├── event
│   ├── handler
│   ├── email
│   └── outbox
└── scheduler
```

Adapt the root package to the package name used by the new Spring Boot project. Keep controllers thin, put business rules in services, and use DTOs rather than exposing entities directly.

---

# Development checklist

Tick items off as you implement and test them. Complete each phase's exit criteria before moving on.

## Phase 0 — Create and secure the project

- [x] Create the separate GitHub repository: `BMS-Clone`.
- [x] Create a Spring Boot project with the dependencies listed above.
- [x] Configure Java, Maven, formatting, and application profiles.
- [x] Add `.gitignore` for IDE files, build output, local configuration, and secrets.
- [x] Configure MySQL using environment variables.
- [ ] Keep passwords, JWT signing keys, and provider credentials out of source control.
- [ ] Add a health-check endpoint and verify the application starts.
- [ ] Add a basic CI workflow to build and run tests.
- [ ] Record the initial project setup and commands in this README.

**Exit criteria:** The clean project builds, starts, connects to a local MySQL instance, and contains no committed secrets.

## Phase 1 — Database migrations and common foundations

- [ ] Add Flyway and create the initial schema migration.
- [ ] Use `ddl-auto=validate` after migrations match the entity model.
- [ ] Define common enum types and timestamp conventions.
- [ ] Add DTO conventions, validation, mapper conventions, and global error responses.
- [ ] Add database constraints and indexes through versioned migrations.
- [ ] Create a consistent API response/error format where appropriate.
- [ ] Add tests for migrations and application context startup.

**Exit criteria:** A new database can be created from migrations, and the application validates the schema successfully.

## Phase 2 — Users and authentication

- [ ] Create `User` with unique email, password hash, phone, role, status, email verification, and timestamps.
- [ ] Implement registration and login DTOs with validation.
- [ ] Hash passwords using BCrypt or an appropriate password encoder.
- [ ] Implement JWT access-token validation and role-based authorization.
- [ ] Create `RefreshToken` with a hashed token value, expiry, and revocation.
- [ ] Implement refresh-token rotation and logout/revocation.
- [ ] Add `EmailPreference` with one record per user.
- [ ] Protect administrator-only endpoints.
- [ ] Test invalid credentials, expired tokens, revoked tokens, and access-control rules.

**Exit criteria:** Registration, login, token refresh, logout, and role checks work and are covered by tests.

## Phase 3 — Movie catalogue and genres

- [ ] Create `Movie` with title, description, duration, release date, language, certificate, poster URL, trailer URL, status, and audit timestamps.
- [ ] Create `Genre`.
- [ ] Create `MovieGenre` as a junction entity/table.
- [ ] Add repositories, services, request/response DTOs, mappers, and controllers.
- [ ] Implement create, update, detail, list, search, and soft-delete/publish operations.
- [ ] Validate input and restrict catalogue management to authorized roles.
- [ ] Add pagination, sorting, and useful filters.
- [ ] Test CRUD operations, genre assignment, invalid requests, and authorization.

**Exit criteria:** Users can browse/search published movies; authorized administrators can manage movies and genres.

## Phase 4 — Theatre, screen, and seat management

- [ ] Create `Theatre` with name, address, city, state, and postal code.
- [ ] Create `Screen` linked to a theatre.
- [ ] Create `Seat` linked to a screen, with row label, seat number, seat type, and status.
- [ ] Add a unique constraint on `(screen_id, row_label, seat_number)`.
- [ ] Implement management DTOs, validation, repositories, services, and endpoints.
- [ ] Validate that each screen belongs to the selected theatre and each seat belongs to the selected screen.
- [ ] Define administrator/theatre-manager permissions.
- [ ] Test theatre creation, screen configuration, duplicate-seat rejection, and invalid relationships.

**Exit criteria:** Authorized users can configure theatres, screens, and physical seats without duplicate seat definitions.

## Phase 5 — Movie shows and show-seat inventory

- [ ] Create `MovieShow` linked to a movie and screen.
- [ ] Store start time, end time, language, format, and status.
- [ ] Validate that end time is after start time.
- [ ] Prevent overlapping shows on the same screen, including any setup/cleaning buffer.
- [ ] Create one `ShowSeat` inventory record per physical seat for each show.
- [ ] Store show-specific price, status, `lockedUntil`, and a JPA `@Version` field.
- [ ] Add a unique constraint on `(movie_show_id, seat_id)`.
- [ ] Implement show discovery by city, movie, theatre, date, language, and format.
- [ ] Test show scheduling, overlap rejection, and complete seat inventory.

**Exit criteria:** Each show has independent seat availability and pricing; customers can discover relevant shows.

## Phase 6 — Booking and seat locking

- [ ] Create `Booking` linked to a user and a specific movie show.
- [ ] Create `BookingSeat` to record selected show seats and `priceAtBooking`.
- [ ] Define booking statuses and allowed state transitions.
- [ ] Generate unique booking references.
- [ ] Implement transactional seat selection and availability checks.
- [ ] Prevent duplicate concurrent reservations using database locks or conditional updates; do not rely only on checking availability in Java.
- [ ] Calculate totals on the server using trusted database prices.
- [ ] Implement booking expiry and safe release of expired locks.
- [ ] Implement booking details, booking history, and cancellation rules.
- [ ] Test duplicate seat selection, simultaneous requests, transaction rollback, and expired locks.

**Exit criteria:** A seat cannot be sold to two bookings, totals are server-calculated, and expired reservations safely release inventory.

## Phase 7 — Payments

- [ ] Create `Payment` linked to a booking; allow multiple attempts if required by the payment lifecycle.
- [ ] Define payment statuses and valid state transitions.
- [ ] Integrate a payment provider in sandbox/test mode.
- [ ] Implement idempotent payment creation with a unique idempotency key.
- [ ] Verify provider responses and signed webhooks; do not trust a browser redirect alone.
- [ ] Handle failure, timeout, duplicate callback, and retry scenarios.
- [ ] Confirm a booking only after verified payment success.
- [ ] Define how ambiguous payment outcomes are reconciled.
- [ ] Release seats safely when a booking expires or payment definitively fails.
- [ ] Test success, failure, timeout, duplicate callbacks, cancellation, and refund paths as applicable.

**Exit criteria:** Retries do not create duplicate confirmations, and bookings are confirmed only after verified payment success.

## Phase 8 — Reviews, wishlist, and notifications

- [ ] Create `Review` linked to a user and movie.
- [ ] Validate rating boundaries and decide whether one review per user/movie is allowed.
- [ ] If one review per movie is allowed, enforce uniqueness on `(user_id, movie_id)`.
- [ ] Create `Wishlist` linked to a user and movie.
- [ ] Add uniqueness on `(user_id, movie_id)` for wishlist entries.
- [ ] Create `Notification` with title, message, type, reference ID, read status, and timestamp.
- [ ] Implement notification listing, unread count, and mark-as-read behavior.
- [ ] Test ownership, duplicate wishlist entries, review validation, and notification access.

**Exit criteria:** Users can manage movie reviews and wishlists and retrieve their own notifications securely.

## Phase 9 — Email delivery and reliable asynchronous processing

- [ ] Configure Spring Boot Mail or a transactional email provider.
- [ ] Create booking confirmation email templates.
- [ ] Add `EmailDelivery` with event type, recipient, idempotency key, status, attempt count, error, and sent time.
- [ ] Send booking confirmation only after the booking transaction commits and payment is verified.
- [ ] Publish a movie-published event when an administrator publishes a movie.
- [ ] Send movie announcements only to eligible users who opted in.
- [ ] Keep in-app notification state separate from email delivery state.
- [ ] Create `OutboxEvent` and persist business events in the same transaction as the business change.
- [ ] Implement a worker/scheduler to process outbox events and retry transient failures.
- [ ] Add duplicate-processing and duplicate-delivery protection.
- [ ] Test failures, retries, and email delivery using a sandbox/test inbox.

**Exit criteria:** Important events are processed reliably, delivery failures can be diagnosed, and duplicate processing is safe.

## Phase 10 — API documentation, tests, and deployment

- [ ] Document implemented endpoints with Swagger / OpenAPI.
- [ ] Include request/response examples and validation/error responses.
- [ ] Add unit tests for business rules and state transitions.
- [ ] Add integration tests for repositories, security, and the end-to-end booking workflow.
- [ ] Test concurrent seat booking against the real database engine used for deployment.
- [ ] Add structured logging without exposing passwords, tokens, or payment secrets.
- [ ] Add Dockerfile and Docker Compose for the application and MySQL.
- [ ] Document environment variables and local setup commands.
- [ ] Run the application from a clean database using Flyway.
- [ ] Verify the complete build and test suite in CI.
- [ ] Update this README when implementation or architecture changes.

**Exit criteria:** The app builds reproducibly, tests pass, API docs are usable, and the service can be run from documented instructions.

---

## Database constraints checklist

- [ ] `User.email` is unique; normalize email before storing/comparing.
- [ ] `Genre.name` is unique.
- [ ] `MovieGenre` is unique on `(movie_id, genre_id)` or uses that pair as a composite primary key.
- [ ] `Seat` is unique on `(screen_id, row_label, seat_number)`.
- [ ] `ShowSeat` is unique on `(movie_show_id, seat_id)`.
- [ ] `Booking.booking_reference` is unique.
- [ ] `BookingSeat` is unique on `(booking_id, show_seat_id)`.
- [ ] `Payment.idempotency_key` is unique and scoped to the payment operation.
- [ ] `Wishlist` is unique on `(user_id, movie_id)`.
- [ ] `Review` is unique on `(user_id, movie_id)` if that is the chosen policy.
- [ ] `RefreshToken.token_hash` is unique.
- [ ] `EmailPreference.user_id` is unique.
- [ ] `EmailDelivery.idempotency_key` is unique.
- [ ] Add indexes for show discovery, booking history, payment lookup, and notification queries.
- [ ] Validate foreign keys and delete/soft-delete behavior.
- [ ] Test seat-lock concurrency; unique constraints alone are not sufficient.

## Suggested build order

- [ ] Project setup and database migrations
- [ ] Authentication and authorization
- [ ] Movie catalogue and genres
- [ ] Theatre, screen, and seat management
- [ ] Shows and show-seat inventory
- [ ] Booking and seat locking
- [ ] Payment integration
- [ ] Reviews, wishlist, and notifications
- [ ] Email, outbox, and retries
- [ ] OpenAPI, integration tests, Docker, and deployment

## Definition of done

- [ ] All implemented endpoints are documented.
- [ ] Authentication and authorization are tested.
- [ ] Concurrent seat booking is handled safely.
- [ ] Payment verification and idempotency are implemented.
- [ ] Booking emails are sent only for confirmed bookings.
- [ ] Marketing emails respect user consent.
- [ ] Migrations work from a clean database.
- [ ] Automated tests pass in CI.
- [ ] Secrets are not committed to the repository.
- [ ] The README and architecture diagram match the implementation.

## Local setup

1. Install Java 17+ and MySQL.
2. Create a local database for the project.
3. Configure environment variables for database access and JWT signing.
4. Run the application and let Flyway apply migrations.
5. Open the Swagger UI URL configured by the project.
6. Run the test suite before pushing changes.

> Do not commit real credentials or production secrets. Keep payment integrations in sandbox mode until the workflow and webhook verification have been tested thoroughly.
