-- Supabase Database Schema for Leaderboard Management System

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    department TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    logo TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Unique constraint to prevent duplicate registrations for same department + year
    CONSTRAINT unique_department_year UNIQUE (department, academic_year)
);

-- 2. Create Settings Table for Registration Toggle
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Insert initial setting if it doesn't exist
INSERT INTO public.settings (registration_enabled)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- 3. Row Level Security (RLS) Setup

-- Enable RLS on tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- Policies for 'teams' table
-- -------------------------------------------------------------

-- Public can view all teams (for leaderboard)
CREATE POLICY "Public can view teams"
ON public.teams FOR SELECT
USING (true);

-- Public can insert a team ONLY if registration is enabled
CREATE POLICY "Public can insert teams if registration is enabled"
ON public.teams FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.settings WHERE registration_enabled = true
    )
);

-- Only authenticated admins can update or delete teams
CREATE POLICY "Admins can update teams"
ON public.teams FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete teams"
ON public.teams FOR DELETE
USING (auth.role() = 'authenticated');


-- -------------------------------------------------------------
-- Policies for 'settings' table
-- -------------------------------------------------------------

-- Public can read settings (to check if registration is open)
CREATE POLICY "Public can view settings"
ON public.settings FOR SELECT
USING (true);

-- Only authenticated admins can update settings
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE
USING (auth.role() = 'authenticated');

-- -------------------------------------------------------------
-- Storage Setup for Logos
-- -------------------------------------------------------------
-- You need to create a storage bucket named 'logos' in your Supabase Dashboard
-- Make sure it is a PUBLIC bucket.

-- Create a trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
