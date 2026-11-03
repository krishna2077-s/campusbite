# 🍔 CampusBite – Restaurant Ordering & Delivery Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/krishna2077-s/campusbite)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7.svg?style=flat&logo=render)](https://render.com)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED.svg?style=flat&logo=docker)](https://www.docker.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLAlchemy%20%2B%20SQLite-003B57.svg?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20API-412991.svg?style=flat&logo=openai)](https://openai.com/)

**CampusBite** is a full-stack, enterprise-grade restaurant ordering and delivery application tailored for campus environments. Built with a modern **React.js** single-page application frontend and a high-performance **FastAPI** backend with **SQLAlchemy ORM**, **JWT Authentication**, containerized with **Docker**, and powered by **OpenAI** for intelligent order history insights.

---

## 🌐 Live Production Links

| Service | Environment | Status | Link |
|---|---|:---:|---|
| **Frontend Web App** | Render Static Site | 🟢 **Live** | [https://campusbite-frontend-7evx.onrender.com](https://campusbite-frontend-7evx.onrender.com) |
| **Backend API Docs** | Render Web Service | 🟢 **Live** | [https://campusbite-backend-t5bq.onrender.com/docs](https://campusbite-backend-t5bq.onrender.com/docs) |
| **Backend Health Check** | Render Web Service | 🟢 **Live** | [https://campusbite-backend-t5bq.onrender.com/health](https://campusbite-backend-t5bq.onrender.com/health) |

---

## 🚀 Live Deployment on Render

Deploy both the backend and frontend in one click using Render Blueprint:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/krishna2077-s/campusbite)

### How Render Deployment Works:
1. **Infrastructure as Code**: The included [`render.yaml`](./render.yaml) automatically provisions:
   - **`campusbite-backend`**: Python web service running FastAPI on Uvicorn (`/health` health checks enabled).
   - **`campusbite-frontend`**: High-speed Static Site running React + Vite with SPA fallback rewrites (`/* -> /index.html`).
2. **Auto-linking**: Render binds the backend URL to the frontend's `VITE_API_BASE_URL` environment variable at build time.
3. **Continuous Deployment**: Every push to `main` on GitHub triggers an automatic zero-downtime deployment on Render.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [User Roles & Key Features](#-user-roles--key-features)
- [Order Lifecycle State Machine](#-order-lifecycle-state-machine)
- [AI Order Insights](#-ai-order-insights)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Local)](#1-backend-setup-local)
  - [Backend Setup (Docker Compose)](#2-backend-setup-docker-compose)
  - [Frontend Setup (Local)](#3-frontend-setup-local)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🌟 Project Overview

CampusBite bridges campus dining and hungry students/faculty by enabling:
- **Customers**: Browse campus eateries, filter menus by name and price, customize cart items, place dummy-paid orders, track lifecycle transitions live, review delivered meals, and query AI-powered summaries of their eating and spending habits.
- **Restaurant Owners**: Manage active menu items and pricing, toggle dish availability, receive incoming orders, monitor order staleness through automated reminders, assign ready orders to delivery partners, and handle customer return/refund requests.
- **Delivery Partners**: View assigned deliveries with real-time address instructions, transition orders to `OUT_FOR_DELIVERY` and `DELIVERED`, and browse past delivery completions.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 (Vite build system)
- **Routing**: React Router DOM v6 with Protected Route HOCs
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`, `useCallback`) + localStorage persistence for auth & cart
- **Styling**: Modern, responsive CSS design system with custom CSS variables, flexbox/grid, and color-coded status badges
- **HTTP Client**: Axios with automatic JWT Bearer token interceptor & 401 redirect handling

### Backend
- **Framework**: FastAPI (Python 3.11) with async routing
- **ORM & Database**: SQLAlchemy 2.0 with relational SQL database (SQLite for local/container dev)
- **Data Validation**: Pydantic v2 schemas for request validation & response serialization
- **Security**: JWT (`python-jose`) with bcrypt password hashing (`passlib`)
- **Background Tasks**: APScheduler running periodic background jobs checking for orders unhandled for >15 minutes
- **Middleware**: Custom request latency timer and audit logger
- **AI Integration**: OpenAI Chat Completions API (`gpt-4o-mini`) for context-grounded order analytics

### DevOps & Containers
- **Containerization**: Dockerfile & Multi-service `docker-compose.yml`
- **Version Control**: Git & GitHub

---

## 👥 User Roles & Key Features

### 1. 🧑‍🎓 Customer
- **Authentication**: Sign up, log in, secure token session.
- **Discovery**: Explore campus eateries, search dishes, filter by cuisine/price.
- **Cart & Checkout**: Manage cart items, update quantities, specify delivery location.
- **Dummy Payment**: Mock-payment ledger recording instantaneous `mock_paid` status.
- **Order Tracking**: Visual status timeline tracking 7-phase order lifecycle.
- **Cancellation**: Cancel placed orders before restaurant acceptance.
- **Feedback & Refunds**: Submit 1-5 star ratings with reviews, or submit refund requests after delivery.
- **AI Insights**: Ask natural-language questions regarding order habits and weekly spend.

### 2. 👨‍🍳 Restaurant Owner
- **Menu Management**: Add, update, delete dishes, update prices/photos, toggle live availability.
- **Order Pipeline**: Accept orders, advance status (`PREPARING` → `READY`), and assign delivery personnel.
- **Stale Order Reminders**: Automated background monitor logs orders stuck in `PLACED`/`ACCEPTED` over 15 minutes.
- **Refund Management**: Review customer refund claims and approve or reject them.
- **Analytics**: Real-time sales statistics, revenue tracking, and top-selling dishes.

### 3. 🛵 Delivery Partner
- **Dedicated Dispatch**: View exclusively orders assigned by restaurant owners.
- **Delivery Operations**: Inspect customer location and update status to `OUT_FOR_DELIVERY` and `DELIVERED`.
- **Delivery Log**: Complete delivery history and performance overview.

---

## 🔄 Order Lifecycle State Machine

Orders enforce strict server-side state transitions validated at the database and API layers:

```
[PLACED] ──(Owner accepts)──> [ACCEPTED] ──(Kitchen starts)──> [PREPARING]
   │                                                                 │
   └──(Customer cancels)──> [CANCELLED]                             │
                                                                     ▼
[DELIVERED] <──(Partner finishes)── [OUT_FOR_DELIVERY] <── [ASSIGNED] <── [READY]
      │
      └──(Refund approved)──> [REFUNDED]
```

- Customers may only cancel when status is `PLACED`.
- Restaurant owners advance orders from `PLACED` to `READY`, then assign a delivery partner.
- Delivery partners advance orders from `ASSIGNED` to `DELIVERED`.
- Delivered orders cannot be cancelled; customers can only submit return/refund requests.

---

## 🤖 AI Order Insights

Customers can ask arbitrary questions about their past orders using the integrated OpenAI assistant:
- *"Summarize my last 5 orders."*
- *"Which of my orders are still in progress?"*
- *"How much did I spend this week?"*
- *"What is my most frequently ordered dish?"*

**Privacy & Security**: The backend queries only the authenticated customer's own order history and passes it as ground-truth context to OpenAI. No customer can access another customer's data.

---

## 📂 Repository Structure

```
campusbite/
├── docker-compose.yml              # Root Docker Compose configuration
├── README.md                       # Comprehensive project documentation
├── .gitignore                      # Git ignore rules for node_modules, .env, DB
├── backend/
│   ├── Dockerfile                  # Container definition for FastAPI backend
│   ├── docker-compose.yml          # Backend-specific Compose configuration
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Sample environment variables
│   └── app/
│       ├── main.py                 # FastAPI application factory & routes registration
│       ├── config.py               # Pydantic BaseSettings configuration
│       ├── database.py             # SQLAlchemy engine & session factory
│       ├── models/                 # SQLAlchemy DB models
│       │   ├── user.py             # User model with RBAC roles
│       │   ├── restaurant.py       # Restaurant profile
│       │   ├── menu_item.py        # Food dishes & availability
│       │   ├── order.py            # Orders & status enumeration
│       │   ├── order_item.py       # Order line items
│       │   ├── review.py           # Customer ratings & reviews
│       │   ├── payment.py          # Mock payment & refund ledger
│       │   ├── reminder.py         # Stale order notification logs
│       │   └── return_refund.py    # Refund claims & dispute tracking
│       ├── schemas/                # Pydantic models for validation
│       │   ├── user.py
│       │   ├── restaurant.py
│       │   ├── menu_item.py
│       │   ├── order.py
│       │   ├── review.py
│       │   ├── payment.py
│       │   └── ai_insights.py
│       ├── routers/                # REST API endpoints
│       │   ├── auth.py             # Registration, Login, Current User
│       │   ├── restaurants.py      # Restaurant listing & details
│       │   ├── menu.py             # Dish CRUD & availability toggle
│       │   ├── orders.py           # Order lifecycle management
│       │   ├── delivery.py         # Delivery dispatch & status
│       │   ├── reviews.py          # Ratings & review submissions
│       │   ├── payments.py         # Payment transaction ledger
│       │   ├── refunds.py          # Return & refund workflows
│       │   ├── ai_insights.py      # OpenAI chat integration
│       │   └── stats.py            # Owner business statistics
│       ├── middleware/
│       │   └── logging_middleware.py # Request execution timer & audit logger
│       ├── background_tasks/
│       │   └── reminder_tasks.py   # APScheduler stale-order detector
│       └── utils/
│           ├── auth.py             # Password hashing & JWT generation
│           └── dependencies.py     # Role verification dependencies
└── frontend/
    ├── package.json                # React & Vite dependencies
    ├── vite.config.js              # Vite dev server configuration & API proxy
    ├── index.html                  # HTML entry point
    ├── .env.example                # Sample frontend environment config
    └── src/
        ├── main.jsx                # Application bootstrap
        ├── App.jsx                 # Route definitions & router setup
        ├── index.css               # Global responsive CSS theme
        ├── api/
        │   └── api.js              # Axios client with interceptors
        ├── context/
        │   └── AuthContext.jsx     # Authentication state & role helpers
        ├── components/
        │   ├── Navbar.jsx          # Role-aware navigation header
        │   ├── ProtectedRoute.jsx  # Role-based route guard
        │   ├── LoadingSpinner.jsx  # Animated UI loading indicator
        │   ├── CartItem.jsx        # Cart line item component
        │   ├── RestaurantCard.jsx  # Restaurant preview card
        │   ├── MenuItemCard.jsx    # Dish card with add-to-cart & owner controls
        │   ├── OrderCard.jsx       # Order status card with action controls
        │   └── StarRating.jsx      # Interactive review rating component
        └── pages/
            ├── Home.jsx            # Landing page
            ├── Login.jsx           # Sign in page
            ├── Register.jsx        # Account registration
            ├── RestaurantList.jsx  # Restaurant discovery & filters
            ├── RestaurantMenu.jsx  # Menu items & cart addition
            ├── Cart.jsx            # Checkout & mock payment
            ├── CustomerDashboard.jsx # Customer order tracking & history
            ├── OwnerDashboard.jsx  # Restaurant analytics & overview
            ├── MenuManagement.jsx  # Owner dish catalog editor
            ├── OrderManagement.jsx # Kitchen order management pipeline
            ├── DeliveryDashboard.jsx# Delivery partner active routes
            └── AIInsights.jsx      # AI natural language order query page
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **Docker & Docker Compose** (optional, for containerized run)
- **Git**

---

### 1. Backend Setup (Local)

1. Navigate to the backend directory:
   ```bash
   cd campusbite/backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Update `OPENAI_API_KEY` in `.env` if you wish to query the OpenAI order assistant).*
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be live at `http://localhost:8000`. Database tables are automatically provisioned on launch.

---

### 2. Backend Setup (Docker Compose)

To run the containerized backend:

1. From the repository root:
   ```bash
   docker compose up --build
   ```
2. The FastAPI backend container starts on port `8000` with volume persistence for SQLite.

---

### 3. Frontend Setup (Local)

1. Navigate to the frontend directory:
   ```bash
   cd campusbite/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal) in your browser.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./campusbite.db` |
| `SECRET_KEY` | Secret key for JWT signing | *(Set secure string)* |
| `ALGORITHM` | JWT cryptographic algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes | `60` |
| `OPENAI_API_KEY` | OpenAI API key for order analytics | `your-openai-api-key` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend REST API base URL | `http://localhost:8000` |

---

## 📖 API Documentation

FastAPI automatically generates interactive OpenAPI documentation:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Category | Method | Endpoint | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | Register customer / partner | Public |
| | `POST` | `/auth/login` | Log in and receive JWT token | Public |
| | `GET` | `/auth/me` | Fetch active user profile | Authenticated |
| **Restaurants** | `GET` | `/restaurants` | List all active restaurants | Public |
| | `GET` | `/restaurants/{id}` | Get restaurant and menu items | Public |
| | `POST` | `/restaurants` | Register a new restaurant | Owner |
| | `PUT` | `/restaurants/{id}` | Update restaurant profile | Owner |
| **Menu** | `GET` | `/restaurants/{id}/menu` | List dishes for restaurant | Public |
| | `POST` | `/restaurants/{id}/menu` | Add dish to menu | Owner |
| | `PUT` | `/menu/{item_id}` | Edit dish price & details | Owner |
| | `DELETE` | `/menu/{item_id}` | Remove dish from menu | Owner |
| | `PATCH` | `/menu/{item_id}/availability` | Toggle dish available/out of stock | Owner |
| **Orders** | `POST` | `/orders` | Place order & process mock payment | Customer |
| | `GET` | `/orders` | List orders (filtered by user role) | Authenticated |
| | `GET` | `/orders/{id}` | Get detailed order status | Authenticated |
| | `PATCH` | `/orders/{id}/status` | Transition order status | Role-gated |
| | `GET` | `/orders/owner/reminders` | Fetch unread stale order alerts | Owner |
| **Delivery** | `GET` | `/delivery/orders` | View assigned delivery routes | Delivery Partner |
| | `PATCH` | `/delivery/orders/{id}/status`| Mark `OUT_FOR_DELIVERY` or `DELIVERED`| Delivery Partner |
| **Reviews** | `POST` | `/reviews` | Submit 1-5 star rating for order | Customer |
| | `GET` | `/restaurants/{id}/reviews`| Fetch customer feedback | Public |
| **Refunds** | `POST` | `/refunds` | Submit return / refund claim | Customer |
| | `GET` | `/refunds` | List pending / resolved refunds | Customer / Owner |
| | `PATCH` | `/refunds/{id}` | Approve or reject refund | Owner |
| **AI** | `POST` | `/ai/insights` | Query OpenAI about order history | Customer |
| **Stats** | `GET` | `/stats/restaurant` | Revenue, count, & popular dishes | Owner |

---

## 🧪 Testing & Quality Assurance

- **Backend Syntax & Compilation**: Verified across all 40+ modules using `python -m compileall`.
- **Frontend Build**: Verified production bundle using `vite build` with zero compile or typing warnings.
- **Security Check**: Verified that no secrets, database files, or `.env` credential files are checked into version control.

---

## 📄 License
This capstone project is developed under the MIT License for academic evaluation.
