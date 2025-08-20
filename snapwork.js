// SnapWork JavaScript - Gig Marketplace with Profile System

// API Configuration
// Use deployed backend URL if available, otherwise fallback to localhost
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://your-app.onrender.com/api'; // <-- Replace with your actual Render URL

// Global state
let currentGigs = [];
let filteredGigs = [];
let currentPage = 1;
let gigsPerPage = 9;
let isLoggedIn = false;
let currentUser = null;
let allUsers = [];
let currentView = 'gigs';
let currentCoords = null;
let currentFilters = {
    category: 'all',
    search: '',
    sort: 'newest'
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    detectLocation();
    setupEventListeners();
    loadGigsFromAPI();
    loadUsers();
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
    
    // Sort functionality (guard if control is absent)
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
    
    // Load more button
    document.getElementById('load-more-btn').addEventListener('click', loadMoreGigs);
    
    // User type selector
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', handleUserTypeSelection);
    });
    
    // Form submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Add event listener for post gig form when it exists
    const postGigForm = document.getElementById('post-gig-form');
    if (postGigForm) {
        postGigForm.addEventListener('submit', handlePostGig);
    }
    
    // Add event listener for review form when it exists
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', handleScroll);

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            document.body.classList.toggle('mobile-nav-open');
            mobileMenuToggle.classList.toggle('open');
        });

        // Close mobile menu when resizing to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                document.body.classList.remove('mobile-nav-open');
                mobileMenuToggle.classList.remove('open');
            }
        });

        // Close mobile menu when clicking outside header
        document.addEventListener('click', function(e) {
            const header = document.getElementById('header');
            if (
                document.body.classList.contains('mobile-nav-open') &&
                header && !header.contains(e.target)
            ) {
                document.body.classList.remove('mobile-nav-open');
                mobileMenuToggle.classList.remove('open');
            }
        });
    }

    // View switcher
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Initialize default view
    switchView('gigs');
}

// Location detection
function detectLocation() {
    const locationElement = document.getElementById('current-location');
    if (!navigator.geolocation) {
        if (locationElement) locationElement.textContent = 'Location unavailable';
        return;
    }
    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if (locationElement) locationElement.textContent = 'Location detected';
            // reload data to include distance
            loadGigsFromAPI();
            loadUsers();
        },
        function() {
            if (locationElement) locationElement.textContent = 'Bangalore, Karnataka';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
}

// Change location
function changeLocation() {
    const newLocation = prompt('Enter your location:');
    if (newLocation) {
        document.getElementById('current-location').textContent = newLocation;
        showSuccessMessage('Location updated successfully!');
    }
}

