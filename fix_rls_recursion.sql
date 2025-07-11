-- Fix infinite recursion in users table RLS policies
-- Run this migration to fix the "infinite recursion detected in policy for relation users" error

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Moderators can read all users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Create new policies without recursion
-- Users can read their own data (simple auth.uid() check)
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (simple auth.uid() check)
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service role can manage users (for triggers and system operations)
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can insert their own record (for signup process)
CREATE POLICY "Users can insert own record" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- For moderator/admin access, we'll use a different approach
-- Create a security definer function to check roles
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users au
        JOIN public.users u ON au.id = u.id
        WHERE au.id = auth.uid() 
        AND u.role IN ('admin', 'moderator')
    );
$$;

-- Now create the moderator policy using the function
CREATE POLICY "Moderators can read all users" ON users
    FOR SELECT USING (is_admin_or_moderator());

-- Allow moderators to update user roles
CREATE POLICY "Moderators can update users" ON users
    FOR UPDATE USING (is_admin_or_moderator());

-- Update the courses policies to also use the function
DROP POLICY IF EXISTS "Moderators can read all courses" ON courses;
DROP POLICY IF EXISTS "Moderators can manage courses" ON courses;

CREATE POLICY "Moderators can read all courses" ON courses
    FOR SELECT USING (is_admin_or_moderator() OR is_published = true);

CREATE POLICY "Moderators can manage courses" ON courses
    FOR ALL USING (is_admin_or_moderator());

-- Update other tables that had similar recursion issues
DROP POLICY IF EXISTS "Moderators can manage categories" ON categories;
CREATE POLICY "Moderators can manage categories" ON categories
    FOR ALL USING (is_admin_or_moderator());

-- Fix other problematic policies
DROP POLICY IF EXISTS "Moderators can manage modules" ON course_modules;
CREATE POLICY "Moderators can manage modules" ON course_modules
    FOR ALL USING (is_admin_or_moderator());

DROP POLICY IF EXISTS "Moderators can manage module content" ON module_content;
CREATE POLICY "Moderators can manage module content" ON module_content
    FOR ALL USING (is_admin_or_moderator());

DROP POLICY IF EXISTS "Moderators can view progress" ON module_progress;
CREATE POLICY "Moderators can view progress" ON module_progress
    FOR SELECT USING (auth.uid() = user_id OR is_admin_or_moderator());

DROP POLICY IF EXISTS "Moderators can manage registrations" ON course_registrations;
CREATE POLICY "Moderators can manage registrations" ON course_registrations
    FOR ALL USING (is_admin_or_moderator());

-- Update quiz-related policies
DROP POLICY IF EXISTS "Users can read enrolled quizzes" ON quizzes;
CREATE POLICY "Users can read enrolled quizzes" ON quizzes
    FOR SELECT USING (
        is_admin_or_moderator() OR
        EXISTS (
            SELECT 1 FROM module_content 
            JOIN course_modules ON course_modules.id = module_content.module_id
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE module_content.quiz_id = quizzes.id 
            AND course_registrations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can read quiz questions" ON quiz_questions;
CREATE POLICY "Users can read quiz questions" ON quiz_questions
    FOR SELECT USING (
        is_admin_or_moderator() OR
        EXISTS (
            SELECT 1 FROM quizzes 
            JOIN module_content ON module_content.quiz_id = quizzes.id
            JOIN course_modules ON course_modules.id = module_content.module_id
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE quizzes.id = quiz_questions.quiz_id 
            AND course_registrations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can read question choices" ON question_choices;
CREATE POLICY "Users can read question choices" ON question_choices
    FOR SELECT USING (
        is_admin_or_moderator() OR
        EXISTS (
            SELECT 1 FROM quiz_questions 
            JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
            JOIN module_content ON module_content.quiz_id = quizzes.id
            JOIN course_modules ON course_modules.id = module_content.module_id
            JOIN course_registrations ON course_registrations.course_id = course_modules.course_id
            WHERE quiz_questions.id = question_choices.question_id 
            AND course_registrations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Moderators can manage attempts" ON quiz_attempts;
CREATE POLICY "Moderators can manage attempts" ON quiz_attempts
    FOR ALL USING (auth.uid() = user_id OR is_admin_or_moderator());

DROP POLICY IF EXISTS "Moderators can manage answers" ON quiz_answers;
CREATE POLICY "Moderators can manage answers" ON quiz_answers
    FOR ALL USING (
        is_admin_or_moderator() OR
        EXISTS (
            SELECT 1 FROM quiz_attempts 
            WHERE quiz_attempts.id = quiz_answers.attempt_id 
            AND quiz_attempts.user_id = auth.uid()
        )
    );