import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_ssh_commands(ssh, commands, log_file):
    for cmd in commands:
        log_file.write(f"\n=========================================\nExecuting: {cmd}\n=========================================\n")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        log_file.write(f"Exit status: {exit_status}\n")
        if out:
            log_file.write("[STDOUT]\n")
            log_file.write(out + "\n")
        if err:
            log_file.write("[STDERR]\n")
            log_file.write(err + "\n")

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        commands = [
            "docker ps",
            "docker compose -f /opt/supabase/docker/docker-compose.yml ps",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 status",
            "tail -n 100 ~/.pm2/logs/*.log 2>/dev/null",
            "netstat -tulnp",
            "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT table_schema, count(*) FROM information_schema.tables WHERE table_schema IN ('public', 'auth', 'storage') GROUP BY table_schema;\"",
            "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT 'public.categories' as tbl, count(*) FROM public.categories UNION ALL SELECT 'public.product', count(*) FROM public.product UNION ALL SELECT 'public.variant', count(*) FROM public.variant UNION ALL SELECT 'public.business', count(*) FROM public.business UNION ALL SELECT 'public.showroom', count(*) FROM public.showroom;\""
        ]
        with open("vps_status.log", "w", encoding="utf-8") as f:
            run_ssh_commands(ssh, commands, f)
        print("[OK] Diagnostics written to vps_status.log.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
