database:
type: PostgreSQL
tables: - users (id, email, username, full_name, password_hash, role, is_active, created_at, updated_at) - courses (id, title, description, duration_hours, is_active, created_at, updated_at) - sops (id, title, description, content, file_url, version, created_at, updated_at) - course_sops (course_id, sop_id) # Many-to-Many - quizzes (id, title, description, course_id, passing_score, max_attempts, time_limit_minutes) - questions (id, quiz_id, question_text, question_type, correct_answer, points, order) - question_options (id, question_id, option_text, is_correct, order) - quiz_attempts (id, user_id, quiz_id, score, passed, started_at, completed_at) - enrollments (id, user_id, course_id, enrolled_at, completed_at, status) - progress (id, user_id, course_id, completion_percentage, last_accessed_at) - certificates (id, user_id, course_id, issued_at, certificate_number, valid_until)

api_endpoints:
users: - POST /api/v1/users/register - Register new user - GET /api/v1/users/ - List all users - GET /api/v1/users/{user_id} - Get user details - PUT /api/v1/users/{user_id} - Update user - DELETE /api/v1/users/{user_id} - Delete user

courses: - POST /api/v1/courses - Create course - GET /api/v1/courses - List courses - GET /api/v1/courses/{course_id} - Get course details - PUT /api/v1/courses/{course_id} - Update course - DELETE /api/v1/courses/{course_id} - Delete course

quizzes: - POST /api/v1/quizzes - Create quiz - GET /api/v1/quizzes/{quiz_id} - Get quiz - GET /api/v1/quizzes/course/{course_id} - List quizzes for course - POST /api/v1/quizzes/{quiz_id}/submit - Submit quiz

dashboard: - GET /api/v1/dashboard/stats - Get dashboard statistics - GET /api/v1/dashboard/monthly-enrollments - Monthly enrollment data - GET /api/v1/dashboard/popular-courses - Popular courses
