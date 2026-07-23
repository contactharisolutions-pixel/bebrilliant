import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        # Test query to the source database from the VPS
        source_url = "postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres"
        cmd = f"docker run --rm --network host postgres:17-alpine psql \"{source_url}\" -c \"SELECT 'public.categories' as tbl, count(*) FROM public.categories UNION ALL SELECT 'public.product', count(*) FROM public.product UNION ALL SELECT 'public.variant', count(*) FROM public.variant UNION ALL SELECT 'public.business', count(*) FROM public.business UNION ALL SELECT 'public.showroom', count(*) FROM public.showroom;\""
        
        print(f"Executing query on source db...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        print(f"Exit status: {exit_status}")
        if out:
            print("[STDOUT]")
            print(out)
        if err:
            print("[STDERR]")
            print(err)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
