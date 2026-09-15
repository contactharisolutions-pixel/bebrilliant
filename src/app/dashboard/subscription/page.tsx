'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
    CreditCard, CheckCircle2, Zap, Package, Info, ShieldCheck,
    Settings, ArrowRight, ShieldAlert, CalendarDays, Loader2, XCircle,
    Activity, Cpu, BarChart3, Globe, Shield, RefreshCcw, History,
    ArrowUpRight, Lock, Target, Plus, Check, Percent, FileText,
    Receipt, Download, Printer, ExternalLink, HelpCircle, AlertTriangle,
    Coins, Building2, Phone, Mail, MapPin, Hash, Sparkles
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SubscriptionState {
    plan_id: string;
    plan_name?: string;
    plan_type?: string;
    tenant_type?: string;
    is_solo?: boolean;
    allow_multiple_teachers?: boolean;
    status: string;
    renewal: string;
    start_date?: string;
    auto_renew: boolean;
    billing_cycle?: string;
    amount?: number;
}

interface Plan {
    id: string;
    name: string;
    raw_name?: string;
    type?: string;
    category?: string;
    is_solo?: boolean;
    allow_multiple_teachers?: boolean;
    teachers_label?: string;
    price: number;
    annual_price: number;
    max_students: number;
    max_teachers: number;
    max_storage_gb: number;
    max_ai_tokens: number;
    features: string[];
}

interface Usage {
    students: number;
    max_students: number;
    teachers: number;
    max_teachers: number;
    storage: number;
    max_storage: number;
    ai_tokens: number;
    max_ai_tokens: number;
}

interface Invoice {
    id: string;
    invoice_no: string;
    plan_name: string;
    base_amount: number;
    gst_amount: number;
    total_amount: number;
    gst_percent: number;
    status: string;
    type: string;
    promo_code?: string | null;
    discount_amount?: number;
    created_at: string;
    pdf_url?: string | null;
}

interface BillingSettings {
    legal_name: string;
    gstin: string;
    pan: string;
    billing_email: string;
    billing_phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    auto_renew: boolean;
}

interface ExecutiveSummary {
    current_tier: string;
    mrr_inr: number;
    renewal_date: string;
    resource_health_pct: number;
    total_invoices_settled: number;
    total_paid_inr: number;
}

const COLORS = {
    primary: '#004B93',
    primaryHover: '#003870',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    emerald: '#10B981',
    emeraldLight: '#ECFDF5',
    amber: '#F59E0B',
    amberLight: '#FFFBEB',
    rose: '#EF4444',
    roseLight: '#FEF2F2',
    slateDark: '#0F172A',
    slateMedium: '#334155',
    slateLight: '#64748B',
    border: '#E2E8F0',
    background: '#F8FAFC',
    cardBg: '#FFFFFF'
};

