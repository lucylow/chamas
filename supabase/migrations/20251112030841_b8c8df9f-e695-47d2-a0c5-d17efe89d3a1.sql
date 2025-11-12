-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chamas table
CREATE TABLE public.chamas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  contribution_amount DECIMAL(18, 6) NOT NULL,
  contribution_frequency TEXT NOT NULL CHECK (contribution_frequency IN ('daily', 'weekly', 'monthly')),
  total_funds DECIMAL(18, 6) DEFAULT 0,
  member_count INTEGER DEFAULT 1,
  contract_address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create chama members table
CREATE TABLE public.chama_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID REFERENCES public.chamas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  total_contributed DECIMAL(18, 6) DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  UNIQUE(chama_id, user_id)
);

-- Create contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chama_id UUID REFERENCES public.chamas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(18, 6) NOT NULL,
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chama_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Chamas policies
CREATE POLICY "Anyone can view active chamas"
  ON public.chamas FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can create chamas"
  ON public.chamas FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their chamas"
  ON public.chamas FOR UPDATE
  USING (auth.uid() = owner_id);

-- Chama members policies
CREATE POLICY "Members can view their memberships"
  ON public.chama_members FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT owner_id FROM public.chamas WHERE id = chama_id
  ));

CREATE POLICY "Users can join chamas"
  ON public.chama_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Contributions policies
CREATE POLICY "Members can view chama contributions"
  ON public.contributions FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.chama_members WHERE chama_id = contributions.chama_id
  ));

CREATE POLICY "Members can create contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chamas_updated_at
  BEFORE UPDATE ON public.chamas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();