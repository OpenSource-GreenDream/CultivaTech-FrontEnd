# CultivaTech — Frontend

CultivaTech is an Agriculture 4.0 platform developed by the **GreenDream** team. It combines agricultural field management, IoT sensor monitoring, statistical analytics, inventory management, a B2B agricultural marketplace, notifications, and community reviews in a single web application.

This repository contains the Angular frontend. It consumes the CultivaTech Spring Boot REST API and provides role-based access to the platform's agricultural and commercial features.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Bounded Contexts](#bounded-contexts)
- [Roles and Access Control](#roles-and-access-control)
- [Sensor Monitoring and Analytics](#sensor-monitoring-and-analytics)
- [User Interface and Internationalization](#user-interface-and-internationalization)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Docker](#docker)
- [Azure Deployment](#azure-deployment)
- [Validation and Current Scope](#validation-and-current-scope)

## Overview

CultivaTech supports agricultural producers in managing crop lots, monitoring soil conditions, and publishing agricultural products. Customers and suppliers can explore the marketplace, discover producers, participate in community reviews, and receive notifications according to their permissions.

The application integrates the following capabilities:

- User registration, authentication, and role-based navigation.
- Farm profiles, crop lots, and configurable moisture thresholds.
- IoT device registration and historical soil telemetry.
- Statistical analysis of sensor readings and comparative nutrient charts.
- Agricultural inventory and product catalog management.
- Contact-based B2B commercial interactions.
- Notifications and agricultural alerts.
- Producer profiles, product reviews, and community reputation.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 22.1.x, TypeScript 6.0.x |
| UI | Angular Material, Angular CDK, CSS, SVG |
| State management | Angular Signals, RxJS, application stores |
| Internationalization | ngx-translate, English and Spanish |
| Backend | Java 25, Spring Boot 4.1.x, REST API |
| Persistence | MySQL 8.4, Spring Data JPA, Hibernate |
| Authentication | JWT Bearer tokens, Spring Security |
| Authorization | Role-Based Access Control (RBAC) and resource ownership |
| Containerization | Docker, multi-stage builds, Nginx Alpine |
| Cloud | Azure Container Apps, Azure Database for MySQL Flexible Server |
| Container registry | Docker Hub |
| Package management | npm (Node.js 26 used for the verified frontend build) |

## Architecture

CultivaTech follows a bounded-context-oriented architecture inspired by Domain-Driven Design (DDD) and Clean Architecture. Each frontend context separates its responsibilities according to the needs of its features rather than enforcing unnecessary abstractions.

Angular is served as a Single Page Application (SPA) by Nginx. The browser communicates directly with the backend using the configured API base URL. Nginx does not act as an API reverse proxy in the current deployment.

### Frontend organization

The following is a conceptual view of the frontend organization. Exact subdirectories vary by bounded context; inventory and commercial features are grouped under the frontend stock area.

```text
src/
├── app/
│   ├── iam/
│   ├── profile/
│   ├── monitoring/
│   ├── analytics/
│   ├── stock/
│   ├── notification/
│   ├── community/
│   ├── shared/
│   └── app.routes.ts
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── main.ts
└── styles.css
public/
├── assets/
└── i18n/
    ├── en.json
    └── es.json
Dockerfile
.dockerignore
nginx.conf
angular.json
package.json
package-lock.json
```

The architecture separates domain models and business rules, application state and use cases, infrastructure/API communication, and presentation components. Shared utilities, access policies, and layout elements are reused across contexts.

The backend remains responsible for business validation, persistence, authentication, authorization, and ownership enforcement. Frontend guards and navigation policies improve the user experience but do not replace server-side authorization.

## Bounded Contexts

The platform is organized around eight logical bounded contexts.

### 1. Identity and Access Management (IAM)

- Public sign-in and sign-up.
- Registration for FARMER, CUSTOMER, and SUPPLIER roles.
- JWT-based authentication and frontend session management.
- Role-based route and navigation restrictions.
- Administrative user and role operations protected by the backend.
- Automatic provisioning of an initial profile during registration.

The ADMIN role cannot be selected during public registration. Administrative role assignment is a privileged operation. The internal profile provisioning flow does not require a JWT before authentication has taken place; external profile operations retain their ownership checks.

### 2. Profile

- Personal and farm profile management.
- Farm name and contact information.
- Configuration of profile thresholds.
- Crop lot registration, editing, and removal.
- Field information including area, soil type, latitude, and longitude.
- Role-aware profile presentation.

Farmers manage their own agricultural resources. Customers and suppliers use a personal profile experience and can view their authored reviews. The temperature threshold remains part of the profile model, but temperature is not currently a supported sensor parameter.

### 3. Monitoring

- Registration and management of IoT devices associated with crop lots.
- MAC address and device status information.
- Latest available sensor measurements.
- Historical readings with timestamps and units.
- Moisture threshold comparisons and related alert presentation.
- Sensor reading history and management through the supported API operations.

The current application uses readings persisted by the backend. It does not require live hardware connectivity for demonstrating the monitoring workflow; test readings can be submitted through the REST API.

### 4. Analytics

- Device-based analysis of historical telemetry.
- Arithmetic mean, variance, standard deviation, and measurement count.
- Moisture threshold status based on the configured minimum.
- Time-series line charts for moisture and pH.
- Comparative bar chart of average nutrient concentrations.
- Reactive switching between visualization modes in a single chart area.

The current frontend analytics scope corresponds to sensor statistics (US36). Harvest Projection (US37) was removed from the frontend and is not presented as an available feature.

### 5. Commercial

- Agricultural product catalog.
- Product details, description, price, and optional product image.
- Product availability based on associated inventory.
- Producer information and commercial contact details.
- Access to product ratings and reviews.

The marketplace follows a contact-based B2B model. Shopping carts, checkout, payment processing, and order execution are outside the currently enabled frontend scope. Order endpoints are blocked by the backend access policy.

### 6. Inventory

- Inventory records associated with agricultural profiles and crop lots.
- Product registration and initial stock quantity.
- Stock quantity updates and inventory filtering.
- Integration between inventory records and the commercial catalog.

A product is associated with an inventory record; inventory may exist before product publication. Farmers and administrators manage inventory within their authorized scope. The frontend groups inventory and commercial capabilities in its stock module.

### 7. Notification

- Notification list and unread indicators.
- General notifications and agricultural alerts.
- Read/unread state management and notification removal.
- Notifications generated through supported application workflows.
- Notification access for all authenticated roles.

Threshold-related frontend workflows can create or display alerts using existing notification capabilities. The current release does not claim to provide an independent, continuously running backend alert engine.

### 8. Community

- Public producer directory and community profiles.
- Producer details, public biography, and optional profile image.
- Product reviews and ratings.
- Review author information and product reputation.
- Role-aware management of producer profiles and authored reviews.

Customers and suppliers can participate in reviews without creating a producer community profile. Producer profiles are intended for authorized producers and administrators. Self-review and resource ownership restrictions are enforced through backend rules.

## Roles and Access Control

| Capability | ADMIN | FARMER | CUSTOMER | SUPPLIER |
| --- | --- | --- | --- | --- |
| Home and personal profile | Yes | Yes | Yes | Yes |
| Fields, Monitoring, Analytics | Yes | Own resources | No | No |
| Inventory and product publication | Yes | Own resources | No | No |
| Commercial catalog | Yes | Yes | Yes | Yes |
| Community directory and reviews | Yes | Yes | Yes | Yes |
| Producer profile management | Yes | Own profile | No | No |
| Notifications | Yes | Own | Own | Own |
| IAM administration API | Yes | No | No | No |
| Order execution | No | No | No | No |

This table summarizes the intended access policy. Business rules, ownership checks, and self-review restrictions still apply. It does not imply that every administrative API operation has a dedicated frontend screen.

The backend uses explicit route and HTTP-method authorization rules, followed by resource-level ownership validation where applicable. Unlisted endpoints are denied by default. Public authentication endpoints, role lookup, and API documentation remain accessible without a JWT.

## Sensor Monitoring and Analytics

### Supported sensor parameters

| Parameter enum | Measurement | Unit |
| --- | --- | --- |
| `MOISTURE` | Soil moisture | `%` |
| `PH` | Soil pH | Dimensionless |
| `NITROGEN` | Nitrogen | `mg/kg` |
| `PHOSPHORUS` | Phosphorus | `mg/kg` |
| `POTASSIUM` | Potassium | `mg/kg` |
| `CALCIUM` | Calcium | `mg/kg` |
| `MAGNESIUM` | Magnesium | `mg/kg` |
| `SULFUR` | Sulfur | `mg/kg` |

Sensor values are validated by the backend: moisture ranges from 0 to 100, pH ranges from 0 to 14, and nutrient concentrations must be non-negative.

### Registering a sensor reading

Example request for an existing device, using an authorized account:

```http
POST /api/v1/devices/{deviceId}/sensor-readings
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "parameter": "MOISTURE",
  "value": 28.7,
  "unit": "%",
  "recordedAt": "2026-11-27T20:00:00.000Z"
}
```

The timestamp and value above are illustrative test data.

### Statistical visualizations

The Analytics dashboard uses a single chart area with three visualization options:

| Selection | Chart | Data |
| --- | --- | --- |
| Moisture | Line chart | Historical moisture readings |
| pH | Line chart | Historical pH readings |
| Nutrients — AVG | Bar chart | Individual mean concentration for N, P, K, Ca, Mg, and S |

Each nutrient mean is calculated independently from the available readings for the selected device. The grouped visualization is a frontend presentation mode, not a new sensor enum or API parameter.

The intended chart behavior distinguishes unavailable measurements from valid zero concentrations and avoids invented nutrient thresholds. The grouped chart uses `mg/kg`; moisture and pH retain their corresponding units. Statistical analysis must not mix readings from different devices or incompatible measurement units.

## User Interface and Internationalization

The frontend uses a shared application layout, consistent form controls, responsive views, and role-aware navigation. Its visual identity is based on a warm, muted agricultural palette.

| Design token | Reference color |
| --- | --- |
| Main background | `#EAE7DE` |
| Surface | `#F8F7F3` |
| Input surface | `#FCFBF8` |
| Primary | `#66794A` |
| Dark green | `#35432C` |
| Border | `#C9C6B5` |
| Error | `#AB4949` |

English and Spanish translations are maintained in `public/i18n/en.json` and `public/i18n/es.json`. Angular uses ngx-translate to resolve translation keys at runtime. The design reference is `docs/STYLE-GUIDE.md` where available in the repository.

## Getting Started

### Prerequisites

- Node.js 26 (the verified local build used Node.js 26.13.0).
- npm (the verified local build used npm 11.20.0).
- A running CultivaTech backend for API-dependent features.
- Docker for containerized execution or deployment.

### Install dependencies

From the root of this repository:

```bash
npm ci
```

### Development server

```bash
npm start
```

Open <http://localhost:4200>.

The development configuration expects the backend at `http://localhost:8181/api/v1`. Start the backend and its database separately before using authenticated or API-dependent features.

### Production build

```bash
npm run build
```

The Angular build configuration defaults to production. Generated browser assets are located at:

```text
dist/cultivatech-front/browser/
```

The verified pre-chart-update build completed successfully with an initial bundle of approximately 326 kB (90 kB estimated transfer size). Existing component CSS budget warnings were non-blocking. These figures are a historical baseline, not a guarantee for subsequent builds.

## Environment Configuration

| File | Environment | API base URL |
| --- | --- | --- |
| `src/environments/environment.development.ts` | Development | `http://localhost:8181/api/v1` |
| `src/environments/environment.ts` | Production | `https://cultivatech-backend.salmonsand-1033f96b.mexicocentral.azurecontainerapps.io/api/v1` |

Angular's development configuration replaces `environment.ts` with `environment.development.ts`. The production build uses `environment.ts` directly.

The API base URL is embedded in the compiled frontend. Changing that URL requires a new frontend build and image. Do not place database credentials, JWT signing secrets, or privileged account passwords in frontend environment files.

## Docker

The frontend uses a multi-stage Docker build. Node.js installs dependencies and compiles Angular in the build stage. Nginx Alpine serves only the compiled static assets in the runtime stage, with SPA route fallback and support for static assets and translation files.

### Build the image

```bash
docker build -t calin1412/cultivatech-front:1.0.1 .
```

### Run locally

```bash
docker run -d --name cultivatech-frontend-local \
  -p 8080:80 calin1412/cultivatech-front:1.0.1
```

Open <http://localhost:8080>.

This command verifies local static serving. The production image targets the Azure backend; authenticated requests from a new local origin may be blocked by its production CORS policy. Use the Angular development environment for ordinary local API testing.

```bash
docker logs cultivatech-frontend-local
docker stop cultivatech-frontend-local
docker rm cultivatech-frontend-local
```

### Publish the image

```bash
docker login
docker push calin1412/cultivatech-front:1.0.1
```

The tag `1.0.1` is the intended next frontend release for the nutrient visualization changes. Docker image tags are independent of the application version (`0.9.0` in `package.json`).

## Azure Deployment

The platform uses two independent Azure Container Apps and an Azure Database for MySQL Flexible Server instance. Images are published to Docker Hub and selected through the Azure portal. GitHub Actions and Azure Static Web Apps are not required for this deployment workflow.

### Deployment configuration

| Resource | Configuration |
| --- | --- |
| Resource group | `rg-cultivatech` |
| Region | Mexico Central |
| Container Apps environment | `cultivatech-env` |
| Frontend app | `cultivatech-frontend` |
| Backend app | `cultivatech-backend` |
| Database server | `cultivatech-mysql` |
| Database | `cultivatech_db` |
| Frontend ingress target port | `80` |
| Backend ingress target port | `8181` |
| Database port | `3306` |
| Frontend resources | 0.25 vCPU, 0.5 GiB |
| Backend resources | 0.5 vCPU, 1 GiB |

Public frontend and backend endpoints use HTTPS managed by Azure. Backend database connectivity uses JDBC with TLS. Backend runtime secrets are configured outside the application image.

### Application URLs

| Service | URL |
| --- | --- |
| Frontend | <https://cultivatech-frontend.salmonsand-1033f96b.mexicocentral.azurecontainerapps.io> |
| REST API | <https://cultivatech-backend.salmonsand-1033f96b.mexicocentral.azurecontainerapps.io/api/v1> |
| Swagger UI | <https://cultivatech-backend.salmonsand-1033f96b.mexicocentral.azurecontainerapps.io/swagger-ui/index.html> |
| OpenAPI specification | <https://cultivatech-backend.salmonsand-1033f96b.mexicocentral.azurecontainerapps.io/v3/api-docs> |

### CORS and security configuration

CORS is managed by the backend Spring Security configuration. The allowed origins include the local Angular development origin (`http://localhost:4200`) and the deployed frontend HTTPS origin. The existing allowed methods and headers support REST operations and Bearer JWT authentication.

Azure ingress CORS was disabled after it interfered with API requests. The final configuration avoids maintaining two competing CORS policies. This does not relax RBAC, JWT validation, or ownership restrictions.

Spring Boot recognizes forwarded headers through the existing Azure runtime configuration, allowing Swagger to generate HTTPS request URLs behind Azure's TLS termination.

### Updating the frontend release

1. Validate the updated Angular build and its runtime behavior locally.
2. Build and publish the new versioned Docker image.
3. Open `cultivatech-frontend` in the Azure portal.
4. Update the container image tag while retaining port 80, ingress, and resource settings.
5. Verify the deployed revision and reload the public frontend.
6. Confirm authentication, protected requests, SPA navigation, and both languages.

A frontend-only release does not require changing the backend or database when the REST contract remains unchanged.

## Validation and Current Scope

The implementation has been developed and reviewed iteratively using build validation, code audits, and manual API and browser checks. Automated test coverage is not claimed by this README.

The backend was deployed with the sign-up provisioning fix and the administrative account was created through the authorized database administration workflow. The frontend image `1.0.0` was deployed successfully and loaded through HTTPS. The backend CORS correction was prepared for `1.0.14`.

The latest frontend changes introduce the grouped nutrient average chart and simplify its selector. The source dictionaries contain English and Spanish translations for the new labels. Before releasing `1.0.1`, verify that the runtime translation loader serves the updated dictionaries; the final translation behavior and publication of this new image have not been confirmed in the available implementation record.

Manual release checks:

- Sign-up and sign-in, including the appropriate role-specific navigation.
- Own-resource access and rejection of unauthorized operations.
- Profile, field, device, inventory, product, and community workflows.
- Sensor readings and statistics for the selected device.
- Moisture and pH line charts and nutrient AVG bar chart.
- English/Spanish language switching and missing-data behavior.
- Direct navigation and browser refresh on internal Angular routes.
- Azure frontend-to-backend requests without CORS errors.

The current scope deliberately excludes frontend harvest projection, order execution, online checkout, payment processing, and a dedicated autonomous backend alert engine. These exclusions preserve the supported academic release scope and should not be interpreted as completed functionality.

---

**CultivaTech | GreenDream** — Agriculture 4.0 academic project.
