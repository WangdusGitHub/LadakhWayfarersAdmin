# 🏔️ Ladakh Wayfarers — Enterprise Admin Management Console

A production-grade, full-stack web application designed for **Ladakh Wayfarers** to manage **Tour Packages (`tourData`)**, **Customer Testimonials (`Reviews`)**, **Photo & Video Gallery (`galleryData`)**, and **Driver & Expedition Fleet Profile (`DRIVER_CONFIG`)** with **MongoDB**, **Cloudinary CDN**, and **JWT Authentication**.

---

## ✨ Key Features

- **🔐 Administrator Authentication & Security**:
  - Secure login with bcrypt-hashed passwords and JSON Web Tokens (JWT).
  - "Remember me on this device" persistent token storage (90 days) with automatic session verification.
  - In-app Password Change modal with live validation.
  - Route-level middleware protecting all mutating CRUD actions.

- **🏔️ Tour Packages CRUD (`tourData`)**:
  - Full management of mountain expedition packages: `id`, `title`, `duration`, `maxAltitude`, `difficulty`, `bestSeason`, `idealVehicle`, `category`, `badge`, `priceEstimate`, and `overview`.
  - **Dynamic Highlights**: Add and delete bullet points on the fly.
  - **Day-by-Day Itinerary Builder**: Add days, milestones, and route descriptions.
  - Real-time search by keywords and filter by difficulty and category.

- **⭐ Customer Reviews CRUD (`Reviews`)**:
  - Manage traveler testimonials: `id`, `name`, `email`, `origin`, `rating` (1–5 stars with interactive selector), `date`, `route`, `vehicle`, `review`, `verified` traveler badge, `helpfulCount`, and driver reply editor.
  - Quick filters for 5-star ratings and verified status.

- **📸 Photo & Video Gallery CRUD with Cloudinary CDN (`galleryData`)**:
  - Responsive visual grid with category filters (`Lakes`, `Passes`, `Monasteries`, `Vehicles`, `Culture`, `Videos`).
  - **Drag-and-Drop Uploader**: Direct streaming to Cloudinary via `/api/upload` with live upload progress bar.
  - Support for high-resolution photography and HD video reels (MP4, WebM, MOV).
  - Automatic asset deletion from Cloudinary when an item is removed.
  - Graceful local disk fallback (`public/uploads`) if Cloudinary credentials are not configured.

- **🧭 Chauffeur & Fleet Configuration (`DRIVER_CONFIG`)**:
  - Live editor for master chauffeur profile (Stanzin Jigmet), vehicle specs (Innova Crysta ZX, Scorpio 4WD), union registration (`JK-10-B-7890`), contact numbers, and emergency safety checklist (portable O2, snow chains, pulse-oximeter).
  - Chauffeur profile photo manager: Drag-and-drop file upload to Cloudinary or direct image URL input with 1-click photo removal.

- **🔌 Resilient Dual-Mode Database Engine**:
  - **Zero-Downtime Architecture**: Uses **Mongoose & MongoDB** when available, and automatically falls back to an in-memory cache synchronized with `local-data-cache.json` if MongoDB is offline or connecting.
  - Automatic pre-seeding on fresh installations.
  - 1-Click "Seed / Reset Sample Data" button and complete database "JSON Export" backup button.

---

## 📁 Project Structure

```text
Ladakh Wayfarers Admin/
├── .env                       # Environment variables (Ignored in Git)
├── .gitignore                  # Git ignore rules for node_modules, secrets, uploads, logs
├── local-data-cache.json      # Local offline database cache (Ignored in Git)
├── package.json               # Project manifest and dependencies
├── pnpm-lock.yaml             # Lockfile
├── README.md                  # System documentation
├── seedData.js                # Baseline seed datasets for Ladakh Wayfarers
├── server.js                  # Express.js REST API & static server
└── public/
    ├── index.html             # Admin dashboard SPA layout & modals
    ├── css/
    │   └── styles.css         # Modern dark mountain aesthetic stylesheet
    ├── js/
    │   └── app.js             # Frontend reactive application logic & API client
    └── uploads/
        └── .gitkeep           # Upload directory placeholder for Git
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Environment Configuration (`.env`)
Create or edit your `.env` file in the root directory:

```env
# Server Port
PORT=5000

# MongoDB Connection String (Local MongoDB or MongoDB Atlas Cloud)
MONGODB_URI=mongodb://127.0.0.1:27017/ladakh_wayfarers
# For MongoDB Atlas Free Cloud:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ladakh_wayfarers?retryWrites=true&w=majority

# Cloudinary Media Storage (Sign up free at https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Security & Master Admin Credentials
JWT_SECRET=your_secure_random_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@ladakhwayfarers.com
ADMIN_PASSWORD=Ladakh@Admin2026!
```

> [!NOTE]
> All sensitive files including `.env`, `local-data-cache.json`, and local fallback media in `public/uploads/*` are automatically excluded from Git commits via `.gitignore`.

### 3. Run the Application
```bash
# Production server:
npm start

# Development auto-reloading server:
npm run dev
```

Open your browser to:
**[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Default Administrator Credentials

| Field | Default Value | Notes |
| :--- | :--- | :--- |
| **Username** | `admin` | Case-insensitive |
| **Email** | `admin@ladakhwayfarers.com` | Can be used interchangeably with username |
| **Password** | `Ladakh@Admin2026!` | Can be changed inside the admin panel anytime |

---

## 📡 REST API Reference

### Authentication Endpoints
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Sign in with username/email & password; returns JWT token |
| `GET` | `/api/auth/verify` | Admin | Validate active session token |
| `POST` | `/api/auth/change-password` | Admin | Update administrator password |
| `POST` | `/api/auth/logout` | Public | Sign out |

### System & Media Endpoints
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/status` | Public | System health check (MongoDB & Cloudinary status) |
| `POST` | `/api/seed` | Admin | Reset & seed database with Ladakh Wayfarers default datasets |
| `GET` | `/api/export` | Admin | Download complete database as JSON |
| `POST` | `/api/upload` | Admin | Upload photo or video to Cloudinary CDN (or local disk fallback) |

### Tours Endpoints (`tourData`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/tours` | Public | Retrieve all tour packages |
| `GET` | `/api/tours/:id` | Public | Retrieve single tour package by ID |
| `POST` | `/api/tours` | Admin | Create a new tour package |
| `PUT` | `/api/tours/:id` | Admin | Update an existing tour package |
| `DELETE` | `/api/tours/:id` | Admin | Delete a tour package |

### Reviews Endpoints (`Reviews`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/reviews` | Public | Retrieve all customer reviews |
| `POST` | `/api/reviews` | Public | Submit a customer review |
| `PUT` | `/api/reviews/:id` | Admin | Edit customer review (or add driver response) |
| `DELETE` | `/api/reviews/:id` | Admin | Delete a customer review |

### Gallery Endpoints (`galleryData`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/gallery` | Public | Retrieve all gallery items |
| `POST` | `/api/gallery` | Admin | Create a gallery media item |
| `PUT` | `/api/gallery/:id` | Admin | Update a gallery media item |
| `DELETE` | `/api/gallery/:id` | Admin | Delete gallery item & destroy Cloudinary media asset |

### Chauffeur & Vehicle Endpoints (`DRIVER_CONFIG`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/driver-config` | Public | Fetch chauffeur profile & vehicle specs |
| `PUT` | `/api/driver-config` | Admin | Update chauffeur profile & vehicle specs |
| `DELETE` | `/api/driver-config/profile-image` | Admin | Delete profile photo & destroy Cloudinary asset |
#   L a d a k h W a y f a r e r s A d m i n  
 