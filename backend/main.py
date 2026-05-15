from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to sys.path to allow imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Create FastAPI instance
app = FastAPI(
    title="Synergy LMS API",
    description="Learning Management System for Synergy Pharmaceuticals",
    version="1.0.0",
)


@app.on_event("startup")
def startup_event():
    from init_db import init_db
    init_db()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.synergy.com"]
)

# Import routes
from app.routes import auth, notifications, quizzes, sops, dashboard, courses, users, enrollments, certificates

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(sops.router)
app.include_router(quizzes.router)
app.include_router(enrollments.router)
app.include_router(certificates.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Synergy Pharmaceuticals LMS API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Synergy LMS"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
