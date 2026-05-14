# Setup & Getting Started Guide

## Welcome to Synergy LMS! 👋

This guide will help you get the Learning Management System up and running on your machine.

## Prerequisites

Before you begin, make sure you have installed:

### Required

- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com)

### Optional (for local development)

- **Node.js 18+** - [Download](https://nodejs.org)
- **Python 3.11+** - [Download](https://www.python.org)
- **PostgreSQL 15** - [Download](https://www.postgresql.org)

## 🚀 Quick Start (Recommended)

### Step 1: Navigate to Project

```bash
cd d:\LMS
```

### Step 2: Start with Docker Compose

```bash
docker-compose up --build
```

This will:

- Create PostgreSQL database
- Start FastAPI backend
- Build and start React frontend
- Everything will be ready in ~2-3 minutes

### Step 3: Access the Application

Open your browser and visit:

| Service  | URL                        | Purpose                       |
| -------- | -------------------------- | ----------------------------- |
| Frontend | http://localhost:3000      | LMS Dashboard                 |
| Backend  | http://localhost:8000      | API Server                    |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Database | localhost:5432             | PostgreSQL (connection only)  |

### Step 4: Login

**Default Credentials** (you can modify in database):

- Username: `admin`
- Password: `admin123`

## 📚 Local Development (Advanced)

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Update DATABASE_URL if using local PostgreSQL
# Default: postgresql://postgres:password@localhost:5432/synergy_lms

# Run the server
python main.py

# Server starts at http://localhost:8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Opens at http://localhost:3000
```

## 🗄️ Database

### With Docker Compose

- Automatically created and configured
- PostgreSQL 15 runs in container
- Data stored in `postgres_data` volume

### Local PostgreSQL

```bash
# Create database
createdb synergy_lms

# Verify connection
psql -U postgres -d synergy_lms -c "SELECT 1"
```

## 📝 First Steps

1. **Explore the Dashboard**
   - Check the statistics cards
   - View the charts
   - Check the courses table

2. **Review the Backend API**
   - Visit http://localhost:8000/docs
   - Try the endpoints
   - Test data submission

3. **Check the Database**
   - Login to PostgreSQL
   - Review the schema
   - Check the data

## 🔧 Useful Commands

### Docker Compose

```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose up --build

# Restart specific service
docker-compose restart backend
```

### Backend

```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Run tests
pytest

# Format code
black app/

# Lint code
flake8 app/
```

### Frontend

```bash
# Build for production
npm run build

# Run tests
npm test

# Format code
npm run format
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000 or 8000
lsof -i :3000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Recreate containers
docker-compose down -v
docker-compose up --build
```

### Frontend Not Loading

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear browser cache or use incognito mode
```

## 📖 Project Documentation

- **[README.md](../README.md)** - Project overview
- **[Deployment Plan](./.azure/deployment-plan.md)** - Project roadmap
- **[Database Schema](./.azure/database-schema.md)** - Database design

## 🚢 Deployment to Azure (Later)

When ready to deploy to Azure:

1. Provide Azure subscription details
2. Select deployment region
3. We'll create Bicep templates
4. Deploy infrastructure
5. Deploy application

## ✨ Features Ready to Use

✅ Admin Dashboard with statistics  
✅ User management API  
✅ Course management API  
✅ Quiz system API  
✅ Progress tracking  
✅ Responsive design  
✅ Database schema

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs: `docker-compose logs -f`
3. Check API docs: http://localhost:8000/docs
4. Review README.md for more information

## 📅 Next Steps

1. ✅ Run locally with Docker Compose
2. Test the dashboard
3. Add sample data
4. Customize as needed
5. Prepare for Azure deployment

---

**Happy coding! 🎉**

For questions or issues, please refer to the README.md or check the deployment plan.