// Load gigs from API
async function loadGigsFromAPI() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.category !== 'all') {
            params.append('category', currentFilters.category);
        }
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        if (currentFilters.sort) {
            params.append('sort', currentFilters.sort);
        }
        if (currentCoords) {
            params.append('lat', currentCoords.lat);
            params.append('lng', currentCoords.lng);
            params.append('radiusKm', 25);
        }
        
        const response = await fetch(`${API_BASE_URL}/gigs?${params.toString()}`);
        const data = await response.json();
        
        currentGigs = data.gigs;
        filteredGigs = data.gigs;
        
        renderGigs();
        updateGigsCount();
        
        // Hide loading state
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('gigs-grid').style.display = 'grid';
        
    } catch (error) {
        console.error('Error loading gigs:', error);
        document.getElementById('loading-state').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                <p>Failed to load gigs. Please make sure the server is running.</p>
                <button class="btn-primary" onclick="loadGigsFromAPI()">Try Again</button>
            </div>
        `;
    }
}

// Load users/workers
async function loadUsers() {
    try {
        const params = new URLSearchParams();
        if (currentCoords) {
            params.append('lat', currentCoords.lat);
            params.append('lng', currentCoords.lng);
            params.append('radiusKm', 25);
        }
        const response = await fetch(`${API_BASE_URL}/workers?${params.toString()}`);
        const data = await response.json();
        allUsers = data.users || [];
        renderWorkers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Render gigs in 3-column grid
function renderGigs() {
    const gigsGrid = document.getElementById('gigs-grid');
    const startIndex = 0;
    const endIndex = currentPage * gigsPerPage;
    const gigsToShow = filteredGigs.slice(startIndex, endIndex);
    
    if (gigsToShow.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        gigsGrid.style.display = 'none';
        document.getElementById('load-more-container').style.display = 'none';
        return;
    }
    
    document.getElementById('no-results').style.display = 'none';
    gigsGrid.style.display = 'grid';
    
    gigsGrid.innerHTML = gigsToShow.map(gig => `
        <div class="gig-card fade-in" onclick="viewGigDetails(${gig.id})">
            <div class="gig-header">
                <span class="gig-category">${gig.category}</span>
                ${gig.urgent ? '<span class="gig-urgent">Urgent</span>' : ''}
            </div>
            <h3 class="gig-title">${gig.title}</h3>
            <p class="gig-description">${gig.description}</p>
            <div class="gig-meta">
                <div class="gig-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${gig.location}</span>
                    <span class="gig-distance">(${gig.distance})</span>
                </div>
                <div class="gig-payment">${gig.payment}</div>
                <div class="gig-time">${gig.timePosted}</div>
            </div>
            <div class="gig-actions">
                <button class="btn-primary" onclick="event.stopPropagation(); handleGigAction(${gig.id}, 'want')">
                    <i class="fas fa-briefcase"></i>
                    I want this
                </button>
                <button class="btn-secondary" onclick="event.stopPropagation(); viewGigDetails(${gig.id})">
                    View More
                </button>
            </div>
        </div>
    `).join('');
    
    // Show/hide load more button
    const loadMoreContainer = document.getElementById('load-more-container');
    if (endIndex >= filteredGigs.length) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }
}

// Render workers grid
function renderWorkers() {
    const grid = document.getElementById('workers-grid');
    const countEl = document.getElementById('workers-count');
    const loadingEl = document.getElementById('workers-loading-state');
    const noResultsEl = document.getElementById('workers-no-results');
    if (!grid || !countEl) return;

    const workers = allUsers.filter(u => u.userType === 'worker');
    countEl.textContent = `${workers.length} worker${workers.length !== 1 ? 's' : ''} available`;

    if (workers.length === 0) {
        grid.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'none';
        if (noResultsEl) noResultsEl.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (loadingEl) loadingEl.style.display = 'none';
    if (noResultsEl) noResultsEl.style.display = 'none';

    grid.innerHTML = workers.map(user => `
        <div class="worker-card fade-in">
            <div class="worker-header">
                <div class="worker-avatar">${user.name?.charAt(0).toUpperCase() || '?'}</div>
                <div>
                    <div class="worker-name">${user.name || 'Unnamed User'}</div>
                    <div class="worker-meta">${user.location || 'Location not provided'}</div>
                </div>
            </div>
            <div class="worker-meta">${user.distance ? '📍 ' + user.distance : ''}${user.phone ? (user.distance ? ' • ' : '') + '📞 ' + user.phone : ''}</div>
            <div class="worker-actions">
                <button class="btn-secondary" onclick="showProfile(${user.id})">View Profile</button>
                <button class="btn-primary" onclick="contactWorker(${user.id})">Contact</button>
            </div>
        </div>
    `).join('');
}

function contactWorker(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    showSuccessMessage(`Contact ${user.name}${user.phone ? ' at ' + user.phone : ''}`);
}

// Switch between Gigs and Workers views
function switchView(view) {
    currentView = view;
    const gigsMain = document.querySelector('main.main-content');
    const workersMain = document.getElementById('workers-content');
    const filters = document.getElementById('gigs-filters');
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.view-btn[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (view === 'gigs') {
        if (filters) filters.style.display = 'block';
        if (gigsMain) gigsMain.style.display = 'block';
        if (workersMain) workersMain.style.display = 'none';
    } else {
        if (filters) filters.style.display = 'none';
        if (gigsMain) gigsMain.style.display = 'none';
        if (workersMain) workersMain.style.display = 'block';
    }
}

// Handle search
function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    applyFilters();
}

// Handle category filter
function handleCategoryFilter(e) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    currentFilters.category = e.target.dataset.category;
    applyFilters();
}

// Handle sort
function handleSort(e) {
    currentFilters.sort = e.target.value;
    applyFilters();
}

// Apply filters
function applyFilters() {
    loadGigsFromAPI();
}

// Load more gigs
function loadMoreGigs() {
    currentPage++;
    renderGigs();
}

// Update gigs count
function updateGigsCount() {
    const count = filteredGigs.length;
    const gigsCount = document.getElementById('gigs-count');
    gigsCount.textContent = `${count} gig${count !== 1 ? 's' : ''} available`;
}

// Clear filters
function clearFilters() {
    currentFilters = {
        category: 'all',
        search: '',
        sort: 'newest'
    };
    
    document.getElementById('search-input').value = '';
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = 'newest';
    }
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const allBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allBtn) {
        allBtn.classList.add('active');
    }
    
    applyFilters();
}

// View gig details
function viewGigDetails(gigId) {
    const gig = currentGigs.find(g => g.id === gigId);
    if (!gig) return;
    
    const modal = document.getElementById('gig-details-modal');
    const content = document.getElementById('gig-details-content');
    
    content.innerHTML = `
        <div class="gig-details-header">
            <div class="gig-details-meta">
                <span class="gig-category">${gig.category}</span>
                ${gig.urgent ? '<span class="gig-urgent">Urgent</span>' : ''}
            </div>
            <h2 class="gig-details-title">${gig.title}</h2>
            <div class="gig-details-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${gig.location} (${gig.distance})</span>
            </div>
        </div>
        
        <div class="gig-details-body">
            <div class="gig-details-description">
                <h3>Description</h3>
                <p>${gig.description}</p>
            </div>
            
            <div class="gig-details-payment">
                <h3>Payment</h3>
                <div class="payment-amount">${gig.payment}</div>
                <small>Payment type: ${gig.paymentType}</small>
            </div>
            
            <div class="gig-details-time">
                <h3>Posted</h3>
                <p>${gig.timePosted}</p>
            </div>
            
            ${gig.postedByName ? `
                <div class="gig-details-poster">
                    <h3>Posted by</h3>
                    <div class="poster-info">
                        <span class="poster-name">${gig.postedByName}</span>
                        ${gig.phone ? `<span class="poster-phone">📞 ${gig.phone}</span>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="gig-details-actions">
            <button class="btn-primary btn-large" onclick="handleGigAction(${gig.id}, 'want')">
                <i class="fas fa-briefcase"></i>
                I want this Gig
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Handle gig actions (want this gig)
async function handleGigAction(gigId, action) {
    if (!isLoggedIn) {
        closeModal('gig-details-modal');
        showRegister('worker');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/gigs/${gigId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: currentUser.id,
                message: `I want to do this gig!`
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage(`Successfully applied for this gig!`);
            closeModal('gig-details-modal');
        } else {
            showErrorMessage(data.error || 'Action failed');
        }
    } catch (error) {
        console.error('Gig action error:', error);
        showErrorMessage('Action failed. Please check your connection.');
    }
}

// Show profile modal
async function showProfile(userId = null) {
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${targetUserId}/profile`);
        const data = await response.json();
        
        if (response.ok) {
            renderProfileModal(data.user, data.gigs || []);
        } else {
            showErrorMessage('Failed to load profile');
        }
    } catch (error) {
        console.error('Profile error:', error);
        showErrorMessage('Failed to load profile');
    }
}

// Render profile modal
function renderProfileModal(user, gigs) {
    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('profile-content');
    
    const completedGigs = gigs.filter(g => g.status === 'completed').length;
    const totalGigs = gigs.length;
    const averageRating = user.averageRating || 0;
    const totalReviews = user.totalReviews || 0;

    // For customers, show only their posted gigs and remove review-related stats
    const isCustomer = String(user.userType).toLowerCase() === 'customer';
    const postedGigs = gigs.filter(g => g.postedBy === user.id);

    const statsMarkup = isCustomer
        ? ''
        : `
            <div class="profile-stats">
                <div class="stat-item">
                    <span class="stat-number">${completedGigs}</span>
                    <span class="stat-label">Gigs Done</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${averageRating.toFixed(1)}</span>
                    <span class="stat-label">Rating</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalReviews}</span>
                    <span class="stat-label">Reviews</span>
                </div>
            </div>
        `;
    
    content.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                ${user.name.charAt(0).toUpperCase()}
            </div>
            <h2 class="profile-name">${user.name}</h2>
            <p class="profile-type">${user.userType}</p>
            ${statsMarkup}
        </div>
        
        <div class="profile-body">
            <div class="profile-section">
                <h3>Contact Information</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                <p><strong>Location:</strong> ${user.location || 'Not provided'}</p>
            </div>
            
            ${isCustomer && postedGigs.length > 0 ? `
                <div class="profile-section">
                    <h3>Posted Gigs</h3>
                    <div class="gig-list">
                        ${postedGigs.slice(0, 8).map(gig => `
                            <div class="gig-item">
                                <div class="gig-info">
                                    <h4>${gig.title}</h4>
                                    <p>${gig.category} • ${gig.payment}</p>
                                </div>
                                <span class="gig-status status-${gig.status}">${gig.status || 'open'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : (!isCustomer && gigs.length > 0 ? `
                <div class="profile-section">
                    <h3>Recent Gigs</h3>
                    <div class="gig-list">
                        ${gigs.slice(0, 5).map(gig => `
                            <div class="gig-item">
                                <div class="gig-info">
                                    <h4>${gig.title}</h4>
                                    <p>${gig.category} • ${gig.payment}</p>
                                </div>
                                <span class="gig-status status-${gig.status}">${gig.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '')}
        </div>
    `;
    
    modal.style.display = 'block';
}

// Show modals
function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

function showRegister(userType = null) {
    const modal = document.getElementById('register-modal');
    modal.style.display = 'block';
    
    if (userType) {
        document.querySelectorAll('.user-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${userType}"]`).classList.add('active');
    }
}

function showPostGig() {
    if (!isLoggedIn) {
        showRegister('customer');
        return;
    }
    
    if (currentUser.userType !== 'customer') {
        showErrorMessage('Only customers can post gigs');
        return;
    }
    
    document.getElementById('post-gig-modal').style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Switch between login/register
function switchToRegister() {
    closeModal('login-modal');
    showRegister();
}

function switchToLogin() {
    closeModal('register-modal');
    showLogin();
}

// Handle user type selection
function handleUserTypeSelection(e) {
    const selectedButton = e.currentTarget || (e.target && e.target.closest && e.target.closest('.user-type-btn'));
    if (!selectedButton) return;
    document.querySelectorAll('.user-type-btn').forEach(btn => btn.classList.remove('active'));
    selectedButton.classList.add('active');
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            isLoggedIn = true;
            currentUser = data.user;
            
            updateHeaderForLoggedInUser();
            closeModal('login-modal');
            showSuccessMessage('Successfully logged in!');
        } else {
            showErrorMessage(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorMessage('Login failed. Please check your connection.');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userType = document.querySelector('.user-type-btn.active').dataset.type;
    
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        userType: userType,
        location: formData.get('location')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            isLoggedIn = true;
            currentUser = data.user;
            
            updateHeaderForLoggedInUser();
            closeModal('register-modal');
            showSuccessMessage('Account created successfully!');
        } else {
            showErrorMessage(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage('Registration failed. Please check your connection.');
    }
}

// Handle post gig form submission
async function handlePostGig(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const gigData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        payment: formData.get('payment'),
        paymentType: formData.get('paymentType'),
        urgent: formData.get('urgent') === 'on',
        postedBy: currentUser.id,
        location: currentUser.location,
        phone: currentUser.phone
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/gigs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gigData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage('Gig posted successfully!');
            closeModal('post-gig-modal');
            loadGigsFromAPI();
            e.target.reset();
        } else {
            showErrorMessage(data.error || 'Failed to post gig');
        }
    } catch (error) {
        console.error('Post gig error:', error);
        showErrorMessage('Failed to post gig. Please check your connection.');
    }
}

// Handle review submission
async function handleReviewSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const reviewData = {
        gigId: formData.get('gigId'),
        revieweeId: formData.get('revieweeId'),
        reviewerId: currentUser.id,
        rating: parseInt(formData.get('rating')),
        comment: formData.get('comment')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage('Review submitted successfully!');
            closeModal('review-modal');
            e.target.reset();
        } else {
            showErrorMessage(data.error || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Review submission error:', error);
        showErrorMessage('Failed to submit review. Please check your connection.');
    }
}

// Update header for logged in user
function updateHeaderForLoggedInUser() {
    const headerActions = document.querySelector('.header-actions');
    headerActions.innerHTML = `
        <button class="profile-btn" onclick="showProfile()" title="View Profile">
            ${currentUser.name.charAt(0).toUpperCase()}
        </button>
        <span class="user-greeting">Hi, ${currentUser.name}</span>
        <button class="btn-text" onclick="logout()">Logout</button>
    `;
    
    // Update user info display in post gig modal
    const locationDisplay = document.getElementById('user-location-display');
    const phoneDisplay = document.getElementById('user-phone-display');
    
    if (locationDisplay) {
        locationDisplay.textContent = currentUser.location || 'Not provided';
    }
    if (phoneDisplay) {
        phoneDisplay.textContent = currentUser.phone || 'Not provided';
    }
}

// Logout
function logout() {
    isLoggedIn = false;
    currentUser = null;
    
    const headerActions = document.querySelector('.header-actions');
    headerActions.innerHTML = `
        <button class="btn-text" onclick="showLogin()">Log in</button>
        <button class="btn-primary" onclick="showRegister()">Sign up</button>
    `;
    
    showSuccessMessage('Logged out successfully!');
}

// Show success message
function showSuccessMessage(message) {
    const successMsg = document.getElementById('success-message');
    document.getElementById('success-text').textContent = message;
    successMsg.style.display = 'flex';
    successMsg.style.background = 'var(--primary-color)';
    
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const successMsg = document.getElementById('success-message');
    document.getElementById('success-text').textContent = message;
    successMsg.style.display = 'flex';
    successMsg.style.background = '#e74c3c';
    
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 4000);
}

// Handle scroll effects
function handleScroll() {
    const header = document.getElementById('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for gig details modal
const gigDetailsStyles = `
    .gig-details-header {
        padding: 40px 40px 20px;
        border-bottom: 1px solid var(--gray-200);
    }
    
    .gig-details-meta {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
    }
    
    .gig-details-title {
        margin-bottom: 12px;
        color: var(--secondary-color);
    }
    
    .gig-details-location {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--gray-600);
    }
    
    .gig-details-location i {
        color: var(--primary-color);
    }
    
    .gig-details-body {
        padding: 30px 40px;
        display: grid;
        gap: 30px;
    }
    
    .gig-details-body h3 {
        margin-bottom: 12px;
        color: var(--secondary-color);
        font-size: 1.1rem;
    }
    
    .gig-details-description p {
        line-height: 1.7;
        color: var(--gray-600);
    }
    
    .payment-amount {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 4px;
    }
    
    .gig-details-poster {
        background: var(--gray-100);
        padding: 20px;
        border-radius: var(--border-radius-md);
    }
    
    .poster-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .poster-name {
        font-weight: 600;
        color: var(--secondary-color);
    }
    
    .poster-phone {
        color: var(--gray-600);
        font-size: 0.9rem;
    }
    
    .gig-details-actions {
        padding: 20px 40px 40px;
        display: flex;
        gap: 16px;
        border-top: 1px solid var(--gray-200);
    }
    
    .gig-details-actions .btn-large {
        flex: 1;
    }
    
    .user-greeting {
        color: var(--gray-600);
        font-weight: 500;
    }
    
    @media (max-width: 768px) {
        .gig-details-header,
        .gig-details-body,
        .gig-details-actions {
            padding-left: 24px;
            padding-right: 24px;
        }
        
        .gig-details-actions {
            flex-direction: column;
            gap: 12px;
        }
    }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = gigDetailsStyles;
document.head.appendChild(styleSheet);