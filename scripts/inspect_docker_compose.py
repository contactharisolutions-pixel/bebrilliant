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
        
        # Read docker-compose.yml
        stdin, stdout, stderr = ssh.exec_command("cat /opt/supabase/docker/docker-compose.yml")
        content = stdout.read().decode('utf-8', errors='ignore')
        
        # Write to local file for inspection
        with open("vps_docker_compose.yml", "w", encoding="utf-8") as f:
            f.write(content)
        print("[OK] docker-compose.yml saved locally to vps_docker_compose.yml")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
