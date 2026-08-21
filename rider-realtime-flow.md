# Rider Real-Time System — Flow Documentation

## Technologies Used

| Layer | Technology | Purpose |
|---|---|---|
| **Real-time transport** | ASP.NET Core SignalR | WebSocket-based push channel between server and rider browser |
| **Frontend framework** | Angular 21 (standalone components) | Rider dashboard SPA |
| **Reactive state** | Angular Signals (`signal`, `computed`) | Timer countdowns, pending orders list, dashboard data |
| **HTTP client** | Angular `HttpClient` | REST API calls (accept, reject, dashboard data) |
| **Persistence** | `localStorage` | Saves selected active order ID across page refreshes |
| **Backend** | ASP.NET Core / nopCommerce plugin | Order routing, group management, auto-reject background task |
| **DI scoping** | `IServiceScopeFactory` | Runs auto-reject check safely after the originating HTTP request ends |

---

## Files Changed / Key Files

| File | Role |
|---|---|
| `Frontend/src/app/features/rider/rider-notification.service.ts` | SignalR hub connection, toast notifications, timer management (toast layer) |
| `Frontend/src/app/features/rider/rider-dashboard.component.ts` | Dashboard state, pending orders signal, countdown signal, `startOrderTimer()` |
| `Frontend/src/app/features/rider/rider-dashboard.component.html` | Order card UI with countdown circle, progress bar, Accept/Reject buttons |
| `Frontend/src/app/features/rider/rider-dashboard.component.css` | Countdown circle, progress bar, warn/urgent animation styles |
| `Frontend/src/app/features/rider/rider-accepted-orders.component.ts` | Accepted orders page, `localStorage` sync for selection persistence |
| `Frontend/src/app/features/rider/rider-api.service.ts` | `acceptOrder()`, `rejectOrder()`, `getSession()`, `getDashboard()` REST calls |
| `src/Plugins/Nop.Plugin.Misc.RiderManagement/Hubs/RiderNotificationHub.cs` | SignalR Hub — `RegisterRider()`, group name convention |
| `src/Plugins/Nop.Plugin.Misc.RiderManagement/Services/RiderNotificationService.cs` | `SendNewOrderToAllAvailableRidersAsync()`, `AutoRejectAfterDelayAsync()`, `BroadcastOrderAcceptedAsync()` |

---

## Bug Fixes Applied

### 1. `disconnectFromHub()` — race condition
**Before:** `stop()` was called first (async), then `hubConnection = null`. The guard `if (this.hubConnection)` in `connectToHub()` would block a new connection while stop was still in progress.

**After:** Reference is nulled **first**, then stop runs in background.
```ts
// rider-notification.service.ts
disconnectFromHub(): void {
  if (this.hubConnection) {
    const conn = this.hubConnection;
    this.hubConnection = null;        // ← unblocks guard immediately
    conn.stop().catch(() => {});      // ← async stop in background
  }
}
```

### 2. `connectToHub()` — no reconnect handler
**Before:** When `withAutomaticReconnect` fired after a network drop, the rider got a new connection ID. The server-side group membership was lost. `RegisterRider` was never re-invoked → server stopped sending orders.

**After:** `onreconnected` re-registers the rider.
```ts
// rider-notification.service.ts
this.hubConnection.onreconnected(() => {
  this.hubConnection?.invoke('RegisterRider', customerId);
});

// Also: on .start() failure, null the ref so connectToHub() can retry
.catch(err => { this.hubConnection = null; });
```

### 3. `getSession()` — silent failure
**Before:** No `error:` handler. If the session API failed (401, timeout), `connectToHub()` was silently skipped → no hub → no `NewOrderAvailable` → no timer.

**After:** Error is logged so failure is visible.
```ts
// rider-dashboard.component.ts
this.riderApi.getSession().subscribe({
  next: (session) => {
    if (session?.customerId) {
      this.notificationService.connectToHub(session.customerId);
    }
  },
  error: (err) => {
    console.error('[Dashboard] getSession() failed — hub not connected:', err);
  }
});
```

### 4. Template — countdown showing "0 sec" when no timer running
**Before:** `<div class="countdown-row">` always rendered, showing "0 sec" / empty bar when no order arrived via SignalR.

**After:** Hidden until timer is actually ticking.
```html
<!-- rider-dashboard.component.html -->
<div class="countdown-row" *ngIf="getCountdown(order.orderId) > 0">
```

---

## Flow 1 — Push Notification & Timer

