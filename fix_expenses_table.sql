-- Fix the split_type column type issue
-- Drop and recreate the table with correct column types

-- First, drop the expense_settlements table (if exists) since it references event_expenses
DROP TABLE IF EXISTS expense_settlements;

-- Drop the event_expenses table
DROP TABLE IF EXISTS event_expenses;

-- Recreate the event_expenses table with correct column types
CREATE TABLE event_expenses (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  paid_by VARCHAR NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  split_type VARCHAR NOT NULL DEFAULT 'equal',
  split_details JSONB NOT NULL,
  category VARCHAR,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recreate the expense_settlements table
CREATE TABLE expense_settlements (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  from_user_id VARCHAR NOT NULL REFERENCES users(id),
  to_user_id VARCHAR NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  proof_image_url TEXT,
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
