-- Adicionar campo role se não existir e atualizar estrutura
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- Adicionar campo professional_id para vincular admins aos profissionais
ALTER TABLE admins ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id);

-- Atualizar admin existente para super_admin
UPDATE admins SET role = 'super_admin' WHERE email = 'admin@salon.com';

-- Inserir alguns admins normais vinculados aos profissionais
INSERT INTO admins (email, password_hash, name, role, professional_id) 
SELECT 
  p.email,
  '$2a$10$rQZ9QmjlhQZ9QmjlhQZ9Qu.rQZ9QmjlhQZ9QmjlhQZ9QmjlhQZ9Qm', -- senha: admin123
  p.name,
  'admin',
  p.id
FROM professionals p
WHERE p.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  professional_id = EXCLUDED.professional_id;

-- Atualizar políticas RLS
DROP POLICY IF EXISTS "Admins can view all data" ON admins;
CREATE POLICY "Admins can view all data" ON admins FOR SELECT USING (true);
CREATE POLICY "Super admins can manage admins" ON admins FOR ALL USING (true);
