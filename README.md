## 1️⃣ Project Overview

**CollabCode** is a web-based real-time collaborative code editor where multiple users can join a shared session (room) and edit code together.
It simulates **pair programming**, **coding interviews**, and **remote debugging** environments.

### Core Capabilities (Current MVP)

* User authentication
* Room-based collaboration
* Real-time code synchronization
* Low-latency WebSocket communication

---

## 2️⃣ High-Level System Architecture

```
┌──────────────┐
│   Browser    │
│ (Next.js)    │
└──────┬───────┘
       │ WebSocket (Socket.IO)
       ▼
┌──────────────┐
│ Node.js API  │
│ + WS Server  │
└──────┬───────┘
       │ Room-based Broadcast
       ▼
┌──────────────┐
│ Other Users  │
│ (Editors)    │
└──────────────┘
```

### Key Design Principles

* **Stateless backend** (easy to scale later)
* **Room isolation** (each session is independent)
* **Event-driven communication**
* **Incremental complexity** (CRDTs added later)

---

## 3️⃣ Monorepo Structure (Stage 0)

The project uses an **npm workspace-based monorepo**.

```
collabcode/
├── apps/
│   ├── web/        # Next.js frontend
│   └── server/     # Node.js backend
├── packages/       # Shared code (future)
├── README.md
└── package.json
```

### Why Monorepo?

* Shared types and constants (later stages)
* Unified version control
* Clean separation of concerns

---

## 4️⃣ Stage 0 – System Foundation

### Objective

Establish a **stable communication backbone** using WebSockets.

### What Was Implemented

* Express server
* Socket.IO WebSocket server
* Next.js frontend
* Persistent WebSocket connection

### Key Concept

Unlike HTTP, WebSockets maintain a **persistent bi-directional connection**, which is essential for real-time collaboration.

### Workflow

```
Browser loads page
 → WebSocket handshake
 → Connection stays open
 → Ready for real-time events
```

---

## 5️⃣ Stage 1 – Authentication & Room Management

### Objective

Secure the system and introduce **collaboration boundaries**.

---

### 5.1 Authentication Design

* JWT-based authentication
* Token issued on login/register
* Token sent in `Authorization` header
* Middleware validates access

#### Auth Flow

```
User registers/logs in
 → Server issues JWT
 → Client stores token
 → Token sent with protected requests
```

### Why JWT?

* Stateless authentication
* Works for HTTP and WebSockets
* Scales horizontally

---

### 5.2 Room Management Design

A **room** represents an isolated collaboration session.

Each room has:

* `roomId`
* `ownerId`
* `members`

#### Room Lifecycle

```
Authenticated user
 → Creates room
 → Receives roomId
 → Shares room link
 → Other users join
```

### Security Rule

Only authenticated users can:

* Create rooms
* Join rooms

---

### Why Rooms Matter

* Prevents cross-session data leakage
* Enables per-session analytics
* Maps naturally to WebSocket channels

---

## 6️⃣ Stage 2 – Real-Time Code Synchronization (Core MVP)

### Objective

Enable **live code editing** across multiple users.

---

## 6.1 Editor Integration

* Monaco Editor (same as VS Code)
* React-based wrapper
* Controlled component (code stored in state)

---

## 6.2 WebSocket Event Design

### Events Used

| Event Name    | Direction       | Purpose             |
| ------------- | --------------- | ------------------- |
| `room:join`   | Client → Server | Join WebSocket room |
| `code:change` | Client → Server | Send code updates   |
| `code:update` | Server → Client | Broadcast updates   |

---

## 6.3 Real-Time Sync Workflow

```
User types in editor
 → onChange event fires
 → Emit "code:change" with roomId
 → Server receives event
 → Server broadcasts to room
 → Other clients update editor
```

### Key Implementation Detail

```js
socket.to(roomId).emit("code:update", { code });
```

This ensures:

* Sender does NOT receive its own update
* Infinite loops are avoided

---

## 7️⃣ Stage 3 – Real-Time Cursor Tracking & User Presence

