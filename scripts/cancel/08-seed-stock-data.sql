-- Insert sample product categories and products
INSERT INTO products (name, category, unit, minimum_stock, cost_price, current_stock, professional_id) VALUES
-- Produtos de cabelo
('Shampoo Profissional 1L', 'Cabelo', 'ml', 500, 25.00, 1000, (SELECT id FROM professionals LIMIT 1)),
('Condicionador Profissional 1L', 'Cabelo', 'ml', 500, 28.00, 800, (SELECT id FROM professionals LIMIT 1)),
('Pomada Modeladora', 'Cabelo', 'unidades', 5, 15.00, 12, (SELECT id FROM professionals LIMIT 1)),
('Gel Fixador', 'Cabelo', 'ml', 300, 12.00, 500, (SELECT id FROM professionals LIMIT 1)),
('Óleo Capilar', 'Cabelo', 'ml', 200, 35.00, 300, (SELECT id FROM professionals LIMIT 1)),

-- Produtos de barba
('Espuma de Barbear', 'Barba', 'ml', 200, 18.00, 400, (SELECT id FROM professionals LIMIT 1)),
('Óleo para Barba', 'Barba', 'ml', 100, 22.00, 150, (SELECT id FROM professionals LIMIT 1)),
('Balm para Barba', 'Barba', 'unidades', 3, 25.00, 8, (SELECT id FROM professionals LIMIT 1)),
('Loção Pós-Barba', 'Barba', 'ml', 150, 20.00, 250, (SELECT id FROM professionals LIMIT 1)),

-- Produtos de limpeza e higiene
('Álcool 70%', 'Higiene', 'ml', 500, 8.00, 1000, (SELECT id FROM professionals LIMIT 1)),
('Desinfetante', 'Higiene', 'ml', 300, 12.00, 500, (SELECT id FROM professionals LIMIT 1)),
('Toalhas Descartáveis', 'Higiene', 'unidades', 50, 0.50, 200, (SELECT id FROM professionals LIMIT 1)),
('Luvas Descartáveis', 'Higiene', 'unidades', 100, 0.30, 500, (SELECT id FROM professionals LIMIT 1)),

-- Ferramentas e acessórios
('Lâminas de Barbear', 'Ferramentas', 'unidades', 20, 2.50, 50, (SELECT id FROM professionals LIMIT 1)),
('Pentes Profissionais', 'Ferramentas', 'unidades', 5, 8.00, 10, (SELECT id FROM professionals LIMIT 1)),
('Escovas de Cabelo', 'Ferramentas', 'unidades', 3, 15.00, 6, (SELECT id FROM professionals LIMIT 1));

-- Insert sample stock entries
INSERT INTO stock_entries (product_id, quantity, entry_date, notes, professional_id) VALUES
((SELECT id FROM products WHERE name = 'Shampoo Profissional 1L' LIMIT 1), 2000, CURRENT_DATE - INTERVAL '7 days', 'Compra inicial', (SELECT id FROM professionals LIMIT 1)),
((SELECT id FROM products WHERE name = 'Pomada Modeladora' LIMIT 1), 20, CURRENT_DATE - INTERVAL '5 days', 'Reposição de estoque', (SELECT id FROM professionals LIMIT 1)),
((SELECT id FROM products WHERE name = 'Álcool 70%' LIMIT 1), 1500, CURRENT_DATE - INTERVAL '3 days', 'Compra para higienização', (SELECT id FROM professionals LIMIT 1));

-- Insert sample stock exits
INSERT INTO stock_exits (product_id, quantity, exit_date, reason, notes, professional_id) VALUES
((SELECT id FROM products WHERE name = 'Shampoo Profissional 1L' LIMIT 1), 1000, CURRENT_DATE - INTERVAL '2 days', 'uso em serviço', 'Uso durante a semana', (SELECT id FROM professionals LIMIT 1)),
((SELECT id FROM products WHERE name = 'Pomada Modeladora' LIMIT 1), 8, CURRENT_DATE - INTERVAL '1 day', 'uso em serviço', 'Vendas para clientes', (SELECT id FROM professionals LIMIT 1)),
((SELECT id FROM products WHERE name = 'Álcool 70%' LIMIT 1), 500, CURRENT_DATE, 'uso em serviço', 'Limpeza e desinfecção', (SELECT id FROM professionals LIMIT 1));
