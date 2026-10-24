/**
 * =========================================================================
 * Ladakh Wayfarers Admin Console — Frontend Core Application
 * =========================================================================
 * Full-featured Single Page Application (SPA) providing real-time management
 * of Tour Packages, Customer Testimonials, Media Gallery, and Driver Configuration.
 * 
 * CORE MODULES & ARCHITECTURE:
 * 1. State Management (`state`):
 *    - Central reactive store containing tours, reviews, gallery items, driver config,
 *      authentication session, and active modal / delete targets.
 * 
 * 2. DOM Cache (`DOM`):
 *    - Cached query selectors for performance, avoiding repeated DOM scans.
 * 
 * 3. Authentication & Security Flow:
 *    - Validates existing session on load with /api/auth/verify
 *    - Persists JWT tokens in localStorage (if Remember Me checked) or sessionStorage
 *    - Injects Authorization Bearer headers into all mutating API calls
 *    - Automatically catches 401 Unauthorized responses and redirects to login
 * 
 * 4. API Client (`apiRequest`):
 *    - Wrapper around fetch() handling JSON encoding, auth headers, and unified error parsing.
 * 
 * 5. Media Upload Pipeline (`uploadFileToCloudinary` / `handleDriverProfileUpload`):
 *    - Streams images and videos via FormData to /api/upload.
 *    - Direct Cloudinary CDN upload with progress bar, drag-and-drop preview, and local fallback.
 * 
 * 6. Dynamic Form Builders:
 *    - Tours: Dynamic highlight rows and day-by-day timeline itinerary editor.
 *    - Driver Config: Emergency checklist tags builder and profile avatar switcher.
 * 
 * HOW TO ADD A NEW FEATURE / TAB IN THE FUTURE:
 * 1. Add new <button class="nav-item" data-tab="yourTab"> in public/index.html sidebar.
 * 2. Add matching <section id="tab-yourTab" class="tab-section"> in public/index.html.
 * 3. Add any needed selectors to the `DOM` object below.
 * 4. Add fetch/render functions and wire them up in `loadAllData()` and `initEvents()`.
 * =========================================================================
 */

// Central Application State
const state = {
  currentTab: 'tours',
  tours: [],
  reviews: [],
  gallery: [],
  driverConfig: null,
  status: null,
  
  // Admin Authentication State
  auth: {
    token: null,
    user: null,
    isAuthenticated: false
  },

  // Pending delete target (used by confirmation modal)
  pendingDelete: {
    type: null, // 'tour' | 'review' | 'gallery'
    id: null,
    title: ''
  }
};

// DOM Selectors
const DOM = {
  // Navigation
  tabButtons: document.querySelectorAll('.nav-item'),
  tabSections: document.querySelectorAll('.tab-section'),
  currentTabTitle: document.getElementById('current-tab-title'),
  currentTabSubtitle: document.getElementById('current-tab-subtitle'),
  sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
  sidebar: document.querySelector('.sidebar'),
  sidebarBackdrop: document.getElementById('sidebar-backdrop'),

  // Badges & Counters
  badgeToursCount: document.getElementById('badge-tours-count'),
  badgeReviewsCount: document.getElementById('badge-reviews-count'),
  badgeGalleryCount: document.getElementById('badge-gallery-count'),
  sidebarDbIndicator: document.getElementById('sidebar-db-indicator'),
  topbarMongoPill: document.getElementById('topbar-mongo-pill'),
  topbarMongoText: document.getElementById('topbar-mongo-text'),
  topbarCloudPill: document.getElementById('topbar-cloud-pill'),
  topbarCloudText: document.getElementById('topbar-cloud-text'),

  // Header Actions
  btnAddItem: document.getElementById('btn-add-item'),
  btnAddItemText: document.getElementById('btn-add-item-text'),
  btnSeedData: document.getElementById('btn-seed-data'),
  btnExportJson: document.getElementById('btn-export-json'),

  // Tours Section
  toursGrid: document.getElementById('tours-grid'),
  toursSearchInput: document.getElementById('tours-search-input'),
  toursDifficultyFilter: document.getElementById('tours-difficulty-filter'),
  toursCategoryFilter: document.getElementById('tours-category-filter'),

  // Reviews Section
  reviewsGrid: document.getElementById('reviews-grid'),
  reviewsSearchInput: document.getElementById('reviews-search-input'),
  reviewsRatingFilter: document.getElementById('reviews-rating-filter'),
  reviewsVerifiedFilter: document.getElementById('reviews-verified-filter'),

  // Gallery Section
  galleryGrid: document.getElementById('gallery-grid'),
  gallerySearchInput: document.getElementById('gallery-search-input'),
  galleryCategoryPills: document.getElementById('gallery-category-pills'),
  btnTriggerGalleryModal: document.getElementById('btn-trigger-gallery-modal'),

  // Driver Config Section
  driverConfigForm: document.getElementById('driver-config-form'),
  safetyFeaturesList: document.getElementById('safety-features-list'),
  newSafetyFeatureInput: document.getElementById('new-safety-feature-input'),
  btnAddSafetyFeature: document.getElementById('btn-add-safety-feature'),
  sidebarDriverName: document.getElementById('sidebar-driver-name'),
  sidebarDriverVehicle: document.getElementById('sidebar-driver-vehicle'),
  sidebarDriverAvatar: document.getElementById('sidebar-driver-avatar'),
  topbarAdminAvatar: document.getElementById('topbar-admin-avatar'),

  // Driver Profile Picture Elements
  driverAvatarWrapper: document.getElementById('driver-avatar-wrapper'),
  driverAvatarImg: document.getElementById('driver-avatar-img'),
  driverAvatarPlaceholder: document.getElementById('driver-avatar-placeholder'),
  driverAvatarBadge: document.getElementById('driver-avatar-badge'),
  driverAvatarBadgeText: document.getElementById('driver-avatar-badge-text'),
  driverProfileFileInput: document.getElementById('driver-profile-file-input'),
  btnUploadDriverPhoto: document.getElementById('btn-upload-driver-photo'),
  btnUploadDriverPhotoText: document.getElementById('btn-upload-driver-photo-text'),
  btnToggleProfileUrl: document.getElementById('btn-toggle-profile-url'),
  btnDeleteDriverPhoto: document.getElementById('btn-delete-driver-photo'),
  profileUrlPanel: document.getElementById('profile-url-panel'),
  cfgProfileImage: document.getElementById('cfg-profileImage'),
  btnApplyProfileUrl: document.getElementById('btn-apply-profile-url'),
  cfgProfileImagePublicId: document.getElementById('cfg-profileImagePublicId'),
  profileUploadProgress: document.getElementById('profile-upload-progress'),
  profileUploadProgressFill: document.getElementById('profile-upload-progress-fill'),
  profileUploadStatusText: document.getElementById('profile-upload-status-text'),
  profileUploadPercentText: document.getElementById('profile-upload-percent-text'),
  driverAvatarDropzone: document.getElementById('driver-avatar-dropzone'),

  // System Status Section
  mongoCardBadge: document.getElementById('mongo-card-badge'),
  mongoStatusText: document.getElementById('mongo-status-text'),
  cloudCardBadge: document.getElementById('cloud-card-badge'),
  cloudNameDisplay: document.getElementById('cloud-name-display'),
  cloudModeText: document.getElementById('cloud-mode-text'),

  // Modals
  tourModal: document.getElementById('tour-modal'),
  tourForm: document.getElementById('tour-form'),
  tourModalTitle: document.getElementById('tour-modal-title'),
  tourHighlightsBuilder: document.getElementById('tour-highlights-builder'),
  tourItineraryBuilder: document.getElementById('tour-itinerary-builder'),
  btnAddHighlight: document.getElementById('btn-add-highlight'),
  btnAddItineraryDay: document.getElementById('btn-add-itinerary-day'),

  reviewModal: document.getElementById('review-modal'),
  reviewForm: document.getElementById('review-form'),
  reviewModalTitle: document.getElementById('review-modal-title'),
  revRatingStars: document.getElementById('rev-rating-stars'),

  galleryModal: document.getElementById('gallery-modal'),
  galleryForm: document.getElementById('gallery-form'),
  galleryModalTitle: document.getElementById('gallery-modal-title'),
  galleryDropzone: document.getElementById('gallery-dropzone'),
  galFileInput: document.getElementById('gal-file-input'),
  dropzoneDefaultView: document.getElementById('dropzone-default-view'),
  dropzonePreviewView: document.getElementById('dropzone-preview-view'),
  previewImageElem: document.getElementById('preview-image-elem'),
  previewVideoElem: document.getElementById('preview-video-elem'),
  galMediaType: document.getElementById('gal-mediaType'),
  previewFilename: document.getElementById('preview-filename'),
  uploadProgressFill: document.getElementById('upload-progress-fill'),
  uploadStatusText: document.getElementById('upload-status-text'),
  btnClearPreview: document.getElementById('btn-clear-preview'),

  deleteModal: document.getElementById('delete-modal'),
  deleteItemTitle: document.getElementById('delete-item-title'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),

  toastContainer: document.getElementById('toast-container'),

  // Authentication UI Selectors
  authSplashScreen: document.getElementById('auth-splash-screen'),
  adminLoginScreen: document.getElementById('admin-login-screen'),
  adminLoginForm: document.getElementById('admin-login-form'),
  loginUsernameInput: document.getElementById('login-username'),
  loginPasswordInput: document.getElementById('login-password'),
  loginRememberMe: document.getElementById('login-remember-me'),
  btnLoginSubmit: document.getElementById('btn-login-submit'),
  btnLoginIdle: document.querySelector('.btn-login-idle'),
  btnLoginBusy: document.querySelector('.btn-login-busy'),
  btnToggleLoginPwd: document.getElementById('btn-toggle-login-pwd'),
  togglePwdIcon: document.getElementById('toggle-pwd-icon'),
  loginErrorAlert: document.getElementById('login-error-alert'),
  loginErrorText: document.getElementById('login-error-text'),
  loginSuccessAlert: document.getElementById('login-success-alert'),
  loginSuccessText: document.getElementById('login-success-text'),
  appLayout: document.getElementById('app-layout'),

  // Header & Sidebar Auth Controls
  topbarAdminUsername: document.getElementById('topbar-admin-username'),
  sidebarAdminRole: document.getElementById('sidebar-admin-role'),
  sidebarBtnLogout: document.getElementById('sidebar-btn-logout'),
  sidebarBtnChangePwd: document.getElementById('sidebar-btn-change-pwd'),
  topbarBtnLogout: document.getElementById('topbar-btn-logout'),
  topbarBtnChangePwd: document.getElementById('topbar-btn-change-pwd'),

  // Change Password Modal
  changePasswordModal: document.getElementById('change-password-modal'),
  changePasswordForm: document.getElementById('change-password-form'),
  changePwdAlert: document.getElementById('change-pwd-alert'),
  pwdCurrent: document.getElementById('pwd-current'),
  pwdNew: document.getElementById('pwd-new'),
  pwdConfirm: document.getElementById('pwd-confirm'),
  btnSubmitChangePwd: document.getElementById('btn-submit-change-pwd')
};

