'use client'
import React, { useState, useEffect } from 'react'
import { 
    Wallet, Package, Zap, Award, 
    History, ArrowRight, CreditCard,
    CheckCircle2, Clock, ShieldCheck, 
    TrendingUp, Rocket, RefreshCcw, Search
} from 'lucide-react'
import Script from 'next/script'
export default function StudentWalletRecharge() {
    const [loading, setLoading] = useState(true)
    const [packages, setPackages] = useState([])
    const [wallet, setWallet] = useState({ free_credits: 0, paid_credits: 0, total_balance: 0, transactions: [] as any[] })
    const [rechargingId, setRechargingId] = useState<string | null>(null)
    useEffect(() => {
        fetchInitialData()
    }, [])
    const fetchInitialData = async () => {
        try {
            const [walletRes, txnRes, pkgRes] = await Promise.all([
                fetch('/api/student/wallet'),
                fetch('/api/student/wallet/transactions?limit=20'),
                fetch('/api/student/wallet/packages')
            ])
            const walletData = await walletRes.json()
            const txnData   = await txnRes.json()
            const pkgData   = await pkgRes.json()
            setWallet({
                free_credits:  walletData.free_credits  ?? 0,
                paid_credits:  walletData.paid_credits  ?? 0,
                total_balance: walletData.total_balance ?? 0,
                transactions:  txnData.transactions     ?? [],
            })
            if (!pkgData.error) setPackages(pkgData.packages || [])
        } catch (err) {
            console.error('Failed to fetch wallet data', err)
        } finally {
            setLoading(false)
        }
    }
    const handleRecharge = async (pkg: any) => {
        setRechargingId(pkg.id)
        try {
            // 1. Create Order
            const orderRes = await fetch('/api/student/wallet/recharge/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ package_id: pkg.id })
            })
            const orderData = await orderRes.json()
            if (orderData.error) throw new Error(orderData.error)
            // 2. Initialize Razorpay Checkout
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Academic Credits",
                description: `Purchase ${pkg.credits + (pkg.bonus || 0)} Credits`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    const verifyRes = await fetch('/api/student/wallet/recharge/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    })
                    const verifyData = await verifyRes.json()
                    if (verifyData.success) {
                        alert('Payment Successful! Wallet Updated.')
                        fetchInitialData() // Refresh balances
                    } else {
                        alert('Payment verification failed. Please contact support.')
                    }
                },
                prefill: {
                    name: "", // Will be filled by Razorpay if email/phone available
                    email: ""
                },
                theme: { color: "var(--color-primary)" }
            }
            const rzp = new (window as any).Razorpay(options)
            rzp.on('payment.failed', function (response: any) {
                alert('Payment Failed: ' + response.error.description)
            })
            rzp.open()
        } catch (error: any) {
            alert(error.message || 'Something went wrong')
        } finally {
            setRechargingId(null)
        }
    }
     if (loading) return (
        <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
             <p style={{ fontWeight: 800, color: '#64748B' }}>Loading Academic Wallet...</p>
        </div>
    )
    return (
        <div style={{ padding: '32px 40px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
             {/* DUAL BALANCE BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>My Wallet & Transactions</h1>
                    <p style={{ color: '#64748B', fontWeight: 600, marginTop: 8 }}>Manage your credits, track exam fees, and buy extra exam passes.</p>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    {/* FREE CREDITS */}
                    <div style={{ background: '#ECFDF5', padding: '16px 28px', borderRadius: 24, border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, background: '#10B981', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={22} color="#FFF" />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎁 Free Credits</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: '#065F46' }}>{wallet.free_credits}</div>
                        </div>
                    </div>
                    {/* PAID CREDITS */}
                    <div style={{ background: '#FFF', padding: '16px 28px', borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                        <div style={{ width: 48, height: 48, background: 'var(--color-primary-gradient)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
                            <Wallet size={22} color="#FFF" />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💳 Paid Credits</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A' }}>{wallet.paid_credits}</div>
                        </div>
                    </div>
                    {/* TOTAL */}
                    <div style={{ background: 'var(--color-primary-gradient)', padding: '16px 28px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-primary)' }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Balance</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{wallet.total_balance} CREDITS</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.4fr', gap: 40 }}>
                {/* LEFT: Package Grid */}
                 <div>
                     <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Rocket size={24} color="var(--color-primary)" /> Add Credits
                        <span style={{ fontSize: 12, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 10, fontWeight: 800, marginLeft: 8 }}>SECURE ENCRYPTION</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                        {packages.map((pkg: any) => (
                            <div key={pkg.id} style={{ 
                                background: '#FFF', padding: 24, borderRadius: 28, border: '1px solid #E2E8F0', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden',
                                transition: 'all 0.2s', cursor: 'default'
                            }}>
                                {pkg.bonus > 0 && (
                                    <div style={{ 
                                        position: 'absolute', top: 12, right: -30, background: '#10B981', color: '#FFF', 
                                        padding: '4px 40px', fontSize: 11, fontWeight: 900, transform: 'rotate(45deg)',
                                        boxShadow: '0 4px 10px rgba(16,185,129,0.3)'
                                    }}>
                                        +{pkg.bonus} BONUS
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                    <div style={{ width: 48, height: 48, background: '#F8FAFC', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={24} color="#475569" />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>₹{pkg.price}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Incl. GST</div>
                                    </div>
                                </div>
                                 <div style={{ marginBottom: 28 }}>
                                    <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>{pkg.name} Plan</h4>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                        <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.05em' }}>{pkg.credits + pkg.bonus}</span>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: '#94A3B8' }}>CREDITS</span>
                                    </div>
                                </div>
                                 <button 
                                    onClick={() => handleRecharge(pkg)}
                                    disabled={rechargingId !== null}
                                    style={{ 
                                        width: '100%', padding: '16px', borderRadius: 18, border: 'none',
                                        background: rechargingId === pkg.id ? '#F1F5F9' : 'var(--color-primary-gradient)',
                                        color: rechargingId === pkg.id ? '#94A3B8' : '#FFF',
                                        fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        transition: 'all 0.2s', boxShadow: 'var(--shadow-primary)'
                                    }}
                                >
                                    {rechargingId === pkg.id ? <RefreshCcw size={18} style={{ animation: 'spin 1.5s linear infinite' }} /> : <><Zap size={18} fill="#FFF" /> PURCHASE CREDITS</>}
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Trust Banner */}
                    <div style={{ marginTop: 40, background: '#EEF2FF', padding: '20px 32px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
                        <ShieldCheck size={32} color="#4F46E5" />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1B4B' }}>Enterprise Grade Security</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>All transactions are processed via Razorpay's PCI-DSS compliant infrastructure.</div>
                        </div>
                    </div>
                </div>
                {/* RIGHT: Transaction History */}
                <div>
                     <div style={{ background: '#FFF', padding: 32, borderRadius: 28, border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                         <h4 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <History size={20} color="var(--color-primary)" /> Recent Transactions
                        </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {wallet.transactions.length > 0 ? wallet.transactions.map((t: any) => (
                                <div key={t.id} style={{ 
                                    padding: '16px 20px', background: '#F8FAFC', borderRadius: 18, border: '1px solid #F1F5F9',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.txn_type === 'credit' ? '#10B981' : '#EF4444' }} />
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', textTransform: 'capitalize' }}>
                                                {t.source?.replace(/_/g, ' ') || 'Adjustment'}
                                            </div>
                                            {/* Credit type badge */}
                                            <div style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                                background: t.credit_type === 'free' ? '#ECFDF5' : '#EFF6FF',
                                                color: t.credit_type === 'free' ? '#059669' : '#2563EB'
                                            }}>
                                                {t.credit_type === 'free' ? '🎁 Free' : '💳 Paid'}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Clock size={12} /> {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                     <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: t.txn_type === 'credit' ? '#10B981' : '#EF4444' }}>
                                            {t.txn_type === 'credit' ? '+' : '-'}{t.amount} CREDITS
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase' }}>BAL: {t.balance_after}</div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ background: '#F8FAFC', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <Zap size={24} color="#CBD5E1" />
                                    </div>
                                    <p style={{ color: '#94A3B8', fontWeight: 600, fontSize: 14 }}>No transactions recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                     <div style={{ marginTop: 24, padding: '24px 32px', background: 'var(--color-primary-gradient)', borderRadius: 28, color: '#FFF', boxShadow: 'var(--shadow-primary)' }}>
                        <TrendingUp size={32} style={{ marginBottom: 12 }} />
                          <div style={{ fontSize: 14, fontWeight: 800 }}>Bonus System</div>
                        <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, lineHeight: 1.6 }}>Unlock bonus credits with premium recharge packs. Happy learning!</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
