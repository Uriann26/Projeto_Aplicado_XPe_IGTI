-- Create road_photos table
CREATE TABLE IF NOT EXISTS road_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  road_id uuid REFERENCES roads(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  taken_at timestamptz NOT NULL,
  location jsonb DEFAULT '{"lat": 0, "lng": 0}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_versions table
CREATE TABLE IF NOT EXISTS report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  content jsonb NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (report_id, version_number)
);

-- Create report_reviews table
CREATE TABLE IF NOT EXISTS report_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  comments text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE road_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage photos through roads"
  ON road_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM roads
      JOIN service_orders ON service_orders.id = roads.service_order_id
      WHERE roads.id = road_photos.road_id
      AND service_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage versions through reports"
  ON report_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.id = report_versions.report_id
      AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage reviews through reports"
  ON report_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reports
      WHERE reports.id = report_reviews.report_id
      AND (reports.user_id = auth.uid() OR auth.uid() = report_reviews.reviewer_id)
    )
  );

-- Create indexes
CREATE INDEX road_photos_road_id_idx ON road_photos(road_id);
CREATE INDEX road_photos_taken_at_idx ON road_photos(taken_at);
CREATE INDEX road_photos_location_idx ON road_photos USING GIN (location);
CREATE INDEX report_versions_report_id_idx ON report_versions(report_id);
CREATE INDEX report_versions_created_by_idx ON report_versions(created_by);
CREATE INDEX report_reviews_report_id_idx ON report_reviews(report_id);
CREATE INDEX report_reviews_reviewer_id_idx ON report_reviews(reviewer_id);
CREATE INDEX report_reviews_status_idx ON report_reviews(status);

-- Create triggers
CREATE TRIGGER update_road_photos_updated_at
  BEFORE UPDATE ON road_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_reviews_updated_at
  BEFORE UPDATE ON report_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-increment version number
CREATE OR REPLACE FUNCTION next_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM report_versions
  WHERE report_id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-incrementing version number
CREATE TRIGGER set_version_number
  BEFORE INSERT ON report_versions
  FOR EACH ROW
  EXECUTE FUNCTION next_version_number();