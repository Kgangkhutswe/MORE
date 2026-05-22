# VaseOps (Uptime Kuma Fork) — Technical Documentation

> **Version**: 2.3.2  
> **Purpose**: Comprehensive architecture, module, configuration, and flow reference for the monitoring application codebase.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Layer](#6-database-layer)
7. [Monitoring Engine](#7-monitoring-engine)
8. [Notification System](#8-notification-system)
9. [Status Pages](#9-status-pages)
10. [Authentication & Security](#10-authentication--security)
11. [Configuration Reference](#11-configuration-reference)
12. [Key Flows & Sequence Diagrams](#12-key-flows--sequence-diagrams)
13. [Build & Deployment](#13-build--deployment)
14. [Development Workflow](#14-development-workflow)
15. [Directory Structure](#15-directory-structure)
16. [Rules & Conventions](#16-rules--conventions)

---

## 1. Overview

VaseOps is a self-hosted monitoring tool forked from Uptime Kuma. It monitors uptime for HTTP(s), TCP, DNS, Ping, Push, Docker, databases, game servers, and more. It provides real-time dashboards, public status pages, and 90+ notification integrations.

**Core Design Principles:**
- **Single-process Node.js backend** with Socket.IO for real-time updates
- **Vue.js 3 SPA frontend** that acts as a reactive projection of server state
- **SQLite by default**, with optional MariaDB/MySQL for larger deployments
- **Plugin-based monitor types** and notification providers for extensibility
- **No dedicated state management library** — the root Vue instance acts as the global store

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js ≥ 20.4.0 |
| **Frontend Framework** | Vue.js 3 (Options API) |
| **Build Tool** | Vite 5.x |
| **Router** | vue-router 4 |
| **UI Framework** | Bootstrap 5 + custom SCSS |
| **Real-time Transport** | Socket.IO 4.x |
| **Backend Framework** | Express 4.x |
| **Database ORM/Query Builder** | Knex 3.x + redbean-node |
| **Databases** | SQLite (default), MariaDB/MySQL, Embedded MariaDB (Docker) |
| **Auth** | bcryptjs, jsonwebtoken, notp (TOTP) |
| **Scheduling** | croner |
| **Notifications** | 90+ providers (Discord, Slack, Telegram, SMTP, PagerDuty, etc.) |
| **Charts** | Custom Canvas 2D (PingChart, HeartbeatBar) |
| **i18n** | vue-i18n 9 (100+ locales) |
| **Testing** | Node.js built-in test runner, Playwright (E2E) |
| **Containerization** | Docker + Docker Compose |

---

## 3. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │  Vue.js SPA │  │  Socket.io  │  │  Public Status Page (no auth)│ │
│  │  (Dashboard)│  │  (Real-time)│  │  (SSR-injected preload data) │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┬───────────────┘  │
└─────────┼────────────────┼───────────────────────┼──────────────────┘
          │                │                       │
          │ HTTP(S)        │ WebSocket             │ HTTP(S)
          ▼                ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NODE.JS SERVER                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Express App                                                  │    │
│  │  ├─ Static files (dist/)                                     │    │
│  │  ├─ API routes (/api/*, /status/*)                           │    │
│  │  ├─ Prometheus metrics (/metrics)                            │    │
│  │  └─ SPA fallback (index.html)                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Socket.IO Handlers                                          │    │
│  │  ├─ Auth (login, 2FA, logout)                                │    │
│  │  ├─ Monitor CRUD                                             │    │
│  │  ├─ Real-time data broadcast                                 │    │
│  │  └─ Settings & Maintenance                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  UptimeKumaServer (Singleton)                                │    │
│  │  ├─ Monitor Scheduler (setTimeout loops per monitor)         │    │
│  │  ├─ MonitorType Registry                                     │    │
│  │  ├─ Notification Dispatcher                                  │    │
│  │  ├─ UptimeCalculator (aggregate statistics)                  │    │
│  │  ├─ Prometheus Metrics Collector                             │    │
│  │  └─ Background Jobs (cron)                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Database Layer                                              │    │
│  │  ├─ SQLite (default) / MariaDB / Embedded MariaDB            │    │
│  │  ├─ Knex migrations                                          │    │
│  │  └─ redbean-node ORM (BeanModel)                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Entry Point & Bootstrap

**File**: `src/main.js`

The app uses `createApp` but mounts an inline root component with global mixins:

```js
const app = createApp({
    mixins: [socket, theme, mobile, datetime, publicMixin, lang],
    data() { return { appName: appName }; },
    render: () => h(App),
});
```

Setup sequence:
1. Import Bootstrap JS and global SCSS
2. Register plugins: `router`, `i18n`, `vue-toastification`
3. Register global components: `<Editable>`, `<FontAwesomeIcon>`
4. Mount to `#app`
5. Register service worker for Web Push

**File**: `src/App.vue`

Minimal root component — renders `<router-view />` only.

### 4.2 State Management Pattern

Uptime Kuma does **not** use Pinia or Vuex. Instead, it uses a **root-instance-as-store** pattern:

- The `socket` mixin (`src/mixins/socket.js`) defines a large `data()` object on the root instance
- All components access global state via `this.$root.monitorList`, `this.$root.heartbeatList`, etc.
- The backend pushes state changes via Socket.IO events; the frontend updates reactively

**Key root data properties:**
```js
info: {},               // Server info (version)
loggedIn: false,
username: null,
monitorList: {},        // All monitors keyed by ID
heartbeatList: {},      // Heartbeats keyed by monitorID
avgPingList: {},
uptimeList: {},
tlsInfoList: {},
maintenanceList: [],
notificationList: [],
statusPageList: [],
proxyList: [],
```

### 4.3 Routing

**File**: `src/router.js`

Uses `createRouter` with `createWebHistory`. Key routes:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Entry.vue` | Redirects to dashboard, status page, or setup |
| `/dashboard` | `Dashboard` → `DashboardHome` | Main monitoring dashboard |
| `/dashboard/:id` | `Details` | Monitor detail view |
| `/edit/:id` / `/add` | `EditMonitor` | Create/edit monitor form |
| `/settings/*` | `Settings` | App settings (general, security, notifications, etc.) |
| `/status/:slug` | `StatusPage.vue` | Public status page |
| `/setup` | `Setup.vue` | First-time setup wizard |
| `/setup-database` | `SetupDatabase.vue` | Database configuration wizard |

### 4.4 Key UI Components

| Component | Purpose |
|-----------|---------|
| `<MonitorList>` | Sidebar with search, filtering, grouping, bulk actions |
| `<HeartbeatBar>` | Canvas-based visual bar of recent heartbeats |
| `<PingChart>` | Canvas-based line chart of ping/response time history |
| `<Status>` | Colored badge (Up/Down/Pending/Maintenance) |
| `<Uptime>` | Uptime percentage for a time window |
| `<Login>` | Login form with 2FA support |
| `<NotificationDialog>` | Add/edit notification provider modal |

### 4.5 Internationalization

**File**: `src/i18n.js`

- `en.json` bundled eagerly; other locales loaded on demand
- RTL languages tracked (`he-IL`, `fa`, `ar-SY`, `ur`)
- `postcss-rtlcss` generates RTL stylesheets automatically

### 4.6 Build Configuration

**File**: `config/vite.config.js`

- Dev server port: `3000`
- Plugins: `@vitejs/plugin-vue`, `rollup-plugin-visualizer`, `vite-plugin-compression` (gzip + brotli)
- PostCSS: `postcss-scss` parser + `postcss-rtlcss`
- `FRONTEND_VERSION` injected from `package.json`

---

## 5. Backend Architecture

### 5.1 Entry Point

**File**: `server/server.js`

Bootstrap sequence:
1. Load `dotenv`, configure `dayjs` plugins
2. Validate Node.js version via `semver`
3. Parse CLI args via `args-parser`
4. Instantiate `UptimeKumaServer` singleton
5. Initialize subsystems: notifications, web-push, rate limiters
6. Start async initialization:
   - `Database.initDataDir(args)`
   - `SetupDatabase` (if no DB configured)
   - `Database.connect()` (runs migrations)
   - `server.initAfterDatabaseReady()`
   - `Prometheus.init()`
7. Mount Express routes
8. Mount Socket.IO handlers

### 5.2 Core Server Class

**File**: `server/uptime-kuma-server.js`

`UptimeKumaServer` is a **singleton** that owns the HTTP/WebSocket server lifecycle.

**Key responsibilities:**
- Create `http.Server` or `https.Server` (if SSL certs configured)
- Register all `MonitorType` subclasses in `monitorTypeList`
- Client IP resolution with `trustProxy` support
- Timezone management
- Data broadcasting helpers (`sendMonitorList`, `sendUpdateMonitorIntoList`)
- Maintenance lifecycle (`loadMaintenanceList`, cron scheduling)
- Socket management (`disconnectAllSocketClients`)

### 5.3 Socket Handlers

**Directory**: `server/socket-handlers/`

| Handler | Events |
|---------|--------|
| `general-socket-handler.js` | `initServerTimezone`, `getGameList`, `testChrome` |
| `status-page-socket-handler.js` | `postIncident`, `unpinIncident`, `getIncidentHistory` |
| `maintenance-socket-handler.js` | `addMaintenance`, `editMaintenance`, `deleteMaintenance` |
| `database-socket-handler.js` | `databaseSize`, `shrinkDatabase` |
| `docker-socket-handler.js` | Docker host management |
| `proxy-socket-handler.js` | Proxy CRUD |
| `api-key-socket-handler.js` | API key generation/revocation |
| `remote-browser-socket-handler.js` | Playwright remote browser management |
| `cloudflared-socket-handler.js` | Cloudflare Tunnel token management |
| `chart-socket-handler.js` | Chart/heartbeat data requests |

**Auth pattern:** Most handlers start with `checkLogin(socket)`. After login, sockets `join(socket.userID)` for targeted broadcasts.

### 5.4 Models

**Directory**: `server/model/`

| Model | Purpose |
|-------|---------|
| `monitor.js` | Central model (~84 KB). Defines monitor properties, validation, `check()` orchestration, heartbeat logic, notification triggering, certificate checks |
| `heartbeat.js` | Single check result. Supports Brotli-compressed response storage |
| `user.js` | Password reset, JWT creation |
| `status_page.js` | SSR rendering, RSS feeds, domain mapping, incident history |
| `maintenance.js` | Maintenance windows with cron scheduling |
| `group.js`, `tag.js`, `incident.js`, `proxy.js`, `docker_host.js`, `api_key.js` | Supporting domain models |

**Pattern:** Models extend `BeanModel` from `redbean-node`. Use `R.dispense("table")` to create, `R.store()` to persist.

### 5.5 Background Jobs

**File**: `server/jobs.js`

Uses `croner` for scheduling in the server's timezone.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `clear-old-data` | `14 03 * * *` (3:14 AM daily) | Deletes old non-important heartbeats and `stat_daily` rows |
| `incremental-vacuum` | `*/5 * * * *` (every 5 min) | Runs `PRAGMA incremental_vacuum(200)` on SQLite |

### 5.6 Settings Management

**File**: `server/settings.js`

Key-value store over the `setting` table with an **in-memory LRU-style cache** (60-second TTL).

```js
Settings.get(key)      // Returns parsed JSON (cached)
Settings.set(key, val) // Persists and invalidates cache
```

Common settings: `serverTimezone`, `entryPage`, `trustProxy`, `disableAuth`, `keepDataPeriodDays`, `primaryBaseURL`.

---

## 6. Database Layer

### 6.1 Connection Strategy

**File**: `server/database.js`

Reads `data/db-config.json` to determine database type.

**SQLite (default):**
- Bootstraps from `./db/kuma.db` template if missing
- Uses `@louislam/sqlite3` via patched Knex dialect
- Defaults to **single connection** (`pool: {min:1, max:1}`) to avoid `SQLITE_BUSY`
- WAL mode, foreign keys, incremental auto-vacuum, 5s busy timeout

**MariaDB / MySQL:**
- Uses `mysql2` client
- Creates DB if not exists (`utf8mb4`)
- Default max pool: 10, cap: 100
- Disables timezone conversion for `DATETIME` fields

**Embedded MariaDB (Docker only):**
- Runs inside the container via `mariadbd`
- Connects via Unix socket
- Requires `node` or `root` user

### 6.2 Migrations

- **Legacy patches**: Versioned SQL files in `./db/old_migrations/`
- **Knex migrations**: Modern migrations in `./db/knex_migrations/`
- **Aggregate table migration**: One-time migration that computes minutely/hourly/daily statistics into `stat_*` tables

### 6.3 Data Maintenance

- `clearHeartbeatData()`: Deletes non-important heartbeats older than N days, keeping last 100 rows and last 24 hours per monitor
- `shrink()`: Runs `VACUUM` on SQLite

---

## 7. Monitoring Engine

### 7.1 Monitor Lifecycle

**File**: `server/model/monitor.js`

Each monitor runs an asynchronous `beat()` loop scheduled via `setTimeout` (not `setInterval`), so the next check only begins after the current one completes.

```
Monitor.start()
  └─► safeBeat() ──► beat()
        │
        ├─► Check if under maintenance → MAINTENANCE status
        │
        ├─► Run check (inline or MonitorType.check())
        │     └─► Evaluate monitor conditions (if supported)
        │
        ├─► Set heartbeat status (UP / DOWN / PENDING)
        │
        ├─► isImportantBeat() ? → important = true
        │     ├─► isImportantForNotification() ? → sendNotification()
        │     └─► Clear status page cache
        │
        ├─► UptimeCalculator.update(status, ping)
        ├─► Prometheus.update(heartbeat, tlsInfo, uptimeData)
        ├─► io.emit("heartbeat", bean) [WebSocket push]
        ├─► Store heartbeat to DB
        └─► Schedule next beat via setTimeout()
```

### 7.2 Monitor Types

**Directory**: `server/monitor-types/`

Checks are handled in two ways:
1. **Inline types** in `Monitor.beat()`: `http`, `keyword`, `json-query`, `ping`, `push`, `steam`, `docker`, `radius`, `kafka-producer`
2. **Pluggable types** via `server/monitor-types/`: Registered in `UptimeKumaServer.monitorTypeList`

**Base class**: `server/monitor-types/monitor-type.js`

```js
class MonitorType {
    name = undefined;
    supportsConditions = false;
    conditionVariables = [];
    allowCustomStatus = false;

    async check(monitor, heartbeat, server) {
        throw new Error("You need to override check()");
    }
}
```

| Type | File | Notes |
|------|------|-------|
| DNS | `dns.js` | A/AAAA/MX/TXT/etc. Supports conditions on `record` |
| TCP / Port | `tcp.js` | Uses `tcp-ping`; TLS alert detection |
| MQTT | `mqtt.js` | Keyword, JSONata, or condition-based matching |
| OracleDB / MySQL / MSSQL / Postgres / MongoDB | DB files | Execute queries; support conditions on `result` |
| Real Browser | `real-browser-monitor-type.js` | Playwright-based checks |
| Group | `group.js` | Logical grouping container |
| Manual | `manual.js` | User-triggered status updates |

### 7.3 Heartbeat Recording

Each beat creates a `heartbeat` bean with:
- `monitor_id`, `time`, `status` (UP=1, DOWN=0, PENDING=2, MAINTENANCE=3)
- `ping` (response time in ms)
- `msg` (result or error message)
- `important` (did status change meaningfully?)

### 7.4 Retry and Importance Logic

- **Retries**: If `maxretries > 0` and check fails, status is `PENDING` until retries exhaust, then `DOWN`
- **isImportantBeat()**: Returns `true` for first beat, UP→DOWN, DOWN→UP, PENDING→DOWN, and any MAINTENANCE transition
- **isImportantForNotification()**: Stricter — suppresses notifications for MAINTENANCE transitions

### 7.5 Monitor Conditions

**Directory**: `server/monitor-conditions/`

Advanced rule engine for custom success criteria:
- `expression.js`: `ConditionExpression` (variable + operator + value) and `ConditionExpressionGroup` (nested AND/OR)
- `operators.js`: String and numeric operators
- `evaluator.js`: `evaluateExpressionGroup(group, context)` recursively evaluates the tree

### 7.6 Uptime Calculation

**File**: `server/uptime-calculator.js`

Maintains in-memory singleton per monitor ID. Updates three time-bucketed tables:

| Table | Granularity | Retention |
|-------|-------------|-----------|
| `stat_minutely` | 1 minute | 24 hours |
| `stat_hourly` | 1 hour | 30 days |
| `stat_daily` | 1 day | 365 days |

- `update(status, ping)` computes time key and increments counters
- UP and MAINTENANCE treated as "up"; PENDING and DOWN as "down"
- Running `avgPing`, `minPing`, `maxPing` using incremental averaging

---

## 8. Notification System

### 8.1 Registry & Base Class

**File**: `server/notification.js`

Static registry. `Notification.init()` instantiates ~90 provider subclasses into `Notification.providerList`.

**Base class**: `server/notification-providers/notification-provider.js`

```js
class NotificationProvider {
    async send(notification, msg, monitorJSON, heartbeatJSON) {
        throw new Error("Override send()");
    }

    renderTemplate(template, msg, monitorJSON, heartbeatJSON) {
        // LiquidJS templating
        // Context: status, name, hostnameOrURL, monitorJSON, heartbeatJSON, msg
    }

    getAxiosConfigWithProxy() {
        // Supports HTTP/SOCKS proxies via notification_proxy
    }
}
```

### 8.2 Triggering Logic

**File**: `server/model/monitor.js` (line ~1487)

Notifications sent in `Monitor.sendNotification()`:
1. Skip first-beat UP notifications
2. Query `monitor_notification` join table for linked providers
3. Build message: `[Monitor Name] [✅ Up / 🔴 Down] error message`
4. Enrich `heartbeatJSON` with timezone, local datetime, `lastDownTime`
5. Call `Notification.send()` for each provider (errors caught per-provider)

**Resend while down**: If monitor remains DOWN and `resendInterval > 0`, `downCount` increments. When `downCount >= resendInterval`, notification is sent again.

### 8.3 Key Providers

| Provider | Key Features |
|----------|--------------|
| Discord | Rich embeds, custom templates, forum posts, avatar fallback |
| Slack | Block-kit messages with uptime stats and downtime duration |
| Telegram | Custom messages, thread IDs, topic IDs |
| Webhook | GET/POST, JSON, form-data, custom headers, Liquid templating |
| SMTP | Standard email via nodemailer |
| PagerDuty / Opsgenie / FlashDuty | Incident management payloads |

---

## 9. Status Pages

### 9.1 Backend

**File**: `server/model/status_page.js`

- **`renderHTML()`**: Uses Cheerio to inject preload data into `index.html`. Injects title, meta, OG tags, `window.preloadData`, analytics scripts, custom CSS, favicon
- **`getStatusPageData()`**: Returns `{ config, incidents, publicGroupList, maintenanceList }`
- **`overallStatus()`**: Aggregates latest heartbeats into `ALL_UP`, `PARTIAL_DOWN`, `ALL_DOWN`, `MAINTENANCE`
- **`renderRSS()`**: RSS feed of currently DOWN monitors
- **Domains**: `status_page_cname` table allows custom domains

### 9.2 Frontend

**File**: `src/pages/StatusPage.vue`

- Consumes `window.preloadData` on load, then lives on `$root.publicGroupList`
- Layout: Overall status banner → pinned incidents → maintenance windows → monitor groups → incident history
- **Edit mode**: Sidebar for admins to modify slug, title, theme, refresh interval, tags visibility, cert expiry visibility, custom CSS, domain names, analytics

---

## 10. Authentication & Security

### 10.1 Session Authentication
- **Username/Password**: bcryptjs hashing (upgraded from legacy `password-hash` automatically on login)
- **JWT**: `User.createJWT()` issues token with `username` and shake256 hash of password. Password change invalidates old tokens.
- **Token login**: `loginByToken` verifies JWT and calls `afterLogin()`

### 10.2 Two-Factor Authentication (2FA)
- TOTP (`notp.totp`) with 30-second window
- `prepare2FA` generates base32 secret and `otpauth://` URI
- Rate-limited by `twoFaRateLimiter`

### 10.3 API Keys
- Format: `uk<ID>_<secret>`
- Stored with bcrypt-hashed keys
- Used by `apiAuth` middleware for `/metrics` and Prometheus endpoints

### 10.4 Rate Limiting
Three `KumaRateLimiter` instances:
- **login**: 20/minute
- **API**: 60/minute
- **2FA**: 30/minute

### 10.5 Security Headers
- `X-Frame-Options: SAMEORIGIN` (unless disabled)
- `X-Powered-By` removed
- WebSocket origin check validates `Origin` against `Host` / `X-Forwarded-Host`

---

## 11. Configuration Reference

### 11.1 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UPTIME_KUMA_HOST` | — | Server bind hostname. Empty = dual-stack |
| `UPTIME_KUMA_PORT` | `3001` | Server listen port |
| `UPTIME_KUMA_SSL_KEY` / `SSL_KEY` | — | Path to SSL private key |
| `UPTIME_KUMA_SSL_CERT` / `SSL_CERT` | — | Path to SSL certificate |
| `UPTIME_KUMA_SSL_KEY_PASSPHRASE` | — | SSL key passphrase |
| `UPTIME_KUMA_DB_TYPE` | `sqlite` | Database type (`sqlite`, `mariadb`) |
| `UPTIME_KUMA_DB_HOSTNAME` | — | MariaDB host |
| `UPTIME_KUMA_DB_PORT` | `3306` | MariaDB port |
| `UPTIME_KUMA_DB_NAME` | `kuma` | MariaDB database name |
| `UPTIME_KUMA_DB_USERNAME` | — | MariaDB username |
| `UPTIME_KUMA_DB_PASSWORD` | — | MariaDB password |
| `UPTIME_KUMA_DB_POOL_MAX_CONNECTIONS` | `10` | Max DB connections |
| `UPTIME_KUMA_SQLITE_SINGLE_CONNECTION` | `true` | Use single SQLite connection |
| `UPTIME_KUMA_ENABLE_EMBEDDED_MARIADB` | `0` | Enable embedded MariaDB |
| `DATA_DIR` | `./data` | Data directory path |
| `NODE_ENV` | `production` | Environment mode |
| `UPTIME_KUMA_WS_ORIGIN_CHECK` | `cors-like` | WebSocket origin validation |
| `UPTIME_KUMA_HIDE_LOG` | — | Comma-separated `level_module` to hide |
| `UPTIME_KUMA_LOG_FORMAT` | — | Set to `json` for structured logging |

### 11.2 CLI Arguments

| Argument | Description |
|----------|-------------|
| `--host` | Bind hostname |
| `--port` | Listen port |
| `--ssl-key` | SSL private key path |
| `--ssl-cert` | SSL certificate path |
| `--ssl-key-passphrase` | SSL key passphrase |
| `--demo` | Enable demo mode |
| `--data-dir` | Data directory override |
| `--cloudflared-token` | Cloudflare Tunnel token |

---

## 12. Key Flows & Sequence Diagrams

### 12.1 User Login Flow

```
User
  │ POST login (username, password)
  ▼
Socket.IO "login" event
  │
  ▼
server.js auth handler
  │
  ├─► Rate limiter check (login)
  ├─► Find user by username
  ├─► bcrypt.compare(password, user.password)
  ├─► If 2FA enabled → emit "need2FA"
  │     User ──► POST 2FA code
  │     Server ──► notp.totp.verify(code, secret)
  │
  └─► afterLogin(socket, user)
        ├─► socket.userID = user.id
        ├─► socket.join(user.id)
        ├─► sendMonitorList(socket)
        ├─► sendMaintenanceList(socket)
        ├─► sendNotificationList(socket)
        ├─► sendProxyList(socket)
        └─► emit "login" success
```

### 12.2 Monitor Check Flow

```
Monitor.start()
  │
  ▼
beat() [setTimeout loop]
  │
  ├─► isUnderMaintenance() ?
  │     Yes → heartbeat.status = MAINTENANCE
  │     No  → proceed
  │
  ├─► Run MonitorType.check()
  │     └─► DNS query / HTTP request / TCP connect / DB query / etc.
  │
  ├─► Evaluate conditions (if supported)
  │
  ├─► Set heartbeat.status = UP or DOWN
  │
  ├─► isImportantBeat(prev, curr) ?
  │     Yes → important = true
  │     ├─► sendNotification() (if important for notification)
  │     └─► apicache.clear() (status page cache)
  │
  ├─► UptimeCalculator.update(status, ping)
  │     └─► Increment stat_minutely / stat_hourly / stat_daily
  │
  ├─► Prometheus.update(heartbeat, tlsInfo, uptimeData)
  │
  ├─► io.to(userID).emit("heartbeat", heartbeat)
  │
  ├─► R.store(heartbeat) [DB persist]
  │
  └─► setTimeout(nextBeat, interval)
```

### 12.3 Notification Dispatch Flow

```
Monitor.sendNotification()
  │
  ├─► Skip if first beat UP
  ├─► Query monitor_notification table
  │
  ├─► For each linked notification config:
  │     │
  │     ▼
  │     Notification.send(config, msg, monitorJSON, heartbeatJSON)
  │       │
  │       ▼
  │       Provider = Notification.providerList[config.type]
  │       │
  │       ├─► renderTemplate() [LiquidJS]
  │       ├─► getAxiosConfigWithProxy()
  │       └─► Provider.send()
  │             └─► Discord API / SMTP / Slack webhook / etc.
  │
  └─► Errors caught per-provider (one failure doesn't block others)
```

### 12.4 Status Page Request Flow

```
Browser ──► GET /status/:slug
  │
  ▼
Express status-page-router
  │
  ▼
StatusPage.renderHTML()
  │
  ├─► getStatusPageData()
  │     ├─► Load config from DB
  │     ├─► Load incidents
  │     ├─► Load publicGroupList (monitors + heartbeats)
  │     └─► Load maintenanceList
  │
  ├─► overallStatus() [aggregate all monitor statuses]
  ├─► Cheerio: inject window.preloadData (jsesc-escaped)
  ├─► Inject analytics scripts
  ├─► Inject custom CSS
  └─► Return rendered HTML
```

### 12.5 Database Setup Flow (First Run)

```
node server/server.js
  │
  ▼
Database.initDataDir()
  │
  ▼
SetupDatabase constructor
  │
  ├─► Try readDBConfig() → fails (no db-config.json)
  ├─► Check kuma.db → not found
  └─► needSetup = true
  │
  ▼
SetupDatabase.start(hostname, port)
  │
  ▼
Express setup app listens on port 3001
  │
  ▼
Browser ──► GET /
  │
  ▼
Serve Setup.vue / SetupDatabase.vue
  │
  ▼
User submits database config
  │
  ▼
POST /setup-database
  │
  ├─► Test connection (mysql2.createConnection + SELECT 1)
  ├─► Write db-config.json
  ├─► emit "ok"
  └─► Shutdown setup server
  │
  ▼
Main server resumes:
  Database.connect() → run migrations → initAfterDatabaseReady()
```

---

## 13. Build & Deployment

### 13.1 Docker

**`compose.yaml`**:
```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    ports:
      - "3001:3001"
```

**Multi-stage Dockerfile** (`docker/dockerfile`):

| Stage | Purpose |
|-------|---------|
| `build_healthcheck` | Compile Go healthcheck binary |
| `build` | `npm ci --omit=dev`, copy source |
| `release` | Production image. Exposes 3001. Uses `dumb-init`. Sets `UPTIME_KUMA_IS_CONTAINER=1` |
| `rootless` | Same as release but runs as `node` user |
| `nightly` | Release + `npm run mark-as-nightly` |
| `pr-test2` | PR testing image with git and gh CLI |

**Base images** (`docker/debian-base.dockerfile`):
- **`base2-slim`**: Node 22 + sqlite3 + ping + dumb-init + curl + cloudflared
- **`base2`**: base2-slim + chromium + fonts + mariadb-server (embedded MariaDB support)

### 13.2 PM2

**File**: `ecosystem.config.js`
```js
module.exports = {
    apps: [{ name: "uptime-kuma", script: "./server/server.js" }]
};
```

### 13.3 Build Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Vite production build → `dist/` |
| `npm run setup` | Download pre-built `dist` from GitHub releases (no build needed) |
| `npm run dev` | Concurrent frontend (Vite :3000) + backend dev server |
| `npm run start-server` | Production server entry |

---

## 14. Development Workflow

### 14.1 Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development mode (frontend + backend)
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001

# Production-like mode
npm run build
node server/server.js
```

### 14.2 Testing

**Backend tests:**
```bash
npm run test-backend
# Uses Node.js built-in test runner
# Tests in: test/backend-test/
```

**E2E tests (Playwright):**
```bash
npm run test-e2e
# Config: config/playwright.config.js
# Specs: test/e2e/specs/
# Workers: 1 (sequential)
# Auto-starts dev backend on port 30001
```

### 14.3 TypeScript

- **Primary TS file**: `src/util.ts` (shared frontend/backend utilities)
- Backend cannot import `.ts` directly; must compile first:
  ```bash
  npm run tsc
  # Compiles src/util.ts → src/util.js for backend use
  ```

---

## 15. Directory Structure

```
.
├── config/
│   ├── vite.config.js          # Vite build configuration
│   ├── playwright.config.js    # E2E test configuration
│   └── ...
├── db/
│   ├── kuma.db                 # SQLite template database
│   ├── knex_init_db.js         # Knex initialization
│   ├── knex_migrations/        # Modern database migrations
│   └── old_migrations/         # Legacy SQLite patches
├── docker/
│   ├── dockerfile              # Main multi-stage Dockerfile
│   ├── debian-base.dockerfile  # Base images
│   ├── builder-go.dockerfile   # Go healthcheck builder
│   └── docker-compose-dev.yml  # Dev container setup
├── extra/
│   ├── reset-password.js       # CLI password reset
│   ├── remove-2fa.js           # CLI 2FA removal
│   ├── healthcheck.go          # Docker healthcheck
│   ├── download-dist.js        # Download prebuilt dist
│   └── uptime-kuma-push/       # Push monitor helpers
├── public/
│   ├── icon.svg                # App logo
│   ├── icon.png                # App icon (notifications)
│   └── manifest.json           # PWA manifest
├── server/
│   ├── server.js               # Application entry point
│   ├── uptime-kuma-server.js   # Core server singleton
│   ├── database.js             # Database connection & migrations
│   ├── setup-database.js       # First-run DB setup wizard
│   ├── auth.js                 # Authentication helpers
│   ├── settings.js             # Key-value settings store
│   ├── jobs.js                 # Background job scheduler
│   ├── config.js               # Environment/CLI config resolver
│   ├── notification.js         # Notification dispatcher registry
│   ├── prometheus.js           # Prometheus metrics
│   ├── uptime-calculator.js    # Aggregate statistics engine
│   ├── client.js               # Socket message emitters
│   ├── model/                  # Data models (Monitor, Heartbeat, User, etc.)
│   ├── socket-handlers/        # Socket.IO event handlers
│   ├── routers/                # Express API routes
│   ├── jobs/                   # Background job implementations
│   ├── monitor-types/          # Pluggable monitor check types
│   ├── monitor-conditions/     # Advanced condition evaluator
│   ├── notification-providers/ # 90+ notification integrations
│   ├── modules/                # Vendored/local modules
│   └── utils/                  # Helper utilities
├── src/
│   ├── main.js                 # Frontend bootstrap
│   ├── App.vue                 # Root component
│   ├── router.js               # Vue Router definitions
│   ├── i18n.js                 # vue-i18n setup
│   ├── util-frontend.js        # Frontend utilities
│   ├── util.ts / util.js       # Shared utilities (compile TS→JS for backend)
│   ├── assets/                 # Global SCSS stylesheets
│   ├── components/             # Reusable Vue components
│   │   ├── notifications/      # Notification provider config forms
│   │   └── settings/           # Settings sub-pages
│   ├── pages/                  # Top-level route views
│   ├── layouts/                # Layout wrappers
│   ├── mixins/                 # Global mixins (socket, theme, mobile, lang)
│   ├── modules/                # Custom dayjs plugins
│   └── lang/                   # Translation JSON files (~100 locales)
├── test/
│   ├── backend-test/           # Backend unit/integration tests
│   └── e2e/                    # Playwright end-to-end tests
├── compose.yaml                # Docker Compose setup
├── ecosystem.config.js         # PM2 configuration
├── package.json
├── tsconfig.json               # Base TypeScript config
└── tsconfig-backend.json       # Backend-specific TS config
```

---

## 16. Rules & Conventions

### 16.1 Coding Style
- **Frontend**: Vue 3 Options API (not Composition API)
- **Backend**: CommonJS (`require`/`module.exports`)
- **Indentation**: 4 spaces
- **Linting**: ESLint for JS/Vue, Stylelint for CSS/SCSS, Prettier for formatting

### 16.2 Database Conventions
- Table names: lowercase, singular (`monitor`, `heartbeat`, `user`)
- Foreign keys: `monitor_id`, `user_id`, `status_page_id`
- redbean-node ORM: `R.dispense("table")`, `R.store(bean)`, `R.findOne("table", ...)`

### 16.3 Socket.IO Event Naming
- Server → Client: camelCase nouns (`monitorList`, `heartbeat`, `updateMonitorIntoList`)
- Client → Server: camelCase verbs (`addMonitor`, `editMonitor`, `deleteMonitor`)

### 16.4 Monitor Type Registration
Monitor types must be registered in `UptimeKumaServer` constructor:
```js
this.monitorTypeList["dns"] = new DnsMonitorType();
this.monitorTypeList["postgres"] = new PostgresMonitorType();
```

### 16.5 Notification Provider Registration
Providers are auto-discovered by `Notification.init()` scanning `server/notification-providers/`.
Each provider file must export a class extending `NotificationProvider`.

### 16.6 File Naming
- Components: PascalCase (`MonitorList.vue`, `HeartbeatBar.vue`)
- Models: camelCase (`monitor.js`, `heartbeat.js`)
- Socket handlers: kebab-case (`general-socket-handler.js`)
- Tests: kebab-case with `.test.js` suffix

### 16.7 Environment Handling
- Never rely on `process.env` directly in components; use `src/util-frontend.js` helpers
- Backend reads env via `server/config.js` with CLI arg precedence
- Docker-specific behavior gated by `UPTIME_KUMA_IS_CONTAINER`

### 16.8 License & Attribution
- Original project: Uptime Kuma by Louis Lam (MIT License)
- Fork modifications should maintain MIT license compliance
- Do not remove original copyright notices from source files

---

*Document generated from codebase analysis. For the most current information, always refer to the source files directly.*
