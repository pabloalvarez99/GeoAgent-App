-- GeoAgent Database Schema
-- Field geology data collection app for mining exploration and production teams

-- Use gen_random_uuid() which is built-in to Supabase

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'geologist' CHECK (role IN ('superintendent', 'geologist', 'technician', 'admin')),
    company TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
    ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert projects"
    ON public.projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
    ON public.projects FOR UPDATE TO authenticated USING (true);

-- ============================================
-- STATIONS
-- ============================================
CREATE TABLE public.stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    geologist TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    weather_conditions TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stations_project ON public.stations(project_id);
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD stations"
    ON public.stations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- LITHOLOGIES
-- ============================================
CREATE TABLE public.lithologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    rock_type TEXT NOT NULL,
    rock_group TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '',
    texture TEXT NOT NULL DEFAULT '',
    grain_size TEXT NOT NULL DEFAULT '',
    mineralogy TEXT NOT NULL DEFAULT '',
    alteration TEXT,
    alteration_intensity TEXT,
    mineralization TEXT,
    mineralization_percent DOUBLE PRECISION,
    structure TEXT,
    weathering TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lithologies_station ON public.lithologies(station_id);
ALTER TABLE public.lithologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD lithologies"
    ON public.lithologies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- STRUCTURAL DATA
-- ============================================
CREATE TABLE public.structural_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    strike DOUBLE PRECISION NOT NULL,
    dip DOUBLE PRECISION NOT NULL,
    dip_direction TEXT NOT NULL,
    movement TEXT,
    thickness DOUBLE PRECISION,
    filling TEXT,
    roughness TEXT,
    continuity TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_structural_station ON public.structural_data(station_id);
ALTER TABLE public.structural_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD structural_data"
    ON public.structural_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- SAMPLES
-- ============================================
CREATE TABLE public.samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    weight DOUBLE PRECISION,
    length DOUBLE PRECISION,
    description TEXT NOT NULL DEFAULT '',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    destination TEXT,
    analysis_requested TEXT,
    status TEXT NOT NULL DEFAULT 'Recolectada',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_samples_station ON public.samples(station_id);
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD samples"
    ON public.samples FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- DRILL HOLES
-- ============================================
CREATE TABLE public.drill_holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    hole_id TEXT NOT NULL,
    type TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    azimuth DOUBLE PRECISION NOT NULL,
    inclination DOUBLE PRECISION NOT NULL,
    planned_depth DOUBLE PRECISION NOT NULL,
    actual_depth DOUBLE PRECISION,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'En Progreso',
    geologist TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drill_holes_project ON public.drill_holes(project_id);
ALTER TABLE public.drill_holes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD drill_holes"
    ON public.drill_holes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- DRILL INTERVALS
-- ============================================
CREATE TABLE public.drill_intervals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drill_hole_id UUID NOT NULL REFERENCES public.drill_holes(id) ON DELETE CASCADE,
    from_depth DOUBLE PRECISION NOT NULL,
    to_depth DOUBLE PRECISION NOT NULL,
    rock_type TEXT NOT NULL,
    rock_group TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '',
    texture TEXT NOT NULL DEFAULT '',
    grain_size TEXT NOT NULL DEFAULT '',
    mineralogy TEXT NOT NULL DEFAULT '',
    alteration TEXT,
    alteration_intensity TEXT,
    mineralization TEXT,
    mineralization_percent DOUBLE PRECISION,
    rqd DOUBLE PRECISION,
    recovery DOUBLE PRECISION,
    structure TEXT,
    weathering TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drill_intervals_hole ON public.drill_intervals(drill_hole_id);
ALTER TABLE public.drill_intervals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD drill_intervals"
    ON public.drill_intervals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- PHOTOS
-- ============================================
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
    drill_hole_id UUID REFERENCES public.drill_holes(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_station ON public.photos(station_id);
CREATE INDEX idx_photos_drill_hole ON public.photos(drill_hole_id);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD photos"
    ON public.photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET FOR PHOTOS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Authenticated users can view photos"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'photos');

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lithologies_updated_at BEFORE UPDATE ON public.lithologies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_structural_updated_at BEFORE UPDATE ON public.structural_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON public.samples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_drill_holes_updated_at BEFORE UPDATE ON public.drill_holes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_drill_intervals_updated_at BEFORE UPDATE ON public.drill_intervals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON public.photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
