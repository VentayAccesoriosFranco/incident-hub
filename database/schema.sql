CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USUARIO'
    CHECK (role IN ('USUARIO', 'TECNICO', 'ADMIN'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL
    CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
  status VARCHAR(20) NOT NULL DEFAULT 'NUEVO'
    CHECK (status IN ('NUEVO', 'ASIGNADO', 'EN_PROCESO', 'RESUELTO', 'CERRADO')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);

INSERT INTO users (name, email, role) VALUES
  ('Usuario Demo', 'usuario@demo.local', 'USUARIO'),
  ('Tecnico Uno', 'tecnico1@demo.local', 'TECNICO'),
  ('Tecnico Dos', 'tecnico2@demo.local', 'TECNICO')
ON CONFLICT (email) DO NOTHING;