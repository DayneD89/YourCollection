-- Party Collection Database Seed Data
-- This script inserts initial test data for local development

-- Insert only admin user for test infrastructure - tests create their own users dynamically
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES 
    (
        COALESCE(current_setting('myapp.admin_email', true), 'admin@example.com'), 
        crypt(COALESCE(current_setting('myapp.admin_password', true), 'AdminTest123@'), gen_salt('bf')), 
        'admin', 
        'Admin', 
        'User'
    )
ON CONFLICT (email) DO NOTHING;

-- Insert sample parties for testing (admin-created only since tests create their own users)
INSERT INTO parties (name, description, date_scheduled, location, max_attendees, created_by)
VALUES 
    (
        'Welcome Party',
        'A welcome party for new team members',
        CURRENT_DATE + INTERVAL '7 days',
        'Main Conference Room',
        50,
        (SELECT id FROM users WHERE email = COALESCE(current_setting('myapp.admin_email', true), 'admin@example.com'))
    ),
    (
        'Holiday Celebration',
        'Annual holiday party with food and games',
        CURRENT_DATE + INTERVAL '30 days',
        'Community Center',
        100,
        (SELECT id FROM users WHERE email = COALESCE(current_setting('myapp.admin_email', true), 'admin@example.com'))
    )
ON CONFLICT DO NOTHING;

-- Log the seeding operation
INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
SELECT 
    'users', 
    id, 
    'INSERT', 
    row_to_json(users.*), 
    id
FROM users 
WHERE email = COALESCE(current_setting('myapp.admin_email', true), 'admin@example.com');

-- Display created admin user for verification
\echo ''
\echo '=== CREATED ADMIN USER ==='
SELECT 
    email, 
    role, 
    first_name, 
    last_name, 
    created_at,
    COALESCE(current_setting('myapp.admin_password', true), 'AdminTest123@') as password
FROM users 
WHERE email = COALESCE(current_setting('myapp.admin_email', true), 'admin@example.com');
\echo ''
\echo 'ℹ️  Test users will be created dynamically by test suite'
\echo '========================'
\echo ''