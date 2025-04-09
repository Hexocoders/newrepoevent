-- Add early bird and multiple buys columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS has_early_bird BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_bird_days INTEGER,
ADD COLUMN IF NOT EXISTS early_bird_discount INTEGER,
ADD COLUMN IF NOT EXISTS has_multiple_buys BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multiple_buys_min_tickets INTEGER,
ADD COLUMN IF NOT EXISTS multiple_buys_discount INTEGER; 
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS has_early_bird BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_bird_days INTEGER,
ADD COLUMN IF NOT EXISTS early_bird_discount INTEGER,
ADD COLUMN IF NOT EXISTS has_multiple_buys BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS multiple_buys_min_tickets INTEGER,
ADD COLUMN IF NOT EXISTS multiple_buys_discount INTEGER; 
 
 
 