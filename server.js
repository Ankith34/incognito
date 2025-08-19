
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// PostgreSQL connection (Render)
const DB_URL = process.env.DATABASE_URL || 'postgresql://database_iqau_user:TR9o6dC9eyjkboHCpIqv...'; // Replace with your full connection string
const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Geo helpers
function toRad(value) {
    return (value * Math.PI) / 180;
}

function haversineKm(a, b) {
    const R = 6371; // km
    const dLat = toRad((b.lat || 0) - (a.lat || 0));
    const dLng = toRad((b.lng || 0) - (a.lng || 0));
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos(toRad(a.lat || 0)) * Math.cos(toRad(b.lat || 0)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)));
    return R * c;
}

function formatDistance(km) {
    if (km == null || Number.isNaN(km)) return null;
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// File paths for data storage
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const GIGS_FILE = path.join(__dirname, 'data', 'gigs.json');
const REVIEWS_FILE = path.join(__dirname, 'data', 'reviews.json');

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        
        // Initialize users file if it doesn't exist
        try {
            await fs.access(USERS_FILE);
        } catch {
            await fs.writeFile(USERS_FILE, JSON.stringify([]));
        }
        
        // Initialize reviews file if it doesn't exist
        try {
            await fs.access(REVIEWS_FILE);
        } catch {
            await fs.writeFile(REVIEWS_FILE, JSON.stringify([]));
        }
        
        // Initialize gigs file if it doesn't exist
        try {
            await fs.access(GIGS_FILE);
        } catch {
            const initialGigs = [
                {
                    id: 1,
                    title: "Pool Cleaning Service",
                    description: "Need someone to clean swimming pool, remove debris, and check chemical levels. No experience required, will provide training.",
                    category: "cleaning",
                    location: "Koramangala, Bangalore",
                    payment: "₹500",
                    paymentType: "fixed",
                    timePosted: "2 hours ago",
                    urgent: false,
                    distance: "0.5 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    title: "Pet Walking - Golden Retriever",
                    description: "Need someone to walk my friendly Golden Retriever twice daily. Morning 7 AM and evening 6 PM. Dog loves people!",
                    category: "pet-care",
                    location: "Indiranagar, Bangalore",
                    payment: "₹300/day",
                    paymentType: "daily",
                    timePosted: "1 hour ago",
                    urgent: false,
                    distance: "1.2 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    title: "House Deep Cleaning",
                    description: "Need thorough cleaning of 2BHK apartment including mopping, dusting, bathroom cleaning. All supplies provided.",
                    category: "cleaning",
                    location: "HSR Layout, Bangalore",
                    payment: "₹800",
                    paymentType: "fixed",
                    timePosted: "3 hours ago",
                    urgent: true,
                    distance: "0.8 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 4,
                    title: "Box Shifting & Moving Help",
                    description: "Moving to new apartment, need 2 people to help pack and move boxes. Heavy lifting involved but manageable.",
                    category: "moving",
                    location: "BTM Layout, Bangalore",
                    payment: "₹600/person",
                    paymentType: "fixed",
                    timePosted: "30 minutes ago",
                    urgent: true,
                    distance: "0.3 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 5,
                    title: "Car Washing Service",
                    description: "Need someone to wash my sedan car thoroughly - exterior wash, interior cleaning, and tire cleaning.",
                    category: "car-care",
                    location: "Jayanagar, Bangalore",
                    payment: "₹200",
                    paymentType: "fixed",
                    timePosted: "6 hours ago",
                    urgent: false,
                    distance: "1.5 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 6,
                    title: "Garden Watering & Plant Care",
                    description: "Need someone to water plants and basic garden maintenance. Perfect for someone who loves plants!",
                    category: "gardening",
                    location: "Whitefield, Bangalore",
                    payment: "₹250/day",
                    paymentType: "daily",
                    timePosted: "4 hours ago",
                    urgent: false,
                    distance: "2.1 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 7,
                    title: "Grocery Shopping & Delivery",
                    description: "Need someone to buy groceries from nearby supermarket and deliver. Shopping list will be provided.",
                    category: "delivery",
                    location: "Electronic City, Bangalore",
                    payment: "₹150",
                    paymentType: "fixed",
                    timePosted: "1 hour ago",
                    urgent: false,
                    distance: "3.2 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 8,
                    title: "Bike Washing & Cleaning",
                    description: "Need someone to wash and clean my motorcycle. Simple job, all cleaning materials provided.",
                    category: "car-care",
                    location: "Marathahalli, Bangalore",
                    payment: "₹100",
                    paymentType: "fixed",
                    timePosted: "5 hours ago",
                    urgent: false,
                    distance: "2.8 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 9,
                    title: "Office Cleaning Service",
                    description: "Small office space needs daily cleaning - sweeping, mopping, trash removal. Easy work, flexible timing.",
                    category: "cleaning",
                    location: "Koramangala, Bangalore",
                    payment: "₹400/day",
                    paymentType: "daily",
                    timePosted: "8 hours ago",
                    urgent: false,
                    distance: "0.6 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 10,
                    title: "Dog Bathing Service",
                    description: "Need someone to give my Labrador a bath. Dog is very friendly and loves water. All supplies provided.",
                    category: "pet-care",
                    location: "HSR Layout, Bangalore",
                    payment: "₹300",
                    paymentType: "fixed",
                    timePosted: "12 hours ago",
                    urgent: false,
                    distance: "0.9 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 11,
                    title: "Balcony Cleaning",
                    description: "Need thorough cleaning of apartment balcony including floor mopping and plant area cleaning.",
                    category: "cleaning",
                    location: "Bellandur, Bangalore",
                    payment: "₹200",
                    paymentType: "fixed",
                    timePosted: "1 day ago",
                    urgent: false,
                    distance: "4.1 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 12,
                    title: "Furniture Moving Help",
                    description: "Need help moving furniture within the house - sofa, dining table, and wardrobe. 2-3 hours work.",
                    category: "moving",
                    location: "Indiranagar, Bangalore",
                    payment: "₹500",
                    paymentType: "fixed",
                    timePosted: "2 days ago",
                    urgent: false,
                    distance: "1.8 km",
                    postedBy: "system",
                    createdAt: new Date().toISOString()
                }
            ];
            await fs.writeFile(GIGS_FILE, JSON.stringify(initialGigs, null, 2));
        }
    } catch (error) {
        console.error('Error setting up data directory:', error);
    }
}

