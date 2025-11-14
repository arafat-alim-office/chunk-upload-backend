-- Schema for Chunk Upload application
-- Table: uploads

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  supabase_path TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads (status);
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads (uploaded_at);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_uploads_updated_at 
BEFORE UPDATE ON uploads 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket setup (if not already created)
-- This would typically be done through the Supabase dashboard or CLI
-- The bucket name should match your SUPABASE_BUCKET env variable: 'uploads'
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);