### Objective

Enhance collaboration realism by allowing users to:

* See **other users’ cursors** in real time
* Observe **live presence** inside a room
* Experience behavior similar to Google Docs / VS Code Live Share

This stage focuses on **ephemeral collaboration signals**, not persistent data.

---

## 7.1 Cursor Tracking Design

Cursor position is **not application state**.
It is **transient, high-frequency, and non-persistent**.

Therefore:

* Cursor data is **never stored**
* Cursor updates are **broadcast-only**
* Cursor events are **throttled** for performance

---

### Cursor Event Flow

```
User moves cursor
 → Monaco emits cursor event
 → Throttled client event fires
 → Emit "cursor:move" via WebSocket
 → Server broadcasts to room
 → Other clients render remote cursor
```

---

### Cursor Events Used

| Event Name      | Direction       | Purpose                          |
| --------------- | --------------- | -------------------------------- |
| `cursor:move`   | Client → Server | Send cursor position             |
| `cursor:update` | Server → Client | Broadcast remote cursor movement |

---

### Why Throttling Is Required

Cursor movement can generate **dozens of events per second**.

Without throttling:

* Network flooding occurs
* UI becomes jittery
* Backend load spikes

Solution:

* Cursor events are throttled to ~20 updates/sec
* Ensures smooth UX with minimal overhead

---

### Rendering Remote Cursors

Remote cursors are rendered using **Monaco editor decorations**.

Key characteristics:

* Purely visual
* No impact on document content
* Automatically cleaned up on disconnect

---

## 7.2 User Presence Model

Presence is derived implicitly from WebSocket connections.

A user is considered:

* **Present** → when socket joins a room
* **Absent** → when socket disconnects

No database writes are required.

---

### Presence Events

| Event Name    | Purpose                  |
| ------------- | ------------------------ |
| `user:joined` | Notify room of new user  |
| `user:left`   | Notify room of departure |

---

### Design Principle

Presence is:

* **Eventually consistent**
* **Session-scoped**
* **Derived, not stored**

This keeps the system:

* Simple
* Scalable
* Fault-tolerant

---

## 8️⃣ Known Limitation After Stage 3 (Important)

At this stage, users may observe the following behavior:

> When multiple users type **simultaneously**, editor contents may diverge.

### Why This Happens

The current implementation uses **state-based synchronization**.

Each update sends the **entire document**:

```
Client A → "Here is my full document"
Client B → "Here is my full document"
```

When edits occur concurrently:

* Last-arriving update overwrites the other
* Clients may temporarily diverge
* Cursor sync still works correctly

This behavior is **expected and correct** for this stage.

---

### Why This Is Not a Bug

This stage intentionally prioritizes:

* Simplicity
* Clear event flow
* Learning boundaries of naive synchronization

The limitation clearly exposes the need for a more advanced approach.

---

## 9️⃣ Transition to Stage 4 – Why CRDTs Are Required

To achieve **true collaborative editing**, the system must:

* Merge concurrent edits deterministically
* Avoid overwriting user input
* Remain correct under network latency
* Support offline or delayed updates

This requires moving from:

```
State-based sync ❌
```

to:

```
Operation-based sync ✅
```

---

### Solution: CRDT (Conflict-Free Replicated Data Types)

In Stage 4, the system will integrate **CRDTs (via Yjs)**.

Key advantages:

* No central locking
* Automatic conflict resolution
* Eventual consistency
* Proven in tools like Google Docs and Figma

---

## 10️⃣ System Evolution Summary

| Stage | Capability Added                        |
| ----- | --------------------------------------- |
| 0     | WebSocket foundation                    |
| 1     | Authentication + room isolation         |
| 2     | Real-time code synchronization (MVP)    |
| 3     | Cursor tracking + user presence         |
| 4     | CRDT-based conflict-free editing (next) |

---
## Stage 3 (Refactored) – Modular Real-Time Collaboration Architecture

As real-time features increased (code sync, cursor tracking, presence), the room page began accumulating multiple responsibilities.

