const url = 'https://bfzlkdurgggzytegvvrw.supabase.co/auth/v1/admin/users';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU';

async function check() {
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        console.log('Status:', res.status);
        const json = await res.json();
        console.log('Response found users count:', json.length || (json.users ? json.users.length : 'error'));
        if (json.users) {
             console.log('First user:', json.users[0]?.email);
        }
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

check();
