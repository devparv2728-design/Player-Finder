-- Seed data for development and demo
-- Run after the migration

-- Insert demo sports (already in migration, but included here for completeness)
INSERT INTO public.sports (name, default_players_needed, icon) VALUES
  ('Badminton', 2, 'racquet'),
  ('Table Tennis', 2, 'table-tennis'),
  ('Cricket', 12, 'cricket'),
  ('Football', 12, 'football'),
  ('Basketball', 10, 'basketball'),
  ('Volleyball', 12, 'volleyball'),
  ('Chess', 2, 'chess'),
  ('Tennis', 2, 'tennis')
ON CONFLICT (name) DO NOTHING;