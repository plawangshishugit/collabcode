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
