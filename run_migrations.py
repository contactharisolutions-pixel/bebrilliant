import pg8000.native, os, re
from pathlib import Path

db_url = None
for line in open('.env.development').readlines():
    if line.startswith('DATABASE_URL='):
        db_url = line.strip().split('=', 1)[1].strip().strip('"')
        break

if not db_url:
    raise ValueError("DATABASE_URL not found in .env.development")

# Parse postgres(ql)://user:pass@host:port/db
m = re.match(r'postgres(?:ql)?://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
user, password, host, port, database = m.group(1), m.group(2), m.group(3), int(m.group(4)), m.group(5)
database = database.split('?')[0]

is_local = host in ('localhost', '127.0.0.1')
ssl_ctx = False if is_local else True
print(f"Connecting to {host}:{port}/{database} as {user} (SSL: {not is_local})...")
conn = pg8000.native.Connection(user=user, password=password, host=host, port=port, database=database, ssl_context=ssl_ctx)

migrations = [
    '039_enterprise_rbac.sql',
    '040_enterprise_crm.sql',
    '041_enterprise_onboarding.sql',
    '048_enterprise_billing.sql',
]

for f in migrations:
    sql = Path(f'supabase/migrations/{f}').read_text(encoding='utf-8')
    print(f"\nApplying {f}...")
    try:
        conn.run(sql)
        print(f"  SUCCESS: {f}")
    except Exception as e:
        print(f"  ERROR in {f}: {e}")

conn.close()
print("\nDone.")
