# Architecture Review & Quick-Commerce Enhancement Plan
**Project:** Conversion of nopCommerce-based E-Commerce platform → Quick-Commerce (Zepto-like) platform

---

## 1. Purpose & Scope

### 1.1 Business goal
Re-purpose the existing **nopCommerce** e-commerce platform to operate as a **quick-commerce** service where customers in a serviceable area receive orders within **10–30 minutes** from a network of **dark stores**.

### 1.2 Scope of this document
- Review the **as-is** architecture of nopCommerce (frontend + backend).
- Identify **gaps** between the as-is platform and quick-commerce requirements.
- Recommend **target architecture** and a **phased migration path** (modular monolith → strangler-fig → microservices).
- Capture **non-functional targets**, **risks**, and **next steps**.

### 1.3 Out of scope (this story)
- Implementation of code changes.
- Vendor/tooling final selection.
- Detailed UI mock-ups.

---

## 2. Source of Truth

| Source | URL | Used for |
|---|---|---|
| Official site | https://www.nopcommerce.com | Product positioning, certifications |
| Source repo | https://github.com/nopSolutions/nopCommerce | Stack, branches, folder layout |
| Latest stable release | `release-4.90.4` (16 Mar 2026) | Baseline version |
| Active branch | `develop` (updated to .NET 10) | Forward-looking baseline |
| Documentation | https://docs.nopcommerce.com | Developer concepts, plugin model |

> **Note:** The Google share link provided in the Jira story redirects to `nopcommerce.com`. The verified facts in §3 are taken from the marketing site, the GitHub `develop` branch metadata, and repository topics.

---

## 3. Current (As-Is) Architecture — nopCommerce

### 3.1 Verified technology stack

| Layer | Technology |
|---|---|
| Runtime | **ASP.NET Core** on **.NET 9** (stable 4.90.4) / **.NET 10** (`develop`) |
| Language | C# (≈68% of repo), Razor/HTML (≈19%), TSQL (≈11%), CSS (≈2%), JS (<1%) |
| Primary DB | **SQL Server 2012+** |
| Other DBs | **PostgreSQL**, **MySQL** (Docker compose files included) |
| Containerization | **Docker** out-of-the-box; cross-platform (Windows / Linux / macOS) |
| Concurrency | **All methods are async** |
| Authentication | Built-in **multi-factor authentication** |
| Scaling | **Web-farm** support, Azure-compatible |
| Compliance | **PCI-DSS** compliant |
| Multi-tenancy | Multi-store, multi-vendor, multi-currency, multi-language |
| API | **Web API plugin** (paid REST add-on) |
| Mobile | Separate paid mobile-app product (not part of OSS core) |

The very low JavaScript share (<1%) confirms a **server-rendered MVC** architecture, not a SPA/PWA.

### 3.2 Repository structure (`develop` branch)

```
nopCommerce/
├── src/
│   ├── Build/                  # MSBuild props/targets
│   ├── Libraries/              # Domain, data access, services
│   ├── Plugins/                # Payment / shipping / tax / widget plugins
│   ├── Presentation/           # Web storefront, Web.Framework, Admin area
│   ├── Tests/Nop.Tests/
│   ├── Directory.Build.props
│   └── NopCommerce.sln
├── upgradescripts/
├── Dockerfile
├── docker-compose.yml
├── mysql-docker-compose.yml
├── postgresql-docker-compose.yml
└── global.json
```

### 3.3 Logical / layered architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Presentation (Razor MVC)                        │
│   Public Storefront           |          Admin Area (/Admin)         │
│   (Nop.Web)                   |          (inside Nop.Web)            │
├──────────────────────────────────────────────────────────────────────┤
│                       Web Framework (Nop.Web.Framework)              │
│        Filters · Model binders · Themes · Controller infra           │
├──────────────────────────────────────────────────────────────────────┤
│                       Services (Nop.Services)                        │
│  Catalog · Orders · Customers · Shipping · Tax · Payments · Discounts│
│  Messages · CMS · Logging · Localization · Security                  │
├──────────────────────────────────────────────────────────────────────┤
│                       Data (Nop.Data)                                │
│  Repositories · Migrations · LinqToDB · Multi-DB providers           │
├──────────────────────────────────────────────────────────────────────┤
│                       Core (Nop.Core)                                │
│  Domain entities · Caching · Events · Infrastructure contracts       │
└──────────────────────────────────────────────────────────────────────┘
            ▲                                       ▲
            │ MEF-style plugin loading              │
            │                                       │
        Plugins/   (Payment, Shipping, Tax, Widgets, Misc)