// ==========================================================================
// Toast Notifications
// ==========================================================================
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i>
    <div class="toast-msg">${message}</div>
    <button class="modal-close-btn" style="font-size: 0.9rem;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==========================================================================
// Authentication & Session Persistence
// ==========================================================================
const AUTH_TOKEN_KEY = 'ladakh_admin_token';
const AUTH_USER_KEY = 'ladakh_admin_user';

function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setStoredAuth(token, user, rememberMe) {
  state.auth.token = token;
  state.auth.user = user;
  state.auth.isAuthenticated = true;

  if (rememberMe) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

function clearStoredAuth() {
  state.auth.token = null;
  state.auth.user = null;
  state.auth.isAuthenticated = false;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

function updateAdminProfileUI(user) {
  if (!user) return;
  if (DOM.topbarAdminUsername) {
    DOM.topbarAdminUsername.textContent = user.username || 'admin';
  }
  if (DOM.sidebarAdminRole) {
    DOM.sidebarAdminRole.textContent = user.role === 'admin' ? 'Super Admin' : user.role;
  }
}

function showLoginScreen(message = '') {
  if (DOM.authSplashScreen) {
    DOM.authSplashScreen.classList.add('hidden');
    DOM.authSplashScreen.style.display = 'none';
  }
  if (DOM.appLayout) DOM.appLayout.style.display = 'none';
  if (DOM.adminLoginScreen) {
    DOM.adminLoginScreen.classList.remove('hidden');
    DOM.adminLoginScreen.style.display = 'flex';
  }

  if (message && DOM.loginErrorText) {
    DOM.loginErrorText.textContent = message;
    DOM.loginErrorAlert.classList.remove('hidden');
    DOM.loginErrorAlert.style.display = 'flex';
  } else if (DOM.loginErrorAlert) {
    DOM.loginErrorAlert.classList.add('hidden');
    DOM.loginErrorAlert.style.display = 'none';
  }
  if (DOM.loginSuccessAlert) {
    DOM.loginSuccessAlert.classList.add('hidden');
    DOM.loginSuccessAlert.style.display = 'none';
  }

  // Ensure button is in normal idle state
  if (DOM.btnLoginIdle) DOM.btnLoginIdle.style.display = 'inline-flex';
  if (DOM.btnLoginBusy) DOM.btnLoginBusy.style.display = 'none';
  if (DOM.btnLoginSubmit) DOM.btnLoginSubmit.disabled = false;

  if (DOM.loginUsernameInput) {
    setTimeout(() => DOM.loginUsernameInput.focus(), 150);
  }
}

function showDashboard() {
  if (DOM.authSplashScreen) {
    DOM.authSplashScreen.classList.add('hidden');
    DOM.authSplashScreen.style.display = 'none';
  }
  if (DOM.adminLoginScreen) {
    DOM.adminLoginScreen.classList.add('hidden');
    DOM.adminLoginScreen.style.display = 'none';
  }
  if (DOM.appLayout) DOM.appLayout.style.display = 'flex';
  updateAdminProfileUI(state.auth.user);
}

function handleUnauthorized() {
  clearStoredAuth();
  showLoginScreen('Your admin session has expired. Please sign in again.');
}

async function verifyExistingSession() {
  const token = getStoredToken();
  const cachedUser = getStoredUser();

  if (!token) {
    showLoginScreen();
    return;
  }

  state.auth.token = token;
  state.auth.user = cachedUser;

  try {
    const res = await fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      state.auth.user = data.user;
      state.auth.isAuthenticated = true;
      showDashboard();
      await loadAllData();
    } else {
      clearStoredAuth();
      showLoginScreen('Your previous session has expired. Please sign in again.');
    }
  } catch (err) {
    // If network glitch but cached user exists, allow offline console view
    if (cachedUser) {
      state.auth.isAuthenticated = true;
      showDashboard();
      await loadAllData();
    } else {
      clearStoredAuth();
      showLoginScreen();
    }
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameOrEmail = DOM.loginUsernameInput.value.trim();
  const password = DOM.loginPasswordInput.value;
  const rememberMe = DOM.loginRememberMe.checked;

  if (!usernameOrEmail || !password) {
    DOM.loginErrorText.textContent = 'Please enter both username/email and password.';
    DOM.loginErrorAlert.classList.remove('hidden');
    DOM.loginErrorAlert.style.display = 'flex';
    return;
  }

  DOM.loginErrorAlert.classList.add('hidden');
  DOM.loginErrorAlert.style.display = 'none';
  DOM.loginSuccessAlert.classList.add('hidden');
  DOM.loginSuccessAlert.style.display = 'none';
  DOM.btnLoginSubmit.disabled = true;
  DOM.btnLoginIdle.classList.add('hidden');
  DOM.btnLoginIdle.style.display = 'none';
  DOM.btnLoginBusy.classList.remove('hidden');
  DOM.btnLoginBusy.style.display = 'inline-flex';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password, rememberMe })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials');
    }

    setStoredAuth(data.token, data.user, rememberMe);

    DOM.loginSuccessText.textContent = `Welcome, ${data.user.name || 'Admin'}! Access verified.`;
    DOM.loginSuccessAlert.classList.remove('hidden');
    DOM.loginSuccessAlert.style.display = 'flex';

    setTimeout(async () => {
      showDashboard();
      DOM.loginPasswordInput.value = '';
      DOM.btnLoginSubmit.disabled = false;
      DOM.btnLoginIdle.classList.remove('hidden');
      DOM.btnLoginIdle.style.display = 'inline-flex';
      DOM.btnLoginBusy.classList.add('hidden');
      DOM.btnLoginBusy.style.display = 'none';
      DOM.loginSuccessAlert.classList.add('hidden');
      DOM.loginSuccessAlert.style.display = 'none';
      showToast(`Signed in as ${data.user.username}`, 'success');
      await loadAllData();
    }, 400);

  } catch (err) {
    DOM.loginErrorText.textContent = err.message || 'Login failed. Please verify credentials.';
    DOM.loginErrorAlert.classList.remove('hidden');
    DOM.loginErrorAlert.style.display = 'flex';
    DOM.btnLoginSubmit.disabled = false;
    DOM.btnLoginIdle.classList.remove('hidden');
    DOM.btnLoginIdle.style.display = 'inline-flex';
    DOM.btnLoginBusy.classList.add('hidden');
    DOM.btnLoginBusy.style.display = 'none';
    DOM.loginPasswordInput.focus();
  }
}

function toggleLoginPasswordVisibility() {
  const isPwd = DOM.loginPasswordInput.type === 'password';
  DOM.loginPasswordInput.type = isPwd ? 'text' : 'password';
  if (DOM.togglePwdIcon) {
    DOM.togglePwdIcon.className = isPwd ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  }
}

async function handleLogout() {
  if (!confirm('Are you sure you want to sign out of the Admin Console?')) {
    return;
  }

  try {
    if (state.auth.token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.auth.token}` }
      });
    }
  } catch (e) {
    // Ignore network error on logout
  }

  clearStoredAuth();
  showLoginScreen();
  showToast('Signed out successfully.', 'info');
}

function openChangePasswordModal() {
  DOM.pwdCurrent.value = '';
  DOM.pwdNew.value = '';
  DOM.pwdConfirm.value = '';
  DOM.changePwdAlert.classList.add('hidden');
  DOM.changePasswordModal.classList.add('active');
  setTimeout(() => DOM.pwdCurrent.focus(), 150);
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const currentPassword = DOM.pwdCurrent.value;
  const newPassword = DOM.pwdNew.value;
  const confirmPassword = DOM.pwdConfirm.value;

  if (newPassword !== confirmPassword) {
    DOM.changePwdAlert.textContent = 'New passwords do not match. Please re-enter.';
    DOM.changePwdAlert.className = 'login-alert alert-danger';
    DOM.changePwdAlert.classList.remove('hidden');
    return;
  }

  if (newPassword.length < 6) {
    DOM.changePwdAlert.textContent = 'New password must be at least 6 characters.';
    DOM.changePwdAlert.className = 'login-alert alert-danger';
    DOM.changePwdAlert.classList.remove('hidden');
    return;
  }

  DOM.btnSubmitChangePwd.disabled = true;
  DOM.btnSubmitChangePwd.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

  try {
    const res = await apiRequest('/api/auth/change-password', 'POST', {
      currentPassword,
      newPassword
    });

    DOM.changePasswordModal.classList.remove('active');
    showToast(res.message || 'Password updated successfully!', 'success');
  } catch (err) {
    DOM.changePwdAlert.textContent = err.message || 'Failed to update password.';
    DOM.changePwdAlert.className = 'login-alert alert-danger';
    DOM.changePwdAlert.classList.remove('hidden');
  } finally {
    DOM.btnSubmitChangePwd.disabled = false;
    DOM.btnSubmitChangePwd.innerHTML = '<i class="fa-solid fa-check"></i> <span>Update Password</span>';
  }
}

// ==========================================================================
// API Handlers
// ==========================================================================
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (state.auth && state.auth.token) {
    options.headers['Authorization'] = `Bearer ${state.auth.token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorJson.error || 'Server request failed');
  }
  return await response.json();
}

