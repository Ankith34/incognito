<<<<<<< HEAD
# TaskConnect - Household Help Platform

A modern, Swiggy-style web application that connects people needing short-term household help with workers nearby. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

### Frontend Features
- **Clean, Swiggy-style UI** with minimalistic design
- **Location-based job browsing** - see tasks near you immediately
- **Real-time search and filtering** by category, distance, and price
- **Mobile-first responsive design** with floating action buttons
- **User authentication** with Customer/Worker role selection
- **Job details page** with apply functionality
- **WhatsApp integration** for direct communication

### Backend Features
- **RESTful API** with Express.js
- **MongoDB database** with Mongoose ODM
- **JWT authentication** with role-based access control
- **Location-based queries** using MongoDB geospatial features
- **Real-time messaging** with Socket.io
- **Email notifications** for job applications and updates
- **File upload support** for job images and documents
- **Rate limiting and security** with Helmet.js
- **Input validation** with express-validator

## 🛠 Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Font Awesome icons
- Responsive design with CSS Grid and Flexbox

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time features
- Nodemailer for email notifications
- Multer for file uploads
- Helmet.js for security

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/taskconnect

   # JWT Secret (change this in production)
   JWT_SECRET=your_super_secret_jwt_key_here

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Google Maps API (optional)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start MongoDB**
   - If using local MongoDB: `mongod`
   - If using MongoDB Atlas: Update the `MONGODB_URI` in `.env`

5. **Start the backend server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`

6. **Serve the frontend**
   You can use any static file server. For example:
   ```bash
   # Using Python
   python -m http.server 3000

   # Using Node.js http-server
   npx http-server -p 3000

   # Using Live Server (VS Code extension)
   # Right-click on index.html and select "Open with Live Server"
   ```

7. **Open the application**
   Navigate to `http://localhost:3000` in your browser

## 🎯 Usage

### For Customers
1. **Browse Tasks** - View nearby tasks immediately without login
2. **Register** - Sign up as a Customer to post tasks
3. **Post Tasks** - Create detailed job postings with location and payment
4. **Review Applications** - See worker profiles and accept applications
5. **Rate Workers** - Provide feedback after task completion

### For Workers
1. **Browse Opportunities** - See available tasks in your area
2. **Register** - Sign up as a Worker with skills and experience
3. **Apply for Tasks** - Submit applications with custom messages
4. **Complete Work** - Update job status and get paid
5. **Build Reputation** - Receive ratings and build your profile

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Jobs
- `GET /api/jobs` - Get jobs with location/filters
- `GET /api/jobs/:id` - Get single job details
- `POST /api/jobs` - Create new job (Customer only)
- `PUT /api/jobs/:id` - Update job
- `POST /api/jobs/:id/apply` - Apply for job (Worker only)
- `POST /api/jobs/:id/accept/:applicationId` - Accept application

### Users
- `GET /api/users/profile/:id` - Get user profile
- `GET /api/users/workers/nearby` - Find nearby workers
- `POST /api/users/:id/rate` - Rate a user
- `GET /api/users/search` - Search users

### Messages
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/:jobId/:userId` - Get conversation messages
- `POST /api/messages` - Send message

## 🌟 Key Features Explained

### Location-Based Matching
- Uses MongoDB's geospatial queries for efficient location-based searches
- Calculates distances using the Haversine formula
- Supports radius-based filtering

### Real-Time Features
- Socket.io integration for instant messaging
- Real-time job status updates
- Live notifications for new applications

### Security
- JWT-based authentication with role-based access control
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration for secure cross-origin requests

### Mobile-First Design
- Responsive design that works on all devices
- Touch-friendly interface with proper button sizes
- Floating action buttons for mobile users
- Optimized loading and performance

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables in your hosting platform
2. Ensure MongoDB connection string is updated
3. Set `NODE_ENV=production`
4. Deploy the backend code

### Frontend Deployment (Netlify/Vercel/GitHub Pages)
1. Update the `API_BASE_URL` in `script.js` to your backend URL
2. Deploy the frontend files
3. Configure redirects for SPA routing if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎉 Acknowledgments

- Inspired by Swiggy's clean and intuitive UI design
- Built with modern web technologies and best practices
- Designed for scalability and maintainability

---

**Happy Connecting! 🤝**
=======
# incognito
>>>>>>> 5737ec2b0ca048d608288c2a8aa10443b2fbd7f6
