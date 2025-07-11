-- Migration script to add comprehensive RLS policies
-- Run this migration to fix 500 errors on Supabase

-- First, drop existing basic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Moderators can read all users" ON users;
DROP POLICY IF EXISTS "Everyone can read published courses" ON courses;
DROP POLICY IF EXISTS "Moderators can manage courses" ON courses;

-- Enable RLS on categories table (was missing)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Moderators and admins can read all users
CREATE POLICY "Moderators can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Service role can manage users (for triggers)
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- CATEGORIES TABLE POLICIES
-- Everyone can read categories
CREATE POLICY "Everyone can read categories" ON categories
    FOR SELECT USING (true);

-- Only moderators and admins can manage categories
CREATE POLICY "Moderators can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- COURSES TABLE POLICIES
-- Everyone can read published courses
CREATE POLICY "Everyone can read published courses" ON courses
    FOR SELECT USING (is_published = true);

-- Moderators and admins can read all courses
CREATE POLICY "Moderators can read all courses" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Moderators and admins can manage courses
CREATE POLICY "Moderators can manage courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- COURSE REGISTRATIONS POLICIES
-- Users can read their own registrations
CREATE POLICY "Users can read own registrations" ON course_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own registrations
CREATE POLICY "Users can create own registrations" ON course_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations" ON course_registrations
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can read registrations for courses (for counting enrollments)
CREATE POLICY "Anyone can read course registrations" ON course_registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_registrations.course_id 
            AND courses.is_published = true
        )
    );

-- Moderators can manage all registrations
CREATE POLICY "Moderators can manage registrations" ON course_registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- COURSE MODULES POLICIES
-- Users can read modules for courses they're registered to
CREATE POLICY "Users can read enrolled course modules" ON course_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_registrations 
            WHERE course_registrations.course_id = course_modules.course_id 
            AND course_registrations.user_id = auth.uid()
        )
    );

-- Everyone can read modules for published courses
CREATE POLICY "Everyone can read published course modules" ON course_modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_modules.course_id 
            AND courses.is_published = true
        )
    );

-- Moderators can manage modules
CREATE POLICY "Moderators can manage modules" ON course_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- MODULE CONTENT POLICIES
-- Similar to course modules
CREATE POLICY "Users can read enrolled module content" ON module_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_modules 
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE course_modules.id = module_content.module_id 
            AND course_registrations.user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can read published module content" ON module_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM course_modules 
            JOIN courses ON courses.id = course_modules.course_id
            WHERE course_modules.id = module_content.module_id 
            AND courses.is_published = true
        )
    );

CREATE POLICY "Moderators can manage module content" ON module_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- MODULE PROGRESS POLICIES
-- Users can manage their own progress
CREATE POLICY "Users can manage own progress" ON module_progress
    FOR ALL USING (auth.uid() = user_id);

-- Moderators can view all progress
CREATE POLICY "Moderators can view progress" ON module_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- QUIZZES POLICIES
-- Users can read quizzes from enrolled courses
CREATE POLICY "Users can read enrolled quizzes" ON quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM module_content 
            JOIN course_modules ON course_modules.id = module_content.module_id
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE module_content.quiz_id = quizzes.id 
            AND course_registrations.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- QUIZ QUESTIONS POLICIES
-- Same access as quizzes
CREATE POLICY "Users can read quiz questions" ON quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes 
            JOIN module_content ON module_content.quiz_id = quizzes.id
            JOIN course_modules ON course_modules.id = module_content.module_id
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE quizzes.id = quiz_questions.quiz_id 
            AND course_registrations.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- QUESTION CHOICES POLICIES
-- Same access as quiz questions
CREATE POLICY "Users can read question choices" ON question_choices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_questions 
            JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
            JOIN module_content ON module_content.quiz_id = quizzes.id
            JOIN course_modules ON course_modules.id = module_content.module_id
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE quiz_questions.id = question_choices.question_id 
            AND course_registrations.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- QUIZ ATTEMPTS POLICIES
-- Users can manage their own attempts
CREATE POLICY "Users can manage own attempts" ON quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

-- Moderators can manage all attempts
CREATE POLICY "Moderators can manage attempts" ON quiz_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- QUIZ ANSWERS POLICIES
-- Users can manage their own answers
CREATE POLICY "Users can manage own answers" ON quiz_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts 
            WHERE quiz_attempts.id = quiz_answers.attempt_id 
            AND quiz_attempts.user_id = auth.uid()
        )
    );

-- Moderators can manage all answers
CREATE POLICY "Moderators can manage answers" ON quiz_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- COURSE REVIEWS POLICIES
-- Users can manage their own reviews
CREATE POLICY "Users can manage own reviews" ON course_reviews
    FOR ALL USING (auth.uid() = user_id);

-- Everyone can read reviews for published courses
CREATE POLICY "Everyone can read published course reviews" ON course_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_reviews.course_id 
            AND courses.is_published = true
        )
    );

-- NOTIFICATIONS POLICIES
-- Users can manage their own notifications
CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- USER GOALS POLICIES
-- Users can manage their own goals
CREATE POLICY "Users can manage own goals" ON user_goals
    FOR ALL USING (auth.uid() = user_id);