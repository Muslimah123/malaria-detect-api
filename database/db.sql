-- -- Create database
-- -- CREATE DATABASE malaria_detection;

-- -- Connect to database
-- \c malaria_detection;

-- -- Create UUID extension
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- Enable full text search
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -- Create enum types
-- CREATE TYPE sample_status AS ENUM ('registered', 'ready_for_analysis', 'processing', 'completed', 'failed');
-- CREATE TYPE sample_priority AS ENUM ('routine', 'urgent');
-- CREATE TYPE sample_type AS ENUM ('thick_smear', 'thin_smear', 'both');
-- CREATE TYPE user_role AS ENUM ('admin', 'lab_technician', 'doctor', 'researcher');
-- CREATE TYPE parasite_species AS ENUM ('p_falciparum', 'p_vivax', 'p_malariae', 'p_ovale', 'p_knowlesi', 'unknown', 'none');

-- -- Create users table
-- CREATE TABLE users (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name VARCHAR(100) NOT NULL,
--   email VARCHAR(100) UNIQUE NOT NULL,
--   password VARCHAR(100) NOT NULL,
--   role user_role NOT NULL DEFAULT 'lab_technician',
--   profile_image VARCHAR(255),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create patients table
-- CREATE TABLE patients (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   patient_id VARCHAR(50) UNIQUE NOT NULL,
--   name VARCHAR(100) NOT NULL,
--   age INTEGER,
--   gender VARCHAR(20),
--   contact_number VARCHAR(20),
--   address TEXT,
--   medical_history TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create samples table
-- CREATE TABLE samples (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   sample_id VARCHAR(50) UNIQUE NOT NULL,
--   patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
--   sample_type sample_type NOT NULL DEFAULT 'thick_smear',
--   collection_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   lab_technician VARCHAR(100) NOT NULL,
--   status sample_status NOT NULL DEFAULT 'registered',
--   priority sample_priority NOT NULL DEFAULT 'routine',
--   notes TEXT,
--   created_by UUID REFERENCES users(id),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create index for efficient querying
--   CONSTRAINT idx_samples_patient_id FOREIGN KEY (patient_id) REFERENCES patients(id)
-- );

-- -- Create sample_images table
-- CREATE TABLE sample_images (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
--   image_url VARCHAR(255) NOT NULL,
--   thumbnail_url VARCHAR(255),
--   original_filename VARCHAR(255),
--   field_of_view VARCHAR(50) DEFAULT 'Center',
--   magnification VARCHAR(20) DEFAULT '100x',
--   image_type VARCHAR(20) DEFAULT 'thick',
--   width INTEGER,
--   height INTEGER,
--   format VARCHAR(20),
--   size INTEGER,
--   capture_device VARCHAR(100),
--   is_analyzed BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create index for efficient querying
--   CONSTRAINT idx_sample_images_sample_id FOREIGN KEY (sample_id) REFERENCES samples(id)
-- );

-- -- Create image_patches table to store the cropped regions
-- CREATE TABLE image_patches (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
--   patch_url VARCHAR(255) NOT NULL,
--   x_coord INTEGER NOT NULL,
--   y_coord INTEGER NOT NULL,
--   width INTEGER NOT NULL,
--   height INTEGER NOT NULL,
--   patch_type VARCHAR(50) NOT NULL, -- 'rbc' or 'parasite_candidate'
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create index for efficient querying
--   CONSTRAINT idx_image_patches_image_id FOREIGN KEY (image_id) REFERENCES sample_images(id)
-- );

-- -- Create initial_analysis table (CNN results)
-- CREATE TABLE initial_analysis (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
--   image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
--   is_positive BOOLEAN DEFAULT FALSE,
--   confidence FLOAT,
--   processing_time INTEGER, -- in milliseconds
--   patches_analyzed INTEGER,
--   positive_patches INTEGER,
--   model_version VARCHAR(50),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create indices for efficient querying
--   CONSTRAINT idx_initial_analysis_sample_id FOREIGN KEY (sample_id) REFERENCES samples(id),
--   CONSTRAINT idx_initial_analysis_image_id FOREIGN KEY (image_id) REFERENCES sample_images(id)
-- );

-- -- Create patch_classification table for individual patch results
-- CREATE TABLE patch_classifications (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   patch_id UUID NOT NULL REFERENCES image_patches(id) ON DELETE CASCADE,
--   analysis_id UUID NOT NULL REFERENCES initial_analysis(id) ON DELETE CASCADE,
--   is_positive BOOLEAN DEFAULT FALSE,
--   confidence FLOAT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create indices for efficient querying
--   CONSTRAINT idx_patch_class_patch_id FOREIGN KEY (patch_id) REFERENCES image_patches(id),
--   CONSTRAINT idx_patch_class_analysis_id FOREIGN KEY (analysis_id) REFERENCES initial_analysis(id)
-- );

-- -- Create detailed_analysis table (YOLOv10 results from external API)
-- CREATE TABLE detailed_analysis (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
--   image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
--   initial_analysis_id UUID REFERENCES initial_analysis(id) ON DELETE CASCADE,
--   parasite_detected BOOLEAN DEFAULT FALSE,
--   species parasite_species DEFAULT 'none',
--   confidence FLOAT,
--   parasite_density FLOAT,
--   processing_time INTEGER, -- in milliseconds
--   external_api_id VARCHAR(100), -- ID from the external API
--   model_version VARCHAR(50),
--   verified_by UUID REFERENCES users(id),
--   verified_at TIMESTAMP WITH TIME ZONE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create indices for efficient querying
--   CONSTRAINT idx_detailed_analysis_sample_id FOREIGN KEY (sample_id) REFERENCES samples(id),
--   CONSTRAINT idx_detailed_analysis_image_id FOREIGN KEY (image_id) REFERENCES sample_images(id),
--   CONSTRAINT idx_detailed_analysis_initial_id FOREIGN KEY (initial_analysis_id) REFERENCES initial_analysis(id)
-- );

-- -- Create detection_results table to store all objects detected
-- CREATE TABLE detection_results (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   detailed_analysis_id UUID NOT NULL REFERENCES detailed_analysis(id) ON DELETE CASCADE,
--   class_name VARCHAR(50) NOT NULL, -- e.g., 'ring', 'trophozoite', etc.
--   x_coord INTEGER NOT NULL,
--   y_coord INTEGER NOT NULL,
--   width INTEGER NOT NULL,
--   height INTEGER NOT NULL,
--   confidence FLOAT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
--   -- Create index for efficient querying
--   CONSTRAINT idx_detection_results_analysis_id FOREIGN KEY (detailed_analysis_id) REFERENCES detailed_analysis(id)
-- );

-- -- Add indexes for common search patterns
-- CREATE INDEX idx_patients_name ON patients USING gin (name gin_trgm_ops);
-- CREATE INDEX idx_patients_patient_id ON patients USING gin (patient_id gin_trgm_ops);
-- CREATE INDEX idx_samples_status ON samples(status);
-- CREATE INDEX idx_samples_priority ON samples(priority);
-- CREATE INDEX idx_samples_sample_id ON samples(sample_id);
-- CREATE INDEX idx_detailed_analysis_verified ON detailed_analysis(verified_at);

-- -- Function to update updated_at timestamp
-- CREATE OR REPLACE FUNCTION update_modified_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Add triggers for updating timestamps
-- CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
-- FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- CREATE TRIGGER update_patients_timestamp BEFORE UPDATE ON patients
-- FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- CREATE TRIGGER update_samples_timestamp BEFORE UPDATE ON samples
-- FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- CREATE TRIGGER update_sample_images_timestamp BEFORE UPDATE ON sample_images
-- FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
-- Initial SQL setup script that will run when PostgreSQL container starts
-- This creates the database schema

-- Create extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sample_status') THEN
        CREATE TYPE sample_status AS ENUM ('registered', 'ready_for_analysis', 'processing', 'completed', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sample_priority') THEN
        CREATE TYPE sample_priority AS ENUM ('routine', 'urgent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sample_type') THEN
        CREATE TYPE sample_type AS ENUM ('thick_smear', 'thin_smear', 'both');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'lab_technician', 'doctor', 'researcher');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parasite_species') THEN
        CREATE TYPE parasite_species AS ENUM ('p_falciparum', 'p_vivax', 'p_malariae', 'p_ovale', 'p_knowlesi', 'unknown', 'none');
    END IF;
END$$;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'lab_technician',
  profile_image VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  contact_number VARCHAR(20),
  address TEXT,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sample_type sample_type NOT NULL DEFAULT 'thick_smear',
  collection_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lab_technician VARCHAR(100) NOT NULL,
  status sample_status NOT NULL DEFAULT 'registered',
  priority sample_priority NOT NULL DEFAULT 'routine',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sample_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255),
  original_filename VARCHAR(255),
  field_of_view VARCHAR(50) DEFAULT 'Center',
  magnification VARCHAR(20) DEFAULT '100x',
  image_type VARCHAR(20) DEFAULT 'thick',
  width INTEGER,
  height INTEGER,
  format VARCHAR(20),
  size INTEGER,
  capture_device VARCHAR(100),
  is_analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_patches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
  patch_url VARCHAR(255) NOT NULL,
  x_coord INTEGER NOT NULL,
  y_coord INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  patch_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS initial_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
  is_positive BOOLEAN DEFAULT FALSE,
  confidence FLOAT,
  processing_time INTEGER,
  patches_analyzed INTEGER,
  positive_patches INTEGER,
  model_version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patch_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patch_id UUID NOT NULL REFERENCES image_patches(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES initial_analysis(id) ON DELETE CASCADE,
  is_positive BOOLEAN DEFAULT FALSE,
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detailed_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES sample_images(id) ON DELETE CASCADE,
  initial_analysis_id UUID REFERENCES initial_analysis(id) ON DELETE CASCADE,
  parasite_detected BOOLEAN DEFAULT FALSE,
  species parasite_species DEFAULT 'none',
  confidence FLOAT,
  parasite_density FLOAT,
  processing_time INTEGER,
  external_api_id VARCHAR(100),
  model_version VARCHAR(50),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detection_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  detailed_analysis_id UUID NOT NULL REFERENCES detailed_analysis(id) ON DELETE CASCADE,
  class_name VARCHAR(50) NOT NULL,
  x_coord INTEGER NOT NULL,
  y_coord INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients USING gin (patient_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_priority ON samples(priority);
CREATE INDEX IF NOT EXISTS idx_samples_sample_id ON samples(sample_id);
CREATE INDEX IF NOT EXISTS idx_samples_patient_id ON samples(patient_id);
CREATE INDEX IF NOT EXISTS idx_sample_images_sample_id ON sample_images(sample_id);
CREATE INDEX IF NOT EXISTS idx_image_patches_image_id ON image_patches(image_id);
CREATE INDEX IF NOT EXISTS idx_initial_analysis_image_id ON initial_analysis(image_id);
CREATE INDEX IF NOT EXISTS idx_patch_class_patch_id ON patch_classifications(patch_id);
CREATE INDEX IF NOT EXISTS idx_detailed_analysis_image_id ON detailed_analysis(image_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_timestamp') THEN
        CREATE TRIGGER update_users_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_patients_timestamp') THEN
        CREATE TRIGGER update_patients_timestamp
        BEFORE UPDATE ON patients
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_samples_timestamp') THEN
        CREATE TRIGGER update_samples_timestamp
        BEFORE UPDATE ON samples
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sample_images_timestamp') THEN
        CREATE TRIGGER update_sample_images_timestamp
        BEFORE UPDATE ON sample_images
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
    END IF;
END$$;

-- Create admin user if no users exist (password: admin123)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users) THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin User', 'admin@example.com', '$2a$10$eiEp8rJFMQDFPVfhStQZVO8kW5oq3Mwh0aObUm/JdYjpULPYjmbai', 'admin');
    END IF;
END$$;