// Check System Status
async function checkSystemStatus() {
  try {
    const res = await apiRequest('/api/status');
    state.status = res;

    // Update MongoDB status
    if (res.mongodb.connected) {
      DOM.sidebarDbIndicator.className = 'db-status-pill connected';
      DOM.sidebarDbIndicator.querySelector('.status-text').textContent = 'MongoDB: Connected';

      DOM.topbarMongoPill.className = 'system-pill active';
      DOM.topbarMongoText.textContent = 'MongoDB: Online';

      DOM.mongoCardBadge.className = 'badge-status-lg online';
      DOM.mongoCardBadge.textContent = 'Active (Connected)';
      DOM.mongoStatusText.innerHTML = '<span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-check"></i> Connected & Synchronized</span>';
    } else {
      DOM.sidebarDbIndicator.className = 'db-status-pill fallback';
      DOM.sidebarDbIndicator.querySelector('.status-text').textContent = 'DB: Fallback Cache';

      DOM.topbarMongoPill.className = 'system-pill warning';
      DOM.topbarMongoText.textContent = 'MongoDB: Fallback Mode';

      DOM.mongoCardBadge.className = 'badge-status-lg offline';
      DOM.mongoCardBadge.textContent = 'Fallback / Local Cache';
      DOM.mongoStatusText.innerHTML = `<span style="color:#fbbf24;"><i class="fa-solid fa-triangle-exclamation"></i> Using high-speed local data cache (${res.mongodb.error || 'Configure MONGODB_URI in .env'})</span>`;
    }

    // Update Cloudinary status
    if (res.cloudinary.configured) {
      DOM.topbarCloudPill.className = 'system-pill active';
      DOM.topbarCloudText.textContent = 'Cloudinary: Active';

      DOM.cloudCardBadge.className = 'badge-status-lg online';
      DOM.cloudCardBadge.textContent = 'Cloud Active';
      DOM.cloudNameDisplay.textContent = res.cloudinary.cloudName;
      DOM.cloudModeText.innerHTML = '<span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-check"></i> Direct Cloud CDN Uploads</span>';
    } else {
      DOM.topbarCloudPill.className = 'system-pill warning';
      DOM.topbarCloudText.textContent = 'Cloudinary: Local Mode';

      DOM.cloudCardBadge.className = 'badge-status-lg offline';
      DOM.cloudCardBadge.textContent = 'Unconfigured';
      DOM.cloudNameDisplay.textContent = 'Not configured in .env';
      DOM.cloudModeText.innerHTML = '<span style="color:#fbbf24;"><i class="fa-solid fa-info-circle"></i> Local file uploads fallback (active)</span>';
    }
  } catch (err) {
    console.warn('Status check warning:', err.message);
  }
}

// Load All Data
async function loadAllData() {
  await Promise.all([
    fetchTours(),
    fetchReviews(),
    fetchGallery(),
    fetchDriverConfig(),
    checkSystemStatus()
  ]);
}

// ==========================================================================
// TOURS: Fetch & Render
// ==========================================================================
async function fetchTours() {
  try {
    const data = await apiRequest('/api/tours');
    state.tours = data;
    DOM.badgeToursCount.textContent = data.length;
    renderTours();
  } catch (err) {
    DOM.toursGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Failed to load tours</h3>
        <p>${err.message}</p>
        <button class="btn btn-secondary" onclick="fetchTours()">Retry</button>
      </div>`;
    showToast('Failed to load tours: ' + err.message, 'error');
  }
}

function renderTours() {
  const searchTerm = DOM.toursSearchInput.value.toLowerCase().trim();
  const diffFilter = DOM.toursDifficultyFilter.value;
  const catFilter = DOM.toursCategoryFilter.value;

  const filtered = state.tours.filter(tour => {
    const matchesSearch = !searchTerm ||
      tour.title.toLowerCase().includes(searchTerm) ||
      tour.id.toLowerCase().includes(searchTerm) ||
      (tour.overview && tour.overview.toLowerCase().includes(searchTerm)) ||
      (tour.maxAltitude && tour.maxAltitude.toLowerCase().includes(searchTerm));

    const matchesDiff = diffFilter === 'all' || tour.difficulty === diffFilter;
    const matchesCat = catFilter === 'all' || tour.category === catFilter;

    return matchesSearch && matchesDiff && matchesCat;
  });

  if (filtered.length === 0) {
    DOM.toursGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-route"></i>
        <h3>No tour packages found</h3>
        <p>No tours match your current filter criteria.</p>
        <button class="btn btn-primary" onclick="openTourModal()">+ Add New Tour</button>
      </div>`;
    return;
  }

  DOM.toursGrid.innerHTML = filtered.map(tour => {
    const diffClass = `difficulty-${(tour.difficulty || 'easy').toLowerCase()}`;
    const highlightsHtml = (tour.highlights || []).map(h => `<li>${escapeHtml(h)}</li>`).join('');
    
    const itineraryHtml = (tour.itinerary || []).map(step => `
      <div class="timeline-step">
        <div class="timeline-day">${escapeHtml(step.day || 'Day')}</div>
        <div class="timeline-title">${escapeHtml(step.title || '')}</div>
        <div class="timeline-desc">${escapeHtml(step.desc || '')}</div>
      </div>
    `).join('');

    return `
      <article class="card tour-card" data-id="${tour.id}">
        <div class="tour-card-header">
          <div>
            <div class="tour-badges-wrap">
              <span class="badge-tag category">${escapeHtml(tour.category || 'Tour')}</span>
              <span class="badge-tag ${diffClass}">${escapeHtml(tour.difficulty || 'Easy')}</span>
              ${tour.badge ? `<span class="badge-tag highlight"><i class="fa-solid fa-crown"></i> ${escapeHtml(tour.badge)}</span>` : ''}
            </div>
            <h3 class="tour-title">${escapeHtml(tour.title)}</h3>
            <span class="tour-id-code">ID: ${escapeHtml(tour.id)}</span>
          </div>
          <div class="card-actions-dropdown">
            <button class="btn-icon" title="Edit Tour" onclick="openTourModal('${tour.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon danger" title="Delete Tour" onclick="triggerDelete('tour', '${tour.id}', '${escapeAttr(tour.title)}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="tour-metrics-grid">
          <div class="metric-item">
            <i class="fa-regular fa-clock"></i>
            <div>
              <div class="metric-label">Duration</div>
              <div class="metric-val">${escapeHtml(tour.duration || 'N/A')}</div>
            </div>
          </div>
          <div class="metric-item">
            <i class="fa-solid fa-mountain"></i>
            <div>
              <div class="metric-label">Altitude</div>
              <div class="metric-val">${escapeHtml(tour.maxAltitude || 'N/A')}</div>
            </div>
          </div>
          <div class="metric-item">
            <i class="fa-solid fa-car-side"></i>
            <div>
              <div class="metric-label">Vehicle</div>
              <div class="metric-val">${escapeHtml(tour.idealVehicle || 'Toyota Innova')}</div>
            </div>
          </div>
          <div class="metric-item">
            <i class="fa-regular fa-calendar-check"></i>
            <div>
              <div class="metric-label">Season</div>
              <div class="metric-val">${escapeHtml(tour.bestSeason || 'May - Oct')}</div>
            </div>
          </div>
        </div>

        <p class="tour-overview-text">${escapeHtml(tour.overview || '')}</p>

        <!-- Highlights Accordion -->
        ${(tour.highlights && tour.highlights.length) ? `
          <div class="expandable-block">
            <button class="expandable-trigger" onclick="toggleAccordion(this)">
              <span><i class="fa-solid fa-sparkles"></i> Highlights (${tour.highlights.length})</span>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="expandable-content">
              <ul class="highlights-ul">${highlightsHtml}</ul>
            </div>
          </div>
        ` : ''}

        <!-- Itinerary Accordion -->
        ${(tour.itinerary && tour.itinerary.length) ? `
          <div class="expandable-block">
            <button class="expandable-trigger" onclick="toggleAccordion(this)">
              <span><i class="fa-solid fa-map-location-dot"></i> Itinerary (${tour.itinerary.length} Days)</span>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="expandable-content">
              <div class="timeline-list">${itineraryHtml}</div>
            </div>
          </div>
        ` : ''}

        <div class="tour-card-footer">
          <div class="price-estimate">
            <span>Price Estimate</span>
            <strong>${escapeHtml(tour.priceEstimate || 'Contact for price')}</strong>
          </div>
          <button class="btn btn-secondary" onclick="openTourModal('${tour.id}')" style="font-size:0.8rem; padding: 6px 12px;">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// ==========================================================================
// REVIEWS: Fetch & Render
// ==========================================================================
async function fetchReviews() {
  try {
    const data = await apiRequest('/api/reviews');
    state.reviews = data;
    DOM.badgeReviewsCount.textContent = data.length;
    renderReviews();
  } catch (err) {
    DOM.reviewsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Failed to load reviews</h3>
        <p>${err.message}</p>
        <button class="btn btn-secondary" onclick="fetchReviews()">Retry</button>
      </div>`;
    showToast('Failed to load reviews: ' + err.message, 'error');
  }
}

function renderReviews() {
  const searchTerm = DOM.reviewsSearchInput.value.toLowerCase().trim();
  const ratingFilter = DOM.reviewsRatingFilter.value;
  const verifiedFilter = DOM.reviewsVerifiedFilter.value;

  const filtered = state.reviews.filter(rev => {
    const matchesSearch = !searchTerm ||
      rev.name.toLowerCase().includes(searchTerm) ||
      (rev.origin && rev.origin.toLowerCase().includes(searchTerm)) ||
      (rev.route && rev.route.toLowerCase().includes(searchTerm)) ||
      (rev.review && rev.review.toLowerCase().includes(searchTerm));

    const matchesRating = ratingFilter === 'all' ||
      (ratingFilter === '5' && rev.rating === 5) ||
      (ratingFilter === '4' && rev.rating >= 4);

    const matchesVerified = verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && rev.verified) ||
      (verifiedFilter === 'unverified' && !rev.verified);

    return matchesSearch && matchesRating && matchesVerified;
  });

  if (filtered.length === 0) {
    DOM.reviewsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-star-half-stroke"></i>
        <h3>No customer reviews found</h3>
        <p>No reviews match your current filter criteria.</p>
        <button class="btn btn-primary" onclick="openReviewModal()">+ Add New Review</button>
      </div>`;
    return;
  }

  DOM.reviewsGrid.innerHTML = filtered.map(rev => {
    const initials = rev.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const starsHtml = Array.from({ length: 5 }, (_, i) => 
      `<i class="fa-${i < (rev.rating || 5) ? 'solid' : 'regular'} fa-star"></i>`
    ).join('');

    return `
      <article class="card review-card" data-id="${rev.id}">
        <div class="review-card-header">
          <div class="reviewer-meta">
            <div class="reviewer-avatar">${escapeHtml(initials)}</div>
            <div class="reviewer-names">
              <strong>${escapeHtml(rev.name)}</strong>
              <span class="reviewer-origin">
                <i class="fa-solid fa-location-dot"></i> ${escapeHtml(rev.origin || 'Traveler')}
              </span>
            </div>
          </div>
          <div class="card-actions-dropdown">
            <button class="btn-icon" title="Edit Review" onclick="openReviewModal('${rev.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon danger" title="Delete Review" onclick="triggerDelete('review', '${rev.id}', '${escapeAttr(rev.name)}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="star-rating-display">${starsHtml}</div>

        <div class="route-vehicle-badge">
          ${rev.route ? `<span class="route-pill"><i class="fa-solid fa-map-pin"></i> ${escapeHtml(rev.route)}</span>` : ''}
          ${rev.vehicle ? `<span class="route-pill"><i class="fa-solid fa-car"></i> ${escapeHtml(rev.vehicle)}</span>` : ''}
          ${rev.verified ? `<span class="badge-tag highlight" style="font-size:0.7rem;"><i class="fa-solid fa-check-circle"></i> Verified</span>` : ''}
        </div>

        <div class="review-quote">
          "${escapeHtml(rev.review)}"
        </div>

        ${rev.driverReply ? `
          <div class="driver-reply-box">
            <div class="driver-reply-header">
              <i class="fa-solid fa-reply"></i> Driver Reply (Stanzin Jigmet):
            </div>
            <div class="driver-reply-text">
              "${escapeHtml(rev.driverReply)}"
            </div>
          </div>
        ` : ''}

        <div class="review-card-footer">
          <div>
            <i class="fa-regular fa-calendar"></i> ${escapeHtml(rev.date || 'Recent')}
          </div>
          <button class="helpful-btn" onclick="incrementHelpful('${rev.id}')">
            <i class="fa-solid fa-thumbs-up"></i> Helpful (${rev.helpfulCount || 0})
          </button>
        </div>
      </article>
    `;
  }).join('');
}

async function incrementHelpful(id) {
  const review = state.reviews.find(r => r.id === id);
  if (!review) return;
  const newCount = (review.helpfulCount || 0) + 1;
  try {
    await apiRequest(`/api/reviews/${id}`, 'PUT', { helpfulCount: newCount });
    review.helpfulCount = newCount;
    renderReviews();
    showToast('Marked as helpful!', 'info', 2000);
  } catch (err) {
    showToast('Failed to update: ' + err.message, 'error');
  }
}

// ==========================================================================
// GALLERY: Fetch & Render
// ==========================================================================
async function fetchGallery() {
  try {
    const data = await apiRequest('/api/gallery');
    state.gallery = data;
    DOM.badgeGalleryCount.textContent = data.length;
    renderGallery();
  } catch (err) {
    DOM.galleryGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Failed to load gallery</h3>
        <p>${err.message}</p>
        <button class="btn btn-secondary" onclick="fetchGallery()">Retry</button>
      </div>`;
    showToast('Failed to load gallery: ' + err.message, 'error');
  }
}

