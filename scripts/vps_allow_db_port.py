import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_cmd(ssh, cmd, label=""):
    print(f"\n=========================================")
    if label:
        print(f"# {label}")
    print(f"Executing: {cmd}")
    print("=========================================")
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
    return exit_status, out

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")

        # Check UFW firewall status
        run_cmd(ssh, "ufw status", "Check UFW status")

        # Allow port 5433/tcp
        run_cmd(ssh, "ufw allow 5433/tcp", "Allow Postgres port 5433")
        run_cmd(ssh, "ufw reload", "Reload UFW")

        # Check if docker port mapping is running
        run_cmd(ssh, "docker ps | grep db", "Verify docker db container mapping")

        # Check if iptables is blocking it or if there is another firewall
        run_cmd(ssh, "ufw status verbose", "UFW Detailed Status")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
