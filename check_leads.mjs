import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkLeads() {
    const { count, error } = await supabase.from('owner_leads').select('*', { count: 'exact', head: true })
    if (error) console.error('Error:', error)
    else console.log('Total Leads:', count)
}

checkLeads()