// Helper functions for file operations
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function readGigs() {
    try {
        const data = await fs.readFile(GIGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeGigs(gigs) {
    await fs.writeFile(GIGS_FILE, JSON.stringify(gigs, null, 2));
}

async function readReviews() {
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeReviews(reviews) {
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

// Routes

// Get all gigs
app.get('/api/gigs', async (req, res) => {
    try {
        const gigs = await readGigs();
        const { category, search, sort, lat, lng, radiusKm } = req.query;
        
        let filteredGigs = gigs;
        
        // Filter by category
        if (category && category !== 'all') {
            filteredGigs = filteredGigs.filter(gig => gig.category === category);
        }
        
        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            filteredGigs = filteredGigs.filter(gig => 
                gig.title.toLowerCase().includes(searchLower) ||
                gig.description.toLowerCase().includes(searchLower) ||
                gig.category.toLowerCase().includes(searchLower)
            );
        }
        
        // Compute distance if requester provided lat/lng
        if (lat && lng) {
            const here = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const maxRadius = parseFloat(radiusKm || '25');
            filteredGigs = filteredGigs
                .map(g => {
                    const hasCoords = typeof g.lat === 'number' && typeof g.lng === 'number';
                    const dKm = hasCoords ? haversineKm(here, { lat: g.lat, lng: g.lng }) : null;
                    return { ...g, distanceKm: dKm, distance: dKm != null ? formatDistance(dKm) : g.distance || null };
                })
                .filter(g => g.distanceKm == null || g.distanceKm <= maxRadius);
        }

        // Sort gigs
        if (sort === 'price-low') {
            filteredGigs.sort((a, b) => parseFloat(a.payment.replace(/[^\d]/g, '')) - parseFloat(b.payment.replace(/[^\d]/g, '')));
        } else if (sort === 'price-high') {
            filteredGigs.sort((a, b) => parseFloat(b.payment.replace(/[^\d]/g, '')) - parseFloat(a.payment.replace(/[^\d]/g, '')));
        } else if (sort === 'distance' && (lat && lng)) {
            filteredGigs.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        } else {
            filteredGigs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        res.json({ gigs: filteredGigs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch gigs' });
    }
});

// Get single gig
app.get('/api/gigs/:id', async (req, res) => {
    try {
        const gigs = await readGigs();
        const gig = gigs.find(g => g.id === parseInt(req.params.id));
        
        if (!gig) {
            return res.status(404).json({ error: 'Gig not found' });
        }
        
        res.json({ gig });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch gig' });
    }
});

// Register user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, phone, password, userType, location, lat, lng } = req.body;
        
        // Validation
        if (!name || !email || !password || !userType) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const users = await readUsers();
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email,
            phone: phone || '',
            password, // In production, this should be hashed
            userType,
            location: location || '',
            lat: typeof lat === 'number' ? lat : null,
            lng: typeof lng === 'number' ? lng : null,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await writeUsers(users);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
            message: 'User registered successfully',
            user: userWithoutPassword 
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const users = await readUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
            message: 'Login successful',
            user: userWithoutPassword 
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Post new gig
app.post('/api/gigs', async (req, res) => {
    try {
        const { title, description, category, payment, paymentType, urgent, postedBy, location, phone, lat, lng } = req.body;
        
        if (!title || !description || !category || !payment || !postedBy) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Get user data to auto-populate location and phone
        const users = await readUsers();
        const user = users.find(u => u.id === postedBy);
        
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        const gigs = await readGigs();
        
        const newGig = {
            id: Math.max(...gigs.map(g => g.id), 0) + 1,
            title,
            description,
            category,
            location: location || user.location || 'Bangalore, Karnataka',
            phone: phone || user.phone || '',
            payment,
            paymentType: paymentType || 'fixed',
            timePosted: 'Just now',
            urgent: urgent || false,
            // distance computed dynamically from requester position
            postedBy: postedBy,
            postedByName: user.name,
            status: 'open', // open, assigned, completed
            lat: typeof lat === 'number' ? lat : (typeof user.lat === 'number' ? user.lat : null),
            lng: typeof lng === 'number' ? lng : (typeof user.lng === 'number' ? user.lng : null),
            createdAt: new Date().toISOString()
        };
        
        gigs.unshift(newGig); // Add to beginning
        await writeGigs(gigs);
        
        res.status(201).json({ 
            message: 'Gig posted successfully',
            gig: newGig 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to post gig' });
    }
});

// Apply for gig
app.post('/api/gigs/:id/apply', async (req, res) => {
    try {
        const gigId = parseInt(req.params.id);
        const { userId, message } = req.body;
        
        // In a real app, you'd store applications in a separate file/database
        // For now, we'll just return success
        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to apply for gig' });
    }
});

// Hire for gig
app.post('/api/gigs/:id/hire', async (req, res) => {
    try {
        const gigId = parseInt(req.params.id);
        const { userId } = req.body;
        
        // In a real app, you'd update the gig status and notify the poster
        res.json({ message: 'Hire request submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit hire request' });
    }
});


// Get all users (DB first, fallback to file)
app.get('/api/users', async (req, res) => {
    try {
        let users = [];
        try {
            const dbRes = await pool.query('SELECT * FROM users');
            users = dbRes.rows;
        } catch (dbErr) {
            users = await readUsers();
        }
        // Remove passwords from response
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json({ users: usersWithoutPasswords });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Workers list with optional distance filtering
app.get('/api/workers', async (req, res) => {
    try {
        const { lat, lng, radiusKm, search } = req.query;
        const users = await readUsers();
        let workers = users.filter(u => u.userType === 'worker');

        if (search) {
            const s = String(search).toLowerCase();
            workers = workers.filter(u =>
                (u.name || '').toLowerCase().includes(s) ||
                (u.location || '').toLowerCase().includes(s)
            );
        }

        if (lat && lng) {
            const here = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const maxRadius = parseFloat(radiusKm || '25');
            workers = workers
                .map(u => {
                    const hasCoords = typeof u.lat === 'number' && typeof u.lng === 'number';
                    const dKm = hasCoords ? haversineKm(here, { lat: u.lat, lng: u.lng }) : null;
                    return { ...u, distanceKm: dKm, distance: dKm != null ? formatDistance(dKm) : null };
                })
                .filter(u => u.distanceKm == null || u.distanceKm <= maxRadius)
                .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        }

        workers = workers.map(({ password, ...user }) => user);
        res.json({ users: workers });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workers' });
    }
});
// Get user profile with gigs
app.get('/api/users/:id/profile', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const users = await readUsers();
        const gigs = await readGigs();
        
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's gigs (posted or applied to)
        const userGigs = gigs.filter(g => 
            g.postedBy === userId || 
            (g.applications && g.applications.some(app => app.worker === userId))
        );
        
        // Remove password from user data
        const { password, ...userWithoutPassword } = user;
        
        res.json({ 
            user: userWithoutPassword,
            gigs: userGigs
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});


// Post review (DB first, fallback to file)
app.post('/api/reviews', async (req, res) => {
    const { gigId, revieweeId, reviewerId, rating, comment } = req.body;
    if (!gigId || !revieweeId || !reviewerId || !rating) {
        return res.status(400).json({ error: 'All required fields must be provided' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    try {
        // Try DB
        try {
            const userRes = await pool.query('SELECT * FROM users WHERE id = $1 OR id = $2', [reviewerId, revieweeId]);
            const reviewer = userRes.rows.find(u => u.id === reviewerId);
            const reviewee = userRes.rows.find(u => u.id === revieweeId);
            if (!reviewer || !reviewee) {
                return res.status(400).json({ error: 'User not found' });
            }
            // Check for existing review
            const existingRes = await pool.query('SELECT * FROM reviews WHERE gig_id = $1 AND reviewer_id = $2 AND reviewee_id = $3', [gigId, reviewerId, revieweeId]);
            if (existingRes.rows.length > 0) {
                return res.status(400).json({ error: 'You have already reviewed this person for this gig' });
            }
            // Insert review
            const insertRes = await pool.query(
                'INSERT INTO reviews (gig_id, reviewee_id, reviewer_id, reviewee_name, reviewer_name, rating, comment, createdat) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
                [gigId, revieweeId, reviewerId, reviewee.name, reviewer.name, rating, comment || '']
            );
            res.status(201).json({ message: 'Review submitted successfully', review: insertRes.rows[0] });
        } catch (dbErr) {
            // Fallback to file
            const reviews = await readReviews();
            const users = await readUsers();
            const existingReview = reviews.find(r => r.gigId === gigId && r.reviewerId === reviewerId && r.revieweeId === revieweeId);
            if (existingReview) {
                return res.status(400).json({ error: 'You have already reviewed this person for this gig' });
            }
            const reviewer = users.find(u => u.id === reviewerId);
            const reviewee = users.find(u => u.id === revieweeId);
            if (!reviewer || !reviewee) {
                return res.status(400).json({ error: 'User not found' });
            }
            const newReview = {
                id: Math.max(...reviews.map(r => r.id), 0) + 1,
                gigId,
                revieweeId,
                reviewerId,
                revieweeName: reviewee.name,
                reviewerName: reviewer.name,
                rating,
                comment: comment || '',
                createdAt: new Date().toISOString()
            };
            reviews.push(newReview);
            await writeReviews(reviews);
            res.status(201).json({ message: 'Review submitted successfully', review: newReview });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Get user reviews
app.get('/api/users/:id/reviews', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const reviews = await readReviews();
        
        const userReviews = reviews.filter(r => r.revieweeId === userId);
        
        res.json({ reviews: userReviews });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Get completed gigs for user (for review purposes)
app.get('/api/users/:id/completed-gigs', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const gigs = await readGigs();
        const reviews = await readReviews();
        
        // Find gigs where user was involved and status is completed
        const completedGigs = gigs.filter(g => 
            g.status === 'completed' && 
            (g.postedBy === userId || g.assignedTo === userId)
        );
        
        // Add review status to each gig
        const gigsWithReviewStatus = completedGigs.map(gig => {
            const hasReviewed = reviews.some(r => 
                r.gigId === gig.id && r.reviewerId === userId
            );
            
            return {
                ...gig,
                hasReviewed,
                canReview: !hasReviewed
            };
        });
        
        res.json({ gigs: gigsWithReviewStatus });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch completed gigs' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize and start server
async function startServer() {
    await ensureDataDirectory();
    app.listen(PORT, () => {
        console.log(`🚀 Gig Marketplace Server running on http://localhost:${PORT}`);
        console.log(`📁 Data stored in: ${path.join(__dirname, 'data')}`);
        console.log(`👥 Users file: ${USERS_FILE}`);
        console.log(`💼 Gigs file: ${GIGS_FILE}`);
    });
}

startServer();