// ── TAX RECEIPT MODAL ─────────────────────────────────────────
function TaxReceiptModal({ invoice, billingSettings, onClose }: { invoice: Invoice; billingSettings: BillingSettings; onClose: () => void }) {
    const handlePrint = () => {
        window.print();
    };

    const cgst = (invoice.gst_amount / 2).toFixed(2);
    const sgst = (invoice.gst_amount / 2).toFixed(2);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[12000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#004B93] rounded-xl">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Official Tax Invoice & Receipt</h3>
                            <p className="text-xs text-slate-500 font-medium">HSN / SAC Code: 998313 (IT & Software Services)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                        >
                            <Printer size={14} /> Print / Save PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Body */}
                <div className="p-8 overflow-y-auto print:p-0 space-y-6 text-slate-800 text-sm">
                    {/* Invoice Meta Bar */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div>
                            <div className="text-2xl font-black text-[#004B93] tracking-tight">BeBrilliant</div>
                            <div className="text-xs text-slate-500 mt-1 font-semibold">Enterprise EdTech Infrastructure</div>
                            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                                <p>BeBrilliant EdTech Solutions Pvt. Ltd.</p>
                                <p>GSTIN: 08AAACB1234F1Z9 | PAN: AAACB1234F</p>
                                <p>Innovation Park, Cyber City, Jaipur, RJ - 302020</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs uppercase tracking-wider mb-2">
                                {invoice.status.toUpperCase()}
                            </div>
                            <div className="text-lg font-black text-slate-900">{invoice.invoice_no}</div>
                            <div className="text-xs text-slate-500 font-semibold">Date: {formatDate(invoice.created_at)}</div>
                        </div>
                    </div>

                    {/* Bill To Info */}
                    <div className="grid grid-cols-2 gap-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To (Institutional Client)</div>
                            <div className="font-bold text-slate-900 text-base">{billingSettings.legal_name || 'Institutional Partner'}</div>
                            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                                <p>{billingSettings.address}, {billingSettings.city}, {billingSettings.state} - {billingSettings.pincode}</p>
                                <p className="font-medium text-slate-700">GSTIN: <span className="font-mono">{billingSettings.gstin || 'Unregistered / Exempt'}</span></p>
                                <p className="font-medium text-slate-700">PAN: <span className="font-mono">{billingSettings.pan || 'N/A'}</span></p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col justify-between">
                            <div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Contact</div>
                                <div className="text-xs font-semibold text-slate-800">{billingSettings.billing_email}</div>
                                <div className="text-xs text-slate-500">{billingSettings.billing_phone}</div>
                            </div>
                            <div className="text-xs text-slate-500">
                                Payment Method: <span className="font-bold text-slate-800">Direct Gateway / Netbanking</span>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">SAC Code</th>
                                    <th className="p-4 text-right">Taxable Value</th>
                                    <th className="p-4 text-right">GST Rate</th>
                                    <th className="p-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                <tr>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{invoice.plan_name} Institutional Node</div>
                                        <div className="text-[11px] text-slate-500">Cloud ERP, AI Question Engine & LMS Platform Access</div>
                                        {invoice.promo_code && (
                                            <div className="text-[10px] text-emerald-600 font-bold mt-1">
                                                Promo Applied: {invoice.promo_code} (-₹{invoice.discount_amount?.toLocaleString()})
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-slate-600">998313</td>
                                    <td className="p-4 text-right font-bold text-slate-900">₹{invoice.base_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 text-right font-semibold text-slate-600">18.00%</td>
                                    <td className="p-4 text-right font-black text-slate-900">₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Tax Breakdown & Totals */}
                    <div className="flex justify-between items-start pt-2">
                        <div className="text-xs text-slate-500 max-w-xs space-y-1">
                            <p className="font-bold text-slate-700">Tax Note:</p>
                            <p>Taxes are computed as Central GST (9%) and State GST (9%) for intra-state supply, or Integrated GST (18%) for inter-state supply.</p>
                            <div className="pt-2 text-[10px] text-slate-400">This is a computer-generated tax invoice and requires no physical signature.</div>
                        </div>
                        <div className="w-64 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Base Taxable Amount:</span>
                                <span className="font-semibold text-slate-900">₹{invoice.base_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>CGST (9%):</span>
                                <span className="font-semibold text-slate-900">₹{Number(cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>SGST (9%):</span>
                                <span className="font-semibold text-slate-900">₹{Number(sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                                <span>Total Paid (INR):</span>
                                <span className="text-[#004B93]">₹{invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── CHECKOUT & UPGRADE MODAL ──────────────────────────────────
function UpgradeModal({
    plan,
    onClose,
    onSubmit,
    saving
}: {
    plan: Plan;
    onClose: () => void;
    onSubmit: (payload: any) => void;
    saving: boolean;
}) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponError, setCouponError] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(true);

    const basePrice = billingCycle === 'annual' ? plan.annual_price : plan.price;

    const handleApplyCoupon = () => {
        setCouponError('');
        const code = couponCode.trim().toUpperCase();
        if (code === 'WELCOME30') {
            setDiscountAmount(Math.round(basePrice * 0.3));
            setCouponApplied(true);
        } else if (code === 'FESTIVE50') {
            setDiscountAmount(Math.round(basePrice * 0.5));
            setCouponApplied(true);
        } else if (code === 'ANNUAL20') {
            setDiscountAmount(Math.round(basePrice * 0.2));
            setCouponApplied(true);
        } else {
            setCouponError('Invalid coupon code. Try WELCOME30, FESTIVE50, or ANNUAL20');
        }
    };

    const discountedBase = Math.max(0, basePrice - discountAmount);
    const gstAmount = Math.round(discountedBase * 0.18 * 100) / 100;
    const finalTotal = Math.round((discountedBase + gstAmount) * 100) / 100;

    const handleConfirm = () => {
        onSubmit({
            plan_id: plan.id,
            billing_cycle: billingCycle,
            promo_code: couponApplied ? couponCode.trim().toUpperCase() : null,
            discount_amount: discountAmount,
            total_amount: finalTotal
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-[#004B93] rounded-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Authorize Tier Upgrade</h3>
                            <p className="text-xs text-slate-500 font-medium">Target: {plan.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                    >
                        <XCircle size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-7 overflow-y-auto space-y-5">
                    {/* Billing Period Selector */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Billing Term</label>
                        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => { setBillingCycle('monthly'); setCouponApplied(false); setDiscountAmount(0); }}
                                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    billingCycle === 'monthly' ? 'bg-white text-[#004B93] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                type="button"
                                onClick={() => { setBillingCycle('annual'); setCouponApplied(false); setDiscountAmount(0); }}
                                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 relative ${
                                    billingCycle === 'annual' ? 'bg-white text-[#004B93] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Annual (Save 20%)
                                <span className="absolute -top-2 right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full">BEST</span>
                            </button>
                        </div>
                    </div>

                    {/* Plan Summary Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-bold text-[#004B93] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">Selected Node</span>
                                <div className="text-lg font-black text-slate-900 mt-1">{plan.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{plan.max_students.toLocaleString()} Students • {plan.max_teachers} Faculty • {plan.max_storage_gb} GB Storage</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-slate-900">₹{basePrice.toLocaleString()}</div>
                                <div className="text-[11px] text-slate-500 font-semibold">{billingCycle === 'annual' ? '/ year' : '/ month'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Promo Code Input */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Institutional Promo Code</label>
                        <div className="flex gap-2">
                            <input
                                value={couponCode}
                                onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                                disabled={couponApplied}
                                placeholder="Try WELCOME30 or FESTIVE50"
                                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 uppercase"
                            />
                            <button
                                onClick={handleApplyCoupon}
                                disabled={couponApplied || !couponCode.trim()}
                                className="px-4 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition"
                            >
                                {couponApplied ? 'Applied' : 'Apply'}
                            </button>
                        </div>
                        {couponError && <p className="text-[11px] text-rose-600 font-semibold mt-1">{couponError}</p>}
                        {couponApplied && <p className="text-[11px] text-emerald-600 font-semibold mt-1">Discount applied successfully!</p>}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Base Subscription ({billingCycle}):</span>
                            <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString()}</span>
                        </div>
                        {couponApplied && (
                            <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Coupon Discount:</span>
                                <span>-₹{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                            <span>GST Tax (18%):</span>
                            <span className="font-semibold text-slate-900">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                            <span>Total Payable Amount:</span>
                            <span className="text-lg text-[#004B93]">₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={e => setAgreeTerms(e.target.checked)}
                            className="mt-0.5 rounded text-[#004B93] focus:ring-0"
                        />
                        <span>I authorize the immediate upgrade of institutional resource quotas and generation of GST tax invoice.</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving || !agreeTerms}
                        className="px-6 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                        Confirm & Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── TOP-UP ADDON MODAL ─────────────────────────────────────────
function TopupModal({
    onClose,
    onSubmit,
    saving
}: {
    onClose: () => void;
    onSubmit: (payload: any) => void;
    saving: boolean;
}) {
    const [resourceType, setResourceType] = useState<'students' | 'teachers' | 'ai_tokens' | 'storage_gb'>('students');

    const ADDON_OPTIONS = [
        { type: 'students', label: '+250 Student Nodes', value: 250, price: 1499, icon: Globe },
        { type: 'students', label: '+500 Student Nodes', value: 500, price: 2799, icon: Globe },
        { type: 'teachers', label: '+10 Faculty Slots', value: 10, price: 999, icon: Shield },
        { type: 'teachers', label: '+25 Faculty Slots', value: 25, price: 1999, icon: Shield },
        { type: 'ai_tokens', label: '+50,000 AI Tokens', value: 50000, price: 1299, icon: Cpu },
        { type: 'ai_tokens', label: '+150,000 AI Tokens', value: 150000, price: 2999, icon: Cpu },
        { type: 'storage_gb', label: '+50 GB Cloud Storage', value: 50, price: 799, icon: Package },
    ];

    const [selectedOption, setSelectedOption] = useState(ADDON_OPTIONS[0]);

    const handleConfirm = () => {
        onSubmit({
            resource_type: selectedOption.type,
            amount: selectedOption.value,
            price: selectedOption.price
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Instant Quota Top-Up</h3>
                            <p className="text-xs text-slate-500 font-medium">Expand operational capacity without changing tiers</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                    >
                        <XCircle size={18} />
                    </button>
                </div>

                <div className="p-7 overflow-y-auto space-y-4">
                    <div className="space-y-2.5">
                        {ADDON_OPTIONS.map((opt, idx) => {
                            const isSelected = selectedOption.label === opt.label;
                            const Icon = opt.icon;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedOption(opt)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                                        isSelected
                                            ? 'border-[#004B93] bg-blue-50/40 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#004B93] text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-xs">{opt.label}</div>
                                            <div className="text-[11px] text-slate-500">Immediate provisioning to institutional pool</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-slate-900 text-sm">₹{opt.price.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">+18% GST</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                            <span>Add-on Amount:</span>
                            <span className="font-semibold text-slate-900">₹{selectedOption.price}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>GST (18%):</span>
                            <span className="font-semibold text-slate-900">₹{(selectedOption.price * 0.18).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                            <span>Total Payable:</span>
                            <span className="text-[#004B93]">₹{(selectedOption.price * 1.18).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                        Authorize Top-Up
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── CANCEL RETENTION MODAL ─────────────────────────────────────
function CancelModal({
    onClose,
    onConfirm,
    saving
}: {
    onClose: () => void;
    onConfirm: (reason: string) => void;
    saving: boolean;
}) {
    const [reason, setReason] = useState('Need budget adjustments');

    const REASONS = [
        'Need budget adjustments',
        'Academic session concluded',
        'Missing specific LMS / grading feature',
        'Migrating to alternate infrastructure',
        'Temporary operational pause'
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-200">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-rose-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-rose-900">Manage Auto-Renewal</h3>
                            <p className="text-xs text-rose-600 font-medium">Deactivation Safeguard</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center transition"
                    >
                        <XCircle size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs text-rose-900 leading-relaxed font-medium">
                        Your institution will retain <strong>100% full platform access</strong> until the conclusion of your current billing cycle. Auto-debit will be deactivated.
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Reason for Deactivation</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        >
                            {REASONS.map((r, idx) => (
                                <option key={idx} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                        Keep Auto-Renewal Active
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={saving}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        Confirm Deactivation
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN SUBSCRIPTION PAGE ────────────────────────────────────
export default function SubscriptionPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'invoices' | 'settings'>('overview');
    const [current, setCurrent] = useState<SubscriptionState | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tenantType, setTenantType] = useState<'school' | 'institute' | 'solo'>('school');
    const [tenantTypeDisplay, setTenantTypeDisplay] = useState<string>('School Tenant');
    const [billingSettings, setBillingSettings] = useState<BillingSettings>({
        legal_name: '',
        gstin: '',
        pan: '',
        billing_email: '',
        billing_phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        auto_renew: true
    });
    const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    // Modals
    const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Invoice | null>(null);

    // Plans view cycle toggle
    const [catalogBillingCycle, setCatalogBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    // Invoices filter
    const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'paid' | 'pending'>('all');
    const [invoiceSearch, setInvoiceSearch] = useState('');

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/subscription');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to synchronize billing heartbeat');
            }

            setCurrent(data.current);
            setPlans(data.plans || []);
            setUsage(data.usage || null);
            setInvoices(data.invoices || []);
            if (data.tenant_type) {
                setTenantType(data.tenant_type);
            }
            if (data.tenant_type_display) {
                setTenantTypeDisplay(data.tenant_type_display);
            }
            if (data.billing_settings) {
                setBillingSettings(data.billing_settings);
            }
            if (data.executive_summary) {
                setExecutiveSummary(data.executive_summary);
            }
        } catch (e: any) {
            setError(e.message || 'Gateway connection timeout');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpgradeSubmit = async (payload: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'UPGRADE_PLAN', payload })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upgrade failed');

            showToast(data.message || 'Subscription upgraded successfully!', true);
            setSelectedUpgradePlan(null);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Upgrade transaction failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleTopupSubmit = async (payload: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOPUP_ADDON', payload })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Top-up failed');

            showToast(data.message || 'Quota provisioned successfully!', true);
            setShowTopupModal(false);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Top-up transaction failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelConfirm = async (reason: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CANCEL_SUBSCRIPTION', payload: { reason } })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Cancellation failed');

            showToast('Auto-renewal deactivated. Service active until end date.', true);
            setShowCancelModal(false);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Action failed', false);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBillingSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SAVE_BILLING_SETTINGS',
                    payload: { billing_settings: billingSettings }
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save settings');

            showToast('Institutional billing details saved!', true);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Failed to save billing settings', false);
        } finally {
            setSaving(false);
        }
    };

    const currentPlan = useMemo(() => {
        return plans.find(p => p.id === current?.plan_id) || plans[0];
    }, [plans, current]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesFilter = invoiceFilter === 'all' || inv.status.toLowerCase() === invoiceFilter;
            const matchesSearch = invoiceSearch.trim() === '' ||
                inv.invoice_no.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                inv.plan_name.toLowerCase().includes(invoiceSearch.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [invoices, invoiceFilter, invoiceSearch]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
                <Loader2 size={42} className="animate-spin text-[#004B93] mb-4" />
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Calibrating Institutional Billing Gateway...
                </div>
            </div>
        );
    }

    if (error || !current) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
                <ShieldAlert size={56} className="text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Billing Gateway Desynchronization</h2>
                <p className="text-sm text-slate-600 text-center max-w-md mb-6">{error || 'Unable to establish secure telemetry connection with the treasury ledger.'}</p>
                <button
                    onClick={fetchData}
                    className="px-6 py-3 bg-[#004B93] hover:bg-[#003870] text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition"
                >
                    <RefreshCcw size={15} /> Re-Sync Telemetry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16">
            {/* Non-blocking Notification Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[20000] px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all ${
                    toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                    {toast.ok ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                    <span className="text-xs font-bold">{toast.msg}</span>
                </div>
            )}

            {/* ART-DIRECTED OPENAI HERO BANNER */}
            <div className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
                    <Image
                        src="/assets/images/dashboard/billing_subscription_banner.jpg"
                        alt="Institutional Treasury Vault"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />

                <div className="relative z-20 w-full px-6 py-10 sm:px-8 lg:px-10 sm:py-12">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Institutional Node Active
                                </span>
                                <span className="text-xs text-slate-400 font-semibold font-mono">
                                    NODE ID: {current.plan_id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                                Treasury, Billing & Quota Manager
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
                                Enterprise resource orchestration, automated GST compliance, dynamic seat allocations, and tamper-proof financial ledgers.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchData}
                                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition"
                            >
                                <RefreshCcw size={14} /> Refresh Telemetry
                            </button>
                            <button
                                onClick={() => setShowTopupModal(true)}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                            >
                                <Plus size={15} /> Top-Up Quotas
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="w-full px-6 sm:px-8 lg:px-10 mt-8 space-y-8 pb-16">
                {/* 4 EXECUTIVE KPI METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: Active Tier */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Institutional Tier</span>
                            <div className="p-2 bg-blue-50 text-[#004B93] rounded-xl">
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {current.plan_name || currentPlan?.name || 'Active Plan'}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <CalendarDays size={13} className="text-amber-500" />
                            <span>Renewal: <strong className="text-slate-700">{formatDate(current.renewal)}</strong></span>
                        </div>
                    </div>

                    {/* Card 2: Monthly Treasury Allocation */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Treasury Allocation</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Coins size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            ₹{(current.amount || currentPlan?.price || 0).toLocaleString()}
                            <span className="text-xs font-bold text-slate-400 ml-1">/ mo</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                            <CheckCircle2 size={13} />
                            <span>{current.auto_renew ? 'Auto-Debit Active' : 'Manual Billing Mode'}</span>
                        </div>
                    </div>

                    {/* Card 3: Aggregate Quota Health */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quota Capacity Index</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Activity size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {executiveSummary?.resource_health_pct || 7}% Utilized
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Optimal capacity headroom</span>
                        </div>
                    </div>

                    {/* Card 4: Invoices & Tax Compliance */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verified Tax Invoices</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Receipt size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {invoices.filter(i => i.status === 'paid').length} Settled
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Shield size={13} className="text-[#004B93]" />
                            <span>18% GST Compliant Ledgers</span>
                        </div>
                    </div>
                </div>

                {/* TABBED ENTERPRISE WORKSPACE */}
                <div className="space-y-6">
                    {/* Modern Tab Switcher */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                                activeTab === 'overview'
                                    ? 'bg-[#004B93] text-white shadow-md shadow-blue-900/10'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                            <Activity size={15} /> Overview & Telemetry
                        </button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                                activeTab === 'plans'
                                    ? 'bg-[#004B93] text-white shadow-md shadow-blue-900/10'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                            <Package size={15} /> Plans & Upgrades
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 relative ${
                                activeTab === 'invoices'
                                    ? 'bg-[#004B93] text-white shadow-md shadow-blue-900/10'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                            <History size={15} /> Invoices & Receipts Ledger
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">
                                {invoices.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                                activeTab === 'settings'
                                    ? 'bg-[#004B93] text-white shadow-md shadow-blue-900/10'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                            <Settings size={15} /> Billing & GST Profile
                        </button>
                    </div>

                    {/* TAB 1: OVERVIEW & TELEMETRY */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Primary Node Banner */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-black text-[#004B93] uppercase tracking-wider">
                                            <ShieldCheck size={16} /> Primary Institutional Node
                                        </div>
                                        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                            {currentPlan?.name || 'School (Standard)'}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Authorization Active
                                            </span>
                                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
                                                Cycle: {current.billing_cycle === 'annual' ? 'Annual Commitment' : 'Monthly Recurring'}
                                            </span>
                                            <span className="px-3 py-1 bg-blue-50 text-[#004B93] rounded-lg">
                                                Next Billing: {formatDate(current.renewal)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => setActiveTab('plans')}
                                            className="px-5 py-3 bg-[#004B93] hover:bg-[#003870] text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-900/15 transition"
                                        >
                                            <Sparkles size={15} /> Upgrade Tier
                                        </button>
                                        <button
                                            onClick={() => setShowTopupModal(true)}
                                            className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 transition"
                                        >
                                            <Plus size={15} /> Add Quota Block
                                        </button>
                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/80 rounded-2xl text-xs font-bold transition"
                                        >
                                            Manage Auto-Renew
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 4 DYNAMIC RESOURCE METERS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    {
                                        title: 'Student Assignments',
                                        used: usage?.students ?? 0,
                                        max: usage?.max_students ?? 1000,
                                        unit: 'Nodes',
                                        icon: Globe,
                                        color: '#004B93',
                                        bg: 'bg-blue-50',
                                        action: () => setShowTopupModal(true)
                                    },
                                    {
                                        title: 'Faculty & Staff Slots',
                                        used: usage?.teachers ?? 0,
                                        max: usage?.max_teachers ?? 60,
                                        unit: 'Faculty',
                                        icon: Shield,
                                        color: '#10B981',
                                        bg: 'bg-emerald-50',
                                        action: () => setShowTopupModal(true)
                                    },
                                    {
                                        title: 'Cloud Document Storage',
                                        used: usage?.storage ?? 15,
                                        max: usage?.max_storage ?? 250,
                                        unit: 'GB',
                                        icon: Package,
                                        color: '#F59E0B',
                                        bg: 'bg-amber-50',
                                        action: () => setShowTopupModal(true)
                                    },
                                    {
                                        title: 'AI Generation & Assessment Engine',
                                        used: usage?.ai_tokens ?? 34500,
                                        max: usage?.max_ai_tokens ?? 50000,
                                        unit: 'Tokens',
                                        icon: Cpu,
                                        color: '#8B5CF6',
                                        bg: 'bg-purple-50',
                                        action: () => setShowTopupModal(true)
                                    }
                                ].map((stat, i) => {
                                    const pct = Math.min(100, Math.round(((stat.used || 0) / (stat.max || 1)) * 100));
                                    const Icon = stat.icon;
                                    const isHigh = pct >= 80;

                                    return (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-2xl ${stat.bg}`} style={{ color: stat.color }}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">{stat.title}</h4>
                                                        <p className="text-[11px] text-slate-500 font-medium">Capacity quota bounds</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={stat.action}
                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                                >
                                                    <Plus size={11} /> Top-Up
                                                </button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-500">
                                                        {stat.used.toLocaleString()} / {stat.max.toLocaleString()} {stat.unit}
                                                    </span>
                                                    <span style={{ color: isHigh ? '#EF4444' : stat.color }}>
                                                        {pct}% Utilized
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor: isHigh ? '#EF4444' : stat.color
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-1">
                                                    <span>{(stat.max - stat.used).toLocaleString()} {stat.unit} available</span>
                                                    <span>{isHigh ? 'Approaching threshold' : 'Nominal capacity'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Plan Feature Checklist */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-500" /> Active Tier Entitlements & Features
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                    {(currentPlan?.features || []).map((feat, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
                                            <Check size={14} className="text-emerald-600 shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PLANS & UPGRADES */}
                    {activeTab === 'plans' && (
                        <div className="space-y-6">
                            {/* Dedicated Tenant Tier & Billing Cycle Header */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                            {tenantTypeDisplay} Subscription Plans & Quotas
                                        </h3>
                                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#004B93] border border-blue-200 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Active Account Type: <strong>{tenantTypeDisplay}</strong>
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium max-w-2xl">
                                        {tenantType === 'school'
                                            ? 'Displaying official School subscription packages calibrated with high-capacity student registries and multi-faculty allocations.'
                                            : tenantType === 'institute'
                                            ? 'Displaying official Coaching & Institute subscription packages calibrated for batch-oriented coaching and multi-faculty rosters.'
                                            : 'Displaying official Solo Teacher subscription packages calibrated for independent tutors and personal educators.'
                                        }
                                    </p>

                                    {/* Dedicated Account Tier Badge */}
                                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
                                            {tenantType === 'school' ? '🏫 School Plans Only' : tenantType === 'institute' ? '🏢 Institute Plans Only' : '🎓 Solo Teacher Plans Only'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                            {tenantType === 'solo' ? 'Single Teacher Only (Multiple Teachers Not Allowed)' : 'Multiple Teachers Allowed & Configured'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 self-start lg:self-center">
                                    <button
                                        onClick={() => setCatalogBillingCycle('monthly')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                                            catalogBillingCycle === 'monthly'
                                                ? 'bg-white text-[#004B93] shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        onClick={() => setCatalogBillingCycle('annual')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
                                            catalogBillingCycle === 'annual'
                                                ? 'bg-white text-[#004B93] shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Annual Commitment
                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full">
                                            20% OFF
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Plan Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((p) => {
                                    const isCurrent = current.plan_id === p.id;
                                    const displayPrice = catalogBillingCycle === 'annual' ? p.annual_price : p.price;
                                    const isSoloPlan = p.is_solo || p.type === 'personal_teacher' || p.type === 'independent_teacher' || p.category === 'solo';

                                    return (
                                        <div
                                            key={p.id}
                                            className={`bg-white rounded-3xl p-6 sm:p-7 border flex flex-col justify-between transition-all relative ${
                                                isCurrent
                                                    ? 'border-[#004B93] ring-2 ring-[#004B93]/20 shadow-lg'
                                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                            }`}
                                        >
                                            {isCurrent && (
                                                <div className="absolute -top-3 right-6 px-3 py-1 bg-[#004B93] text-white rounded-full text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                                                    <Target size={12} /> Current Active Plan
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    {/* Plan Tier Type Badge */}
                                                    <div>
                                                        {isSoloPlan ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                                                                🎓 Solo Teacher • Single Teacher Only
                                                            </span>
                                                        ) : p.category === 'institute' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                                                🏢 Institute Tier • Multiple Teachers Allowed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#004B93] border border-blue-200">
                                                                🏫 School Tier • Multiple Teachers Allowed
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="text-lg font-black text-slate-900">{p.name}</h4>
                                                    <div className="flex items-baseline gap-1 mt-1">
                                                        <span className="text-3xl font-black text-slate-900 tracking-tight">₹{displayPrice.toLocaleString()}</span>
                                                        <span className="text-xs text-slate-400 font-bold">{catalogBillingCycle === 'annual' ? '/ year' : '/ mo'}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Excluding 18% GST</div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included Capacity & Limits</div>
                                                    <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                                            <span>{(p.max_students || 100).toLocaleString()} Student Capacity</span>
                                                        </div>

                                                        {/* Teacher Quota Distinction */}
                                                        <div className="flex items-start gap-2">
                                                            {isSoloPlan ? (
                                                                <div className="p-0.5 bg-amber-100 text-amber-800 rounded-full mt-0.5 shrink-0">
                                                                    <AlertTriangle size={13} />
                                                                </div>
                                                            ) : (
                                                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                                            )}
                                                            <div className="flex-1">
                                                                {isSoloPlan ? (
                                                                    <div>
                                                                        <span className="text-amber-900 font-bold">1 Teacher Allowed</span>
                                                                        <p className="text-[10px] text-amber-700 font-normal mt-0.5">
                                                                            Multiple teachers are NOT allowed on Solo plans
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <span>Up to {p.max_teachers} Teachers Allowed</span>
                                                                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                                                                            Multiple faculty collaboration enabled
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                                            <span>{p.max_storage_gb} GB Document Storage</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                                            <span>{((p.max_ai_tokens || 1000000)/1000).toLocaleString()}k Monthly AI Generation Credits</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 mt-6 border-t border-slate-100">
                                                {isCurrent ? (
                                                    <div className="w-full py-3 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-default">
                                                        <Lock size={14} /> Current Active Plan
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedUpgradePlan(p)}
                                                        className="w-full py-3 bg-[#004B93] hover:bg-[#003870] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-900/10 transition"
                                                    >
                                                        Upgrade to {p.name} <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: INVOICES & RECEIPTS LEDGER */}
                    {activeTab === 'invoices' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                            {/* Filter Bar */}
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Financial Invoices & GST Tax Receipts</h3>
                                    <p className="text-xs text-slate-500 font-medium">Historical transaction ledgers with printable tax invoices</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="text"
                                        value={invoiceSearch}
                                        onChange={e => setInvoiceSearch(e.target.value)}
                                        placeholder="Search invoice #..."
                                        className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                                        {(['all', 'paid', 'pending'] as const).map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => setInvoiceFilter(filter)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                                                    invoiceFilter === filter
                                                        ? 'bg-[#004B93] text-white'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Invoices Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3.5 px-6">Invoice #</th>
                                            <th className="py-3.5 px-6">Date</th>
                                            <th className="py-3.5 px-6">Description</th>
                                            <th className="py-3.5 px-6 text-right">Taxable Base</th>
                                            <th className="py-3.5 px-6 text-right">GST (18%)</th>
                                            <th className="py-3.5 px-6 text-right">Total Paid</th>
                                            <th className="py-3.5 px-6 text-center">Status</th>
                                            <th className="py-3.5 px-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredInvoices.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                                    No invoices match the selected filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredInvoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                                        {inv.invoice_no}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 font-medium">
                                                        {formatDate(inv.created_at)}
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-slate-800">
                                                        {inv.plan_name} Institutional Node
                                                        {inv.promo_code && (
                                                            <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                                                {inv.promo_code}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-semibold text-slate-700">
                                                        ₹{inv.base_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-medium text-slate-500">
                                                        ₹{inv.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-black text-slate-900">
                                                        ₹{inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            inv.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => setSelectedReceipt(inv)}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#004B93] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                                                        >
                                                            <Printer size={13} /> View Tax Invoice
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium">
                                <div>Showing {filteredInvoices.length} of {invoices.length} total institutional tax records</div>
                                <div>Total Cumulative Settled: <strong className="text-slate-900 font-bold">₹{(executiveSummary?.total_paid_inr || 0).toLocaleString()}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: BILLING & GST SETTINGS */}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Institutional Billing & GST Configuration</h3>
                                <p className="text-xs text-slate-500 font-medium">Configure corporate credentials for tax invoices, GST input credits, and billing dispatches</p>
                            </div>

                            <form onSubmit={handleSaveBillingSettings} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5">Legal Entity / Registered School Name</label>
                                        <input
                                            type="text"
                                            value={billingSettings.legal_name}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, legal_name: e.target.value }))}
                                            required
                                            placeholder="Silver Bells School Mansarovar"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5">GSTIN (15 Digits)</label>
                                        <input
                                            type="text"
                                            value={billingSettings.gstin}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                                            placeholder="08AAAAA0000A1Z5"
                                            maxLength={15}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 uppercase font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5">PAN Number (10 Digits)</label>
                                        <input
                                            type="text"
                                            value={billingSettings.pan}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                                            placeholder="AAAAA0000A"
                                            maxLength={10}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 uppercase font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5">Accounts & Billing Email</label>
                                        <input
                                            type="email"
                                            value={billingSettings.billing_email}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, billing_email: e.target.value }))}
                                            required
                                            placeholder="accounts@silverbells.edu"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5">Billing Contact Telephone</label>
                                        <input
                                            type="text"
                                            value={billingSettings.billing_phone}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, billing_phone: e.target.value }))}
                                            placeholder="+91 94140 12345"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5">Postal PIN Code</label>
                                        <input
                                            type="text"
                                            value={billingSettings.pincode}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, pincode: e.target.value }))}
                                            placeholder="302020"
                                            maxLength={6}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="font-bold text-slate-700 block mb-1.5">Registered Institutional Address</label>
                                        <textarea
                                            value={billingSettings.address}
                                            onChange={e => setBillingSettings(prev => ({ ...prev, address: e.target.value }))}
                                            rows={2}
                                            placeholder="Sector 12, Institutional Area, Mansarovar, Jaipur, Rajasthan"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Auto-Renew Preference Switch */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Automated Subscription Renewal</div>
                                        <div className="text-[11px] text-slate-500">Ensure un-interrupted cloud compute quotas and LMS availability at cycle ends</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={billingSettings.auto_renew}
                                        onChange={e => setBillingSettings(prev => ({ ...prev, auto_renew: e.target.checked }))}
                                        className="h-5 w-5 rounded text-[#004B93] focus:ring-0 cursor-pointer"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
                                    >
                                        {saving && <Loader2 size={14} className="animate-spin" />}
                                        Save Billing Preferences
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* UPGRADE CHECKOUT MODAL */}
            {selectedUpgradePlan && (
                <UpgradeModal
                    plan={selectedUpgradePlan}
                    onClose={() => setSelectedUpgradePlan(null)}
                    onSubmit={handleUpgradeSubmit}
                    saving={saving}
                />
            )}

            {/* TOP-UP QUOTA MODAL */}
            {showTopupModal && (
                <TopupModal
                    onClose={() => setShowTopupModal(false)}
                    onSubmit={handleTopupSubmit}
                    saving={saving}
                />
            )}

            {/* CANCEL RETENTION MODAL */}
            {showCancelModal && (
                <CancelModal
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={handleCancelConfirm}
                    saving={saving}
                />
            )}

            {/* PRINTABLE GST TAX RECEIPT MODAL */}
            {selectedReceipt && (
                <TaxReceiptModal
                    invoice={selectedReceipt}
                    billingSettings={billingSettings}
                    onClose={() => setSelectedReceipt(null)}
                />
            )}
        </div>
    );
}
