-- Criar função para finalizar agendamentos automaticamente
CREATE OR REPLACE FUNCTION auto_complete_past_appointments()
RETURNS void AS $$
BEGIN
  UPDATE appointments 
  SET status = 'completed'
  WHERE status = 'scheduled' 
    AND appointment_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Criar extensão se não existir para usar cron jobs (opcional)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária da função (descomente se pg_cron estiver disponível)
-- SELECT cron.schedule('auto-complete-appointments', '0 0 * * *', 'SELECT auto_complete_past_appointments();');