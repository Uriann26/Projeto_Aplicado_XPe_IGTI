/*
  # Road Reports Schema

  1. New Tables
    - `service_orders`: Stores service order information
      - `id` (uuid, primary key)
      - `number` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references profiles)

    - `roads`: Stores road information
      - `id` (uuid, primary key)
      - `service_order_id` (uuid, references service_orders)
      - `name` (text)
      - `length` (numeric)
      - `width` (numeric)
      - `paved_length` (numeric)
      - `sidewalk_length` (numeric)
      - `curb_length` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `pathologies`: Stores road pathologies
      - `id` (uuid, primary key)
      - `road_id` (uuid, references roads)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create service_orders table
CREATE TABLE IF NOT EXISTS service_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create roads table
CREATE TABLE IF NOT EXISTS roads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
    name text NOT NULL,
    length numeric NOT NULL,
    width numeric NOT NULL,
    paved_length numeric NOT NULL,
    sidewalk_length numeric NOT NULL,
    curb_length numeric NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create pathologies table
CREATE TABLE IF NOT EXISTS pathologies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    road_id uuid REFERENCES roads(id) ON DELETE CASCADE,
    description text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indices
CREATE INDEX IF NOT EXISTS service_orders_number_idx ON service_orders(number);
CREATE INDEX IF NOT EXISTS service_orders_user_id_idx ON service_orders(user_id);
CREATE INDEX IF NOT EXISTS roads_service_order_id_idx ON roads(service_order_id);
CREATE INDEX IF NOT EXISTS pathologies_road_id_idx ON pathologies(road_id);

-- Enable RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE roads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathologies ENABLE ROW LEVEL SECURITY;

-- Policies for service_orders
CREATE POLICY "Users can manage own service orders"
ON service_orders
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policies for roads
CREATE POLICY "Users can manage roads through service orders"
ON roads
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM service_orders
        WHERE service_orders.id = roads.service_order_id
        AND service_orders.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM service_orders
        WHERE service_orders.id = roads.service_order_id
        AND service_orders.user_id = auth.uid()
    )
);

-- Policies for pathologies
CREATE POLICY "Users can manage pathologies through roads"
ON pathologies
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM roads
        JOIN service_orders ON service_orders.id = roads.service_order_id
        WHERE roads.id = pathologies.road_id
        AND service_orders.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM roads
        JOIN service_orders ON service_orders.id = roads.service_order_id
        WHERE roads.id = pathologies.road_id
        AND service_orders.user_id = auth.uid()
    )
);

-- Triggers for updated_at
CREATE TRIGGER update_service_orders_updated_at
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roads_updated_at
    BEFORE UPDATE ON roads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pathologies_updated_at
    BEFORE UPDATE ON pathologies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();