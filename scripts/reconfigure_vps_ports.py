import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_ssh_commands(ssh, commands):
    for cmd in commands:
        print(f"\nExecuting: {cmd}")
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

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        # 1. Back up and edit docker-compose.yml
        print("\n--> 1. Editing docker-compose.yml on VPS...")
        
        # Read the file
        sftp = ssh.open_sftp()
        dc_path = "/opt/supabase/docker/docker-compose.yml"
        with sftp.file(dc_path, "r") as f:
            lines = f.readlines()
            
        new_lines = []
        in_db = False
        in_supavisor = False
        db_ports_added = False
        
        for line in lines:
            stripped = line.strip()
            
            # Identify services
            if stripped == "db:":
                in_db = True
                in_supavisor = False
            elif stripped == "supavisor:":
                in_supavisor = True
                in_db = False
            elif stripped.endswith(":") and not (stripped.startswith("#") or "db" in stripped or "supavisor" in stripped):
                # Any other service
                in_db = False
                in_supavisor = False
                
            # Edit db service: add ports mapping
            if in_db and stripped == "image: supabase/postgres:15.8.1.085":
                new_lines.append(line)
                new_lines.append("    ports:\n")
                new_lines.append("      - 5432:5432\n")
                db_ports_added = True
                continue
                
            # Edit supavisor service: change port mapping
            if in_supavisor and stripped == "- ${POSTGRES_PORT}:5432":
                new_lines.append("      - 5433:5432\n")
                continue
                
            new_lines.append(line)
            
        # Write the updated docker-compose.yml
        with sftp.file(dc_path, "w") as f:
            f.writelines(new_lines)
        print("[OK] docker-compose.yml edited and saved.")
        
        # 2. Restart Supabase stack
        print("\n--> 2. Restarting Supabase Docker stack to apply port updates...")
        restart_cmds = [
            "cd /opt/supabase/docker && docker compose down",
            "cd /opt/supabase/docker && docker compose up -d"
        ]
        run_ssh_commands(ssh, restart_cmds)
        
        # 3. Verify netstat and docker ps
        print("\n--> 3. Checking netstat for port 5432 & 5433...")
        verify_cmds = [
            "netstat -tulnp | grep -E '5432|5433'",
            "docker ps | grep -E 'db|pooler'"
        ]
        run_ssh_commands(ssh, verify_cmds)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