To maintain:

* readability
* scalability
* ease of future CRDT integration

the room editor was **refactored into composable hooks**, following modern React and system-design best practices.

---

## Why Modularization Was Necessary

Before refactoring, the room page handled:

* WebSocket connection lifecycle
* Room join logic
* Code synchronization
* Cursor tracking
* Monaco editor lifecycle

This violated the **Single Responsibility Principle** and made future extensions risky.

---

## Refactored Frontend Structure

```
apps/web/app/room/[roomId]/
├── page.tsx              # UI composition only
├── useRoomSocket.ts      # Socket.IO singleton
├── useCodeSync.ts        # Stage-3 code synchronization
├── useCursorTracking.ts  # Cursor presence & rendering
```

Each module now owns **exactly one responsibility**.

---

## Module Responsibilities

### 1️⃣ `useRoomSocket.ts` – WebSocket Singleton

**Responsibility**

* Create and manage a single Socket.IO connection
* Prevent duplicate socket instances across renders

**Design Principle**

* Shared infrastructure belongs in a singleton
* Business logic should not manage socket lifecycle

---

### 2️⃣ `useCodeSync.ts` – Real-Time Code Synchronization (Stage 3)

**Responsibility**

* Maintain editor code state
* Emit `code:change` events
* Apply `code:update` broadcasts

**Key Insight**
This hook intentionally uses **state-based synchronization**, exposing the limitations of last-write-wins behavior under concurrency.

> This design decision clearly motivates the transition to CRDTs in Stage 4.

---

### 3️⃣ `useCursorTracking.ts` – Cursor Presence

**Responsibility**

* Emit cursor movement events (throttled)
* Render remote cursors using Monaco decorations
* Handle ephemeral presence signals

**Why Separate?**
Cursor presence is:

* high-frequency
* non-persistent
* visually scoped

Separating it avoids coupling UI signals with document state.

---

### 4️⃣ `page.tsx` – Composition Layer

**Responsibility**

* Assemble hooks
* Bind Monaco editor
* Remain free of business logic

The page now acts as a **thin orchestration layer**, improving readability and testability.

---
## Stage 4 – Transition to CRDT-Based Synchronization (Yjs)

### Objective

Stage 3 intentionally used **state-based synchronization**, which exposed classic real-time collaboration problems:

* last-write-wins overwrites
* divergent document states
* lack of true conflict resolution

Stage 4 replaces this with **CRDT-based synchronization** using **Yjs**, enabling mathematically safe concurrent edits.

---

## Why CRDTs Were Necessary

Traditional approaches (emit full text on change) fail under concurrency:

```
User A types "hello"
User B types "world"
→ One update overwrites the other
```

CRDTs solve this by ensuring:

* commutative updates
* eventual consistency
* no central locking
* deterministic convergence

---

## CRDT Architecture Overview

```
Editor (Monaco)
   ↓
Y.Text (CRDT)
   ↓
Encoded Updates (Uint8Array)
   ↓
Network Broadcast
   ↓
Other Clients
```

The **document state is never replaced**, only **merged**.

---

## Stage 5 – Awareness & Presence (Cursors, Users)

### Objective

Enable **real-time presence** without polluting document state.

### Key Concepts

* Awareness data is **ephemeral**
* Presence ≠ document content
* Cursor positions are not persisted

---

### Awareness Design

* Powered by `y-protocols/awareness`
* Each client publishes:

  * user id
  * cursor position
  * color metadata
* Other clients render cursors via Monaco decorations

This separation ensures:

* low bandwidth
* no CRDT pollution
* instant join/leave updates

---

## Stage 6 – Shared Time Travel (Global Undo / Restore)

### Objective

Enable **shared undo / restore** that affects **all participants**, not just one client.

### Design Insight

Local undo is insufficient in collaborative systems.

Instead, the system restores a **previous CRDT snapshot**, ensuring:

* all clients converge
* no partial state rollback
* consistent shared history

---

### Snapshot Strategy

