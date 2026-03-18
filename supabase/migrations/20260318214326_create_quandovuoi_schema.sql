/*
  # QuandoVuoi Platform Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `company_name` (text)
      - `user_type` (text) - 'employee' or 'hr'
      - `onboarding_completed` (boolean) - tracks if user completed onboarding
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `request_number` (text) - generated request ID
      - `amount` (numeric) - requested amount in euros
      - `status` (text) - 'In attesa', 'Approvato', 'Erogato'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `company_config`
      - `id` (uuid, primary key)
      - `company_name` (text, unique)
      - `ragione_sociale` (text)
      - `piva` (text)
      - `numero_dipendenti` (integer)
      - `referente_hr` (text)
      - `max_advance_percent` (integer)
      - `request_frequency` (text)
      - `welcome_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  company_name text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('employee', 'hr')),
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  request_number text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'In attesa' CHECK (status IN ('In attesa', 'Approvato', 'Erogato')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text UNIQUE NOT NULL,
  ragione_sociale text,
  piva text,
  numero_dipendenti integer,
  referente_hr text,
  max_advance_percent integer DEFAULT 50,
  request_frequency text DEFAULT 'Settimanale',
  welcome_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to users"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to users"
  ON users FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to requests"
  ON requests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to requests"
  ON requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to requests"
  ON requests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to company_config"
  ON company_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to company_config"
  ON company_config FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to company_config"
  ON company_config FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);