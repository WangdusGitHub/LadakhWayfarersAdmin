/**
 * =========================================================================
 * Ladakh Wayfarers — Enterprise Admin Management Console Backend
 * =========================================================================
 * A full-stack Node.js / Express server managing Tours, Reviews, Media Gallery,
 * and Driver Configuration with dual-mode MongoDB + In-Memory Fallback persistence,
 * Cloudinary CDN media uploads, and JWT authentication.
 * 
 * CORE ARCHITECTURE:
 * - Runtime: Node.js (CommonJS modules)
 * - Web Server: Express.js
 * - Database: MongoDB (via Mongoose) with automatic JSON cache fallback
 * - Media Storage: Cloudinary CDN with local disk fallback (/public/uploads)
 * - Security: JSON Web Tokens (JWT) & bcryptjs salted password hashing
 * 
 * CONFIGURATION & ENVIRONMENT VARIABLES (.env):
 * - PORT: Port to bind HTTP listener (defaults to 5000)
 * - MONGODB_URI: Connection string for MongoDB (Local or MongoDB Atlas)
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: Cloudinary credentials
 * - JWT_SECRET: Secret key for signing and verifying administrator tokens
 * - ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD: Default admin credentials
 * =========================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Security & Authentication Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'ladakh_wayfarers_super_secure_admin_jwt_secret_key_2026_himalaya';
const DEFAULT_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@ladakhwayfarers.com').toLowerCase().trim();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ladakh@Admin2026!';

// Baseline Seed Datasets
const {
  INITIAL_TOURS,
  INITIAL_REVIEWS,
  INITIAL_GALLERY,
  INITIAL_DRIVER_CONFIG
} = require('./seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON & URL-encoded parsing with generous limits (20MB) and CORS for API clients
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// -------------------------------------------------------------------------
// 1. Media Upload & Cloudinary Setup
// -------------------------------------------------------------------------
// If Cloudinary keys are provided in .env, media uploads stream directly to CDN.
// Otherwise, files fall back gracefully to the local public/uploads directory.
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('☁️  Cloudinary initialized successfully.');
} else {
  console.log('⚠️  Cloudinary credentials not set in .env. Image uploads will use local storage fallback.');
}

// Multer in-memory storage buffer (supports photos & HD videos up to 100MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Ensure public/uploads directory exists for local fallback storage
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// -------------------------------------------------------------------------
// 2. Mongoose Database Models & Schemas
// -------------------------------------------------------------------------
// To add new fields to any model in the future:
// 1. Add the field definition to the respective Schema below
// 2. Add default values or validation if necessary
// 3. Update the matching HTML input in public/index.html and mapper in public/js/app.js
const TourSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  duration: { type: String, default: '' },
  maxAltitude: { type: String, default: '' },
  difficulty: { type: String, default: 'Moderate' },
  bestSeason: { type: String, default: '' },
  idealVehicle: { type: String, default: 'Toyota Innova Crysta' },
  category: { type: String, default: 'Classic' },
  badge: { type: String, default: '' },
  priceEstimate: { type: String, default: '' },
  overview: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  highlights: [{ type: String }],
  itinerary: [{
    day: { type: String },
    title: { type: String },
    desc: { type: String }
  }]
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  origin: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  date: { type: String, default: '' },
  route: { type: String, default: '' },
  vehicle: { type: String, default: 'Toyota Innova Crysta' },
  review: { type: String, required: true },
  verified: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 },
  driverReply: { type: String, default: '' }
}, { timestamps: true });

const GallerySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'lakes' },
  caption: { type: String, default: '' },
  location: { type: String, default: '' },
  image: { type: String, required: true },
  publicId: { type: String, default: '' },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' }
}, { timestamps: true });

const DriverConfigSchema = new mongoose.Schema({
  driverName: { type: String, default: 'Stanzin Jigmet' },
  brandName: { type: String, default: 'Ladakh Wayfarers' },
  tagline: { type: String, default: 'High-Altitude Chauffeur & Mountain Guide' },
  phone: { type: String, default: '+91 97978 87369' },
  whatsapp: { type: String, default: '919797887369' },
  whatsappNumber: { type: String, default: '919797887369' },
  displayPhone: { type: String, default: '+91 97978 87369' },
  email: { type: String, default: 'stanzinjigmet33@gmail.com' },
  baseLocation: { type: String, default: 'Leh, Ladakh (Main Taxi Stand & Airport Pickups)' },
  taxiUnionReg: { type: String, default: 'JK-10-B-7890 (All Ladakh Tour Operators Union)' },
  primaryVehicle: { type: String, default: 'Toyota Innova Crysta 2.8 ZX (Luxury AC / Dual Heaters)' },
  secondaryVehicle: { type: String, default: 'Mahindra Scorpio 4WD (Extreme Clearance)' },
  drivingExperienceYears: { type: String, default: '12+' },
  safeExpeditionsCount: { type: String, default: '650+' },
  safetyFeatures: [{ type: String }],
  profileImage: { type: String, default: '' },
  profileImagePublicId: { type: String, default: '' }
}, { timestamps: true });

const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' },
  name: { type: String, default: 'Stanzin Jigmet (Admin)' },
  lastLogin: { type: Date }
}, { timestamps: true });

const Tour = mongoose.model('Tour', TourSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Gallery = mongoose.model('Gallery', GallerySchema);
const DriverConfig = mongoose.model('DriverConfig', DriverConfigSchema);
const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

// -------------------------------------------------------------------------
// 3. Dual-Mode High-Availability Data Engine
// -------------------------------------------------------------------------
// The system operates with zero-downtime dual persistence:
// 1. Primary Engine: MongoDB (via Mongoose models).
// 2. Resilient Fallback: If MongoDB is offline, connecting, or unconfigured,
//    the server seamlessly reads & writes to an in-memory cache synchronized
//    with `local-data-cache.json`. This guarantees the admin UI never crashes.
let memoryStore = {
  adminUsers: [],
  tours: JSON.parse(JSON.stringify(INITIAL_TOURS)),
  reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
  gallery: JSON.parse(JSON.stringify(INITIAL_GALLERY)),
  driverConfig: JSON.parse(JSON.stringify(INITIAL_DRIVER_CONFIG))
};

// Load cached state from disk if it exists
const LOCAL_DB_FILE = path.join(__dirname, 'local-data-cache.json');
if (fs.existsSync(LOCAL_DB_FILE)) {
  try {
    const cached = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    if (cached.adminUsers) memoryStore.adminUsers = cached.adminUsers;
    if (cached.tours) memoryStore.tours = cached.tours;
    if (cached.reviews) memoryStore.reviews = cached.reviews;
    if (cached.gallery) memoryStore.gallery = cached.gallery;
    if (cached.driverConfig) memoryStore.driverConfig = cached.driverConfig;
  } catch (err) {
    console.error('Error reading local data cache:', err.message);
  }
}

// Synchronizes in-memory mutations to local-data-cache.json
function persistLocalBackup() {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write local backup:', e.message);
  }
}

let isMongoConnected = false;
let mongoErrorMessage = null;

// -------------------------------------------------------------------------
// 4. MongoDB Initialization & Automatic Pre-Seeding
// -------------------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ladakh_wayfarers';

async function initMongoDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    mongoErrorMessage = null;
    const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`🌿 Connected to MongoDB at: ${maskedUri}`);

    // Auto-seed if collections are empty on first run
    const tourCount = await Tour.countDocuments();
    if (tourCount === 0) {
      console.log('🌱 Pre-seeding empty MongoDB with Ladakh Wayfarers default datasets...');
      await Tour.insertMany(INITIAL_TOURS);
      await Review.insertMany(INITIAL_REVIEWS);
      await Gallery.insertMany(INITIAL_GALLERY);
      await DriverConfig.create(INITIAL_DRIVER_CONFIG);
      console.log('✅ MongoDB successfully populated with initial data.');
    }
  } catch (err) {
    isMongoConnected = false;
    mongoErrorMessage = err.message;
    console.log(`⚠️  MongoDB connection notice: ${err.message}`);
    console.log('⚡ Admin API running smoothly in seamless fallback mode. You can set MONGODB_URI in .env to connect anytime.');
  }
}

// -------------------------------------------------------------------------
// 5. Default Administrator Provisioning
// -------------------------------------------------------------------------
// Ensures at least one master admin account exists in both MongoDB & fallback
// store so that administrators are never locked out of the console.
async function ensureDefaultAdmin() {
  try {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // MongoDB check
    if (isMongoConnected) {
      const existing = await AdminUser.findOne({
        $or: [
          { username: DEFAULT_ADMIN_USERNAME },
          { email: DEFAULT_ADMIN_EMAIL }
        ]
      });
      if (!existing) {
        await AdminUser.create({
          username: DEFAULT_ADMIN_USERNAME,
          email: DEFAULT_ADMIN_EMAIL,
          passwordHash,
          role: 'admin',
          name: 'Stanzin Jigmet (Admin)'
        });
        console.log(`🔐 Default admin user created in MongoDB: ${DEFAULT_ADMIN_USERNAME} (${DEFAULT_ADMIN_EMAIL})`);
      }
    }

    // MemoryStore fallback check
    if (!memoryStore.adminUsers) memoryStore.adminUsers = [];
    const memoryExisting = memoryStore.adminUsers.find(
      u => u.username === DEFAULT_ADMIN_USERNAME || u.email === DEFAULT_ADMIN_EMAIL
    );
    if (!memoryExisting) {
      memoryStore.adminUsers.push({
        id: 'admin-' + Date.now(),
        username: DEFAULT_ADMIN_USERNAME,
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        name: 'Stanzin Jigmet (Admin)',
        createdAt: new Date().toISOString()
      });
      persistLocalBackup();
    }
  } catch (err) {
    console.error('Error ensuring default admin user:', err.message);
  }
}

// -------------------------------------------------------------------------
// 6. Security Middleware: Authenticate Admin Request
// -------------------------------------------------------------------------
// Protects administrative mutating endpoints (POST, PUT, DELETE).
// Accepts standard `Authorization: Bearer <token>` header or `?token=` query param.
function authenticateAdmin(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Only authorized Admin can perform this action.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Admin session expired or invalid. Please sign in again.'
    });
  }
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// ------------------ AUTHENTICATION ENDPOINTS ------------------
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password, rememberMe } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Please provide both username/email and password.' });
    }

    const identifier = String(usernameOrEmail).trim().toLowerCase();

    // 1. Look in MongoDB
    let admin = null;
    if (isMongoConnected) {
      admin = await AdminUser.findOne({
        $or: [{ username: identifier }, { email: identifier }]
      });
    }

    // 2. Look in memoryStore
    if (!admin && memoryStore.adminUsers) {
      admin = memoryStore.adminUsers.find(
        u => (u.username && u.username.toLowerCase() === identifier) ||
             (u.email && u.email.toLowerCase() === identifier)
      );
    }

    // 3. Fallback direct check against default credentials if DB hasn't finished seeding
    if (!admin && (identifier === DEFAULT_ADMIN_USERNAME || identifier === DEFAULT_ADMIN_EMAIL)) {
      if (password === DEFAULT_ADMIN_PASSWORD) {
        const token = jwt.sign(
          { username: DEFAULT_ADMIN_USERNAME, email: DEFAULT_ADMIN_EMAIL, role: 'admin', name: 'Stanzin Jigmet (Admin)' },
          JWT_SECRET,
          { expiresIn: rememberMe !== false ? '90d' : '24h' }
        );
        return res.json({
          success: true,
          token,
          expiresIn: rememberMe !== false ? '90d' : '24h',
          user: {
            username: DEFAULT_ADMIN_USERNAME,
            email: DEFAULT_ADMIN_EMAIL,
            role: 'admin',
            name: 'Stanzin Jigmet (Admin)'
          }
        });
      }
    }

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Access denied: Invalid admin username or password.' });
    }

    // Validate password hash
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Access denied: Invalid admin username or password.' });
    }

    // Record login timestamp
    if (isMongoConnected && admin.save) {
      admin.lastLogin = new Date();
      await admin.save();
    } else if (admin) {
      admin.lastLogin = new Date().toISOString();
      persistLocalBackup();
    }

    // Sign JWT token - 90 days for persistent device login ("Remember me"), 24h otherwise
    const tokenDuration = rememberMe !== false ? '90d' : '24h';
    const token = jwt.sign(
      {
        id: admin._id || admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role || 'admin',
        name: admin.name || 'Stanzin Jigmet (Admin)'
      },
      JWT_SECRET,
      { expiresIn: tokenDuration }
    );

    return res.json({
      success: true,
      token,
      expiresIn: tokenDuration,
      user: {
        username: admin.username,
        email: admin.email,
        role: admin.role || 'admin',
        name: admin.name || 'Stanzin Jigmet (Admin)'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Authentication service error: ' + err.message });
  }
});

// GET /api/auth/verify (Token verification / session keep-alive)
app.get('/api/auth/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    user: req.admin
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    const username = req.admin.username;
    let admin = null;
    if (isMongoConnected) {
      admin = await AdminUser.findOne({ username });
    }
    if (!admin && memoryStore.adminUsers) {
      admin = memoryStore.adminUsers.find(u => u.username === username);
    }

    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password does not match.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    if (isMongoConnected && admin.save) {
      admin.passwordHash = newHash;
      await admin.save();
    } else {
      admin.passwordHash = newHash;
      persistLocalBackup();
    }

    return res.json({ success: true, message: 'Admin password updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// System Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    mongodb: {
      connected: isMongoConnected,
      uri: process.env.MONGODB_URI ? 'Configured' : 'Using default',
      error: mongoErrorMessage
    },
    cloudinary: {
      configured: isCloudinaryConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null
    },
    counts: {
      tours: isMongoConnected ? null : memoryStore.tours.length,
      reviews: isMongoConnected ? null : memoryStore.reviews.length,
      gallery: isMongoConnected ? null : memoryStore.gallery.length
    }
  });
});

// Seed Endpoint (Manually reset or populate)
app.post('/api/seed', authenticateAdmin, async (req, res) => {
  try {
    if (isMongoConnected) {
      await Tour.deleteMany({});
      await Review.deleteMany({});
      await Gallery.deleteMany({});
      await DriverConfig.deleteMany({});

      await Tour.insertMany(INITIAL_TOURS);
      await Review.insertMany(INITIAL_REVIEWS);
      await Gallery.insertMany(INITIAL_GALLERY);
      await DriverConfig.create(INITIAL_DRIVER_CONFIG);
    }
    // Also reset fallback memoryStore
    memoryStore = {
      tours: JSON.parse(JSON.stringify(INITIAL_TOURS)),
      reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
      gallery: JSON.parse(JSON.stringify(INITIAL_GALLERY)),
      driverConfig: JSON.parse(JSON.stringify(INITIAL_DRIVER_CONFIG))
    };
    persistLocalBackup();

    res.json({ success: true, message: 'Database successfully seeded with default Ladakh Wayfarers data.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------ TOURS CRUD ------------------
// GET all tours
app.get('/api/tours', async (req, res) => {
  try {
    if (isMongoConnected) {
      const tours = await Tour.find().sort({ createdAt: -1 });
      return res.json(tours);
    }
    return res.json(memoryStore.tours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single tour
app.get('/api/tours/:id', async (req, res) => {
  try {
    if (isMongoConnected) {
      const tour = await Tour.findOne({ id: req.params.id });
      if (!tour) return res.status(404).json({ error: 'Tour not found' });
      return res.json(tour);
    }
    const tour = memoryStore.tours.find(t => t.id === req.params.id);
    if (!tour) return res.status(404).json({ error: 'Tour not found' });
    return res.json(tour);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create tour
app.post('/api/tours', authenticateAdmin, async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = 'tour-' + Date.now();
    }
    if (!data.title) {
      return res.status(400).json({ error: 'Tour title is required' });
    }

    if (isMongoConnected) {
      const existing = await Tour.findOne({ id: data.id });
      if (existing) {
        return res.status(400).json({ error: 'A tour with this ID already exists' });
      }
      const newTour = await Tour.create(data);
      return res.status(201).json(newTour);
    } else {
      if (memoryStore.tours.some(t => t.id === data.id)) {
        return res.status(400).json({ error: 'A tour with this ID already exists' });
      }
      memoryStore.tours.unshift(data);
      persistLocalBackup();
      return res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update tour
app.put('/api/tours/:id', authenticateAdmin, async (req, res) => {
  try {
    const tourId = req.params.id;
    const updateData = req.body;

    if (isMongoConnected) {
      const updated = await Tour.findOneAndUpdate({ id: tourId }, updateData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Tour not found' });
      return res.json(updated);
    } else {
      const idx = memoryStore.tours.findIndex(t => t.id === tourId);
      if (idx === -1) return res.status(404).json({ error: 'Tour not found' });
      memoryStore.tours[idx] = { ...memoryStore.tours[idx], ...updateData };
      persistLocalBackup();
      return res.json(memoryStore.tours[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE tour
app.delete('/api/tours/:id', authenticateAdmin, async (req, res) => {
  try {
    const tourId = req.params.id;
    if (isMongoConnected) {
      const deleted = await Tour.findOneAndDelete({ id: tourId });
      if (!deleted) return res.status(404).json({ error: 'Tour not found' });
      return res.json({ success: true, message: 'Tour deleted successfully' });
    } else {
      const idx = memoryStore.tours.findIndex(t => t.id === tourId);
      if (idx === -1) return res.status(404).json({ error: 'Tour not found' });
      memoryStore.tours.splice(idx, 1);
      persistLocalBackup();
      return res.json({ success: true, message: 'Tour deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ REVIEWS CRUD ------------------
// GET all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    if (isMongoConnected) {
      const reviews = await Review.find().sort({ createdAt: -1 });
      return res.json(reviews);
    }
    return res.json(memoryStore.reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create review
app.post('/api/reviews', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = 'rev_' + Date.now();
    }
    if (!data.name || !data.review) {
      return res.status(400).json({ error: 'Reviewer name and review text are required' });
    }
    data.rating = Number(data.rating) || 5;
    data.verified = data.verified !== false && data.verified !== 'false';
    data.helpfulCount = Number(data.helpfulCount) || 0;

    if (isMongoConnected) {
      const existing = await Review.findOne({ id: data.id });
      if (existing) {
        return res.status(400).json({ error: 'A review with this ID already exists' });
      }
      const newReview = await Review.create(data);
      return res.status(201).json(newReview);
    } else {
      if (memoryStore.reviews.some(r => r.id === data.id)) {
        return res.status(400).json({ error: 'A review with this ID already exists' });
      }
      memoryStore.reviews.unshift(data);
      persistLocalBackup();
      return res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update review
app.put('/api/reviews/:id', authenticateAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const updateData = req.body;
    if (updateData.rating !== undefined) updateData.rating = Number(updateData.rating);
    if (updateData.helpfulCount !== undefined) updateData.helpfulCount = Number(updateData.helpfulCount);
    if (updateData.verified !== undefined) updateData.verified = Boolean(updateData.verified);

    if (isMongoConnected) {
      const updated = await Review.findOneAndUpdate({ id: reviewId }, updateData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Review not found' });
      return res.json(updated);
    } else {
      const idx = memoryStore.reviews.findIndex(r => r.id === reviewId);
      if (idx === -1) return res.status(404).json({ error: 'Review not found' });
      memoryStore.reviews[idx] = { ...memoryStore.reviews[idx], ...updateData };
      persistLocalBackup();
      return res.json(memoryStore.reviews[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE review
app.delete('/api/reviews/:id', authenticateAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;
    if (isMongoConnected) {
      const deleted = await Review.findOneAndDelete({ id: reviewId });
      if (!deleted) return res.status(404).json({ error: 'Review not found' });
      return res.json({ success: true, message: 'Review deleted successfully' });
    } else {
      const idx = memoryStore.reviews.findIndex(r => r.id === reviewId);
      if (idx === -1) return res.status(404).json({ error: 'Review not found' });
      memoryStore.reviews.splice(idx, 1);
      persistLocalBackup();
      return res.json({ success: true, message: 'Review deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ GALLERY CRUD ------------------
// GET all gallery items
app.get('/api/gallery', async (req, res) => {
  try {
    if (isMongoConnected) {
      const gallery = await Gallery.find().sort({ createdAt: -1 });
      return res.json(gallery);
    }
    return res.json(memoryStore.gallery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create gallery item
app.post('/api/gallery', authenticateAdmin, async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = 'gal-' + Date.now();
    }
    if (!data.title || !data.image) {
      return res.status(400).json({ error: 'Title and image URL are required' });
    }

    if (isMongoConnected) {
      const existing = await Gallery.findOne({ id: data.id });
      if (existing) {
        return res.status(400).json({ error: 'A gallery item with this ID already exists' });
      }
      const newItem = await Gallery.create(data);
      return res.status(201).json(newItem);
    } else {
      if (memoryStore.gallery.some(g => g.id === data.id)) {
        return res.status(400).json({ error: 'A gallery item with this ID already exists' });
      }
      memoryStore.gallery.unshift(data);
      persistLocalBackup();
      return res.status(201).json(data);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update gallery item
app.put('/api/gallery/:id', authenticateAdmin, async (req, res) => {
  try {
    const galId = req.params.id;
    const updateData = req.body;

    if (isMongoConnected) {
      const updated = await Gallery.findOneAndUpdate({ id: galId }, updateData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Gallery item not found' });
      return res.json(updated);
    } else {
      const idx = memoryStore.gallery.findIndex(g => g.id === galId);
      if (idx === -1) return res.status(404).json({ error: 'Gallery item not found' });
      memoryStore.gallery[idx] = { ...memoryStore.gallery[idx], ...updateData };
      persistLocalBackup();
      return res.json(memoryStore.gallery[idx]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE gallery item
app.delete('/api/gallery/:id', authenticateAdmin, async (req, res) => {
  try {
    const galId = req.params.id;
    let itemToDelete = null;

    if (isMongoConnected) {
      itemToDelete = await Gallery.findOneAndDelete({ id: galId });
    } else {
      const idx = memoryStore.gallery.findIndex(g => g.id === galId);
      if (idx !== -1) {
        itemToDelete = memoryStore.gallery.splice(idx, 1)[0];
        persistLocalBackup();
      }
    }

    if (!itemToDelete) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    // If item had a Cloudinary publicId and Cloudinary is configured, delete from Cloudinary
    if (isCloudinaryConfigured && itemToDelete.publicId) {
      try {
        const isVid = itemToDelete.mediaType === 'video' || 
                      (itemToDelete.image && (itemToDelete.image.includes('/video/upload/') || /\.(mp4|webm|mov|m4v)$/i.test(itemToDelete.image)));
        await cloudinary.uploader.destroy(itemToDelete.publicId, {
          resource_type: isVid ? 'video' : 'image'
        });
      } catch (cErr) {
        console.warn('Could not delete media asset from Cloudinary:', cErr.message);
      }
    }

    return res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ DRIVER CONFIG ------------------
// GET driver config
app.get('/api/driver-config', async (req, res) => {
  try {
    if (isMongoConnected) {
      let config = await DriverConfig.findOne();
      if (!config) {
        config = await DriverConfig.create(INITIAL_DRIVER_CONFIG);
      }
      return res.json(config);
    }
    return res.json(memoryStore.driverConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update driver config
app.put('/api/driver-config', authenticateAdmin, async (req, res) => {
  try {
    const updateData = req.body;
    if (isMongoConnected) {
      let config = await DriverConfig.findOneAndUpdate({}, updateData, { new: true, upsert: true });
      return res.json(config);
    }
    memoryStore.driverConfig = { ...memoryStore.driverConfig, ...updateData };
    persistLocalBackup();
    return res.json(memoryStore.driverConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE driver profile image (removes from Cloudinary if stored there, and resets config)
app.delete('/api/driver-config/profile-image', authenticateAdmin, async (req, res) => {
  try {
    let currentConfig;
    if (isMongoConnected) {
      currentConfig = await DriverConfig.findOne();
    } else {
      currentConfig = memoryStore.driverConfig;
    }

    const publicId = currentConfig ? currentConfig.profileImagePublicId : null;
    if (isCloudinaryConfigured && publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (cErr) {
        console.warn('Could not delete driver profile image from Cloudinary:', cErr.message);
      }
    }

    const updateData = { profileImage: '', profileImagePublicId: '' };
    if (isMongoConnected) {
      let updated = await DriverConfig.findOneAndUpdate({}, updateData, { new: true, upsert: true });
      return res.json({ success: true, message: 'Driver profile picture deleted successfully', config: updated });
    }

    memoryStore.driverConfig = { ...memoryStore.driverConfig, ...updateData };
    persistLocalBackup();
    return res.json({ success: true, message: 'Driver profile picture deleted successfully', config: memoryStore.driverConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ CLOUDINARY UPLOAD (Images & Videos) ------------------
app.post('/api/upload', authenticateAdmin, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const isVideo = file.mimetype && file.mimetype.startsWith('video/');

    // If Cloudinary is configured, upload directly to Cloudinary
    if (isCloudinaryConfigured) {
      const uploadOptions = {
        folder: 'ladakh_wayfarers',
        resource_type: 'auto', // Detects image or video automatically
        chunk_size: 6000000
      };

      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      const result = await uploadPromise;
      const detectedType = result.resource_type || (isVideo ? 'video' : 'image');

      return res.json({
        success: true,
        source: 'cloudinary',
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: detectedType,
        mediaType: detectedType,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration || null,
        message: `${detectedType === 'video' ? 'Video' : 'Image'} successfully uploaded to Cloudinary!`
      });
    }

    // Fallback: Save to public/uploads directory for local preview
    const ext = path.extname(file.originalname) || (isVideo ? '.mp4' : '.jpg');
    const prefix = isVideo ? 'vid' : 'img';
    const filename = `${prefix}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const localUrl = `/uploads/${filename}`;
    const fallbackType = isVideo ? 'video' : 'image';
    return res.json({
      success: true,
      source: 'local',
      url: localUrl,
      publicId: filename,
      resourceType: fallbackType,
      mediaType: fallbackType,
      message: `${fallbackType === 'video' ? 'Video' : 'Image'} uploaded locally (Configure Cloudinary in .env for cloud CDN)`
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Media upload failed' });
  }
});

// JSON Export for full backup
app.get('/api/export', authenticateAdmin, async (req, res) => {
  try {
    let tours, reviews, gallery, driverConfig;
    if (isMongoConnected) {
      tours = await Tour.find();
      reviews = await Review.find();
      gallery = await Gallery.find();
      driverConfig = await DriverConfig.findOne();
    } else {
      tours = memoryStore.tours;
      reviews = memoryStore.reviews;
      gallery = memoryStore.gallery;
      driverConfig = memoryStore.driverConfig;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      tours,
      reviews,
      gallery,
      driverConfig
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ladakh-wayfarers-database-export.json');
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
async function startServer() {
  await initMongoDB();
  await ensureDefaultAdmin();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🏔️  Ladakh Wayfarers Admin Console is running!`);
    console.log(`🚀 Access Webpage: http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB: ${isMongoConnected ? '✅ CONNECTED' : '⚠️ Offline/Fallback mode (set MONGODB_URI)'}`);
    console.log(`☁️  Cloudinary: ${isCloudinaryConfigured ? '✅ ACTIVE' : '⚠️ Unconfigured (local upload fallback)'}`);
    console.log(`======================================================\n`);
  });
}

startServer();
