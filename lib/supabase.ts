import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================
// REPLACE THESE WITH YOUR SUPABASE CREDENTIALS
// Go to: https://supabase.com → Your Project → Settings → API
// =============================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Check if Supabase is configured (not placeholder)
export const isSupabaseConfigured = () =>
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') && !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY');

// Platform fee percentage (20%)
export const PLATFORM_FEE_PERCENT = 20;

/*
SQL TO RUN IN SUPABASE SQL EDITOR (Settings → SQL Editor → New Query):

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_expert BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts
CREATE TABLE forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum replies
CREATE TABLE forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum likes
CREATE TABLE forum_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  UNIQUE(post_id, user_id)
);

-- Expert profiles
CREATE TABLE experts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[], -- ['3D', 'target', 'hunting', 'tuning', 'mental game']
  credentials TEXT,
  live_rate NUMERIC(10,2) DEFAULT 0, -- per 30 min live session
  message_rate NUMERIC(10,2) DEFAULT 0, -- per message Q&A
  availability_status TEXT DEFAULT 'offline', -- 'available', 'busy', 'offline'
  avatar_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES experts(id),
  user_id UUID REFERENCES profiles(id),
  service_type TEXT NOT NULL, -- 'live' or 'message'
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'cancelled'
  message TEXT,
  expert_reply TEXT,
  amount NUMERIC(10,2),
  platform_fee NUMERIC(10,2),
  expert_payout NUMERIC(10,2),
  scheduled_at TIMESTAMPTZ,
  duration_min INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies (allow read for all, write for authenticated)
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own write" ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public read" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update" ON forum_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read" ON forum_likes FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON forum_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth delete" ON forum_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public read" ON experts FOR SELECT USING (true);
CREATE POLICY "Own write" ON experts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Involved read" ON bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM experts WHERE id = expert_id));
CREATE POLICY "Auth insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Involved update" ON bookings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM experts WHERE id = expert_id));

-- Storage buckets (create in Supabase Dashboard → Storage)
-- 1. avatars (public)
-- 2. forum-images (public)
*/
