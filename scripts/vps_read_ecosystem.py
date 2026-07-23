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
        sftp = ssh.open_sftp()
        
        try:
            with sftp.open('/var/www/bebrilliant/ecosystem.config.js', 'r') as f:
                content = f.read()
                print("--- Current ecosystem.config.js on VPS ---")
                print(content.decode('utf-8'))
        except FileNotFoundError:
            print("File ecosystem.config.js not found on VPS.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