```
ORDER PLACED (customer checkout)
        │
        ▼
[Backend] RiderNotificationService.SendNewOrderToAllAvailableRidersAsync()
  ├─ Queries all Active + Available riders
  ├─ Filters by delivery city (location match)
  ├─ Sorts by fewest active deliveries (least-busy first)
  └─ For each eligible rider:
       SendToRiderWithRetryAsync() ──► SignalR Hub
             up to 3 attempts          Group: "rider_{customerId}"
             with 1s / 3s / 7s                │
             backoff delays                    │  WebSocket push
                                               ▼
[Angular] RiderNotificationService.hubConnection.on('NewOrderAvailable', payload)
  │  payload = { orderId, orderTotal, shippingAddress, customerName,
  │              customerPhone, sentAtUtc, expiresInSeconds: 60 }
  │
  ├─► newOrder$.next(payload)
  │         │
  │         ▼
  │   RiderDashboardComponent — orderSub subscriber
  │     ├─ Adds order to pendingOrders signal (deduped)
  │     └─ startOrderTimer(orderId, expiresInSeconds=60)
  │              ├─ Sets orderCountdowns[orderId] = 60
  │              ├─ Starts countdownTick (setInterval, 1s)
  │              │     Every second: orderCountdowns[orderId] -= 1
  │              └─ Sets auto-reject setTimeout(60s)
  │
  └─► notifyRider() — shows toast overlay
        ├─ DOM-injected toast card with Accept / Reject buttons
        └─ Parallel toast countdown timer (setInterval, 250ms)

[Template] countdown-row rendered (only when getCountdown(orderId) > 0)
  ┌──────────────────────────────────────────────┐
  │  ┌──────┐  Auto-rejected in 45s              │
  │  │  45  │  ████████████░░░░░░░               │
  │  │  sec │  (orange → yellow @20s → red @10s) │
  │  └──────┘                                    │
  └──────────────────────────────────────────────┘
```

---

## Flow 2 — Auto-Rejection

Two parallel timers run — frontend and backend independently ensure the order is rejected.

### Frontend auto-reject (60s `setTimeout` in dashboard component)
```
startOrderTimer(orderId, 60)
        │
        └─ setTimeout(() => {
               clearOrderTimer(orderId)      ← stops countdownTick if no more orders
               riderApi.rejectOrder(orderId) ← POST /api/rider/reject-order?orderId=X
                 ├─ next: removePendingOrder(orderId)  ← card disappears
                 └─ error: removePendingOrder(orderId) ← card disappears anyway
           }, 60_000)
```

### Backend auto-reject (60s `Task.Delay` in `RiderNotificationService`)
```
AutoRejectAfterDelayAsync(orderId, notifiedCustomerIds)
        │
        └─ await Task.Delay(60s)
               │
               ▼
           GetDeliveryOrderByOrderIdAsync(orderId)
               │
               ├─ Status == Pending?  YES →  broadcast OrderNotificationExpired
               │                              to all originally-notified riders
               └─ Status != Pending? (accepted) → skip, log
```

### Frontend handling of `OrderNotificationExpired`
```
hubConnection.on('OrderNotificationExpired', { orderId })
  ├─ clearOrderTimer(orderId)      ← stops countdown
  └─ orderExpired$.next(orderId)
          │
          ▼
    expiredSub (dashboard)
      ├─ clearOrderTimer(orderId)
      └─ removePendingOrder(orderId)  ← card dismissed silently
```

### Toast timer auto-reject (parallel)
```
Toast setInterval (250ms tick)
  └─ remaining = ceil((expiresAt - Date.now()) / 1000)
       └─ remaining <= 0 →
            clearInterval(timer)
            rejectOrder(orderId, dismiss)
              └─ POST /api/rider/reject-order
                   ├─ orderRejected$.next(orderId)
                   └─ dismiss() → toast fades out
```

---

## Flow 3 — Real-Time Order Feed (What Other Riders See)

```
Rider A accepts order
        │
        ▼
[Backend] AcceptOrderAsync()
  └─ BroadcastOrderAcceptedAsync(orderId, acceptingRiderCustomerId)
       └─ For every other active rider:
            SignalR push: "OrderAlreadyAccepted" { orderId }
                    │
                    ▼
[Angular — other riders] hubConnection.on('OrderAlreadyAccepted', { orderId })
  ├─ clearOrderTimer(orderId)
  ├─ orderAccepted$.next(orderId)
  │       │
  │       ▼
  │   acceptedSub (dashboard)
  │     ├─ clearOrderTimer(orderId)
  │     └─ removePendingOrder(orderId)   ← card dismissed on all other riders
  └─ (toast layer) clearOrderTimer(orderId) → toast dismissed
```

---

## Flow 4 — Accept Order & Available Orders (persisting after refresh)

```
Rider clicks ✅ Accept
        │
        ▼
RiderDashboardComponent.acceptOrder(order)
  ├─ clearOrderTimer(order.orderId)   ← stops local countdown immediately
  └─ riderApi.acceptOrder(orderId)    ← POST /api/rider/accept-order?orderId=X
       │
       ▼  { ok, orderId, riderId, deliveryOrderId }
       ├─ removePendingOrder(orderId)   ← card removed from UI
       ├─ dashboardState.availability = false  ← rider marked unavailable
       └─ loadDashboard(false)          ← refresh dashboard from REST API
                │
                ▼
            getDashboard() → activeOrderIds[] now includes the accepted orderId
                │
                ▼
            syncSelectedOrder(dashboard)
              ├─ Checks localStorage key: "rider_selected_active_order_id"
              ├─ If stored ID is valid and in activeOrderIds → keep it
              └─ Else → store dashboard.activeOrderId in localStorage
```