function renderGallery() {
  const searchTerm = DOM.gallerySearchInput.value.toLowerCase().trim();
  const activePill = DOM.galleryCategoryPills.querySelector('.pill-btn.active');
  const catFilter = activePill ? activePill.dataset.category : 'all';

  const filtered = state.gallery.filter(item => {
    const matchesSearch = !searchTerm ||
      item.title.toLowerCase().includes(searchTerm) ||
      (item.location && item.location.toLowerCase().includes(searchTerm)) ||
      (item.caption && item.caption.toLowerCase().includes(searchTerm));

    const isVideoItem = item.mediaType === 'video' || (item.image && (item.image.includes('/video/upload/') || /\.(mp4|webm|mov|m4v)$/i.test(item.image)));
    const matchesCat = catFilter === 'all' || 
      (catFilter === 'videos' ? (item.category === 'videos' || isVideoItem) : item.category === catFilter);

    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    DOM.galleryGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-images"></i>
        <h3>No media items found</h3>
        <p>No photos or videos match your filter criteria.</p>
        <button class="btn btn-primary" onclick="openGalleryModal()">+ Upload Photo / Video</button>
      </div>`;
    return;
  }

  DOM.galleryGrid.innerHTML = filtered.map(item => {
    const isVideo = item.mediaType === 'video' || (item.image && (item.image.includes('/video/upload/') || /\.(mp4|webm|mov|m4v)$/i.test(item.image)));
    const isCloudinary = (item.image && item.image.includes('cloudinary.com')) || item.publicId;

    return `
      <div class="gallery-card" data-id="${item.id}">
        <div class="gallery-thumb-wrap">
          ${isVideo ? `
            <video class="gallery-video-player" src="${escapeAttr(item.image)}" controls playsinline preload="metadata"></video>
            <span class="gallery-badge-overlay">${escapeHtml(item.category || 'video')}</span>
            <span class="gallery-media-pill video"><i class="fa-solid fa-video"></i> Video</span>
          ` : `
            <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=600&q=80'">
            <span class="gallery-badge-overlay">${escapeHtml(item.category || 'photo')}</span>
          `}
          ${isCloudinary ? `
            <span class="gallery-cloudinary-badge" title="Hosted on Cloudinary CDN">
              <i class="fa-solid fa-cloud"></i> Cloudinary
            </span>
          ` : ''}
        </div>

        <div class="gallery-card-body">
          <h4 class="gallery-title">${escapeHtml(item.title)}</h4>
          ${item.location ? `
            <div class="gallery-location">
              <i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.location)}
            </div>
          ` : ''}
          <p class="gallery-caption">${escapeHtml(item.caption || '')}</p>

          <div class="gallery-card-footer">
            <span class="tour-id-code">ID: ${escapeHtml(item.id)}</span>
            <div class="card-actions-dropdown">
              <button class="btn-icon" title="Copy Media Link" onclick="copyToClipboard('${escapeAttr(item.image)}')">
                <i class="fa-solid fa-link"></i>
              </button>
              <button class="btn-icon" title="Edit Item" onclick="openGalleryModal('${item.id}')">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon danger" title="Delete Item" onclick="triggerDelete('gallery', '${item.id}', '${escapeAttr(item.title)}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// DRIVER CONFIG: Fetch & Save
// ==========================================================================
async function fetchDriverConfig() {
  try {
    const data = await apiRequest('/api/driver-config');
    state.driverConfig = data;
    renderDriverConfigForm(data);
  } catch (err) {
    console.error('Error fetching driver config:', err);
  }
}

function renderDriverConfigForm(cfg) {
  if (!cfg) return;

  if (DOM.sidebarDriverName) DOM.sidebarDriverName.textContent = cfg.driverName || 'Stanzin Jigmet';
  if (DOM.sidebarDriverVehicle) DOM.sidebarDriverVehicle.textContent = cfg.primaryVehicle || 'Toyota Innova Crysta';

  document.getElementById('cfg-driverName').value = cfg.driverName || '';
  document.getElementById('cfg-brandName').value = cfg.brandName || '';
  document.getElementById('cfg-tagline').value = cfg.tagline || '';
  document.getElementById('cfg-phone').value = cfg.phone || '';
  document.getElementById('cfg-whatsappNumber').value = cfg.whatsappNumber || '';
  document.getElementById('cfg-email').value = cfg.email || '';
  document.getElementById('cfg-baseLocation').value = cfg.baseLocation || '';
  document.getElementById('cfg-taxiUnionReg').value = cfg.taxiUnionReg || '';
  document.getElementById('cfg-primaryVehicle').value = cfg.primaryVehicle || '';
  document.getElementById('cfg-secondaryVehicle').value = cfg.secondaryVehicle || '';
  document.getElementById('cfg-drivingExperienceYears').value = cfg.drivingExperienceYears || '';
  document.getElementById('cfg-safeExpeditionsCount').value = cfg.safeExpeditionsCount || '';

  // Driver Profile Picture
  const profileImg = cfg.profileImage || '';
  const profilePublicId = cfg.profileImagePublicId || '';
  if (DOM.cfgProfileImage) DOM.cfgProfileImage.value = profileImg;
  if (DOM.cfgProfileImagePublicId) DOM.cfgProfileImagePublicId.value = profilePublicId;
  updateProfilePictureUI(profileImg, profilePublicId);

  renderSafetyFeaturesList(cfg.safetyFeatures || []);
}

function renderSafetyFeaturesList(features) {
  DOM.safetyFeaturesList.innerHTML = features.map((feat, index) => `
    <div class="tag-item-row" data-index="${index}">
      <i class="fa-solid fa-shield-heart"></i>
      <span>${escapeHtml(feat)}</span>
      <button type="button" class="btn-icon danger" style="width:26px; height:26px; font-size:0.75rem;" onclick="removeSafetyFeature(${index})">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

function removeSafetyFeature(index) {
  if (!state.driverConfig || !state.driverConfig.safetyFeatures) return;
  state.driverConfig.safetyFeatures.splice(index, 1);
  renderSafetyFeaturesList(state.driverConfig.safetyFeatures);
}

function addSafetyFeature() {
  const input = DOM.newSafetyFeatureInput;
  const val = input.value.trim();
  if (!val) return;

  if (!state.driverConfig) state.driverConfig = {};
  if (!state.driverConfig.safetyFeatures) state.driverConfig.safetyFeatures = [];
  
  state.driverConfig.safetyFeatures.push(val);
  renderSafetyFeaturesList(state.driverConfig.safetyFeatures);
  input.value = '';
}

// ==========================================================================
// DRIVER PROFILE PICTURE HANDLERS (Add, Update, Delete)
// ==========================================================================
function updateProfilePictureUI(imageUrl, publicId) {
  const hasImage = Boolean(imageUrl && imageUrl.trim());

  if (hasImage) {
    if (DOM.driverAvatarImg) {
      DOM.driverAvatarImg.src = imageUrl;
      DOM.driverAvatarImg.style.display = 'block';
    }
    if (DOM.driverAvatarPlaceholder) DOM.driverAvatarPlaceholder.style.display = 'none';
    if (DOM.btnDeleteDriverPhoto) DOM.btnDeleteDriverPhoto.style.display = 'inline-flex';
    if (DOM.btnUploadDriverPhotoText) DOM.btnUploadDriverPhotoText.textContent = 'Update Picture';

    // Status badge
    if (DOM.driverAvatarBadge && DOM.driverAvatarBadgeText) {
      DOM.driverAvatarBadge.classList.remove('active-cloud', 'active-local');
      if (imageUrl.includes('cloudinary.com')) {
        DOM.driverAvatarBadge.classList.add('active-cloud');
        DOM.driverAvatarBadgeText.textContent = 'Cloudinary CDN';
      } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('http://localhost') || imageUrl.startsWith('/')) {
        DOM.driverAvatarBadge.classList.add('active-local');
        DOM.driverAvatarBadgeText.textContent = 'Local Upload';
      } else {
        DOM.driverAvatarBadge.classList.add('active-cloud');
        DOM.driverAvatarBadgeText.textContent = 'Active Photo';
      }
    }

    // Sidebar avatar update
    if (DOM.sidebarDriverAvatar) {
      DOM.sidebarDriverAvatar.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="Driver Avatar" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fa-solid fa-user-shield\\'></i>';">`;
    }

    // Topbar admin chip avatar update
    if (DOM.topbarAdminAvatar) {
      DOM.topbarAdminAvatar.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="Admin Avatar" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fa-solid fa-circle-user\\'></i>';">`;
    }
  } else {
    if (DOM.driverAvatarImg) {
      DOM.driverAvatarImg.src = '';
      DOM.driverAvatarImg.style.display = 'none';
    }
    if (DOM.driverAvatarPlaceholder) DOM.driverAvatarPlaceholder.style.display = 'flex';
    if (DOM.btnDeleteDriverPhoto) DOM.btnDeleteDriverPhoto.style.display = 'none';
    if (DOM.btnUploadDriverPhotoText) DOM.btnUploadDriverPhotoText.textContent = 'Upload Picture';

    if (DOM.driverAvatarBadge && DOM.driverAvatarBadgeText) {
      DOM.driverAvatarBadge.classList.remove('active-cloud', 'active-local');
      DOM.driverAvatarBadgeText.textContent = 'Default Avatar';
    }

    if (DOM.sidebarDriverAvatar) {
      DOM.sidebarDriverAvatar.innerHTML = `<i class="fa-solid fa-user-shield"></i>`;
    }

    if (DOM.topbarAdminAvatar) {
      DOM.topbarAdminAvatar.innerHTML = `<i class="fa-solid fa-circle-user"></i>`;
    }
  }
}

async function handleDriverProfileUpload(file) {
  if (!file) return;

  if (!file.type || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, JPEG, WEBP)', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('Image size exceeds 10MB limit', 'error');
    return;
  }

  // Show progress indicator
  if (DOM.profileUploadProgress) DOM.profileUploadProgress.style.display = 'flex';
  if (DOM.profileUploadProgressFill) {
    DOM.profileUploadProgressFill.style.width = '30%';
    DOM.profileUploadProgressFill.style.background = 'var(--gradient-primary)';
  }
  if (DOM.profileUploadStatusText) DOM.profileUploadStatusText.textContent = 'Uploading to Cloudinary CDN...';
  if (DOM.profileUploadPercentText) DOM.profileUploadPercentText.textContent = '30%';
  if (DOM.btnUploadDriverPhoto) DOM.btnUploadDriverPhoto.disabled = true;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const uploadHeaders = {};
    if (state.auth && state.auth.token) {
      uploadHeaders['Authorization'] = `Bearer ${state.auth.token}`;
    }

    // Visual progress step
    setTimeout(() => {
      if (DOM.profileUploadProgressFill) DOM.profileUploadProgressFill.style.width = '75%';
      if (DOM.profileUploadPercentText) DOM.profileUploadPercentText.textContent = '75%';
    }, 250);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });

    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errJson.error || 'Upload failed');
    }

    const data = await response.json();
    if (DOM.profileUploadProgressFill) DOM.profileUploadProgressFill.style.width = '100%';
    if (DOM.profileUploadPercentText) DOM.profileUploadPercentText.textContent = '100%';
    if (DOM.profileUploadStatusText) {
      DOM.profileUploadStatusText.textContent = data.source === 'cloudinary'
        ? '✓ Profile picture uploaded to Cloudinary!'
        : '✓ Profile picture uploaded locally!';
    }

    const newImageUrl = data.url;
    const newPublicId = data.publicId || '';

    if (DOM.cfgProfileImage) DOM.cfgProfileImage.value = newImageUrl;
    if (DOM.cfgProfileImagePublicId) DOM.cfgProfileImagePublicId.value = newPublicId;

    // Immediately persist update to driver config
    const updatePayload = {
      profileImage: newImageUrl,
      profileImagePublicId: newPublicId
    };
    const updatedConfig = await apiRequest('/api/driver-config', 'PUT', updatePayload);
    state.driverConfig = { ...state.driverConfig, ...updatedConfig, profileImage: newImageUrl, profileImagePublicId: newPublicId };

    updateProfilePictureUI(newImageUrl, newPublicId);
    showToast('Driver profile picture updated successfully!', 'success');

    setTimeout(() => {
      if (DOM.profileUploadProgress) DOM.profileUploadProgress.style.display = 'none';
    }, 2000);
  } catch (err) {
    if (DOM.profileUploadStatusText) DOM.profileUploadStatusText.textContent = 'Upload failed: ' + err.message;
    if (DOM.profileUploadProgressFill) DOM.profileUploadProgressFill.style.background = 'var(--accent-rose)';
    showToast('Upload failed: ' + err.message, 'error');
  } finally {
    if (DOM.btnUploadDriverPhoto) DOM.btnUploadDriverPhoto.disabled = false;
    if (DOM.driverProfileFileInput) DOM.driverProfileFileInput.value = '';
  }
}

