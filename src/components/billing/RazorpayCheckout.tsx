'use client'

import { useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { Check, ShieldCheck } from 'lucide-react'

// You must declare Razorpay on Window for TS to know it exists when using external script
declare global {
    interface Window {
        Razorpay: any
    }
}

export default function RazorpayCheckout({ tenantId, userEmail, userName }: { tenantId: string, userEmail: string, userName: string }) {
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentResponse, setPaymentResponse] = useState<string | null>(null)

    const handleCheckout = async () => {
        setIsProcessing(true)
        setPaymentResponse(null)

        try {
            // 1. Ask Backend to Generate RazorPay Order
            const orderRes = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_name: 'Premium Yearly Access',
                    amount_inr: 2999
                })
            })

            const order = await orderRes.json()

            if (!orderRes.ok) throw new Error(order.error || 'Failed to create payment context')

            // 2. Initialize Razorpay popup
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: order.amount,
                currency: order.currency,
                name: "BrilliantBoard",
                description: "Annual Tenant Subscription",
                image: "/apple-icon.png", // Or public logo URL
                order_id: order.id,

                // 3. Callback upon successful UI checkout
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                tenant_id: tenantId
                            })
                        })

                        const verifyData = await verifyRes.json()
                        if (!verifyRes.ok) throw new Error(verifyData.error)

                        setPaymentResponse('Payment Validated! Your tenant has been permanently activated.')
                        setTimeout(() => {
                            router.push('/dashboard') // Redirect back to active operations!
                            router.refresh()
                        }, 2500)

                    } catch (verifyError: any) {
                        setPaymentResponse(`Verification Error: ${verifyError.message}`)
                    }
                },
                prefill: {
                    name: userName || "Tenant Admin",
                    email: userEmail
                },
                theme: {
                    color: "#672AEA", // Theme branding primary color
                }
            }

            const paymentObject = new window.Razorpay(options)
            paymentObject.on('payment.failed', function (response: any) {
                setPaymentResponse('Payment attempt failed. Please try a different card.')
                console.error(response.error)
            })

            paymentObject.open()

        } catch (err: any) {
            console.error(err)
            setPaymentResponse('System failure. Please check your network and try again.')
        } finally {
            setIsProcessing(false) // Note: Popup is active but API request is done
        }
    }

    return (
        <>
            <Script id="razorpay-js" src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="bg-white border rounded-2xl shadow-xl p-8 max-w-sm w-full mx-auto relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110" />

                <h2 className="text-2xl font-bold text-gray-900 mb-1">Premium Tenant</h2>
                <div className="text-sm text-gray-500 mb-6 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-600" /> Billed Annually</div>

                <div className="flex items-baseline gap-2 mb-6 border-b pb-6">
                    <span className="text-4xl font-extrabold text-[#1B1D21]">â‚¹2,999</span>
                    <span className="text-gray-500 font-medium">/ year</span>
                </div>

                <ul className="space-y-4 mb-8">
                    {['Up to 500 Students', 'Unlimited Active Exams', 'Role-Based Dashboards', 'Premium Analytics UI'].map((feature, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700">
                            <span className="bg-purple-100 p-0.5 rounded-full h-fit mt-0.5">
                                <Check className="w-3.5 h-3.5 text-purple-700" strokeWidth={3} />
                            </span>
                            {feature}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-[#672AEA] to-[#1FAC63] hover:from-[#5A24CC] hover:to-[#7C3AED] text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-75 relative overflow-hidden"
                >
                    {isProcessing ? 'Connecting Server...' : 'Pay with RazorPay'}
                </button>

                {paymentResponse && (
                    <div className={`mt-4 text-sm font-medium p-3 rounded-lg ${paymentResponse.includes('Failed') || paymentResponse.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {paymentResponse}
                    </div>
                )}
            </div>
        </>
    )
}
