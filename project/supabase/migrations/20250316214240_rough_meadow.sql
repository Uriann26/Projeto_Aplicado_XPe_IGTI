/*
  # Add coordinates to roads and pathologies

  1. Changes
    - Add coordinates column to roads table to store path points
    - Add coordinates column to pathologies table to store location
    - Add indexes for spatial queries

  2. Notes
    - Using JSONB to store coordinates for flexibility
    - Format for roads: [{"lat": number, "lng": number}, ...]
    - Format for pathologies: {"lat": number, "lng": number}
*/

-- Add coordinates columns
ALTER TABLE roads
ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '[]';

ALTER TABLE pathologies
ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"lat": 0, "lng": 0}';

-- Create indexes
CREATE INDEX IF NOT EXISTS roads_coordinates_idx ON roads USING GIN (coordinates);
CREATE INDEX IF NOT EXISTS pathologies_coordinates_idx ON pathologies USING GIN (coordinates);

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can manage roads through service orders" ON roads;
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
  );

DROP POLICY IF EXISTS "Users can manage pathologies through roads" ON pathologies;
CREATE POLICY "Users can manage pathologies through roads"
  ON pathologies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM roads
      JOIN service_orders ON service_orders.id = roads.service_order_id
      WHERE roads.id = pathologies.road_id
      AND service_orders.user_id = auth.uid()
    )
  );