```

### 3.4 As-Is component / runtime view

```
                         ┌──────────────────────────┐
                         │   Browser (Desktop /     │
                         │   Mobile Web)            │
                         │   Razor pages + jQuery   │
                         │   + Bootstrap            │
                         └────────────┬─────────────┘
                                      │ HTTPS (full page reload)
                                      ▼
              ┌──────────────────────────────────────────────┐
              │           Load Balancer / Reverse Proxy      │
              │              (IIS / Nginx / Azure)           │
              └────────────────────┬─────────────────────────┘
                                   │
            ┌──────────────────────┴──────────────────────┐
            │                                             │
            ▼                                             ▼
  ┌────────────────────────┐                  ┌────────────────────────┐
  │  nopCommerce Web Node  │  …web farm…      │  nopCommerce Web Node  │
  │  (Nop.Web, ASP.NET     │  (sticky or      │  (Nop.Web, ASP.NET     │
  │   Core, single process)│   distributed    │   Core, single process)│
  │                        │   session)       │                        │
  │  ┌──────────────────┐  │                  │  ┌──────────────────┐  │
  │  │ Storefront (MVC) │  │                  │  │ Storefront (MVC) │  │
  │  │ Admin (/Admin)   │  │                  │  │ Admin (/Admin)   │  │
  │  │ Web API plugin*  │  │                  │  │ Web API plugin*  │  │
  │  │ Loaded plugins   │  │                  │  │ Loaded plugins   │  │
  │  │  (Payment /      │  │                  │  │  (Payment /      │  │
  │  │   Shipping /     │  │                  │  │   Shipping /     │  │
  │  │   Tax / Widget)  │  │                  │  │   Tax / Widget)  │  │
  │  │ ScheduleTasks    │  │                  │  │ ScheduleTasks    │  │
  │  │  (in-process)    │  │                  │  │  (in-process)    │  │
  │  │ In-proc Events   │  │                  │  │ In-proc Events   │  │
  │  └──────────────────┘  │                  │  └──────────────────┘  │
  └───────┬────────┬───────┘                  └───────┬────────┬───────┘
          │        │                                  │        │
          │        └──────────┬───────────────────────┘        │
          │                   │                                │
          ▼                   ▼                                ▼
  ┌────────────────┐  ┌────────────────┐            ┌──────────────────┐
  │  Relational DB │  │ Distributed    │            │ File / Blob      │
  │  SQL Server /  │  │ Cache          │            │ Storage          │
  │  PostgreSQL /  │  │ (Redis,        │            │ (images, themes, │
  │  MySQL         │  │  optional)     │            │  invoices)       │
  └────────────────┘  └────────────────┘            └──────────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │  External integrations   │
                  │  (Stripe, PayPal,        │
                  │   FedEx, SMTP, Google,   │
                  │   Azure, etc.)           │
                  └──────────────────────────┘

  *Web API plugin is a paid add-on; not part of the core OSS install.