function requestDeleteDriverProfilePhoto() {
  triggerDelete('driver-profile-photo', 'driver-profile-photo', 'Driver Profile Picture');
}

async function applyProfileImageUrl() {
  const input = DOM.cfgProfileImage;
  const url = (input.value || '').trim();
  if (!url) {
    showToast('Please enter a valid image URL', 'warning');
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    showToast('Please enter a valid URL (starting with http:// or https://)', 'error');
    return;
  }

  try {
    const updatePayload = {
      profileImage: url,
      profileImagePublicId: ''
    };
    const updatedConfig = await apiRequest('/api/driver-config', 'PUT', updatePayload);
    state.driverConfig = { ...state.driverConfig, ...updatedConfig, profileImage: url, profileImagePublicId: '' };
    updateProfilePictureUI(url, '');
    showToast('Profile picture URL applied and saved!', 'success');
  } catch (err) {
    showToast('Failed to apply image URL: ' + err.message, 'error');
  }
}

function setupProfilePhotoDragDrop() {
  const dropTargets = [DOM.driverAvatarDropzone, DOM.driverAvatarWrapper].filter(Boolean);

  dropTargets.forEach(target => {
    ['dragenter', 'dragover'].forEach(eventName => {
      target.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (DOM.driverAvatarDropzone) DOM.driverAvatarDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      target.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (DOM.driverAvatarDropzone) DOM.driverAvatarDropzone.classList.remove('drag-over');
      });
    });

    target.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt ? dt.files : null;
      if (files && files.length > 0) {
        handleDriverProfileUpload(files[0]);
      }
    });
  });
}


