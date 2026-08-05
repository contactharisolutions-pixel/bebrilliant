import os
import sys
import subprocess
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

# VPS Connection Credentials
VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_local_cmd(cmd):
    print(f"--> [Local Exec]: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.stdout:
        print(res.stdout)
    if res.stderr and res.returncode != 0:
        print(f"[Error]: {res.stderr}")
    if res.returncode != 0:
        raise Exception(f"Local command failed: {cmd}")

def push_to_git():
    print("\n=======================================================")
    print(" Step 1: Pushing Local Changes to GitHub (origin/main) ")
    print("=======================================================")
    
    # Check git status
    status = subprocess.run("git status --porcelain", shell=True, capture_output=True, text=True).stdout.strip()
    if status:
        print("[!] Local changes detected. Staging and committing...")
        run_local_cmd("git add .")
        if sys.stdin and sys.stdin.isatty():
            commit_msg = input("Enter commit message [Auto-deploy sync]: ").strip() or "Auto-deploy sync"
        else:
            commit_msg = sys.argv[1] if len(sys.argv) > 1 else "Configure Local -> Git -> Hostinger VPS deployment pipeline"
        run_local_cmd(f'git commit -m "{commit_msg}"')
    else:
        print("[OK] Working tree clean.")

    print("[+] Pushing branch 'main' to remote origin...")
    run_local_cmd("git push origin main")
    print("[OK] Pushed to GitHub successfully.")

def trigger_vps_deployment():
    print("\n=======================================================")
    print(" Step 2: Triggering Git Deployment on Hostinger VPS     ")
    print("=======================================================")
    
    print(f"--> Connecting to Hostinger VPS ({VPS_IP})...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to VPS via SSH.")
        
        commands = [
            "mkdir -p /var/www/bebrilliant",
            "if [ ! -d /var/www/bebrilliant/.git ]; then cd /var/www/bebrilliant && git init && (git remote add origin https://github.com/contactharisolutions-pixel/bebrilliant.git || git remote set-url origin https://github.com/contactharisolutions-pixel/bebrilliant.git); fi",
            "cd /var/www/bebrilliant && git fetch origin main && git checkout -B main origin/main && git reset --hard origin/main",
            "chmod +x /var/www/bebrilliant/scripts/vps-git-deploy.sh || true",
            "bash /var/www/bebrilliant/scripts/vps-git-deploy.sh"
        ]
        
        for cmd in commands:
            print(f"\n--> Executing on VPS: {cmd}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            
            # Stream output live
            while True:
                line = stdout.readline()
                if not line:
                    break
                print(line, end="")
                
            err = stderr.read().decode('utf-8', errors='ignore')
            exit_code = stdout.channel.recv_exit_status()
            
            if err and exit_code != 0:
                print(f"[STDERR]:\n{err}")
                
            if exit_code != 0:
                raise Exception(f"VPS command failed with exit status {exit_code}")

        print("\n=======================================================")
        print("          Deployment Pipeline Completed Successfully    ")
        print("=======================================================")

    except Exception as e:
        print(f"\n[ERROR] Deployment failed: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    try:
        push_to_git()
        trigger_vps_deployment()
    except Exception as e:
        print(f"\n[FATAL ERROR]: {e}")
        sys.exit(1)
