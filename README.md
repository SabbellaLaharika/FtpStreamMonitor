# FTP Stream Monitor (Real-Time State Synchronization)

An event-driven filesystem audit monitor (similar to Dropbox sync-daemons or cloud log aggregators) that wraps a stateless FTP server, detects filesystem modifications in memory, and streams live updates to a browser dashboard via WebSockets.

---

## 🛠️ Overview & Tech Stack

This application implements a highly auditable and low-latency system monitor based on the following principles:
-   **FTP File State**: Evaluated dynamically via recursive directory listing.
-   **In-Memory Comparison**: State differences (diffs) are calculated in memory to bypass database write locks and network file-transfer bottlenecks.
-   **Symmetric Diffing**: Detects additions, modifications, and deletions in linear O(N) time.
-   **WebSockets**: Broadcasts incremental patches with sub-millisecond network latency.

### 💻 Frontend Tier
*   **Next.js 16 (App Router)**: Serves as the core React framework, leveraging Server-Side Rendering (SSR) for fast initial loads and optimized client components for real-time interactivity.
*   **React 19**: Manages the local UI state tree, dynamically re-rendering the Explorer tree, stats panels, and activity cards with surgical efficiency when WebSocket events are received.

### ⚙️ Backend Tier
*   **Custom Node.js Server (`tsx` execution)**: Integrates Socket.io directly with the Next.js request handler, bypassing serverless route limitations to support permanent, low-overhead WebSocket tunnels.
*   **Socket.io**: Establishes persistent bidirectional connections, broadcasting filesystem delta events (`fs:diff`) to all active client tabs.
*   **basic-ftp Client**: Wraps standard FTP commands in promise-based streams, supporting automated directory navigation, folder creation, and Extended Passive Mode (EPSV).

### 🐳 Infrastructure & DevOps
*   **Docker & Docker Compose**: Orchestrates the multi-container stack, building a multi-stage production image for the Next.js app and deploying a containerized `vsftpd` server in an isolated bridge network.
*   **Jest & ts-jest**: Executes typing-safe unit tests verifying the O(N) symmetric diffing algorithm across all target directory modification scenarios.

## 🏗️ High-Level Architecture & Flow

The system consists of three primary tiers: the web client dashboard, the Next.js server containing the active polling loop and diffing engine, and the remote vsftpd server instance.

```mermaid
graph TD
    subgraph Client [Browser Dashboard]
        Tree[File Tree Component]
        Feed[Activity Feed Component]
        Preview[File Preview Panel]
    end
    
    subgraph Server [Next.js & Socket.io Server]
        API[API Router]
        WS[Socket.io Hub]
        Poll[Polling coordinator]
        Diff[Diff Engine]
    end
    
    FTPServer[(vsftpd FTP Server)]
    
    %% Client Interactions
    Tree -->|User Click| Preview
    Preview -->|HTTP GET /api/ftp/preview| API
    
    %% Socket Connections
    WS <-->|WebSockets| Tree
    WS -.->|fs:diff| Feed
    
    %% Backend Flow
    Poll -->|1. Poll Interval| FTPServer
    FTPServer -->|2. Directory List| Poll
    Poll -->|3. Compare snapshot| Diff
    Diff -->|4. Emit Diff| WS
```

---

## ⚡ Real-Time Sync Lifecycle

