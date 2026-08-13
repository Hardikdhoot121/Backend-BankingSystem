# Bank Ledger & Transaction System

> A financial-grade, ACID-compliant ledger backend built for atomic transfers, immutable auditing, and high-concurrency banking workflows.

---

## Executive Overview

In traditional software systems, financial balances are often stored as simple mutable numbers (`user.balance += amount`). In production banking environments, this approach leads to race conditions, double-spending vulnerabilities, and untraceable data corruption.

**Bank Ledger & Transaction System** solves this by enforcing a strict **Double-Entry Bookkeeping Architecture**:
* **Zero Mutable Balances:** Account balances are never stored directly as static values in the database.
* **Derived Real-Time Balance:** User balances are dynamically calculated on-demand via MongoDB aggregation pipelines over an immutable history of `CREDIT` and `DEBIT` ledger records.
* **Audit-Proof Financial Integrity:** Every single rupee entering or leaving the system is permanently traceable to a specific transaction.

---

## Key Architecture & Features

* **Double-Entry Bookkeeping:** Every valid transaction generates two matching, offsetting ledger entries: a `DEBIT` (-) on the sender's account and a `CREDIT` (+) on the receiver's account.
* **ACID Compliant Transactions:** All money transfers run inside MongoDB Client Sessions (`startSession()`) ensuring all-or-nothing execution with automatic transaction rollbacks on failure.
* **Immutable Ledger Records:** Mongoose `pre` hooks intercept and block any `UPDATE`, `DELETE`, or `REPLACE` attempts on ledger entries, guaranteeing an unalterable financial audit trail.
* **Idempotency Safeguards:** Transactions enforce a unique `idempotencyKey` index to prevent duplicate charges or double-deductions during network retries.
* **Role-Based Access Control (RBAC):** Strict separation between regular customer permissions and privileged System Admin users (`authSystemUserMiddleware`) authorized to seed vault liquidity.
* **Token Blacklisting & Invalidation:** Logout invalidates JWT tokens by storing them in a dedicated MongoDB collection backed by a 1-Day TTL Index for automatic database cleanup.
* **Automated Transaction Notifications:** Integrated email notification engine via Nodemailer using Google OAuth2 to dispatch real-time HTML security and transaction receipts.

---

## System Architecture & Flow

```text
Client Request (Postman / Frontend)
       │
       ▼
Express Route Matcher (/api/auth | /api/account | /api/transaction)
       │
       ▼
Authentication & Blacklist Check (authMiddleware / authSystemUserMiddleware)
       │
       ▼
Controller Validation (Request Params, Idempotency Check, Balance Check)
       │
       ▼
MongoDB Client Session (ACID Transaction)
  ├── 1. Create Transaction (Status: PENDING)
  ├── 2. Create DEBIT Ledger Record (Sender)
  ├── 3. Create CREDIT Ledger Record (Receiver)
  └── 4. Mark Transaction COMPLETE & Commit Session
       │
       ▼
Background Async Email Service (Nodemailer OAuth2)
       │
       ▼
Client Response (HTTP 201 Created + Transaction Details)
```

---

## Tech Stack & Dependencies

* **Runtime & Framework:** Node.js, Express.js
* **Database & ORM:** MongoDB Atlas, Mongoose (Aggregation Pipeline, Client Sessions, Compound & TTL Indexes)
* **Authentication & Security:** JWT (JSON Web Tokens), HTTP-Only Cookies, Bcryptjs, Token Blacklisting
* **Email & Integrations:** Nodemailer, Google OAuth2
* **Tooling & Environment:** Dotenv, Cookie-Parser, Nodemon

---

## API Endpoint Documentation

### Authentication & User Management (`/api/auth`)

| HTTP Method | Endpoint | Auth Required | Role / Middleware | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | Public | Register new user, issue JWT cookie, and send welcome email. |
| `POST` | `/api/auth/login` | None | Public | Authenticate user credentials and set HTTP-Only JWT cookie. |
| `POST` | `/api/auth/logout` | Required | `authMiddleware` | Clear client cookie and add JWT to DB Blacklist table. |

