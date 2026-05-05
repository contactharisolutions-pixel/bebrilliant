'use client'

import React, { useState, useEffect } from 'react'
import { X, Tag, Calculator, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'
import Script from 'next/script'

interface PricingBreakdown {
    base_amount: number;
    discount_amount: number;
    taxable_amount: number;
    gst_percent: number;
    gst_amount: number;
    total_amount: number;
    coupon_applied?: string;
    offer_applied?: string;
}

export default function CheckoutOverlay({ 
    isOpen, 
    onClose, 
    item, 
    user 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    item: { id: string; title: string; price: number; type: 'EXAM' | 'PLAN' };
    user: { id: string; email: string; name: string; tenantId?: string; }
}) {
    const [coupon, setCoupon] = useState('')
    const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchBreakdown = async (code?: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/payments/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseAmount: item.price,
                    couponCode: code || undefined,
                    tenantId: user.tenantId,
                    userId: user.id,
                    itemType: item.type,
                    itemId: item.id
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setBreakdown(data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) fetchBreakdown()
    }, [isOpen, item.id])

    const handleApplyCoupon = () => {
        fetchBreakdown(coupon)
    }

    const handlePayment = async () => {
        setProcessing(true)
        try {
            // 1. Create Order
            const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    [item.type === 'PLAN' ? 'plan_id' : 'exam_id']: item.id,
                    coupon_code: coupon || undefined
                })
            })
            const order = await res.json()
            if (!res.ok) throw new Error(order.error)

            // 2. Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: order.amount,
                currency: order.currency,
                name: "BrilliantBoard",
                description: `Purchase: ${item.title}`,
                order_id: order.id,
                handler: async function (response: any) {
                    const verifyRes = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...response,
                            tenant_id: user.tenantId
                        })
                    })
                    if (verifyRes.ok) {
                        alert('Purchase Successful!')
                        onClose()
                        window.location.reload()
                    }
                },
                prefill: { name: user.name, email: user.email },
                theme: { color: P.brand }
            }
            const rzp = new (window as any).Razorpay(options)
            rzp.open()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setProcessing(false)
        }
    }

    if (!isOpen) return null

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <style>{GLASS_STYLES}</style>
            
            {/* BACKDROP */}
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} />

            {/* MODAL */}
            <div className="glass-card" style={{ 
                position: 'relative', width: '100%', maxWidth: 500, background: '#fff', borderRadius: 32, 
                overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease-out'
            }}>
                <header style={{ padding: '32px 40px 24px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>Checkout Terminal</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: P.muted, fontWeight: 600 }}>Review your institutional purchase</p>
                    </div>
                    <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: P.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} color={P.dark} />
                    </button>
                </header>

                <div style={{ padding: 40 }}>
                    {/* ITEM INFO */}
                    <div style={{ background: P.bg, padding: 24, borderRadius: 24, border: `1px solid ${P.border}`, marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 900, color: P.brand, textTransform: 'uppercase', marginBottom: 4 }}>{item.type}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: P.dark }}>{item.title}</div>
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: P.dark }}>₹{item.price.toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    {/* COUPON SECTION */}
                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.dark, marginBottom: 12 }}>Promotional Code</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Tag size={16} color={P.muted} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                <input 
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                                    placeholder="Enter code (e.g. SAVE20)" 
                                    style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, border: `1px solid ${P.border}`, fontSize: 14, background: P.bg, outline: 'none', boxSizing: 'border-box' }} 
                                />
                            </div>
                            <button 
                                onClick={handleApplyCoupon}
                                disabled={loading || !coupon}
                                style={{ padding: '0 24px', borderRadius: 14, background: P.dark, color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Apply'}
                            </button>
                        </div>
                        {breakdown?.offer_applied && (
                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: P.success, fontSize: 12, fontWeight: 800 }}>
                                <CheckCircle2 size={16} /> Benefit Unlocked: {breakdown.offer_applied}
                            </div>
                        )}
                    </div>

                    {/* TAX BREAKDOWN */}
                    <div style={{ background: P.bg, padding: 24, borderRadius: 24, border: `1px dashed ${P.border}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: P.muted }}>
                                <span>Subtotal</span>
                                <span>₹{breakdown?.base_amount.toLocaleString('en-IN') || item.price.toLocaleString('en-IN')}</span>
                            </div>
                            {breakdown && breakdown.discount_amount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: P.success }}>
                                    <span>Discount</span>
                                    <span>-₹{breakdown.discount_amount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: P.muted }}>
                                <span>GST ({breakdown?.gst_percent || 18}%)</span>
                                <span>₹{breakdown?.gst_amount.toLocaleString('en-IN') || '---'}</span>
                            </div>
                            <div style={{ height: 1, background: P.border, margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 950, color: P.dark }}>
                                <span>Total Payable</span>
                                <span>₹{breakdown?.total_amount.toLocaleString('en-IN') || '---'}</span>
                            </div>
                        </div>
                    </div>

                    {error && <div style={{ marginTop: 24, padding: 16, background: P.errorBg, borderRadius: 12, color: P.error, fontSize: 13, fontWeight: 700 }}>{error}</div>}

                    {/* PAY BUTTON */}
                    <button 
                        onClick={handlePayment}
                        disabled={processing || loading}
                        style={{ 
                            width: '100%', marginTop: 32, padding: 20, borderRadius: 18, background: P.brand, color: '#fff', 
                            border: 'none', fontWeight: 950, fontSize: 16, cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: `0 20px 40px ${P.brand}30`
                        }}
                    >
                        {processing ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Secure Checkout</>}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: P.muted, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Calculator size={14} /> Tax calculations compliant with 2024 Finance Act
                    </div>
                </div>

                <style>{`
                    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                    .hover-lift:hover { transform: translateY(-2px); }
                `}</style>
            </div>
        </div>
    )
}
