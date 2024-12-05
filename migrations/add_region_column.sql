-- Add region column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(255);

-- Add region column to businesses table (if it exists)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS region VARCHAR(255);

-- Add region column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS region character varying(100);

-- Update the index to include the new column
CREATE INDEX IF NOT EXISTS idx_clients_region
ON public.clients(region);
