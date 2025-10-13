/*
  # Add Locations Table for Distance Calculations

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text) - Location name (e.g., "Work", "Gym", "Parents' House")
      - `address` (text) - Full address
      - `latitude` (numeric) - Required for distance calculations
      - `longitude` (numeric) - Required for distance calculations
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on locations table
    - Add policies for public access (matching existing pattern)
  
  3. Important Notes
    - Locations are user-defined points of interest
    - Used to calculate distances from properties to important places
    - Each location must have valid coordinates for distance calculations
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to locations"
  ON locations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to locations"
  ON locations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to locations"
  ON locations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from locations"
  ON locations FOR DELETE
  TO anon
  USING (true);