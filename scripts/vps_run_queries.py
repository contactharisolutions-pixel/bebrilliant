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

        # Let's write a temporary script on the VPS
        node_script = """
const { createClient } = require('/var/www/bebrilliant/node_modules/@supabase/supabase-js');
const dotenv = require('/var/www/bebrilliant/node_modules/dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: '/var/www/bebrilliant/.env.production' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Service Key is defined:", !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function run() {
    try {
        const { data: wallet, error: wError } = await supabase
            .from('owner_wallet')
            .select('*')
            .maybeSingle();

        console.log("Wallet Data:", wallet);
        console.log("Wallet Error:", wError);
        
        const { data: typeStats, error: tError } = await supabase
            .from('payments')
            .select('type, amount')
            .eq('status', 'success');
            
        console.log("Payments Data Count:", typeStats ? typeStats.length : 0);
        console.log("Payments Error:", tError);

        const { count: activeSubs, error: sError } = await supabase
            .from('tenant_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
            
        console.log("Active Subs Count:", activeSubs);
        console.log("Active Subs Error:", sError);

    } catch (e) {
        console.error("Error in script:", e);
    }
}
run();
"""
        sftp = ssh.open_sftp()
        with sftp.file('/tmp/test_queries.js', 'w') as f:
            f.write(node_script)
        sftp.close()

        # Run the script using node under the same environment
        print("Running query script on VPS...")
        stdin, stdout, stderr = ssh.exec_command(
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& cd /var/www/bebrilliant && node /tmp/test_queries.js"
        )
        exit_status = stdout.channel.recv_exit_status()
        print(f"Exit status: {exit_status}")
        print("[STDOUT]")
        print(stdout.read().decode('utf-8', errors='ignore'))
        print("[STDERR]")
        print(stderr.read().decode('utf-8', errors='ignore'))

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