```

**Key observations from the as-is runtime view**
- One deployable unit: storefront + admin + plugins all run inside a single ASP.NET Core process. Web farm scales the *whole monolith*, not individual capabilities.
- The browser is the only first-class client. There is no native mobile app, no SPA, and no real-time channel (WebSocket/SignalR) on the public surface.
- Eventing and background jobs live **inside** the web process (`IConsumer<TEvent>` + `ScheduleTask`). There is no external broker or job queue.
- Integrations (payment, shipping, tax) are reached **synchronously** from the web request thread.

### 3.5 Architectural style
- **Monolithic** deployment (single ASP.NET Core process + plugins).
- **Layered / N-tier** with clear separation Core → Data → Services → Web.
- **Pluggable**: features ship as discoverable plugins under `src/Plugins`.
- **Server-rendered**: Razor views; full page navigation; jQuery + Bootstrap.
- **Multi-store / multi-vendor / multi-warehouse** are first-class concepts.
- **Async-first** I/O.

### 3.6 Frontend (storefront) structure & characteristics

**Tech & behaviour**
- Razor + Bootstrap + minimal jQuery.
- SEO-friendly URLs, server-side rendering.
- Themable via `Themes/` and view overrides.
- No first-class WebSocket / real-time UI.
- Optimized for catalog browsing, search, faceted filters, full checkout.

**Folder layout (under `src/Presentation/`)**
```
Presentation/
├── Nop.Web/                          # Storefront + Admin host (ASP.NET Core MVC)
│   ├── Areas/
│   │   └── Admin/                    # Admin UI (controllers, views, models)
│   ├── Views/                        # Razor views per controller (storefront)
│   ├── Components/                   # Razor view components (header, cart, etc.)
│   ├── Factories/                    # View model factories (Service → ViewModel)
│   ├── Models/                       # Public-facing view models
│   ├── Controllers/                  # MVC controllers
│   ├── Themes/                       # Pluggable themes (CSS, layout overrides)
│   ├── Plugins/                      # Runtime drop-folder for compiled plugins
│   ├── wwwroot/                      # Static assets: JS, CSS, images, fonts
│   ├── App_Data/                     # Settings, install state, logs
│   └── Program.cs / appsettings.json # Host & configuration
└── Nop.Web.Framework/                # Shared MVC infra used by Web and plugins
    ├── Controllers/                  # Base controllers, filters
    ├── Mvc/                          # Model binders, action filters, attributes
    ├── Themes/                       # Theme provider abstractions
    ├── Models/                       # Shared model base classes
    └── Infrastructure/               # Startup tasks, DI extensions
```

**Frontend extension points**
- **Themes** override views/CSS without touching core.
- **Widgets** (a plugin type) inject UI fragments into named zones (e.g., `home_page_top`).
- **View Components** render reusable server-side fragments.
- **`/Plugins` drop-folder** lets compiled plugins ship their own controllers, views, static assets.

### 3.7 Backend characteristics
- Repository pattern over **LinqToDB**.
- In-process event bus via `IConsumer<TEvent>` style handlers.
- `ScheduleTask` table polled by a built-in scheduler (no external job queue).
- DI-first; services resolved through ASP.NET Core's container with NopEngine wrapper.
- **PCI-DSS** compliant payment flows; pluggable provider model.

### 3.8 Data model — relevant entities (high-level)
`Product`, `Category`, `Manufacturer`, `Warehouse`, `Vendor`, `Store`,
`Customer`, `Address`, `ShoppingCartItem`, `Order`, `OrderItem`, `Shipment`,
`Discount`, `TaxRate`, `Country`, `StateProvince`, `Currency`, `Language`,
`PaymentMethod`, `ShippingMethod`, `EmailAccount`, `MessageTemplate`.

### 3.9 Strengths (carry forward)
- Mature, **PCI-DSS compliant** payment & checkout flows.
- **Multi-store / multi-warehouse / multi-vendor** out of the box.
- **Plugin extensibility** — new behaviour can ship without forking core.
- **Async-everywhere**, **Docker-ready**, **multi-DB**, **web-farm capable**.
- Active community, large marketplace (800+ integrations).

### 3.10 Limitations for quick-commerce
- Server-rendered storefront unsuitable for app-grade mobile UX.
- No first-class **real-time** infrastructure (WebSocket, push, live tracking).
- Order state machine designed for **days-long fulfilment**, not minutes.
- **Inventory** model is warehouse-centric, not designed for high-frequency, per-dark-store reservations.
- No native **geo-serviceability** (pincode/polygon → store mapping).
- No **rider / dispatch / routing** domain.
- Monolithic deploy unit — cannot autoscale Order or Inventory independently.
- Reports are SQL-based, not streaming; insufficient for ops dashboards in q-commerce.

### 3.11 Frontend ↔ Backend interaction

The current platform has **two interaction styles** between client and server:

**A. Browser ↔ Razor MVC (default, all OSS users)**

```
Browser  ──HTTPS POST/GET──►  Routing (ASP.NET Core)
                                    │
                                    ▼
                            Controller (Nop.Web / Areas/Admin)
                                    │  uses
                                    ▼
                            View Model Factory (Nop.Web/Factories)
                                    │  calls
                                    ▼
                            Service (Nop.Services)
                                    │  reads/writes via
                                    ▼
                            Repository (Nop.Data, LinqToDB)
                                    │
                                    ▼
                            SQL Server / PostgreSQL / MySQL
                                    │
                            (Cache: Redis or in-memory; checked before DB)
                                    │
                            (In-process Events: IConsumer<TEvent> fired after writes)
                                    │
                                    ▼
                            Controller returns Razor View → HTML to Browser
