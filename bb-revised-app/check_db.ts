import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing ENV')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function checkConfig() {
    const { data, error } = await supabaseAdmin.from('exam_config').select('*')
    if (error) {
        console.error('Error:', error.message)
    } else {
        console.log('Exam Configs:', JSON.stringify(data, null, 2))
    }
}

checkConfig()
