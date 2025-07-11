-- Fix quiz creation RLS policy error
-- Add missing INSERT policies for tables that moderators/admins need to create

-- QUIZZES table - allow moderators to create quizzes
CREATE POLICY "Moderators can create quizzes" ON quizzes
    FOR INSERT WITH CHECK (is_admin_or_moderator());

-- QUIZ QUESTIONS table - allow moderators to create questions
CREATE POLICY "Moderators can create quiz questions" ON quiz_questions
    FOR INSERT WITH CHECK (is_admin_or_moderator());

-- QUESTION CHOICES table - allow moderators to create choices
CREATE POLICY "Moderators can create question choices" ON question_choices
    FOR INSERT WITH CHECK (is_admin_or_moderator());

-- COURSES table - allow moderators to create courses
CREATE POLICY "Moderators can create courses" ON courses
    FOR INSERT WITH CHECK (is_admin_or_moderator());

-- COURSE MODULES table - allow moderators to create modules
CREATE POLICY "Moderators can create course modules" ON course_modules
    FOR INSERT WITH CHECK (is_admin_or_moderator());

-- MODULE CONTENT table - allow moderators to create module content
CREATE POLICY "Moderators can create module content" ON module_content
    FOR INSERT WITH CHECK (is_admin_or_moderator());

-- CATEGORIES table - allow moderators to create categories
CREATE POLICY "Moderators can create categories" ON categories
    FOR INSERT WITH CHECK (is_admin_or_moderator());