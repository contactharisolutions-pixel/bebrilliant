import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import RazorpayCheckout from '@/components/billing/RazorpayCheckout'

export default async function BillingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Get profile to find Tenant ID
    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('tenant_id, first_name, last_name, email')
        .eq('id', user.id)
        .single()

    const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Tenant Admin'

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-8">
            <div className="mb-12 text-center max-w-lg">
                <h1 className="text-3xl font-bold tracking-tight mb-4 text-gray-900">Activate Your Workspace</h1>
                <p className="text-gray-500 font-medium">
                    Your institutional dashboard requires an active subscription. Choose a plan below to permanently unlock analytics, examinations, and full RBAC controls.
                </p>
            </div>

            <RazorpayCheckout
                tenantId={profile?.tenant_id || ''}
                userEmail={user.email || ''}
                userName={name}
            />
        </div>
    )
}
