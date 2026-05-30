const url = 'https://zgcmncootfkygzeebnhv.supabase.co/auth/v1/token?grant_type=password';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY21uY29vdGZreWd6ZWVibmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjE0MDcsImV4cCI6MjA5MzUzNzQwN30.RswsFPn7l9hbstEoRAMY85DH5LaoatvzVFVNf3gZcGE';

async function testLogin() {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'owner@brightboard.in',
                password: 'Demo@123'
            })
        });
        console.log('Status:', res.status);
        const json = await res.json();
        console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

testLogin();
