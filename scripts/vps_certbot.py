'use strict';
# python script
import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_certbot():
    print("Connecting to VPS via SSH to run Certbot SSL setup...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        # Install Certbot & Nginx plugin first
        install_cmd = "apt-get update && apt-get install -y certbot python3-certbot-nginx"
        print(f"Executing: {install_cmd}")
        stdin, stdout, stderr = ssh.exec_command(install_cmd)
        exit_status = stdout.channel.recv_exit_status()
        
        # Certbot non-interactive command
        certbot_cmd = (
            "certbot --nginx --non-interactive --agree-tos "
            "--email support@bebrilliant.in --redirect "
            "-d bebrilliant.in -d www.bebrilliant.in -d shop.bebrilliant.in -d supabase.bebrilliant.in"
        )
        
        print(f"Executing: {certbot_cmd}")
        stdin, stdout, stderr = ssh.exec_command(certbot_cmd)
        
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out:
            print(f"[STDOUT]\n{out.encode('ascii', errors='replace').decode('ascii')}")
        if err:
            print(f"[STDERR]\n{err.encode('ascii', errors='replace').decode('ascii')}")
            
        if exit_status == 0:
            print("\n=====================================================")
            print("          SSL/HTTPS CONFIGURATION SUCCESSFUL         ")
            print("=====================================================")
            print("Your domains are now running securely over HTTPS:")
            print("- https://bebrilliant.in (Next.js App)")
            print("- https://shop.bebrilliant.in (Storefront UI)")
            print("- https://supabase.bebrilliant.in (Supabase Gateway)")
            print("=====================================================")
        else:
            print(f"ERROR: Certbot failed with exit status {exit_status}")
            
    except Exception as e:
        print(f"[ERROR] Connection or execution failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    run_certbot()
