/*
  # Housing Tracker Database Schema

  1. New Tables
    - `criteria`
      - `id` (uuid, primary key)
      - `name` (text) - The criterion name (e.g., "Access to public transportation")
      - `type` (text) - Either "must-have" or "nice-to-have"
      - `definition` (text, nullable) - Optional definition/notes about the criterion
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `properties`
      - `id` (uuid, primary key)
      - `name` (text) - Property name
      - `address` (text) - Full address
      - `neighborhood` (text) - Neighborhood name
      - `price` (numeric, nullable) - Monthly rent/price
      - `bedrooms` (numeric, nullable)
      - `bathrooms` (numeric, nullable)
      - `sqft` (numeric, nullable) - Square footage
      - `date_viewed` (date, nullable)
      - `listing_url` (text, nullable)
      - `notes` (text, nullable) - Property-level notes
      - `archived` (boolean) - Whether property is archived
      - `latitude` (numeric, nullable) - For map display
      - `longitude` (numeric, nullable) - For map display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ratings`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key) - References properties table
      - `criterion_id` (uuid, foreign key) - References criteria table
      - `score` (integer) - Rating value: 1, 2, or 3
      - `notes` (text, nullable) - Per-criterion rating notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (MVP uses browser-only storage, but RLS required for security)
    
  3. Important Notes
    - All tables use UUID for primary keys
    - Timestamps automatically track creation and updates
    - Ratings table creates many-to-many relationship between properties and criteria
    - Archived properties preserved but can be filtered out of main views
*/

-- Create criteria table
CREATE TABLE IF NOT EXISTS criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('must-have', 'nice-to-have')),
  definition text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  neighborhood text NOT NULL,
  price numeric,
  bedrooms numeric,
  bathrooms numeric,
  sqft numeric,
  date_viewed date,
  listing_url text,
  notes text,
  archived boolean DEFAULT false,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score IN (1, 2, 3)),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, criterion_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ratings_property_id ON ratings(property_id);
CREATE INDEX IF NOT EXISTS idx_ratings_criterion_id ON ratings(criterion_id);
CREATE INDEX IF NOT EXISTS idx_properties_archived ON properties(archived);

-- Enable Row Level Security
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (MVP allows anyone to use the app)
-- In production, you would restrict these to authenticated users

CREATE POLICY "Allow public read access to criteria"
  ON criteria FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to criteria"
  ON criteria FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to criteria"
  ON criteria FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from criteria"
  ON criteria FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to properties"
  ON properties FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to properties"
  ON properties FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to properties"
  ON properties FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from properties"
  ON properties FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to ratings"
  ON ratings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to ratings"
  ON ratings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to ratings"
  ON ratings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from ratings"
  ON ratings FOR DELETE
  TO anon
  USING (true);