Below is the chronological sequence of events showing how the initial state is established and how a file modification propagates from the FTP filesystem to the active browser dashboards.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Web Dashboard Client
    participant Server as Next.js & WebSockets Server
    participant Poll as Polling Coordinator
    participant Diff as Diff Engine
    participant FTP as vsftpd FTP Server

    Note over Client, FTP: Startup & Initial Sync
    Server->>Poll: start()
    Poll->>FTP: listRecursive('/')
    FTP-->>Poll: Current Snapshot File List
    Note over Poll: Cache Snapshot in Memory (lastSnapshot)
    Client->>Server: Connect Socket
    Server-->>Client: emit "fs:snapshot" (lastSnapshot)

    Note over Client, FTP: File Event Propagation
    FTP->>FTP: File /test.txt is modified
    Note over Poll: Polling Timer Fires
    Poll->>FTP: listRecursive('/')
    FTP-->>Poll: Updated Snapshot File List
    Poll->>Diff: diffSnapshots(lastSnapshot, currentSnapshot)
    Note over Diff: Map lookup: check sizes/timestamps
    Diff-->>Poll: SnapshotDiff { modified: [/test.txt] }
    Note over Poll: Update lastSnapshot = currentSnapshot
    Poll->>Server: Emit diff event
    Server->>Client: broadcast "fs:diff" (SnapshotDiff)
    Note over Client: React updates files list & prepends activity
```

---

## 🧠 Why In-Memory Diffing? (Database vs. In-Memory State)

In standard file synchronization systems, state tracking often relies on persisting file listings to a database and running heavy SQL joins to identify modified items.

*   **The Database Join Bottleneck:** Storing thousands of file paths and metadata columns in a database requires frequent read/write transactions. At high polling frequencies, database write locks and index rebuilds degrade throughput and increase system latency.
*   **The In-Memory Solution:** By maintaining the last-known state as an active memory snapshot, the application bypasses database disk I/O entirely. The diff is calculated in memory using linear hash-map lookups. This reduces state reconciliation times to sub-millisecond ranges and enables highly responsive, real-time dashboards.

---

## 🌍 Real-World Use Cases

The architectural design of this project is directly applicable to several enterprise-level systems:
1. **Automated Document Ingestion:** Monitors remote dropboxes where third parties upload invoices, reports, or legal logs, triggering automated ingestion scripts immediately.
2. **Audit Logging & Directory Monitoring:** Tracks unauthorized or unexpected file creations, modifications, and deletions in secure storage arrays.
3. **Backup Synchronization Agents:** Serves as the blueprint for background agents (like Dropbox or OneDrive) that track local/remote file changes and resolve conflict states.

---

## 🛡️ Strategic Architectural Advantages

By combining an in-memory diffing engine with WebSockets, this system achieves operational capabilities that are highly resilient:

*   **Event-Driven WebSocket Streaming:** Instead of having multiple web clients polling the backend, clients establish a single TCP socket connection. The server pushes updates *only* when a diff is generated, saving network bandwidth.
*   **Stateless Backend Recovery:** The backend does not maintain persistent state. If the server crashes, it runs a full FTP directory scan on startup to rebuild its in-memory snapshot, ensuring perfect recovery without database migrations.
*   **Decoupled Architecture:** The Next.js dashboard UI, custom WebSocket server, and FTP file server are decoupled, allowing each tier to scale independently in production.

---

## 📂 Project Structure

```
FtpStreamMonitor/
├── docker-compose.yml        # App & FTP services orchestration
├── Dockerfile                # Production multi-stage build
├── server.ts                 # Custom HTTP + Socket.io server
├── tests/
│   └── diff-engine.test.ts   # Jest unit tests for diffing scenarios
└── src/
    ├── app/                  # Next.js pages & routes
    ├── components/           # Explorer, Preview, Feed components
    └── lib/                  # Polling & FTP client utilities
```

---

## 🚀 Getting Started

### 1. Configure Environment
Create a `.env` file at the root of the repository:
```bash
FTP_USER=testuser
FTP_PASS=testpass
FTP_HOST=ftp
NEXT_PUBLIC_WS_URL=ws://localhost:3000
POLLING_INTERVAL_MS=5000
```

### 2. Launch the Application Stack
Build and start all services using Docker Compose:
```bash
docker-compose up -d --build
```
This boots:
- The `app` service (Next.js Dashboard on port 3000)
- The `ftp` service (vsftpd server on ports 21 and passive range)

### 3. Run Unit Tests
To run the diffing engine tests locally:
```bash
npm install
npm test
```
