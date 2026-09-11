import socket
import sys
import threading
import paramiko
import time

sys.stdout.reconfigure(encoding='utf-8')

VPS_IP = "89.116.33.188"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Life@20242526"

TUNNELS = [
    (8000, "127.0.0.1", 8000, "Supabase Kong Gateway"),
    (5433, "127.0.0.1", 5432, "PostgreSQL Database"),
]

def pipe(source, destination):
    try:
        while True:
            data = source.recv(4096)
            if not data:
                break
            destination.sendall(data)
    except Exception:
        pass
    finally:
        try:
            source.close()
        except Exception:
            pass
        try:
            destination.close()
        except Exception:
            pass

def forward_connection(client_socket, transport, remote_host, remote_port):
    try:
        chan = transport.open_channel(
            'direct-tcpip',
            (remote_host, remote_port),
            client_socket.getpeername()
        )
        if chan is None:
            client_socket.close()
            return
        
        t1 = threading.Thread(target=pipe, args=(client_socket, chan), daemon=True)
        t2 = threading.Thread(target=pipe, args=(chan, client_socket), daemon=True)
        t1.start()
        t2.start()
    except Exception:
        client_socket.close()

def listen_tunnel(local_port, remote_host, remote_port, label, transport):
    local_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    local_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        local_socket.bind(('127.0.0.1', local_port))
        local_socket.listen(100)
        print(f"[TUNNEL READY] 127.0.0.1:{local_port} -> VPS {remote_host}:{remote_port} ({label})")
    except Exception as e:
        print(f"[ERROR] Failed to bind local port {local_port} for {label}: {e}")
        return

    while True:
        try:
            client_socket, _ = local_socket.accept()
            threading.Thread(
                target=forward_connection,
                args=(client_socket, transport, remote_host, remote_port),
                daemon=True
            ).start()
        except Exception:
            break

def main():
    print(f"Connecting SSH to VPS {VPS_IP}:{VPS_PORT}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    except Exception as e:
        print(f"[ERROR] SSH connection failed: {e}")
        sys.exit(1)
        
    print("[OK] SSH connection established.")
    transport = client.get_transport()

    for local_port, remote_host, remote_port, label in TUNNELS:
        t = threading.Thread(
            target=listen_tunnel,
            args=(local_port, remote_host, remote_port, label, transport),
            daemon=True
        )
        t.start()

    print("[INFO] Live Database & Gateway tunnels are active. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping tunnel...")
    finally:
        client.close()

if __name__ == '__main__':
    main()
