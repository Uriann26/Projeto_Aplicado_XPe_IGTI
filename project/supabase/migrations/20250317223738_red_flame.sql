/*
  # Create Test Data Migration

  1. Changes
    - Create test users and profiles
    - Add notification settings
    - Create teams and members
    - Add sample data for testing

  2. Security
    - Maintain RLS policies
    - Keep audit trails
*/

-- Create test data with conflict handling
WITH new_users AS (
  SELECT 
    email,
    gen_random_uuid() as id
  FROM (VALUES 
    ('joao.silva@example.com'),
    ('maria.santos@example.com'),
    ('pedro.oliveira@example.com'),
    ('ana.costa@example.com'),
    ('carlos.souza@example.com')
  ) AS t(email)
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = t.email
  )
),
inserted_users AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    id,
    'authenticated',
    'authenticated',
    email,
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  FROM new_users
  RETURNING id, email
),
all_users AS (
  SELECT id, email FROM new_users
  UNION ALL
  SELECT id, email FROM inserted_users
),
profiles_insert AS (
  INSERT INTO profiles (id, name, role, updated_at)
  SELECT 
    COALESCE(u.id, (SELECT id FROM auth.users WHERE email = u.email)),
    split_part(u.email, '@', 1),
    'supervisor',
    NOW()
  FROM all_users u
  ON CONFLICT (id) DO UPDATE 
  SET 
    role = 'supervisor',
    updated_at = NOW()
  RETURNING id, name
),
notification_settings_insert AS (
  INSERT INTO notification_settings (user_id, email_notifications, deadline_reminders, reminder_days_before, daily_digest)
  SELECT 
    id,
    true,
    true,
    3,
    false
  FROM profiles_insert
  ON CONFLICT (user_id) DO NOTHING
),
team1 AS (
  INSERT INTO teams (id, name, description, created_by)
  SELECT
    gen_random_uuid(),
    'Equipe Norte',
    'Responsável pela região norte',
    id
  FROM profiles_insert
  WHERE name = 'joao.silva'
  RETURNING id
),
team2 AS (
  INSERT INTO teams (id, name, description, created_by)
  SELECT
    gen_random_uuid(),
    'Equipe Sul',
    'Responsável pela região sul',
    id
  FROM profiles_insert
  WHERE name = 'maria.santos'
  RETURNING id
),
team3 AS (
  INSERT INTO teams (id, name, description, created_by)
  SELECT
    gen_random_uuid(),
    'Equipe Especial',
    'Projetos especiais',
    id
  FROM profiles_insert
  WHERE name = 'pedro.oliveira'
  RETURNING id
),
team_members_insert AS (
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    t1.id,
    p.id,
    CASE 
      WHEN p.name = 'joao.silva' THEN 'leader'
      ELSE 'member'
    END
  FROM team1 t1
  CROSS JOIN profiles_insert p
  WHERE p.name IN ('joao.silva', 'maria.santos', 'pedro.oliveira')
  ON CONFLICT (team_id, user_id) DO NOTHING
),
service_orders_insert AS (
  INSERT INTO service_orders (id, number, user_id)
  SELECT
    gen_random_uuid(),
    'OS-2025-001',
    id
  FROM profiles_insert
  WHERE name = 'joao.silva'
  RETURNING id
),
roads_insert AS (
  INSERT INTO roads (id, service_order_id, name, length, width, paved_length, sidewalk_length, curb_length, coordinates)
  SELECT
    gen_random_uuid(),
    so.id,
    'Avenida Principal',
    1000.0,
    12.0,
    1000.0,
    900.0,
    950.0,
    '[{"lat": -23.550, "lng": -46.633}]'::jsonb
  FROM service_orders_insert so
  RETURNING id
),
pathologies_insert AS (
  INSERT INTO pathologies (id, road_id, description, coordinates)
  SELECT
    gen_random_uuid(),
    r.id,
    'Trinca longitudinal',
    '{"lat": -23.550, "lng": -46.633}'::jsonb
  FROM roads_insert r
),
reports_insert AS (
  INSERT INTO reports (id, title, description, file_url, status, user_id)
  SELECT
    gen_random_uuid(),
    'Relatório Mensal - Janeiro',
    'Atividades realizadas em janeiro',
    'https://example.com/report1.pdf',
    'pending',
    id
  FROM profiles_insert
  WHERE name = 'joao.silva'
),
daily_reports_insert AS (
  INSERT INTO daily_reports (id, user_id, date)
  SELECT
    gen_random_uuid(),
    id,
    CURRENT_DATE
  FROM profiles_insert
  WHERE name = 'joao.silva'
  ON CONFLICT (user_id, date) DO NOTHING
),
notifications_insert AS (
  INSERT INTO notifications (id, user_id, type, title, content, read)
  SELECT
    gen_random_uuid(),
    id,
    'deadline_reminder'::notification_type,
    'Prazo Próximo',
    'Relatório mensal vence em 3 dias',
    false
  FROM profiles_insert
  WHERE name = 'joao.silva'
)
SELECT 'Test data inserted successfully' as result;