// ==========================================================================
// TOURS: Modal & CRUD
// ==========================================================================
function openTourModal(tourId = null) {
  const isEdit = Boolean(tourId);
  document.getElementById('tour-is-edit').value = isEdit ? 'true' : 'false';
  DOM.tourModalTitle.innerHTML = `<i class="fa-solid fa-route"></i> ${isEdit ? 'Edit Tour Package' : 'Add New Tour Package'}`;

  if (isEdit) {
    const tour = state.tours.find(t => t.id === tourId);
    if (!tour) return;

    document.getElementById('tour-id').value = tour.id;
    document.getElementById('tour-id').readOnly = true;
    document.getElementById('tour-title').value = tour.title || '';
    document.getElementById('tour-duration').value = tour.duration || '';
    document.getElementById('tour-maxAltitude').value = tour.maxAltitude || '';
    document.getElementById('tour-difficulty').value = tour.difficulty || 'Easy';
    document.getElementById('tour-bestSeason').value = tour.bestSeason || '';
    document.getElementById('tour-idealVehicle').value = tour.idealVehicle || 'Toyota Innova Crysta';
    document.getElementById('tour-category').value = tour.category || 'Classic';
    document.getElementById('tour-badge').value = tour.badge || '';
    document.getElementById('tour-priceEstimate').value = tour.priceEstimate || '';
    document.getElementById('tour-overview').value = tour.overview || '';

    // Render Highlights
    DOM.tourHighlightsBuilder.innerHTML = '';
    (tour.highlights || []).forEach(h => addHighlightRow(h));

    // Render Itinerary
    DOM.tourItineraryBuilder.innerHTML = '';
    (tour.itinerary || []).forEach(step => addItineraryRow(step.day, step.title, step.desc));
  } else {
    DOM.tourForm.reset();
    document.getElementById('tour-id').readOnly = false;
    document.getElementById('tour-id').value = 'tour-' + Date.now().toString().slice(-6);
    document.getElementById('tour-idealVehicle').value = 'Toyota Innova Crysta';
    
    // Default 1 highlight and 1 day
    DOM.tourHighlightsBuilder.innerHTML = '';
    addHighlightRow('Acclimatization day & scenic sunset view');
    
    DOM.tourItineraryBuilder.innerHTML = '';
    addItineraryRow('Day 1', 'Arrival in Leh & Acclimatization', 'Airport pickup, warm welcome and hotel transfer with rest.');
  }

  DOM.tourModal.classList.add('active');
}

function addHighlightRow(text = '') {
  const row = document.createElement('div');
  row.className = 'dynamic-input-row';
  row.innerHTML = `
    <input type="text" class="highlight-item-input" placeholder="e.g. Ascend to Khardung La Pass (17,982 ft)" value="${escapeAttr(text)}">
    <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  DOM.tourHighlightsBuilder.appendChild(row);
}

function addItineraryRow(day = '', title = '', desc = '') {
  const count = DOM.tourItineraryBuilder.children.length + 1;
  const row = document.createElement('div');
  row.className = 'itinerary-item-box';
  row.innerHTML = `
    <div class="itinerary-row-header">
      <input type="text" class="itinerary-day-input" placeholder="Day 1" value="${escapeAttr(day || 'Day ' + count)}">
      <input type="text" class="itinerary-title-input" placeholder="Day Title (e.g. Sham Valley Wonders)" value="${escapeAttr(title)}">
      <button type="button" class="btn-icon danger" onclick="this.closest('.itinerary-item-box').remove()">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
    <textarea class="itinerary-desc-input" rows="2" placeholder="Detailed day activities...">${escapeHtml(desc)}</textarea>
  `;
  DOM.tourItineraryBuilder.appendChild(row);
}

async function handleTourFormSubmit(e) {
  e.preventDefault();
  const isEdit = document.getElementById('tour-is-edit').value === 'true';
  const id = document.getElementById('tour-id').value.trim();

  // Gather Highlights
  const highlights = Array.from(DOM.tourHighlightsBuilder.querySelectorAll('.highlight-item-input'))
    .map(inp => inp.value.trim())
    .filter(Boolean);

  // Gather Itinerary
  const itinerary = Array.from(DOM.tourItineraryBuilder.querySelectorAll('.itinerary-item-box'))
    .map(box => ({
      day: box.querySelector('.itinerary-day-input').value.trim(),
      title: box.querySelector('.itinerary-title-input').value.trim(),
      desc: box.querySelector('.itinerary-desc-input').value.trim()
    }))
    .filter(item => item.day || item.title);

  const payload = {
    id,
    title: document.getElementById('tour-title').value.trim(),
    duration: document.getElementById('tour-duration').value.trim(),
    maxAltitude: document.getElementById('tour-maxAltitude').value.trim(),
    difficulty: document.getElementById('tour-difficulty').value,
    bestSeason: document.getElementById('tour-bestSeason').value.trim(),
    idealVehicle: document.getElementById('tour-idealVehicle').value.trim(),
    category: document.getElementById('tour-category').value,
    badge: document.getElementById('tour-badge').value.trim(),
    priceEstimate: document.getElementById('tour-priceEstimate').value.trim(),
    overview: document.getElementById('tour-overview').value.trim(),
    highlights,
    itinerary
  };

  const btnSave = document.getElementById('btn-save-tour');
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  try {
    if (isEdit) {
      await apiRequest(`/api/tours/${id}`, 'PUT', payload);
      showToast('Tour package updated successfully!', 'success');
    } else {
      await apiRequest('/api/tours', 'POST', payload);
      showToast('New tour package created successfully!', 'success');
    }

    DOM.tourModal.classList.remove('active');
    await fetchTours();
  } catch (err) {
    showToast('Failed to save tour: ' + err.message, 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save Tour</span>';
  }
}

// ==========================================================================
// REVIEWS: Modal & CRUD
// ==========================================================================
function openReviewModal(reviewId = null) {
  const isEdit = Boolean(reviewId);
  document.getElementById('review-is-edit').value = isEdit ? 'true' : 'false';
  DOM.reviewModalTitle.innerHTML = `<i class="fa-solid fa-star"></i> ${isEdit ? 'Edit Customer Review' : 'Add Customer Review'}`;

  if (isEdit) {
    const rev = state.reviews.find(r => r.id === reviewId);
    if (!rev) return;

    document.getElementById('rev-id').value = rev.id;
    document.getElementById('rev-id').readOnly = true;
    document.getElementById('rev-name').value = rev.name || '';
    document.getElementById('rev-email').value = rev.email || '';
    document.getElementById('rev-origin').value = rev.origin || '';
    document.getElementById('rev-date').value = rev.date || '';
    document.getElementById('rev-route').value = rev.route || '';
    document.getElementById('rev-vehicle').value = rev.vehicle || 'Toyota Innova Crysta';
    document.getElementById('rev-review').value = rev.review || '';
    document.getElementById('rev-driverReply').value = rev.driverReply || '';
    document.getElementById('rev-helpfulCount').value = rev.helpfulCount || 0;
    document.getElementById('rev-verified').checked = rev.verified !== false;
    
    setStarRating(rev.rating || 5);
  } else {
    DOM.reviewForm.reset();
    document.getElementById('rev-id').readOnly = false;
    document.getElementById('rev-id').value = 'rev_' + Date.now().toString().slice(-4);
    document.getElementById('rev-vehicle').value = 'Toyota Innova Crysta';
    document.getElementById('rev-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('rev-verified').checked = true;
    setStarRating(5);
  }

  DOM.reviewModal.classList.add('active');
}

function setStarRating(rating) {
  document.getElementById('rev-rating').value = rating;
  DOM.revRatingStars.querySelectorAll('button').forEach(btn => {
    const val = Number(btn.dataset.val);
    if (val <= rating) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

async function handleReviewFormSubmit(e) {
  e.preventDefault();
  const isEdit = document.getElementById('review-is-edit').value === 'true';
  const id = document.getElementById('rev-id').value.trim();

  const payload = {
    id,
    name: document.getElementById('rev-name').value.trim(),
    email: document.getElementById('rev-email').value.trim(),
    origin: document.getElementById('rev-origin').value.trim(),
    rating: Number(document.getElementById('rev-rating').value) || 5,
    date: document.getElementById('rev-date').value,
    route: document.getElementById('rev-route').value.trim(),
    vehicle: document.getElementById('rev-vehicle').value.trim(),
    review: document.getElementById('rev-review').value.trim(),
    verified: document.getElementById('rev-verified').checked,
    helpfulCount: Number(document.getElementById('rev-helpfulCount').value) || 0,
    driverReply: document.getElementById('rev-driverReply').value.trim()
  };

  const btnSave = document.getElementById('btn-save-review');
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  try {
    if (isEdit) {
      await apiRequest(`/api/reviews/${id}`, 'PUT', payload);
      showToast('Customer review updated successfully!', 'success');
    } else {
      await apiRequest('/api/reviews', 'POST', payload);
      showToast('New review added successfully!', 'success');
    }

    DOM.reviewModal.classList.remove('active');
    await fetchReviews();
  } catch (err) {
    showToast('Failed to save review: ' + err.message, 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save Review</span>';
  }
}

// ==========================================================================
// GALLERY: Modal, Cloudinary Upload & CRUD
// ==========================================================================
function openGalleryModal(itemId = null) {
  const isEdit = Boolean(itemId);
  document.getElementById('gal-is-edit').value = isEdit ? 'true' : 'false';
  DOM.galleryModalTitle.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> ${isEdit ? 'Edit Gallery Item' : 'Upload & Add Photo / Video'}`;

  resetDropzone();

  if (isEdit) {
    const item = state.gallery.find(g => g.id === itemId);
    if (!item) return;

    const isVid = item.mediaType === 'video' || (item.image && (item.image.includes('/video/upload/') || /\.(mp4|webm|mov|m4v)$/i.test(item.image)));

    document.getElementById('gal-id').value = item.id;
    document.getElementById('gal-id').readOnly = true;
    document.getElementById('gal-title').value = item.title || '';
    document.getElementById('gal-category').value = item.category || (isVid ? 'videos' : 'lakes');
    document.getElementById('gal-location').value = item.location || '';
    document.getElementById('gal-caption').value = item.caption || '';
    document.getElementById('gal-image').value = item.image || '';
    document.getElementById('gal-publicId').value = item.publicId || '';
    if (DOM.galMediaType) {
      DOM.galMediaType.value = isVid ? 'video' : 'image';
    }

    // Show preview of current item
    if (item.image) {
      DOM.dropzoneDefaultView.style.display = 'none';
      DOM.dropzonePreviewView.style.display = 'flex';
      if (isVid && DOM.previewVideoElem) {
        DOM.previewVideoElem.src = item.image;
        DOM.previewVideoElem.style.display = 'block';
        if (DOM.previewImageElem) DOM.previewImageElem.style.display = 'none';
      } else if (DOM.previewImageElem) {
        DOM.previewImageElem.src = item.image;
        DOM.previewImageElem.style.display = 'block';
        if (DOM.previewVideoElem) DOM.previewVideoElem.style.display = 'none';
      }
      DOM.previewFilename.textContent = item.title;
      DOM.uploadProgressFill.style.width = '100%';
      DOM.uploadStatusText.textContent = item.publicId ? 'Hosted on Cloudinary CDN' : 'Current media loaded';
    }
  } else {
    DOM.galleryForm.reset();
    if (DOM.galMediaType) DOM.galMediaType.value = 'image';
    document.getElementById('gal-id').readOnly = false;
    document.getElementById('gal-id').value = 'gal-' + Date.now().toString().slice(-4);
  }

  DOM.galleryModal.classList.add('active');
}