* Snapshots are captured as:

  ```ts
  Y.encodeStateAsUpdate(ydoc)
  ```
* Stored as binary updates
* Restored using:

  ```ts
  Y.applyUpdate(ydoc, snapshot)
  ```

This preserves CRDT guarantees.

---

## Stage 7 – Persistent Version Storage (MongoDB Atlas)

### Objective

Ensure **durability** across:

* page refresh
* reconnects
* server restarts
* new users joining late

---

### Persistence Design

* Snapshots stored as **binary blobs**
* MongoDB Atlas used for:

  * reliability
  * production parity
* Each snapshot is immutable and timestamped

---

### Database Schema

```
RoomSnapshot
├── roomId (indexed)
├── snapshot (Binary)
└── createdAt (Date)
```

---

### Restore-on-Join Flow

```
User joins room
 → Server checks DB
 → Latest snapshot loaded (if exists)
 → CRDT state sent to client
 → Client applies update
```

This guarantees **stateless servers with stateful rooms**.

---

## Stage 8 – Version History Sidebar UI

### Objective

Expose collaborative history to users in a **clear, intuitive UI**.

---

### UX Design

* Sidebar lists:

  * timestamped versions
  * ordered newest → oldest
* Each entry has a **Restore** action
* Restore is **shared**, not local

---

### Separation of Concerns

```
hooks/useSnapshots.ts
  ├─ snapshot capture
  ├─ version metadata
  └─ restore logic

components/VersionHistory.tsx
  └─ presentation only
```

The UI never touches CRDT internals.

---
## Stage 9 – Stable User Identity & Cursor Presence

### Objective

Ensure **consistent collaboration experience** by making users:

* identifiable across refreshes
* visually distinguishable via cursor colors
* stable across sessions (no random identity on reload)

---

### Identity Design

* Identity stored **client-side** using `localStorage`
* Each user has:

  * `id` (UUID)
  * `name`
  * `color`
* Identity is injected into **Yjs Awareness**

This avoids premature backend coupling while remaining production-realistic.

---

### Awareness Data Model

```
awareness.state
├── user
│   ├── id
│   ├── name
│   └── color
└── cursor
    ├── lineNumber
    └── column
```

---

### Cursor Sync Flow

```
User moves cursor
 → Monaco emits cursor event
 → Awareness local state updated
 → Awareness broadcast to peers
 → Remote cursors rendered via Monaco decorations
```

---

### Key Engineering Decisions

* Awareness used for **ephemeral state only**
* CRDT document remains **cursor-free**
* Cursor rendering handled purely at UI layer

This prevents CRDT pollution and keeps state minimal.

---

## Stage 10 – Session Analytics Dashboard

### Objective

Provide **observability** into collaborative sessions, enabling:

* performance analysis
* engagement metrics
* interview-ready system insights

---

### Metrics Tracked

| Metric        | Description                |
| ------------- | -------------------------- |
| Active Users  | Live count per room        |
| Edits         | Text changes (throttled)   |
| Restores      | Shared time-travel actions |
| Snapshots     | Version captures           |
| Session Start | Room lifetime              |

---

### Analytics Architecture

```
Client
 ├─ emits analytics events
 │   ├─ edit
 │   ├─ snapshot
 │   └─ restore
 ↓
Socket.IO Server
 ├─ in-memory aggregation
 ├─ per-room analytics state
 ↓
Client UI
 └─ live analytics panel
```

---

### Design Trade-offs

* **In-memory aggregation** for low latency
* Persistence optional (can be enabled later)
* Throttled events to prevent socket flooding

This design balances **accuracy, performance, and simplicity**.

---

### UI Composition

```
EditorClient
├── Code Editor
├── Version History Sidebar
└── Analytics Panel
```

Each panel subscribes independently, avoiding tight coupling.

---

## Overall System Guarantees (So Far)

✔ Real-time collaboration
✔ Conflict-free editing (CRDT)
✔ Shared time travel
✔ Durable persistence (MongoDB Atlas)
✔ Stable user identity
✔ Live session analytics

---
