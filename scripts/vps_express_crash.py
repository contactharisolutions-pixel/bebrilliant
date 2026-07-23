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

        # Find the latest error log file for bebrilliant-express
        run_cmd(ssh,
            "ls -la /root/.pm2/logs/ | grep bebrilliant-express",
            "List bebrilliant-express log files")

        run_cmd(ssh,
            "tail -100 /root/.pm2/logs/bebrilliant-express-error-26.log 2>/dev/null || "
            "tail -100 $(ls /root/.pm2/logs/bebrilliant-express-error-*.log 2>/dev/null | tail -1)",
            "Express error log (last 100 lines)")

        run_cmd(ssh,
            "tail -30 /root/.pm2/logs/bebrilliant-express-out-26.log 2>/dev/null || "
            "tail -30 $(ls /root/.pm2/logs/bebrilliant-express-out-*.log 2>/dev/null | tail -1)",
            "Express out log (last 30 lines)")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
