/*
  # Add Geocoding Cache Table

  1. New Tables
    - `geocoding_cache`
      - `id` (uuid, primary key)
      - `address` (text, unique) - The full address string used for lookup
      - `latitude` (numeric) - Geocoded latitude
      - `longitude` (numeric) - Geocoded longitude
      - `created_at` (timestamptz) - When the geocoding was performed
  
  2. Security
    - Enable RLS on geocoding_cache table
    - Add policies for public access (consistent with MVP approach)
  
  3. Important Notes
    - Cache prevents repeated API calls for the same address
    - Helps avoid rate limiting issues with geocoding services
    - Address is unique to prevent duplicate cache entries
*/

-- Create geocoding cache table
CREATE TABLE IF NOT EXISTS geocoding_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster address lookups
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_address ON geocoding_cache(address);

-- Enable Row Level Security
ALTER TABLE geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to geocoding_cache"
  ON geocoding_cache FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to geocoding_cache"
  ON geocoding_cache FOR INSERT
  TO anon
  WITH CHECK (true);