function resetDropzone() {
  DOM.galFileInput.value = '';
  DOM.dropzoneDefaultView.style.display = 'flex';
  DOM.dropzonePreviewView.style.display = 'none';
  if (DOM.previewImageElem) {
    DOM.previewImageElem.src = '';
    DOM.previewImageElem.style.display = 'none';
  }
  if (DOM.previewVideoElem) {
    DOM.previewVideoElem.src = '';
    DOM.previewVideoElem.style.display = 'none';
  }
  DOM.uploadProgressFill.style.width = '0%';
  DOM.uploadStatusText.textContent = 'Uploading to Cloudinary...';
}

// Handle Cloudinary File Upload via Multer / Backend Stream (Images & Videos)
async function uploadFileToCloudinary(file) {
  if (!file) return;

  const isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

  // Immediate local preview
  const localUrl = URL.createObjectURL(file);
  DOM.dropzoneDefaultView.style.display = 'none';
  DOM.dropzonePreviewView.style.display = 'flex';

  if (isVideo && DOM.previewVideoElem) {
    DOM.previewVideoElem.src = localUrl;
    DOM.previewVideoElem.style.display = 'block';
    if (DOM.previewImageElem) DOM.previewImageElem.style.display = 'none';
  } else if (DOM.previewImageElem) {
    DOM.previewImageElem.src = localUrl;
    DOM.previewImageElem.style.display = 'block';
    if (DOM.previewVideoElem) DOM.previewVideoElem.style.display = 'none';
  }

  DOM.previewFilename.textContent = file.name;
  DOM.uploadProgressFill.style.width = '35%';
  DOM.uploadProgressFill.style.background = 'var(--grad-amber)';
  DOM.uploadStatusText.textContent = `Uploading ${isVideo ? 'video' : 'photo'} to Cloudinary...`;

  if (DOM.galMediaType) {
    DOM.galMediaType.value = isVideo ? 'video' : 'image';
  }
  if (isVideo && document.getElementById('gal-category').value === 'lakes') {
    document.getElementById('gal-category').value = 'videos';
  }

  // Prepare FormData
  const formData = new FormData();
  formData.append('file', file);

  try {
    const uploadHeaders = {};
    if (state.auth && state.auth.token) {
      uploadHeaders['Authorization'] = `Bearer ${state.auth.token}`;
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });

    DOM.uploadProgressFill.style.width = '90%';

    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errJson.error || 'Upload error');
    }

    const data = await response.json();
    DOM.uploadProgressFill.style.width = '100%';
    const typeLabel = data.mediaType === 'video' ? 'Video' : 'Photo';
    DOM.uploadStatusText.textContent = data.source === 'cloudinary' 
      ? `✓ ${typeLabel} uploaded to Cloudinary Cloud!` 
      : `✓ ${typeLabel} uploaded locally (configure Cloudinary for cloud CDN)`;

    // Update form fields
    document.getElementById('gal-image').value = data.url;
    if (data.publicId) {
      document.getElementById('gal-publicId').value = data.publicId;
    }
    if (DOM.galMediaType && data.mediaType) {
      DOM.galMediaType.value = data.mediaType;
    }

    // Auto-fill title if empty
    const titleField = document.getElementById('gal-title');
    if (!titleField.value) {
      titleField.value = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    }

    showToast(data.message || `${typeLabel} uploaded successfully!`, 'success');
  } catch (err) {
    DOM.uploadStatusText.textContent = 'Upload failed: ' + err.message;
    DOM.uploadProgressFill.style.background = 'var(--accent-rose)';
    showToast('Upload error: ' + err.message, 'error');
  }
}

async function handleGalleryFormSubmit(e) {
  e.preventDefault();
  const isEdit = document.getElementById('gal-is-edit').value === 'true';
  const id = document.getElementById('gal-id').value.trim();

  const payload = {
    id,
    title: document.getElementById('gal-title').value.trim(),
    category: document.getElementById('gal-category').value,
    caption: document.getElementById('gal-caption').value.trim(),
    location: document.getElementById('gal-location').value.trim(),
    image: document.getElementById('gal-image').value.trim(),
    publicId: document.getElementById('gal-publicId').value.trim(),
    mediaType: DOM.galMediaType ? DOM.galMediaType.value : 'image'
  };

  const btnSave = document.getElementById('btn-save-gallery');
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  try {
    if (isEdit) {
      await apiRequest(`/api/gallery/${id}`, 'PUT', payload);
      showToast('Gallery item updated successfully!', 'success');
    } else {
      await apiRequest('/api/gallery', 'POST', payload);
      showToast('Media added to gallery successfully!', 'success');
    }

    DOM.galleryModal.classList.remove('active');
    await fetchGallery();
  } catch (err) {
    showToast('Failed to save gallery item: ' + err.message, 'error');
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save to Gallery</span>';
  }
}

// ==========================================================================
// DRIVER CONFIG: Save Form
// ==========================================================================
async function handleDriverConfigSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-driver-config');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const payload = {
    driverName: document.getElementById('cfg-driverName').value.trim(),
    brandName: document.getElementById('cfg-brandName').value.trim(),
    tagline: document.getElementById('cfg-tagline').value.trim(),
    profileImage: (DOM.cfgProfileImage ? DOM.cfgProfileImage.value : '').trim(),
    profileImagePublicId: (DOM.cfgProfileImagePublicId ? DOM.cfgProfileImagePublicId.value : '').trim(),
    phone: document.getElementById('cfg-phone').value.trim(),
    whatsappNumber: document.getElementById('cfg-whatsappNumber').value.trim(),
    whatsapp: document.getElementById('cfg-whatsappNumber').value.trim(),
    email: document.getElementById('cfg-email').value.trim(),
    baseLocation: document.getElementById('cfg-baseLocation').value.trim(),
    taxiUnionReg: document.getElementById('cfg-taxiUnionReg').value.trim(),
    primaryVehicle: document.getElementById('cfg-primaryVehicle').value.trim(),
    secondaryVehicle: document.getElementById('cfg-secondaryVehicle').value.trim(),
    drivingExperienceYears: document.getElementById('cfg-drivingExperienceYears').value.trim(),
    safeExpeditionsCount: document.getElementById('cfg-safeExpeditionsCount').value.trim(),
    safetyFeatures: state.driverConfig ? state.driverConfig.safetyFeatures : []
  };

  try {
    const updated = await apiRequest('/api/driver-config', 'PUT', payload);
    state.driverConfig = updated;
    if (DOM.sidebarDriverName) DOM.sidebarDriverName.textContent = updated.driverName;
    if (DOM.sidebarDriverVehicle) DOM.sidebarDriverVehicle.textContent = updated.primaryVehicle;
    updateProfilePictureUI(updated.profileImage, updated.profileImagePublicId);
    showToast('Driver & Chauffeur configuration updated successfully!', 'success');
  } catch (err) {
    showToast('Failed to save config: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>Save Config Changes</span>';
  }
}

// ==========================================================================
// DELETE HANDLING
// ==========================================================================
function triggerDelete(type, id, title) {
  state.pendingDelete = { type, id, title };
  DOM.deleteItemTitle.textContent = `"${title}" (${id})`;
  DOM.deleteModal.classList.add('active');
}

