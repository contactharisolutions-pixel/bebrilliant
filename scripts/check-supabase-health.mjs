const url = 'https://zgcmncootfkygzeebnhv.supabase.co/auth/v1/health';

async function check() {
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

check();
