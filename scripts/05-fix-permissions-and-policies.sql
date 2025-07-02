-- Corrigir políticas RLS para permitir operações do Super Admin
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
DROP POLICY IF EXISTS "Super admins can manage professional services" ON professional_services;

-- Políticas para admins
CREATE POLICY "Super admins can insert admins" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins can update admins" ON admins FOR UPDATE USING (true);
CREATE POLICY "Super admins can delete admins" ON admins FOR DELETE USING (true);

-- Políticas para professionals
DROP POLICY IF EXISTS "Professionals are viewable by everyone" ON professionals;
CREATE POLICY "Professionals are viewable by everyone" ON professionals FOR SELECT USING (true);
CREATE POLICY "Super admins can insert professionals" ON professionals FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins can update professionals" ON professionals FOR UPDATE USING (true);
CREATE POLICY "Super admins can delete professionals" ON professionals FOR DELETE USING (true);

-- Políticas para services
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Super admins can insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins can update services" ON services FOR UPDATE USING (true);
CREATE POLICY "Super admins can delete services" ON services FOR DELETE USING (true);

-- Políticas para appointments
DROP POLICY IF EXISTS "Appointments are viewable by everyone" ON appointments;
DROP POLICY IF EXISTS "Appointments can be inserted by everyone" ON appointments;
CREATE POLICY "Appointments are viewable by everyone" ON appointments FOR SELECT USING (true);
CREATE POLICY "Appointments can be inserted by everyone" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Appointments can be updated by everyone" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Super admins can delete appointments" ON appointments FOR DELETE USING (true);

-- Políticas para professional_services
DROP POLICY IF EXISTS "Professional services are viewable by everyone" ON professional_services;
CREATE POLICY "Professional services are viewable by everyone" ON professional_services FOR SELECT USING (true);
CREATE POLICY "Super admins can insert professional services" ON professional_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admins can update professional services" ON professional_services FOR UPDATE USING (true);
CREATE POLICY "Super admins can delete professional services" ON professional_services FOR DELETE USING (true);