async function confirmDelete() {
  const { type, id } = state.pendingDelete;
  if (!type || !id) return;

  const btn = DOM.btnConfirmDelete;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

  try {
    if (type === 'driver-profile-photo') {
      const res = await apiRequest('/api/driver-config/profile-image', 'DELETE');
      if (DOM.cfgProfileImage) DOM.cfgProfileImage.value = '';
      if (DOM.cfgProfileImagePublicId) DOM.cfgProfileImagePublicId.value = '';
      if (state.driverConfig) {
        state.driverConfig.profileImage = '';
        state.driverConfig.profileImagePublicId = '';
      }
      updateProfilePictureUI('', '');
      showToast('Profile picture deleted successfully!', 'success');
      DOM.deleteModal.classList.remove('active');
      return;
    }

    let endpoint = '';
    if (type === 'tour') endpoint = `/api/tours/${id}`;
    else if (type === 'review') endpoint = `/api/reviews/${id}`;
    else if (type === 'gallery') endpoint = `/api/gallery/${id}`;

    await apiRequest(endpoint, 'DELETE');
    showToast(`Successfully deleted ${type} item!`, 'success');
    DOM.deleteModal.classList.remove('active');

    // Refresh affected section
    if (type === 'tour') await fetchTours();
    else if (type === 'review') await fetchReviews();
    else if (type === 'gallery') await fetchGallery();
  } catch (err) {
    showToast('Deletion failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> <span>Delete Permanently</span>';
    state.pendingDelete = { type: null, id: null, title: '' };
  }
}

// ==========================================================================
// SEED & EXPORT
// ==========================================================================
async function seedDefaultData() {
  if (!confirm('This will seed/reset the database with the sample Ladakh Wayfarers tours, reviews, gallery photos, and driver config. Proceed?')) {
    return;
  }

  const btn = DOM.btnSeedData;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Seeding...';

  try {
    const res = await apiRequest('/api/seed', 'POST');
    showToast(res.message || 'Database seeded successfully!', 'success');
    await loadAllData();
  } catch (err) {
    showToast('Seed failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-seedling"></i> <span>Seed Sample Data</span>';
  }
}

function exportDatabaseJSON() {
  const tokenParam = state.auth && state.auth.token ? `?token=${encodeURIComponent(state.auth.token)}` : '';
  window.location.href = `/api/export${tokenParam}`;
  showToast('Database export downloaded as JSON!', 'info');
}

// ==========================================================================
// TAB SWITCHING
// ==========================================================================
function switchTab(tabName) {
  state.currentTab = tabName;

  DOM.tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  DOM.tabSections.forEach(sec => {
    sec.classList.toggle('active', sec.id === `section-${tabName}`);
  });

  // Update Header text and primary action button
  const titles = {
    'tours': {
      title: 'Tour Packages Management',
      sub: 'Create, update, and manage high-altitude itineraries for Ladakh Wayfarers',
      btnText: 'Add Tour'
    },
    'reviews': {
      title: 'Customer Reviews Management',
      sub: 'Monitor, verify, reply to, and publish traveler testimonials',
      btnText: 'Add Review'
    },
    'gallery': {
      title: 'Photo Gallery & Cloudinary Storage',
      sub: 'Upload and organize high-resolution landscape and vehicle media',
      btnText: 'Upload Photo'
    },
    'driver-config': {
      title: 'Driver & Chauffeur Profile',
      sub: 'Manage Stanzin Jigmet\'s contact details, union registration, and safety equipment',
      btnText: null
    },
    'system-status': {
      title: 'Database & Cloudinary Connection',
      sub: 'Configure MongoDB Atlas and Cloudinary CDN credentials for production',
      btnText: null
    }
  };

  const meta = titles[tabName] || titles['tours'];
  DOM.currentTabTitle.textContent = meta.title;
  DOM.currentTabSubtitle.textContent = meta.sub;

  if (meta.btnText) {
    DOM.btnAddItem.style.display = 'inline-flex';
    DOM.btnAddItemText.textContent = meta.btnText;
  } else {
    DOM.btnAddItem.style.display = 'none';
  }

  // Close sidebar on mobile
  DOM.sidebar.classList.remove('mobile-open');
  if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.classList.remove('active');
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
function toggleAccordion(btn) {
  btn.classList.toggle('open');
  const content = btn.nextElementSibling;
  content.classList.toggle('open');
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  showToast('Image URL copied to clipboard!', 'info', 2000);
}

// ==========================================================================
// EVENT LISTENERS INITIALIZATION
// ==========================================================================
function initEvents() {
  // Tab Navigation Click
  DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Mobile Sidebar Toggle
  DOM.sidebarToggleBtn.addEventListener('click', () => {
    const isOpen = DOM.sidebar.classList.toggle('mobile-open');
    if (DOM.sidebarBackdrop) {
      DOM.sidebarBackdrop.classList.toggle('active', isOpen);
    }
  });

  // Backdrop click closes sidebar
  if (DOM.sidebarBackdrop) {
    DOM.sidebarBackdrop.addEventListener('click', () => {
      DOM.sidebar.classList.remove('mobile-open');
      DOM.sidebarBackdrop.classList.remove('active');
    });
  }

  // Header Add Item Button
  DOM.btnAddItem.addEventListener('click', () => {
    if (state.currentTab === 'tours') openTourModal();
    else if (state.currentTab === 'reviews') openReviewModal();
    else if (state.currentTab === 'gallery') openGalleryModal();
  });

  DOM.btnTriggerGalleryModal.addEventListener('click', () => openGalleryModal());
  DOM.btnSeedData.addEventListener('click', seedDefaultData);
  DOM.btnExportJson.addEventListener('click', exportDatabaseJSON);

  // Search and Filters
  DOM.toursSearchInput.addEventListener('input', renderTours);
  DOM.toursDifficultyFilter.addEventListener('change', renderTours);
  DOM.toursCategoryFilter.addEventListener('change', renderTours);

  DOM.reviewsSearchInput.addEventListener('input', renderReviews);
  DOM.reviewsRatingFilter.addEventListener('change', renderReviews);
  DOM.reviewsVerifiedFilter.addEventListener('change', renderReviews);

  DOM.gallerySearchInput.addEventListener('input', renderGallery);
  DOM.galleryCategoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-btn');
    if (!pill) return;
    DOM.galleryCategoryPills.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    renderGallery();
  });

  // Tour Form
  DOM.btnAddHighlight.addEventListener('click', () => addHighlightRow(''));
  DOM.btnAddItineraryDay.addEventListener('click', () => addItineraryRow('', '', ''));
  DOM.tourForm.addEventListener('submit', handleTourFormSubmit);

  // Review Form & Star Rating Selector
  DOM.revRatingStars.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    setStarRating(Number(btn.dataset.val));
  });
  DOM.reviewForm.addEventListener('submit', handleReviewFormSubmit);

  // Gallery Form & Dropzone
  DOM.galleryDropzone.addEventListener('click', (e) => {
    if (e.target.closest('#btn-clear-preview')) return;
    DOM.galFileInput.click();
  });

  DOM.galFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFileToCloudinary(e.target.files[0]);
    }
  });

  DOM.galleryDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.galleryDropzone.classList.add('dragover');
  });

  DOM.galleryDropzone.addEventListener('dragleave', () => {
    DOM.galleryDropzone.classList.remove('dragover');
  });

  DOM.galleryDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.galleryDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFileToCloudinary(e.dataTransfer.files[0]);
    }
  });

  DOM.btnClearPreview.addEventListener('click', (e) => {
    e.stopPropagation();
    resetDropzone();
    document.getElementById('gal-image').value = '';
    document.getElementById('gal-publicId').value = '';
  });

  DOM.galleryForm.addEventListener('submit', handleGalleryFormSubmit);

  // Driver Config Form
  DOM.btnAddSafetyFeature.addEventListener('click', addSafetyFeature);
  DOM.newSafetyFeatureInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSafetyFeature();
    }
  });
  DOM.driverConfigForm.addEventListener('submit', handleDriverConfigSubmit);

  // Driver Profile Picture Event Listeners
  if (DOM.btnUploadDriverPhoto) {
    DOM.btnUploadDriverPhoto.addEventListener('click', () => {
      if (DOM.driverProfileFileInput) DOM.driverProfileFileInput.click();
    });
  }
  if (DOM.driverAvatarWrapper) {
    DOM.driverAvatarWrapper.addEventListener('click', () => {
      if (DOM.driverProfileFileInput) DOM.driverProfileFileInput.click();
    });
    DOM.driverAvatarWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (DOM.driverProfileFileInput) DOM.driverProfileFileInput.click();
      }
    });
  }
  if (DOM.driverProfileFileInput) {
    DOM.driverProfileFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleDriverProfileUpload(file);
    });
  }
  if (DOM.btnToggleProfileUrl) {
    DOM.btnToggleProfileUrl.addEventListener('click', () => {
      if (DOM.profileUrlPanel) {
        const isHidden = DOM.profileUrlPanel.style.display === 'none';
        DOM.profileUrlPanel.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && DOM.cfgProfileImage) DOM.cfgProfileImage.focus();
      }
    });
  }
  if (DOM.btnApplyProfileUrl) {
    DOM.btnApplyProfileUrl.addEventListener('click', applyProfileImageUrl);
  }
  if (DOM.cfgProfileImage) {
    DOM.cfgProfileImage.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyProfileImageUrl();
      }
    });
  }
  if (DOM.btnDeleteDriverPhoto) {
    DOM.btnDeleteDriverPhoto.addEventListener('click', requestDeleteDriverProfilePhoto);
  }
  setupProfilePhotoDragDrop();

  // Delete Confirmation
  DOM.btnConfirmDelete.addEventListener('click', confirmDelete);

  // Authentication UI Listeners
  if (DOM.adminLoginForm) {
    DOM.adminLoginForm.addEventListener('submit', handleLoginSubmit);
  }
  if (DOM.btnToggleLoginPwd) {
    DOM.btnToggleLoginPwd.addEventListener('click', toggleLoginPasswordVisibility);
  }
  if (DOM.sidebarBtnLogout) {
    DOM.sidebarBtnLogout.addEventListener('click', handleLogout);
  }
  if (DOM.topbarBtnLogout) {
    DOM.topbarBtnLogout.addEventListener('click', handleLogout);
  }
  if (DOM.sidebarBtnChangePwd) {
    DOM.sidebarBtnChangePwd.addEventListener('click', openChangePasswordModal);
  }
  if (DOM.topbarBtnChangePwd) {
    DOM.topbarBtnChangePwd.addEventListener('click', openChangePasswordModal);
  }
  if (DOM.changePasswordForm) {
    DOM.changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
  }

  // Modal Close buttons & overlay click
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('active');
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

// Global functions attached to window for inline onclicks
window.openTourModal = openTourModal;
window.openReviewModal = openReviewModal;
window.openGalleryModal = openGalleryModal;
window.triggerDelete = triggerDelete;
window.toggleAccordion = toggleAccordion;
window.incrementHelpful = incrementHelpful;
window.copyToClipboard = copyToClipboard;
window.removeSafetyFeature = removeSafetyFeature;
window.fetchTours = fetchTours;
window.fetchReviews = fetchReviews;
window.fetchGallery = fetchGallery;
window.handleLogout = handleLogout;
window.openChangePasswordModal = openChangePasswordModal;

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  verifyExistingSession();
});