```

- Every interaction is a **full HTTP round-trip**; no WebSocket on the public storefront.
- Plugins can hook into this flow by registering controllers, view components, widgets, or event consumers.
- Themes / widgets can override or inject UI without touching the controller.

**B. External client ↔ Web API plugin (paid add-on, used by mobile/headless)**

```
Mobile / SPA ──HTTPS JSON──►  Web API plugin endpoints (REST)
                                       │
                                       ▼
                               Same Service layer (Nop.Services)
                                       │
                                       ▼
                               Same Data layer (Nop.Data)
```

- Reuses the existing service & data layers; only the entry point differs.
- Auth via JWT/OAuth issued by the API plugin.

**Cross-cutting interactions inside the process**
- **Caching:** Services consult `IStaticCacheManager` (in-memory or Redis) before hitting `Nop.Data`.
- **Eventing:** `IEventPublisher` raises events that `IConsumer<TEvent>` handlers process **synchronously, in-process**.
- **Background work:** `ScheduleTask` rows are polled by a built-in scheduler thread inside the same web process.
- **External integrations:** payment / shipping / tax providers are invoked **synchronously** from the request thread via plugin contracts.

**Implications for quick-commerce**
- The browser-only, request/response model means **live tracking, ETA updates, and rider location push** cannot be delivered without adding a new real-time channel (SignalR / WebSocket / MQTT).
- The single-process eventing means **stock changes in one node are not instantly visible to others** unless Redis cache invalidation is wired up; this is a hard blocker for accurate per-dark-store inventory.
- Mobile/native clients require the **paid Web API plugin** or a custom-built API surface — there is no public REST API in the OSS core.

---

## 4. Target (To-Be) Capabilities — Quick-Commerce Domain

### 4.1 Functional capabilities
1. **Hyperlocal serviceability** — gate browsing by deliverable location (lat/long or pincode).
2. **Per-dark-store catalog & inventory** — assortment, price and stock vary per store.
3. **10–30 min delivery promise** — promised SLA shown at cart and tracked through fulfilment.
4. **Order pipeline:** `Placed → Paid → Picking → Packed → RiderAssigned → OutForDelivery → Delivered` (with `Cancelled / Returned` branches).
5. **Rider management** — onboarding, shifts, attendance, earnings, COD reconciliation.
6. **Dispatch & routing** — auto-assignment (nearest, capacity, batching), manual override.
7. **Live tracking** — rider location and ETA on customer app.
8. **Dynamic pricing** — surge, time-of-day, location, promo engine.
9. **Push / SMS / in-app** notifications across order lifecycle.
10. **Picker / packer apps** for dark-store ops.
11. **Ops console** — live orders, store health, stock-outs, dispatch overrides.

---

## 5. Gap Analysis — As-Is vs. To-Be

| # | Capability | nopCommerce as-is | Quick-commerce need | Gap | Action |
|---|---|---|---|---|---|
| 1 | Storefront UX | Razor MVC, page reloads | Mobile-first SPA / native | **Major** | New mobile app (React Native / Flutter) + PWA web |
| 2 | API surface | Web API plugin (paid) | Public REST + GraphQL/BFF | **Medium** | Adopt Web API + add BFF per client |
| 3 | Geo serviceability | None | Pincode/polygon → store | **Major** | New `Location/Serviceability` module |
| 4 | Catalog scoping | Global (per store/vendor) | Per dark store | **Medium** | Use multi-store; add per-store overrides for price/stock |
| 5 | Inventory | Warehouse-centric, basic | Per-store SKU, reservations, real-time | **Major** | New `Inventory` service with outbox + reservation TTL |
| 6 | Order pipeline | Standard e-commerce states | Pick → Pack → Dispatch → Track | **Major** | Extend `Order` domain; add saga/orchestrator |
| 7 | Rider management | Not present | Full domain | **Major** | New `Rider` service + apps |
| 8 | Dispatch / routing | Not present | Auto-assign + batching | **Major** | New `Dispatch` service (algo + manual override) |
| 9 | Real-time | None | WebSocket / SignalR / MQTT | **Major** | New `Realtime` hub (SignalR) + push (FCM/APNS) |
| 10 | Eventing | In-process events | Durable broker | **Medium** | Add Kafka / Azure Service Bus + Outbox pattern |
| 11 | Pricing | Static + discounts | Surge / dynamic | **Medium** | New `Pricing` service |
| 12 | Search | SQL / Elastic plugin | Instant typeahead | **Medium** | Algolia / OpenSearch with per-store index |
| 13 | Notifications | Email-centric | Push + SMS + in-app | **Medium** | New `Notification` service (provider-agnostic) |
| 14 | Analytics | SQL reports | Streaming dashboards | **Medium** | Kafka → ClickHouse / Synapse + Grafana |
| 15 | Observability | Basic logging | Tracing per order | **Medium** | OpenTelemetry → App Insights / Grafana |
| 16 | Deployment | Single monolith | Independent autoscale | **Major** | Strangler-fig to Kubernetes / Container Apps |
| 17 | Caching | In-memory / Redis | Geo-sharded per store | **Minor** | Redis with `storeId` keying + invalidation events |
| 18 | Compliance | PCI-DSS | + India DPDP / GDPR | **Minor** | Privacy review for rider/customer location data |

---

## 6. Recommended Target Architecture

### 6.1 Architectural principles
1. **Strangler-fig over big-bang** — keep nopCommerce running, peel off hot domains.
2. **Modular monolith first** — refactor inside the current solution; extract only when value justifies operational cost.
3. **Domain-Driven boundaries** — explicit bounded contexts; one team owns one service.
4. **Event-driven for state propagation** — durable broker, outbox, idempotent consumers.
5. **API-first** — every capability exposed via versioned REST; clients are first-class.
6. **Observability by default** — every service emits traces, metrics, structured logs.
7. **Security by default** — secrets in vault, least-privilege, encryption at rest & in transit.
8. **Cloud-native** — containers, Kubernetes / Container Apps, IaC.

### 7.2 High-level component diagram

```
[Customer Mobile]  [Rider App]  [Picker App]  [Ops Console]  [Web PWA]
        \             |            |              |             /
         \            v            v              v            /
          +------------------- API Gateway ----------------+
                              (YARP / APIM)
                                    |
   +-----------+----------+---------+---------+----------+----------+
   |           |          |         |         |          |          |
