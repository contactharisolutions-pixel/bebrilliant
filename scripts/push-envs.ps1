$envs = @{
    "SUPABASE_URL" = "https://zgcmncootfkygzeebnhv.supabase.co"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY21uY29vdGZreWd6ZWVibmh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk2MTQwNywiZXhwIjoyMDkzNTM3NDA3fQ.-NZmCR02sTYWbdQCNHKjj2QBXoYXcQsQc_5vY6ez7xg"
    "DATABASE_URL" = "postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres"
    "RAZORPAY_KEY_ID" = "rzp_live_SHBxckJxQTVh7g"
    "RAZORPAY_KEY_SECRET" = "fE8u2LU9PADggjbRK8yih4ez"
    "SMTP_HOST" = "smtp.hostinger.com"
    "SMTP_PORT" = "465"
    "SMTP_SECURE" = "true"
    "SMTP_USER" = "support@bebrilliant.in"
    "SMTP_PASS" = "Life@20242526"
    "SMTP_FROM" = "support@bebrilliant.in"
    "SMTP_FROM_NAME" = "BeBrillint"
    "TZ" = "Asia/Kolkata"
    "NEXT_PUBLIC_SUPABASE_URL" = "https://zgcmncootfkygzeebnhv.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY21uY29vdGZreWd6ZWVibmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjE0MDcsImV4cCI6MjA5MzUzNzQwN30.RswsFPn7l9hbstEoRAMY85DH5LaoatvzVFVNf3gZcGE"
    "NEXT_PUBLIC_SITE_URL" = "https://bebrilliant.in"
    "NEXT_PUBLIC_RAZORPAY_KEY_ID" = "rzp_live_SHBxckJxQTVh7g"
    "GEMINI_API_KEY" = "AIzaSyBVv4bn95oKgqZIqh_cCRfmvlmHlETl1kk"
}

$targets = @("production", "preview", "development")

foreach ($key in $envs.Keys) {
    $value = $envs[$key]
    foreach ($target in $targets) {
        Write-Host "Adding $key to $target..."
        # Use --force to override if exists, --yes and --value for non-interactive
        vercel env add $key $target --value "$value" --force --yes
    }
}