---

### Bank Account Management (`/api/account`)

| HTTP Method | Endpoint | Auth Required | Role / Middleware | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/account/` | Required | `authMiddleware` | Create a new bank account linked to the logged-in user. |
| `GET` | `/api/account/` | Required | `authMiddleware` | Retrieve active bank account details for the authenticated user. |
| `GET` | `/api/account/balance/:id` | Required | `authMiddleware` | Compute live balance via ledger aggregation pipeline. |

---

### Transaction Engine & System Funding (`/api/transaction`)

| HTTP Method | Endpoint | Auth Required | Role / Middleware | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/transaction/` | Required | `authMiddleware` | Execute atomic transfer between sender and recipient accounts. |
| `POST` | `/api/transaction/system/add-funds` | Required | `authSystemUserMiddleware` | System Admin route to seed initial test liquidity into accounts. |

---

## Database Models & Schema Structure

### 1. User Model (`models/user.model.js`)
* `email`: String (Unique, lowercase, validated by regex).
* `name`: String.
* `password`: String (Hashed with Bcryptjs, `select: false`).
* `token`: String.
* `systemUser`: Boolean (Default: `false`, `immutable: true`, `select: false`).

### 2. Account Model (`models/account.model.js`)
* `user`: ObjectId (Ref: `User`, Indexed).
* `status`: String (Enum: `["Active", "Frozen", "Closed"]`, Default: `"Active"`).
* `currency`: String (Default: `"INR"`).
* **Compound Index:** `{ user: 1, status: 1 }`
* **Method `getBalance()`:** Runs MongoDB `$match`, `$group`, `$cond`, `$eq`, and `$sum` aggregation pipeline.

### 3. Transaction Model (`models/transaction.model.js`)
* `fromAccount`: ObjectId (Ref: `Account`, Indexed).
* `toAccount`: ObjectId (Ref: `Account`, Indexed).
* `amount`: Number.
* `idempotencyKey`: String (Unique, Indexed).
* `status`: String (Enum: `["PENDING", "COMPLETE", "FAILED", "REVERSED"]`, Default: `"PENDING"`).

### 4. Ledger Model (`models/ledger.model.js`)
* `account`: ObjectId (Ref: `Account`, Indexed, `immutable: true`).
* `amount`: Number (`immutable: true`).
* `transaction`: ObjectId (Ref: `transaction`, Indexed, `immutable: true`).
* `type`: String (Enum: `["CREDIT", "DEBIT"]`, `immutable: true`).
* **Immutability Hooks:** `pre` hooks blocking `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `findOneAndUpdate`, etc.

### 5. Blacklist Model (`models/blackList.model.js`)
* `token`: String (Unique).
* **TTL Index:** Expire after 1 day (`expireAfterSeconds: 86400`).

---

## Local Setup & Installation

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Hardikdhoot121/Backend-BankingSystem.git
cd Backend-BankingSystem
npm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/banking_system?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key

# Nodemailer Google OAuth2 Credentials
EMAIL_USER=your_email@gmail.com
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_google_refresh_token
```

### 3. Run Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`.

---

## Engineering Trade-offs & Production Scaling

* **Redis Balance Caching:** While on-demand aggregation over ledger records guarantees 100% accuracy, scaling to millions of daily transactions can increase database read pressure. In production, a Redis Cache layer can store current balances and invalidate on new ledger commits.
* **Asynchronous Message Queues:** Transitioning background transactional email dispatches from inline promises to a dedicated distributed message broker like BullMQ or RabbitMQ will prevent SMTP latency from affecting HTTP response times.

---

## Owner & Author

* **Developer:** [Hardik Dhoot](https://github.com/Hardikdhoot121)
* **GitHub:** [@Hardikdhoot121](https://github.com/Hardikdhoot121)

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
