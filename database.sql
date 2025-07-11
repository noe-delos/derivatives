-- Database schema for Derivatives platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Subscription type enum
CREATE TYPE subscription_type AS ENUM ('free', 'premium_800', 'premium_2000');

-- Quiz question type enum
CREATE TYPE question_type AS ENUM ('choice', 'text');

-- Module content type enum
CREATE TYPE module_content_type AS ENUM ('video', 'file', 'quiz');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    profile_picture_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    subscription_type subscription_type DEFAULT 'free' NOT NULL,
    subscription_date TIMESTAMP WITH TIME ZONE,
    day_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    picture_url TEXT,
    notes TEXT,
    difficulty TEXT,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Course modules table
CREATE TABLE public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    estimated_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Module content table
CREATE TABLE public.module_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    content_type module_content_type NOT NULL,
    title TEXT,
    file_url TEXT,
    video_url TEXT,
    video_duration_minutes INTEGER,
    quiz_id UUID,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Quizzes table
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    timer_minutes INTEGER,
    needs_correction BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Quiz questions table
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    correct_answer TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Question choices table (for multiple choice questions)
CREATE TABLE public.question_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL
);

-- Course registrations table
CREATE TABLE public.course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, course_id)
);

-- Module progress table
CREATE TABLE public.module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, module_id)
);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    is_corrected BOOLEAN DEFAULT false,
    needs_correction BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE,
    corrected_by UUID REFERENCES users(id),
    corrected_at TIMESTAMP WITH TIME ZONE
);

-- Quiz answers table
CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    choice_id UUID REFERENCES question_choices(id),
    is_correct BOOLEAN,
    moderator_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Course reviews table
CREATE TABLE public.course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(course_id, user_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User goals table
CREATE TABLE public.user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    ask_again_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_order ON courses(order_index);
CREATE INDEX idx_modules_course ON course_modules(course_id);
CREATE INDEX idx_modules_order ON course_modules(order_index);
CREATE INDEX idx_content_module ON module_content(module_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_registrations_user ON course_registrations(user_id);
CREATE INDEX idx_registrations_course ON course_registrations(course_id);
CREATE INDEX idx_progress_user ON module_progress(user_id);
CREATE INDEX idx_progress_module ON module_progress(module_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_goals_user ON user_goals(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at BEFORE UPDATE ON module_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON course_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own record (for signup process)
CREATE POLICY "Users can insert own record" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Service role can manage users (for triggers)
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create a security definer function to check roles (avoids recursion)
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

-- Moderators and admins can read all users (using security definer function)
CREATE POLICY "Moderators can read all users" ON users
    FOR SELECT USING (is_admin_or_moderator());

-- Allow moderators to update user roles
CREATE POLICY "Moderators can update users" ON users
    FOR UPDATE USING (is_admin_or_moderator());

-- CATEGORIES TABLE POLICIES
-- Everyone can read categories
CREATE POLICY "Everyone can read categories" ON categories
    FOR SELECT USING (true);

-- Only moderators and admins can manage categories
CREATE POLICY "Moderators can manage categories" ON categories
    FOR ALL USING (is_admin_or_moderator());

-- COURSES TABLE POLICIES
-- Everyone can read published courses
CREATE POLICY "Everyone can read published courses" ON courses
    FOR SELECT USING (is_published = true);

-- Moderators and admins can read all courses
CREATE POLICY "Moderators can read all courses" ON courses
    FOR SELECT USING (is_admin_or_moderator() OR is_published = true);

-- Moderators and admins can manage courses
CREATE POLICY "Moderators can manage courses" ON courses
    FOR ALL USING (is_admin_or_moderator());

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
    FOR ALL USING (is_admin_or_moderator());

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
    FOR ALL USING (is_admin_or_moderator());

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
    FOR ALL USING (is_admin_or_moderator());

-- MODULE PROGRESS POLICIES
-- Users can manage their own progress
CREATE POLICY "Users can manage own progress" ON module_progress
    FOR ALL USING (auth.uid() = user_id);

-- Moderators can view all progress
CREATE POLICY "Moderators can view progress" ON module_progress
    FOR SELECT USING (auth.uid() = user_id OR is_admin_or_moderator());

-- QUIZZES POLICIES
-- Users can read quizzes from enrolled courses
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

-- QUIZ QUESTIONS POLICIES
-- Same access as quizzes
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

-- QUESTION CHOICES POLICIES
-- Same access as quiz questions
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

-- QUIZ ATTEMPTS POLICIES
-- Users can manage their own attempts
CREATE POLICY "Users can manage own attempts" ON quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

-- Moderators can manage all attempts
CREATE POLICY "Moderators can manage attempts" ON quiz_attempts
    FOR ALL USING (auth.uid() = user_id OR is_admin_or_moderator());

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
        is_admin_or_moderator() OR
        EXISTS (
            SELECT 1 FROM quiz_attempts 
            WHERE quiz_attempts.id = quiz_answers.attempt_id 
            AND quiz_attempts.user_id = auth.uid()
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

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();