const url = 'https://zgcmncootfkygzeebnhv.supabase.co/auth/v1/admin/users';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY21uY29vdGZreWd6ZWVibmh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk2MTQwNywiZXhwIjoyMDkzNTM3NDA3fQ.-NZmCR02sTYWbdQCNHKjj2QBXoYXcQsQc_5vY6ez7xg';

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
        console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

check();
