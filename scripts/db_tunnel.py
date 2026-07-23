import socket
import sys
import threading
import paramiko

# Configure stdout encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

VPS_IP = "89.116.33.188"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Life@20242526"

LOCAL_PORT = 5433
REMOTE_HOST = "127.0.0.1"
REMOTE_PORT = 5432

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
        except:
            pass
        try:
            destination.close()
        except:
            pass

def forward_connection(client_socket, transport):
    try:
        chan = transport.open_channel(
            'direct-tcpip',
            (REMOTE_HOST, REMOTE_PORT),
            client_socket.getpeername()
        )
        if chan is None:
            print("Failed to open remote SSH channel.")
            client_socket.close()
            return
        
        print("Tunnel connection established.")
        # Start two threads to copy data back and forth
        t1 = threading.Thread(target=pipe, args=(client_socket, chan), daemon=True)
        t2 = threading.Thread(target=pipe, args=(chan, client_socket), daemon=True)
        t1.start()
        t2.start()
    except Exception as e:
        print(f"Error forwarding connection: {e}")
        client_socket.close()

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to SSH server {VPS_IP}:{VPS_PORT}...")
    try:
        client.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    except Exception as e:
        print(f"SSH connection failed: {e}")
        sys.exit(1)
        
    print("SSH connection established successfully.")
    
    local_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    local_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        local_socket.bind(('127.0.0.1', LOCAL_PORT))
        local_socket.listen(100)
        print(f"Tunnel listening on local port {LOCAL_PORT} -> remote {REMOTE_HOST}:{REMOTE_PORT}...")
    except Exception as e:
        print(f"Failed to bind local port {LOCAL_PORT}: {e}")
        client.close()
        sys.exit(1)
        
    try:
        while True:
            client_socket, addr = local_socket.accept()
            print(f"Received local connection from {addr}")
            threading.Thread(target=forward_connection, args=(client_socket, client.get_transport()), daemon=True).start()
    except KeyboardInterrupt:
        print("Exiting...")
    finally:
        local_socket.close()
        client.close()

if __name__ == '__main__':
    main()
