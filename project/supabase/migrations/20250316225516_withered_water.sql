/*
  # Create Test Users Migration

  1. Create test users with supervisor role
  2. Create notification settings
  3. Create teams and assign members
  4. Create test data for service orders, roads, and pathologies
  5. Create test reports and activities
*/

-- Create test users (profiles)
WITH inserted_users AS (
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
  VALUES
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'joao.silva@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'maria.santos@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'pedro.oliveira@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ana.costa@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'carlos.souza@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
  RETURNING id, email
),
-- Create profiles for users
profiles_insert AS (
  INSERT INTO profiles (id, name, role, updated_at)
  SELECT 
    id,
    split_part(email, '@', 1),
    'supervisor',
    NOW()
  FROM inserted_users
  RETURNING id, name
),
-- Create notification settings for users
notification_settings_insert AS (
  INSERT INTO notification_settings (user_id, email_notifications, deadline_reminders, reminder_days_before, daily_digest)
  SELECT 
    id,
    true,
    true,
    3,
    false
  FROM profiles_insert
),
-- Create teams
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
-- Insert team members
team_members_insert AS (
  INSERT INTO team_members (team_id, user_id, role)
  SELECT 
    t1.id,
    u.id,
    CASE 
      WHEN u.name = 'joao.silva' THEN 'leader'
      ELSE 'member'
    END
  FROM team1 t1
  CROSS JOIN profiles_insert u
  WHERE u.name IN ('joao.silva', 'maria.santos', 'pedro.oliveira')
  UNION ALL
  SELECT 
    t2.id,
    u.id,
    CASE 
      WHEN u.name = 'maria.santos' THEN 'leader'
      ELSE 'member'
    END
  FROM team2 t2
  CROSS JOIN profiles_insert u
  WHERE u.name IN ('maria.santos', 'ana.costa')
  UNION ALL
  SELECT 
    t3.id,
    u.id,
    CASE 
      WHEN u.name = 'pedro.oliveira' THEN 'leader'
      ELSE 'member'
    END
  FROM team3 t3
  CROSS JOIN profiles_insert u
  WHERE u.name IN ('pedro.oliveira', 'carlos.souza')
),
-- Insert tasks
tasks_insert AS (
  INSERT INTO tasks (id, title, description, status, priority, due_date, assigned_to, team_id, created_by)
  SELECT
    gen_random_uuid(),
    'Inspeção Avenida Principal',
    'Realizar inspeção completa',
    'pending',
    'high',
    NOW() + INTERVAL '7 days',
    u2.id,
    t1.id,
    u1.id
  FROM profiles_insert u1
  CROSS JOIN profiles_insert u2
  CROSS JOIN team1 t1
  WHERE u1.name = 'joao.silva'
  AND u2.name = 'maria.santos'
),
-- Insert service orders
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
service_orders_insert2 AS (
  INSERT INTO service_orders (id, number, user_id)
  SELECT
    gen_random_uuid(),
    'OS-2025-002',
    id
  FROM profiles_insert
  WHERE name = 'maria.santos'
  RETURNING id
),
-- Insert roads
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
roads_insert2 AS (
  INSERT INTO roads (id, service_order_id, name, length, width, paved_length, sidewalk_length, curb_length, coordinates)
  SELECT
    gen_random_uuid(),
    so.id,
    'Rua Secundária',
    500.0,
    8.0,
    500.0,
    400.0,
    450.0,
    '[{"lat": -23.551, "lng": -46.634}]'::jsonb
  FROM service_orders_insert so
  RETURNING id
),
roads_insert3 AS (
  INSERT INTO roads (id, service_order_id, name, length, width, paved_length, sidewalk_length, curb_length, coordinates)
  SELECT
    gen_random_uuid(),
    so.id,
    'Avenida Comercial',
    800.0,
    15.0,
    800.0,
    800.0,
    800.0,
    '[{"lat": -23.552, "lng": -46.635}]'::jsonb
  FROM service_orders_insert2 so
  RETURNING id
),
-- Insert pathologies
pathologies_insert AS (
  INSERT INTO pathologies (id, road_id, description, coordinates)
  SELECT
    gen_random_uuid(),
    r.id,
    'Trinca longitudinal',
    '{"lat": -23.550, "lng": -46.633}'::jsonb
  FROM roads_insert r
  UNION ALL
  SELECT
    gen_random_uuid(),
    r.id,
    'Afundamento',
    '{"lat": -23.551, "lng": -46.633}'::jsonb
  FROM roads_insert r
  UNION ALL
  SELECT
    gen_random_uuid(),
    r.id,
    'Buraco',
    '{"lat": -23.551, "lng": -46.634}'::jsonb
  FROM roads_insert2 r
  UNION ALL
  SELECT
    gen_random_uuid(),
    r.id,
    'Desgaste superficial',
    '{"lat": -23.552, "lng": -46.635}'::jsonb
  FROM roads_insert3 r
),
-- Insert reports
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
  UNION ALL
  SELECT
    gen_random_uuid(),
    'Relatório Técnico - Via Principal',
    'Análise técnica',
    'https://example.com/report2.pdf',
    'approved',
    id
  FROM profiles_insert
  WHERE name = 'maria.santos'
),
-- Insert daily reports
daily_reports_insert AS (
  INSERT INTO daily_reports (id, user_id, date)
  SELECT
    gen_random_uuid(),
    id,
    CURRENT_DATE
  FROM profiles_insert
  WHERE name = 'joao.silva'
  UNION ALL
  SELECT
    gen_random_uuid(),
    id,
    CURRENT_DATE - INTERVAL '1 day'
  FROM profiles_insert
  WHERE name = 'maria.santos'
),
-- Insert notifications
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
  UNION ALL
  SELECT
    gen_random_uuid(),
    id,
    'report_status_change'::notification_type,
    'Relatório Aprovado',
    'Seu relatório foi aprovado',
    false
  FROM profiles_insert
  WHERE name = 'maria.santos'
),
-- Insert team messages
team_messages_insert AS (
  INSERT INTO team_messages (team_id, user_id, content)
  SELECT
    t1.id,
    u.id,
    'Reunião amanhã às 9h'
  FROM team1 t1
  CROSS JOIN profiles_insert u
  WHERE u.name = 'joao.silva'
  UNION ALL
  SELECT
    t2.id,
    u.id,
    'Relatório semanal disponível'
  FROM team2 t2
  CROSS JOIN profiles_insert u
  WHERE u.name = 'maria.santos'
),
-- Insert team files
team_files_insert AS (
  INSERT INTO team_files (team_id, user_id, name, file_url, size, type)
  SELECT
    t1.id,
    u.id,
    'procedimentos.pdf',
    'https://example.com/file1.pdf',
    1024,
    'application/pdf'
  FROM team1 t1
  CROSS JOIN profiles_insert u
  WHERE u.name = 'joao.silva'
  UNION ALL
  SELECT
    t2.id,
    u.id,
    'fotos.zip',
    'https://example.com/file2.zip',
    2048,
    'application/zip'
  FROM team2 t2
  CROSS JOIN profiles_insert u
  WHERE u.name = 'maria.santos'
)
SELECT 'Test data inserted successfully' as result;