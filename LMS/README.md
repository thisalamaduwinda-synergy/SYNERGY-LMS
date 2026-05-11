# Synergy Pharmaceuticals LMS - Learning Management System

A modern, full-stack Learning Management System designed specifically for **Synergy Pharmaceuticals Corporation** to manage employee training, Standard Operating Procedures (SOPs), and assessments.

## 🚀 Project Status

**Current Phase:** Implementation (60% Complete)

- ✅ Project structure created
- ✅ Database schema designed
- ✅ Admin dashboard UI (matches Figma design)
- ✅ FastAPI backend scaffolding
- ✅ React frontend setup
- 🚀 Ready for local testing

## 📋 Features

### Core Functionality

- 👥 **User Management** - Admin, Manager, Employee roles
- 📚 **SOP Management** - Upload, organize, and version control SOPs
- 📝 **Quiz & Assessments** - Create quizzes with multiple question types
- ✅ **Progress Tracking** - Monitor employee completion rates
- 🎓 **Certificate Generation** - Auto-generate certificates on completion
- 📊 **Admin Dashboard** - Real-time analytics and insights
- 📱 **Mobile Responsive** - Works on all devices
- 🔐 **Secure Authentication** - JWT-based authentication

## 🛠️ Tech Stack

| Layer                | Technology              | Version |
| -------------------- | ----------------------- | ------- |
| **Frontend**         | React.js                | 18.2.0  |
| **Backend**          | FastAPI (Python)        | 0.104.1 |
| **Database**         | PostgreSQL              | 15      |
| **Charting**         | Recharts                | 2.5.0   |
| **Icons**            | Lucide React            | 0.263.1 |
| **Containerization** | Docker & Docker Compose | Latest  |
| **Styling**          | Custom CSS (Responsive) | -       |

## 📁 Project Structure

```
LMS/
├── .azure/                      # Azure deployment configs
│   ├── deployment-plan.md       # This deployment plan
│   └── database-schema.md       # Database design
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── styles/              # CSS files
│   │   ├── App.jsx              # Main app component
│   │   └── index.js             # Entry point
│   ├── public/                  # Static files
│   ├── Dockerfile               # Docker image for frontend
│   ├── nginx.conf               # Nginx configuration
│   └── package.json             # Dependencies
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routes/              # API endpoints
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Database setup
│   │   └── schemas.py           # Pydantic schemas
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Example environment variables
│   └── Dockerfile               # Docker image for backend
└── docker-compose.yml           # Docker Compose configuration
```

## 🏃 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Git

### Option 1: Docker Compose (Recommended - Easiest)

```bash
# Navigate to project directory
cd d:\LMS

# Start all services
docker-compose up --build

# Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs (Swagger UI)
- Database: localhost:5432
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env

# Update DATABASE_URL in .env to point to your PostgreSQL

# Run the server
python main.py

# API will be available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Application will open at http://localhost:3000
```

## 🗄️ Database Setup

The database schema includes 11 tables:

- **Users** - Employee accounts and roles
- **Courses** - Training courses
- **SOPs** - Standard Operating Procedures
- **Quizzes** - Assessment tests
- **Questions** - Quiz questions
- **QuestionOptions** - Multiple choice answers
- **QuizAttempts** - Quiz submissions and scores
- **Enrollments** - Course enrollments
- **Progress** - Completion tracking
- **Certificates** - Issued certificates
- **CourseSOPs** - Many-to-many relationships

See [database-schema.md](./.azure/database-schema.md) for detailed schema.

## 📊 Dashboard Features

The admin dashboard displays:

1. **Key Metrics**
   - Total Students: 1,247
   - Active Courses: 38
   - Completion Rate: 87.5%
   - Certifications Issued: 892

2. **Charts**
   - Monthly Enrollments (Bar Chart)
   - Completion Rate Trend (Line Chart)

3. **Popular Courses Table**
   - Course title, student count, completion %, status

## 🔌 API Endpoints

### Users

```
POST   /api/v1/users/register       - Register new user
GET    /api/v1/users/               - List all users
GET    /api/v1/users/{user_id}      - Get user details
PUT    /api/v1/users/{user_id}      - Update user
DELETE /api/v1/users/{user_id}      - Delete user
```

### Courses

```
POST   /api/v1/courses              - Create course
GET    /api/v1/courses              - List courses
GET    /api/v1/courses/{course_id}  - Get course details
PUT    /api/v1/courses/{course_id}  - Update course
DELETE /api/v1/courses/{course_id}  - Delete course
```

### Quizzes

```
POST   /api/v1/quizzes              - Create quiz
GET    /api/v1/quizzes/{quiz_id}    - Get quiz details
GET    /api/v1/quizzes/course/{course_id} - List quizzes for course
POST   /api/v1/quizzes/{quiz_id}/submit   - Submit quiz
```

### Dashboard

```
GET    /api/v1/dashboard/stats              - Dashboard statistics
GET    /api/v1/dashboard/monthly-enrollments - Monthly enrollment data
GET    /api/v1/dashboard/popular-courses     - Popular courses list
```

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/synergy_lms

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Azure
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=

# Email
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@synergy.com
```

## 🚢 Docker Compose Services

The `docker-compose.yml` sets up:

1. **PostgreSQL** - Database server (port 5432)
2. **Backend** - FastAPI server (port 8000)
3. **Frontend** - React app via Nginx (port 3000)

## 📱 Dashboard UI

The dashboard includes a beautiful, responsive interface with:

- **Sidebar Navigation** - Easy access to all sections
- **Top Navigation Bar** - Search, notifications, user profile
- **Statistics Cards** - Key metrics with trend indicators
- **Interactive Charts** - Monthly enrollments and completion rates
- **Courses Table** - Popular courses with completion progress
- **Mobile Responsive** - Fully responsive design

## 🔄 Next Steps

### 1. Local Testing

```bash
docker-compose up
# Test at http://localhost:3000
```

### 2. Azure Setup (When Ready)

```bash
# Provide Azure subscription details
# Select deployment region
```

### 3. Complete Implementation

- [ ] Authentication pages (Login/Register)
- [ ] SOP content viewer
- [ ] Quiz interface
- [ ] Certificate generation
- [ ] Email notifications

### 4. Deploy to Azure

- [ ] Create Bicep templates
- [ ] Setup Azure resources
- [ ] Configure CI/CD pipeline
- [ ] Deploy backend and frontend

## 📚 Documentation

- [Deployment Plan](./.azure/deployment-plan.md) - Project roadmap
- [Database Schema](./.azure/database-schema.md) - Database design
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🤝 Team & Support

**Company:** Synergy Pharmaceutical Corporation Pvt Ltd  
**Project Lead:** [Your Name]  
**Status:** In Active Development

## 📝 License

This project is proprietary to Synergy Pharmaceutical Corporation.

## 🎯 Key Milestones

- ✅ Project Setup (Complete)
- ✅ Dashboard UI (Complete)
- ✅ Backend Scaffolding (Complete)
- 🚀 Local Testing (Next)
- ⏳ Azure Deployment (Pending credentials)
- ⏳ Production Launch (4-6 weeks)

---

**Last Updated:** 2026-04-28  
**Next Review:** 2026-05-05