Catalog   Inventory    Order    Dispatch   Pricing   Notification  Location
 (per      (per-store    Saga    (rider     (surge    (push/SMS/    (geo,
 store)    real-time)   orches.   alloc.)    dyn.)    email)        ETA)
   |           |          |         |         |          |          |
   +-----------+----+-----+----+----+---------+----------+----------+
                    |          |
              Event Bus  (Kafka / Azure Service Bus)
                    |          |
   Search (Algolia/OpenSearch)  Cache (Redis)   Geo (PostGIS / Redis Geo)
                        |
                  OLTP (SQL Server / PostgreSQL)
                        |
        Streaming → Analytics (ClickHouse / Synapse) → Dashboards
        Tracing/Logs/Metrics → OpenTelemetry → Grafana / App Insights
```

### 7.3 Service catalog (Phase 2 target)

| Service | Responsibility | Data store |
|---|---|---|
| **Catalog** | Master products, categories, attributes; per-store assortment overrides | SQL + Redis |
| **Inventory** | Per-store SKU stock, reservations, replenishment | SQL + Redis (hot keys) |
| **Order Orchestrator** | Order lifecycle saga, idempotency | SQL (write) |
| **Pricing** | Base price, surge, promotions | SQL + Redis |
| **Dispatch** | Rider allocation, batching, reassignment | SQL + Redis Geo |
| **Rider** | Rider profile, shifts, earnings | SQL |
| **Location** | Serviceability, pincode→store, ETA | PostGIS |
| **Notification** | Push / SMS / email | Stateless |
| **Realtime** | SignalR hub for live ETA & order status | Redis backplane |
| **Identity** | Customer / rider / staff auth, MFA | SQL |
| **Payments** | Wraps PCI-DSS providers (Stripe etc.) | SQL |
| **Search** | Per-store typeahead | Algolia / OpenSearch |
| **Analytics** | Streaming KPIs | Kafka → ClickHouse |

### 7.4 Frontend strategy

| Surface | Tech | Rationale |
|---|---|---|
| Customer mobile | **React Native** (or Flutter) | Cross-platform, single team, reuses BFF |
| Customer web | **Next.js PWA** | SEO + offline + installable |
| Rider app | **React Native** | Same skill set; low-end Android first |
| Picker / Packer app | **React Native** (tablet) or PWA | In-store device, quick to deploy |
| Admin / Ops console | **React + TypeScript** SPA | Rich tables, real-time tiles |
| Existing nopCommerce admin | Kept temporarily | Catalog, marketing, CMS, vendors |

Adopt **Backend-for-Frontend (BFF)** per client to keep mobile responses lean.

### 7.5 Key design patterns
- **CQRS** for catalog (read-heavy) vs. inventory (write-heavy).
- **Saga / Orchestrator** for order lifecycle.
- **Outbox** for reliable event publishing.
- **Event-driven inventory** (every pick / sale / restock emits an event).
- **Circuit breaker / retry / bulkhead** via Polly.
- **Feature flags** (LaunchDarkly / ConfigCat) — roll out store-by-store.
- **Idempotency keys** on all state-changing public APIs.

---

## 8. Phased Migration Roadmap

### Phase 0 — Foundation (architecture spike)
- Clone repo (`release-4.90.4`) into engineering workspace.
- Stand up CI/CD, container builds, observability skeleton.
- Decide language/framework for new services (recommend stay on **.NET** to reuse skillset).

### Phase 1 — Modular Monolith inside nopCommerce
- Use **Multi-store** = one logical "dark store" per locality/pincode.
- Use **Warehouses** for hyperlocal stock; refine `Warehouse` → `DarkStore` view.
- Build three plugins:
  1. `Nop.Plugin.QuickCommerce.Geo` — pincode/lat-long → store/warehouse resolution; address gating before browsing.
  2. `Nop.Plugin.QuickCommerce.Dispatch` — extended order states, rider entity, basic assignment.
  3. `Nop.Plugin.QuickCommerce.Realtime` — SignalR hub for ETA, rider location, stock invalidation.
- License the **Web API plugin** to expose REST for new mobile clients.
- Ship **customer mobile app v1** + **PWA**.
- Pilot in **one dark store / one pincode**.

### Phase 2 — Strangler-fig extraction
Pull these out of the monolith (in order of business value):
1. **Inventory** (per-store, real-time, reservations + outbox).
2. **Order Orchestrator** (saga across pay → pick → pack → dispatch).
3. **Dispatch** (rider allocation, batching).
4. **Pricing** (surge, time-of-day).
5. **Notification** (push / SMS / email).
6. **Location** (geofencing, ETA).

Add the platform pieces: **Kafka / Service Bus**, **Redis (Geo)**, **PostGIS**, **OpenSearch / Algolia**, **OpenTelemetry**.

### Phase 3 — Decompose remaining hot paths
- Extract **Catalog** read-side (CQRS) if read traffic exceeds monolith scaling envelope.
- Keep **CMS / Marketing / Forums / Vendors** in original monolith (no q-commerce value in extracting).
- Continue per-city, per-store rollout via feature flags.

### Phase 4 — Optimize & decommission
- Decommission unused nopCommerce modules irrelevant to q-commerce (forums, recurring billing if unused).
- Tune autoscaling, cost, FinOps.
- Replatform admin to the new Ops Console once parity is reached.

---

## 9. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Big-bang rewrite fails / over-runs | Medium | High | Strangler-fig; ship per dark store; feature flags |
| R2 | nopCommerce plugin coupling slows extraction | Medium | Medium | Extract Inventory & Order first; freeze non-critical changes |
| R3 | Real-time stock drift in dark stores | High | High | Reservation TTL, idempotent consumers, hourly reconciliation |
| R4 | Team skill gap (mobile, microservices, K8s) | Medium | Medium | Training + targeted hires; modular monolith first |
| R5 | Rider data privacy (DPDP / GDPR) | Medium | High | DPIA, retention policies, opt-in tracking |
| R6 | Vendor lock-in (cloud / search / push) | Medium | Medium | Abstract behind interfaces; IaC portability |
| R7 | Cost blow-up (broker, search, geo) | Medium | Medium | Start managed-minimal, FinOps reviews per phase |
| R8 | Regulatory gig-worker rules | Low | Medium | Legal review of rider engagement model |