### Persistence across page refresh

```
localStorage["rider_selected_active_order_id"] = orderId

                        PAGE REFRESH
                             │
                             ▼
ngOnInit → loadDashboard() → getDashboard() (REST API)
  └─ syncSelectedOrder(dashboard)
       ├─ getStoredSelectedOrderId() from localStorage
       ├─ Check if stored ID is still in activeOrderIds (server-confirmed)
       └─ selectedActiveOrderIdState.set(storedId)  ← restored ✓

Template: selectedActiveOrderId > 0 →
  "Selected Order: #39"
  [Open Selected Delivery] button → /rider/orders/39
```

### Accepted Orders page (`/rider/accepted-orders`)

```
RiderAcceptedOrdersComponent.ngOnInit()
  └─ riderApi.getDashboard()
       └─ activeOrderIds[] from server
            └─ syncSelection(activeOrderIds, activeOrderId)
                 ├─ Reads localStorage for previously selected order
                 ├─ Validates it is still in activeOrderIds
                 └─ Falls back to dashboard.activeOrderId if stale

chooseOrder(orderId)
  ├─ selectedOrderIdState.set(orderId)
  ├─ localStorage["rider_selected_active_order_id"] = orderId
  └─ redirect → /rider/dashboard
```

---

## SignalR Hub — Server-Side Group Model

```
RiderNotificationHub : Hub
  │
  ├─ RegisterRider(customerId)
  │    └─ Groups.AddToGroupAsync(connectionId, "rider_{customerId}")
  │
  └─ OnDisconnectedAsync()
       └─ SignalR auto-removes the connectionId from all groups

Group name convention: "rider_{customerId}"
  e.g. customerId=42 → group "rider_42"
  Supports multiple tabs: each tab gets its own connectionId,
  all added to the same group → all tabs receive the push.
```

---

## Key Methods Reference

### `RiderNotificationService` (Angular — `rider-notification.service.ts`)

| Method | What it does |
|---|---|
| `connectToHub(customerId)` | Builds HubConnection, registers `.on()` handlers, calls `.start()`, invokes `RegisterRider` |
| `onreconnected` callback | Re-invokes `RegisterRider` after any auto-reconnect so server group is restored |
| `disconnectFromHub()` | Nulls ref first (unblocks guard), stops old connection in background |
| `notifyRider(options)` | Injects DOM toast, creates frontend countdown timer (250ms tick), handles Accept/Reject clicks |
| `clearOrderTimer(orderId)` | Clears toast `setInterval`, removes from `activeTimers` map |

### `RiderDashboardComponent` (Angular — `rider-dashboard.component.ts`)

| Method | What it does |
|---|---|
| `ngOnInit()` | Calls `getSession()` → `connectToHub()`, subscribes to `newOrder$` / `orderExpired$` / `orderAccepted$` |
| `startOrderTimer(orderId, seconds)` | Sets `orderCountdowns[orderId] = seconds`, starts global `countdownTick` (1s), sets auto-reject `setTimeout` |
| `clearOrderTimer(orderId)` | Cancels `setTimeout`, removes from `orderCountdowns`, stops `countdownTick` when no more orders |
| `getCountdown(orderId)` | Returns current remaining seconds (0 if not in map) |
| `getCountdownPercent(orderId, total)` | Returns % for progress bar width binding |
| `acceptOrder(order)` | Clears timer, calls `acceptOrder()` API, marks unavailable, refreshes dashboard |
| `rejectOrder(order)` | Clears timer, calls `rejectOrder()` API, removes card |
| `loadDashboard(showLoader)` | Polls `GET /api/rider/dashboard`, normalizes camelCase/PascalCase, syncs selected order |

### `RiderNotificationService` (C# — `RiderNotificationService.cs`)

| Method | What it does |
|---|---|
| `SendNewOrderToAllAvailableRidersAsync()` | Filters riders by status/location/load, sends `NewOrderAvailable` with retry, fires `AutoRejectAfterDelayAsync` in background |
| `SendToRiderWithRetryAsync()` | Up to 3 attempts with 1s/3s/7s backoff; sends `NewOrderAvailable` payload with `expiresInSeconds = 60` |
| `AutoRejectAfterDelayAsync()` | Waits 60s in background thread, checks if still Pending, broadcasts `OrderNotificationExpired` |
| `BroadcastOrderAcceptedAsync()` | Sends `OrderAlreadyAccepted` to all riders except the one who accepted |

---

## Constants

| Constant | Value | Location |
|---|---|---|
| `AutoRejectSeconds` | **60** | `RiderNotificationService.cs` (C#) |
| `AUTO_REJECT_SECONDS` | **60** | `RiderDashboardComponent` (Angular) |
| `MaxRetries` | **3** | `RiderNotificationService.cs` |
| Retry delays | **1s, 3s, 7s** | `RiderNotificationService.cs` |
| Auto-reconnect delays | **0, 2s, 5s, 10s, 30s** | `rider-notification.service.ts` |
| localStorage key | `rider_selected_active_order_id` | Dashboard + AcceptedOrders components |
