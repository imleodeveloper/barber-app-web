-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- ml, unidades, kg, etc
  minimum_stock INTEGER DEFAULT 0,
  cost_price DECIMAL(10,2),
  current_stock INTEGER DEFAULT 0,
  professional_id UUID REFERENCES professionals(id), -- Para controle por barbearia
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock entries table
CREATE TABLE IF NOT EXISTS stock_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  notes TEXT,
  professional_id UUID REFERENCES professionals(id), -- Quem registrou a entrada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock exits table
CREATE TABLE IF NOT EXISTS stock_exits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  exit_date DATE NOT NULL,
  reason VARCHAR(100) NOT NULL, -- uso em serviço, perda, vencido, etc
  notes TEXT,
  professional_id UUID REFERENCES professionals(id), -- Quem registrou a saída
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_professional ON products(professional_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_minimum_stock ON products(minimum_stock);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON stock_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_stock_exits_product ON stock_exits(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_exits_date ON stock_exits(exit_date);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_exits ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted by everyone" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated by everyone" ON products FOR UPDATE USING (true);
CREATE POLICY "Products can be deleted by everyone" ON products FOR DELETE USING (true);

-- Create policies for stock entries
CREATE POLICY "Stock entries are viewable by everyone" ON stock_entries FOR SELECT USING (true);
CREATE POLICY "Stock entries can be inserted by everyone" ON stock_entries FOR INSERT WITH CHECK (true);

-- Create policies for stock exits
CREATE POLICY "Stock exits are viewable by everyone" ON stock_exits FOR SELECT USING (true);
CREATE POLICY "Stock exits can be inserted by everyone" ON stock_exits FOR INSERT WITH CHECK (true);

-- Function to update product stock after entry
CREATE OR REPLACE FUNCTION update_stock_after_entry()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET current_stock = current_stock + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock after exit
CREATE OR REPLACE FUNCTION update_stock_after_exit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET current_stock = GREATEST(current_stock - NEW.quantity, 0),
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_stock_after_entry
  AFTER INSERT ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_entry();

CREATE TRIGGER trigger_update_stock_after_exit
  AFTER INSERT ON stock_exits
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_exit();
