-- Criar tabela de relacionamento entre profissionais e serviços
CREATE TABLE IF NOT EXISTS professional_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id, service_id)
);

-- Adicionar alguns relacionamentos de exemplo
INSERT INTO professional_services (professional_id, service_id)
SELECT p.id, s.id 
FROM professionals p, services s 
WHERE p.name = 'Ana Silva' AND s.name IN ('CORTE', 'Química Coloração', 'Hidratação')
ON CONFLICT DO NOTHING;

INSERT INTO professional_services (professional_id, service_id)
SELECT p.id, s.id 
FROM professionals p, services s 
WHERE p.name = 'Carlos Santos' AND s.name IN ('BARBA', 'CORTE', 'CORTE E BARBA', 'Pigmentação')
ON CONFLICT DO NOTHING;

INSERT INTO professional_services (professional_id, service_id)
SELECT p.id, s.id 
FROM professionals p, services s 
WHERE p.name = 'Maria Oliveira' AND s.name IN ('Química Botox', 'Química Progressiva', 'Química Relaxamento', 'Luzes')
ON CONFLICT DO NOTHING;

INSERT INTO professional_services (professional_id, service_id)
SELECT p.id, s.id 
FROM professionals p, services s 
WHERE p.name = 'João Costa' AND s.name IN ('Limpeza de Pele', 'Sobrancelha', 'Penteado')
ON CONFLICT DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_professional_services_professional ON professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_service ON professional_services(service_id);

-- Habilitar RLS
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Professional services are viewable by everyone" ON professional_services FOR SELECT USING (true);
CREATE POLICY "Super admins can manage professional services" ON professional_services FOR ALL USING (true);
