-- Insert sample services
INSERT INTO services (name, duration_minutes, price, category) VALUES
('BARBA', 30, 25.00, 'beauty'),
('Cachos (manutenção)', 60, 45.00, 'beauty'),
('CORTE', 30, 30.00, 'beauty'),
('CORTE E BARBA', 60, 50.00, 'beauty'),
('Corte e Barba com base visagista', 120, 80.00, 'beauty'),
('Hidratação', 30, 35.00, 'beauty'),
('Limpeza de Pele', 60, 60.00, 'beauty'),
('Luzes', 60, 70.00, 'beauty'),
('Penteado', 60, 40.00, 'beauty'),
('Pigmentação', 30, 45.00, 'beauty'),
('Química Botox', 60, 90.00, 'beauty'),
('Química Coloração', 60, 65.00, 'beauty'),
('Química Platinado', 60, 85.00, 'beauty'),
('Química Progressiva', 60, 75.00, 'beauty'),
('Química Relaxamento', 60, 70.00, 'beauty'),
('Sobrancelha', 20, 20.00, 'beauty');

-- Insert sample professionals
INSERT INTO professionals (name, email, phone, specialties) VALUES
('Ana Silva', 'ana@salon.com', '(11) 99999-1111', ARRAY['Cortes', 'Coloração']),
('Carlos Santos', 'carlos@salon.com', '(11) 99999-2222', ARRAY['Barba', 'Cortes Masculinos']),
('Maria Oliveira', 'maria@salon.com', '(11) 99999-3333', ARRAY['Química', 'Hidratação']),
('João Costa', 'joao@salon.com', '(11) 99999-4444', ARRAY['Limpeza de Pele', 'Sobrancelha']);

-- Insert sample admin (password: admin123)
INSERT INTO admins (email, password_hash, name) VALUES
('admin@salon.com', '$2b$10$rQZ9QmjlhQZ9QmjlhQZ9Qu', 'Administrador');
