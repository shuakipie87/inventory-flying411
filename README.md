# Flying411 Inventory Management System

A comprehensive full-stack inventory management platform for sellers to list products, manage inventory, and integrate with the Flying411.com marketplace.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication with role-based access control
- **Listing Management** - Create, edit, and manage product listings with images
- **Image Upload** - Multiple image support with automatic thumbnail generation
- **Admin Approval Workflow** - Admin review and approval system for listings
- **Seller Dashboard** - Analytics and insights for sellers
- **Flying411 Integration** - Sync listings with Flying411.com marketplace
- **Docker Deployment** - Containerized deployment with Docker Compose

## 📋 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Multer & Sharp for image processing

### DevOps
- Docker & Docker Compose
- Nginx for frontend serving
- PostgreSQL container

## 🏗️ Project Structure

```
inventory-flying411/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   └── uploads/            # File uploads
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API services
│   │   └── App.tsx
│   └── public/
├── docker-compose.yml      # Docker orchestration
└── PLAN.md                 # Detailed implementation plan
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 15 (if running locally without Docker)

### Local Development

#### 1. Clone the repository
```bash
git clone <repository-url>
cd inventory-flying411
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register      # Register new user
POST /api/auth/login         # Login user
POST /api/auth/logout        # Logout user
GET  /api/auth/me            # Get current user
```

### Listing Endpoints
```
GET    /api/listings         # Get all approved listings
GET    /api/listings/:id     # Get listing by ID
POST   /api/listings         # Create listing (auth required)
PUT    /api/listings/:id     # Update listing (auth required)
DELETE /api/listings/:id     # Delete listing (auth required)
POST   /api/listings/:id/images           # Upload images
PATCH  /api/listings/:id/submit           # Submit for approval
```

### Dashboard Endpoints
```
GET /api/dashboard/stats     # Get user statistics
GET /api/dashboard/listings  # Get user listings
```

### Admin Endpoints
```
GET  /api/admin/listings/pending          # Get pending listings
POST /api/admin/listings/:id/approve      # Approve listing
POST /api/admin/listings/:id/reject       # Reject listing
GET  /api/admin/users                     # Get all users
GET  /api/admin/stats                     # Get admin statistics
```

## 🔐 Default Credentials (Development)

After seeding the database:

**Admin Account:**
- Email: admin@flying411.com
- Password: admin123

**Test User:**
- Email: user@flying411.com
- Password: user123

⚠️ **Important:** Change these credentials in production!

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📦 Database Schema

### Users
- User authentication and profile information
- Role-based access (USER, ADMIN)

### Listings
- Product listings with full details
- Status tracking (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SOLD)
- Price, category, condition, quantity

### ListingImages
- Multiple images per listing
- Primary image selection
- Automatic thumbnail generation

### Reviews
- Admin review history
- Approval/rejection tracking
- Comments and feedback

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://flying411:flying411pass@localhost:5432/flying411_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif
FLYING411_API_URL=https://api.flying411.com
FLYING411_API_KEY=your-api-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Flying411 Inventory
VITE_MAX_FILE_SIZE=5242880
```

## 🛠️ Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

## 📝 Project Status

Current implementation status: **65% Complete**

✅ **Completed:**
- Project structure and setup
- Backend API scaffolding
- Frontend React application
- Database schema and migrations
- Authentication system
- Listing CRUD operations
- Admin review APIs
- Dashboard APIs
- Docker configuration

🚧 **In Progress:**
- Image upload implementation
- Admin panel UI
- Dashboard UI enhancements
- Testing suite

❌ **Not Started:**
- Flying411 API integration
- Comprehensive testing
- Production deployment
- Advanced analytics

See [PLAN.md](./PLAN.md) for detailed implementation roadmap.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Bug Reports & Feature Requests

Please use the GitHub Issues tracker to report bugs or request features.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@flying411.com

---

**Built with ❤️ for the Flying411 community**
# inventory-flying
