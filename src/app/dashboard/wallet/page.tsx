'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
    WalletCards, ArrowRightLeft, Landmark, Receipt, CheckCircle, XCircle,
    Loader2, ArrowUpRight, ArrowDownRight, Building2, Coins, Calendar,
    Plus, Filter, Search, Download, Printer, ExternalLink, ShieldCheck,
    CheckCircle2, Clock, Check, CreditCard, ChevronRight, Sparkles,
    AlertCircle, RefreshCcw, HelpCircle, FileText, Smartphone, Laptop,
    ArrowRight, Cpu
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface WalletStats {
    total_earnings: number;
    available_balance: number;
    pending_balance: number;
    withdrawn_amount: number;
    total_tds: number;
}

interface CollectionItem {
    id: string;
    amount: number;
    status: string;
    type: string;
    method: string;
    student_name: string;
    grade: string;
    title: string;
    created_at: string;
    order_id: string;
    payment_id: string;
}

interface DisbursementItem {
    id: string;
    amount: number;
    tds_amount: number;
    net_amount: number;
    status: string;
    requested_at: string;
    reviewed_at?: string;
    admin_note: string;
    tenant_note: string;
    utr?: string | null;
}

interface BankDetails {
    account_name: string;
    bank_name: string;
    branch: string;
    account_no: string;
    ifsc: string;
    account_type: string;
    pan: string;
    auto_settle: boolean;
}

interface FeeCatalogItem {
    id: string;
    name: string;
    category: string;
    amount: number;
    active: boolean;
}

// ── PRINTABLE STUDENT FEE RECEIPT MODAL ─────────────────────────
function StudentReceiptModal({
    item,
    schoolName,
    onClose
}: {
    item: CollectionItem;
    schoolName: string;
    onClose: () => void;
}) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[12000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#004B93] rounded-xl">
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Student Tuition & Fee Receipt</h3>
                            <p className="text-xs text-slate-500 font-medium">Txn ID: {item.payment_id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                        >
                            <Printer size={14} /> Print Receipt
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto print:p-0 space-y-6 text-slate-800 text-sm">
                    {/* Receipt Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div>
                            <div className="text-2xl font-black text-[#004B93] tracking-tight">{schoolName || 'Silver Bells School'}</div>
                            <div className="text-xs text-slate-500 mt-1 font-semibold">Institutional Assessment & Fee Collection Voucher</div>
                            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                                <p>Mansarovar Institutional Area, Jaipur, Rajasthan</p>
                                <p>Affiliation Code: CBSE-IND-88219</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs uppercase tracking-wider mb-2">
                                {item.status.toUpperCase()}
                            </div>
                            <div className="text-base font-mono font-black text-slate-900">{item.order_id}</div>
                            <div className="text-xs text-slate-500 font-semibold">{formatDate(item.created_at)}</div>
                        </div>
                    </div>

                    {/* Student Info Box */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Candidate</div>
                            <div className="font-bold text-slate-900 text-base">{item.student_name}</div>
                            <div className="text-slate-600 font-medium mt-1">Class / Grade: <strong className="text-slate-900">{item.grade}</strong></div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</div>
                            <div className="font-bold text-slate-900 text-sm">{item.method}</div>
                            <div className="text-slate-500 text-[11px] mt-1 font-mono">Ref: {item.payment_id}</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Fee Item / Particulars</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4 text-right">Amount (INR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-4 font-bold text-slate-900">{item.title}</td>
                                    <td className="p-4 text-slate-600 font-medium capitalize">{item.type} Assessment</td>
                                    <td className="p-4 text-right font-black text-slate-900">₹{item.amount.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                        <div className="text-xs text-slate-400">
                            Computer generated fee collection receipt. No physical signature required.
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 font-bold uppercase">Total Settled Amount</div>
                            <div className="text-2xl font-black text-[#004B93]">₹{item.amount.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── REQUEST WITHDRAWAL MODAL ────────────────────────────────────
function WithdrawalModal({
    availableBalance,
    bankDetails,
    onClose,
    onSubmit,
    saving
}: {
    availableBalance: number;
    bankDetails: BankDetails;
    onClose: () => void;
    onSubmit: (amount: number, note: string) => void;
    saving: boolean;
}) {
    const [amount, setAmount] = useState<number>(availableBalance > 1000 ? Math.floor(availableBalance) : 1000);
    const [note, setNote] = useState('');
    const [agree, setAgree] = useState(true);

    const tdsDeduction = Math.round(amount * 0.10);
    const netDisbursal = Math.max(0, amount - tdsDeduction);

    const handlePercent = (pct: number) => {
        setAmount(Math.floor((availableBalance * pct) / 100));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount < 1000) return;
        onSubmit(amount, note);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-[#004B93] rounded-xl">
                            <Landmark size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Request Bank Settlement</h3>
                            <p className="text-xs text-slate-500 font-medium">Clear institutional liquidity to verified bank account</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                    >
                        <XCircle size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-7 overflow-y-auto space-y-5 text-xs">
                    {/* Available Liquidity Box */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available Liquidity</span>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">₹{availableBalance.toLocaleString()}</div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">
                            Immediate Clearance
                        </div>
                    </div>

                    {/* Amount Input with Quick Percent Buttons */}
                    <div className="space-y-2">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">Withdrawal Amount (INR)</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                            <div className="pl-4 pr-2 font-bold text-slate-400">₹</div>
                            <input
                                type="number"
                                min={1000}
                                max={availableBalance}
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                className="flex-1 py-2.5 bg-transparent font-black text-slate-900 text-sm focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            {[25, 50, 75, 100].map(pct => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handlePercent(pct)}
                                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                                >
                                    {pct}% {pct === 100 && 'MAX'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Bank Card */}
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1 text-slate-700">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#004B93]">
                            <Building2 size={15} /> Target Disbursement Account
                        </div>
                        <div className="font-black text-slate-900 text-sm">{bankDetails.bank_name} •••• {bankDetails.account_no.slice(-4)}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            {bankDetails.account_name} | IFSC: {bankDetails.ifsc}
                        </div>
                    </div>

                    {/* Real-time Calculation Breakdown */}
                    <div className="space-y-2 border-t border-slate-200 pt-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Requested Gross Payout:</span>
                            <span className="font-semibold text-slate-900">₹{amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Statutory TDS Withholding (10%):</span>
                            <span className="font-semibold text-rose-600">-₹{tdsDeduction.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                            <span>Net Bank Credit:</span>
                            <span className="text-base text-emerald-600">₹{netDisbursal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Note Input */}
                    <div>
                        <label className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">Settlement Remarks / Purpose</label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Monthly examination fees payout"
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                        />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-600 select-none pt-1">
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={e => setAgree(e.target.checked)}
                            className="mt-0.5 rounded text-[#004B93] focus:ring-0"
                        />
                        <span>I verify the target bank account credentials and authorize statutory 10% TDS withholding.</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !agree || amount < 1000 || amount > availableBalance}
                            className="px-6 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-blue-900/15 transition"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            Submit Payout Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── RECORD MANUAL COLLECTION MODAL ──────────────────────────────
function ManualFeeModal({
    onClose,
    onSubmit,
    saving
}: {
    onClose: () => void;
    onSubmit: (payload: any) => void;
    saving: boolean;
}) {
    const [studentName, setStudentName] = useState('');
    const [grade, setGrade] = useState('Grade 10-A');
    const [title, setTitle] = useState('CBSE Board Examination Registration');
    const [amount, setAmount] = useState('2500');
    const [method, setMethod] = useState('Cash Collection');
    const [receiptNo, setReceiptNo] = useState(`REC-${Date.now().toString().slice(-5)}`);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            student_name: studentName,
            grade,
            title,
            amount: Number(amount),
            method,
            receipt_no: receiptNo
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Record Offline Fee Collection</h3>
                            <p className="text-xs text-slate-500 font-medium">Credit cash, cheque, or direct bank deposits to institutional ledger</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                    >
                        <XCircle size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Student Candidate Name</label>
                        <input
                            type="text"
                            required
                            value={studentName}
                            onChange={e => setStudentName(e.target.value)}
                            placeholder="e.g. Rohan Mehra"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Class / Grade</label>
                            <input
                                type="text"
                                value={grade}
                                onChange={e => setGrade(e.target.value)}
                                placeholder="10-A"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Fee Amount (INR)</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Fee Purpose / Particulars</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Term Examination Fee"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                            <select
                                value={method}
                                onChange={e => setMethod(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                            >
                                <option value="Cash Collection">Cash at Counter</option>
                                <option value="Cheque / DD">Cheque / Demand Draft</option>
                                <option value="Direct Bank NEFT">Direct Bank NEFT</option>
                                <option value="UPI Counter Scanner">UPI Counter Scanner</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-bold text-slate-700 block mb-1">Voucher / Receipt #</label>
                            <input
                                type="text"
                                value={receiptNo}
                                onChange={e => setReceiptNo(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !studentName.trim() || !amount}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-2 transition"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            Record Inbound Fee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── CREATE NEW FEE CATALOG ITEM MODAL ───────────────────────────
function CreateFeeModal({
    onClose,
    onSubmit,
    saving
}: {
    onClose: () => void;
    onSubmit: (payload: any) => void;
    saving: boolean;
}) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Exam Enrollment');
    const [amount, setAmount] = useState('1500');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, category, amount: Number(amount) });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#004B93] rounded-xl">
                            <Plus size={18} />
                        </div>
                        <h3 className="text-base font-black text-slate-900">Add New Fee Structure</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        <XCircle size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Structure Title</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Mid-Term Assessment Pass"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Category</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                        >
                            <option value="Exam Enrollment">Exam Enrollment</option>
                            <option value="Special Competition">Special Competition</option>
                            <option value="Digital Learning">Digital Learning Pass</option>
                            <option value="Tuition Add-on">Tuition & Lab Add-on</option>
                        </select>
                    </div>

                    <div>
                        <label className="font-bold text-slate-700 block mb-1">Standard Rate (INR)</label>
                        <input
                            type="number"
                            required
                            min={1}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !name.trim() || !amount}
                            className="px-5 py-2 bg-[#004B93] hover:bg-[#003870] text-white rounded-xl font-bold flex items-center gap-2"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            Create Structure
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── MAIN PAYMENTS & FEES COMPONENT ─────────────────────────────
export default function WalletPayouts() {
    const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'disbursements' | 'bank' | 'catalog'>('overview');
    const [wallet, setWallet] = useState<WalletStats>({
        total_earnings: 0,
        available_balance: 0,
        pending_balance: 0,
        withdrawn_amount: 0,
        total_tds: 0
    });
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [disbursements, setDisbursements] = useState<DisbursementItem[]>([]);
    const [bankDetails, setBankDetails] = useState<BankDetails>({
        account_name: '',
        bank_name: '',
        branch: '',
        account_no: '',
        ifsc: '',
        account_type: 'Current Account',
        pan: '',
        auto_settle: true
    });
    const [feeCatalog, setFeeCatalog] = useState<FeeCatalogItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    // Modals
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [showManualFeeModal, setShowManualFeeModal] = useState(false);
    const [showCreateFeeModal, setShowCreateFeeModal] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<CollectionItem | null>(null);

    // Filters
    const [collectionSearch, setCollectionSearch] = useState('');
    const [collectionTypeFilter, setCollectionTypeFilter] = useState('all');

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/wallet');
            const json = await res.json();
            if (res.ok) {
                setWallet(json.wallet);
                setCollections(json.collections || []);
                setDisbursements(json.disbursements || []);
                if (json.bank_details) setBankDetails(json.bank_details);
                if (json.fee_catalog) setFeeCatalog(json.fee_catalog);
            } else {
                showToast(json.error || 'Failed to load treasury balances', false);
            }
        } catch {
            showToast('Gateway connection timeout', false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleWithdrawalSubmit = async (amount: number, note: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'REQUEST_PAYOUT',
                    payload: { amount, tenant_note: note }
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Payout failed');

            showToast(json.message || 'Withdrawal request queued successfully!', true);
            setShowWithdrawalModal(false);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Withdrawal error', false);
        } finally {
            setSaving(false);
        }
    };

    const handleManualFeeSubmit = async (payload: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'RECORD_OFFLINE_FEE',
                    payload
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to record fee');

            showToast(json.message || 'Fee collected and credited to wallet!', true);
            setShowManualFeeModal(false);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Transaction error', false);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_BANK_ACCOUNT',
                    payload: { bank_details: bankDetails }
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update bank details');

            showToast('Settlement bank credentials updated and verified!', true);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Error updating bank', false);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateFeeSubmit = async (payload: any) => {
        setSaving(true);
        try {
            const res = await fetch('/api/dashboard/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_FEE_ITEM',
                    payload: { fee_item: payload }
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to add fee');

            showToast(json.message || 'Fee structure created!', true);
            setShowCreateFeeModal(false);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Error creating fee', false);
        } finally {
            setSaving(false);
        }
    };

    const filteredCollections = useMemo(() => {
        return collections.filter(c => {
            const matchesType = collectionTypeFilter === 'all' || c.type.toLowerCase() === collectionTypeFilter;
            const matchesSearch = collectionSearch.trim() === '' ||
                c.student_name.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                c.title.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                c.order_id.toLowerCase().includes(collectionSearch.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [collections, collectionTypeFilter, collectionSearch]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
                <Loader2 size={42} className="animate-spin text-[#004B93] mb-4" />
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Synchronizing Treasury Liquidity Ledger...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-16">
            {/* Non-blocking Notification Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[20000] px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all ${
                    toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                    {toast.ok ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                    <span className="text-xs font-bold">{toast.msg}</span>
                </div>
            )}

            {/* ART-DIRECTED OPENAI HERO BANNER - FULL WIDTH */}
            <div className="relative w-full bg-slate-950 text-white overflow-hidden border-b border-slate-800">
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
                    <Image
                        src="/assets/images/dashboard/wallet_earnings_banner.jpg"
                        alt="Institutional Treasury & Liquidity Command"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />

                <div className="relative z-20 w-full px-6 py-10 sm:px-10 sm:py-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Treasury Liquidity Operational
                                </span>
                                <span className="text-xs text-slate-400 font-semibold font-mono">
                                    GATEWAY: ENCRYPTED HDFC CLEARING • TDS RATE: 10%
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                                Institutional Payments & Earnings Treasury
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-normal">
                                Real-time student fee collections, online examination registration revenues, automatic TDS compliance tracking, and scheduled bank disbursements.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={fetchData}
                                className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition"
                            >
                                <RefreshCcw size={14} /> Refresh
                            </button>
                            <button
                                onClick={() => setShowManualFeeModal(true)}
                                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold flex items-center gap-2 backdrop-blur-sm transition"
                            >
                                <Plus size={15} /> Record Offline Fee
                            </button>
                            <button
                                onClick={() => setShowWithdrawalModal(true)}
                                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                            >
                                <Landmark size={15} /> Request Withdrawal
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL WIDTH MAIN CONTENT WRAPPER */}
            <div className="w-full px-6 sm:px-10 mt-8 space-y-8">
                {/* 4 EXECUTIVE KPI METRICS (FULL WIDTH GRID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: Available Liquidity */}
                    <div className="bg-gradient-to-br from-[#004B93] to-[#002D58] text-white p-6 rounded-3xl shadow-lg shadow-blue-900/15 relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Available Liquidity</span>
                                <div className="p-2 bg-white/10 text-white rounded-xl">
                                    <WalletCards size={18} />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tight">
                                ₹{wallet.available_balance.toLocaleString()}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                            <span>Ready for disbursement</span>
                            <button
                                onClick={() => setShowWithdrawalModal(true)}
                                className="font-bold underline hover:text-white flex items-center gap-1"
                            >
                                Payout <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Total Net Collections */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Collections</span>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <ArrowUpRight size={18} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                ₹{wallet.total_earnings.toLocaleString()}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                            <CheckCircle2 size={14} />
                            <span>{collections.length} verified fee receipts</span>
                        </div>
                    </div>

                    {/* Card 3: Settled to Bank */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Settled to Bank</span>
                                <div className="p-2 bg-blue-50 text-[#004B93] rounded-xl">
                                    <Landmark size={18} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                ₹{wallet.withdrawn_amount.toLocaleString()}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Building2 size={13} className="text-[#004B93]" />
                            <span>HDFC Bank •••• 4281</span>
                        </div>
                    </div>

                    {/* Card 4: Pending Settlement */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Clearance</span>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Clock size={18} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                ₹{wallet.pending_balance.toLocaleString()}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-600 font-semibold">
                            <span>Friday clearing cycle active</span>
                        </div>
                    </div>
                </div>

                {/* TAB NAVIGATION BAR (FULL WIDTH) */}
                <div className="w-full border-b border-slate-200 pb-3 flex flex-wrap items-center gap-2.5">
                    {[
                        { id: 'overview', label: 'Overview & Liquidity Telemetry', icon: Coins },
                        { id: 'collections', label: 'Inbound Collections & Fee Ledger', icon: Receipt, count: collections.length },
                        { id: 'disbursements', label: 'Bank Disbursements & Settlements', icon: Landmark, count: disbursements.length },
                        { id: 'bank', label: 'Settlement Bank Account & Tax', icon: Building2 },
                        { id: 'catalog', label: 'Fee Structures & Pricing Catalog', icon: FileText, count: feeCatalog.length }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-[#004B93] text-white shadow-md shadow-blue-900/15'
                                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                            >
                                <Icon size={15} /> {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT PANELS (FULL WIDTH) */}
                <div className="w-full">
                    {/* ── TAB 1: OVERVIEW & LIQUIDITY TELEMETRY ── */}
                    {activeTab === 'overview' && (
                        <div className="w-full space-y-6">
                            {/* Revenue Breakdown Matrix */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: 'Examination Registration Revenues',
                                        subtitle: 'CBSE, State Board & Term Assessment Fees',
                                        amount: 24000,
                                        icon: FileText,
                                        color: '#004B93',
                                        bg: 'bg-blue-50'
                                    },
                                    {
                                        title: 'STEM & Olympiad Registrations',
                                        subtitle: 'National Competitions & Special Challenges',
                                        amount: 18000,
                                        icon: Sparkles,
                                        color: '#10B981',
                                        bg: 'bg-emerald-50'
                                    },
                                    {
                                        title: 'Digital LMS & AI Resource Packs',
                                        subtitle: 'Student Practice Credits & Courseware Passes',
                                        amount: 24700,
                                        icon: Cpu,
                                        color: '#F59E0B',
                                        bg: 'bg-amber-50'
                                    }
                                ].map((rev, idx) => {
                                    const Icon = rev.icon;
                                    return (
                                        <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${rev.bg}`} style={{ color: rev.color }}>
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-xs">{rev.title}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">{rev.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="text-2xl font-black text-slate-900 pt-2 border-t border-slate-100">
                                                ₹{rev.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* TDS & Settlement Policies Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Statutory TDS Withholding Box */}
                                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900">Statutory Tax & TDS Accounting</h4>
                                            <p className="text-xs text-slate-500 font-medium">Section 194J / 194C Compliant Withholdings</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        In compliance with Central Board of Direct Taxes (CBDT) regulations, a statutory 10% TDS deduction is accounted for on institutional earnings disbursals. Quarterly Form 16A certificates are automatically made available.
                                    </p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-600">Total TDS Withheld to Date:</span>
                                        <span className="text-slate-900 font-mono">₹{wallet.total_tds.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Clearing Schedule Box */}
                                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-50 text-[#004B93] rounded-xl">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900">Clearing & Disbursement Schedule</h4>
                                            <p className="text-xs text-slate-500 font-medium">Automated weekly settlement batching</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        Payout requests submitted before Thursday 23:59 IST are processed directly via NEFT/RTGS during the Friday banking settlement run directly into your verified current account.
                                    </p>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-600">Next Scheduled Clearing Run:</span>
                                        <span className="text-emerald-600">Friday, 18:00 IST</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: INBOUND COLLECTIONS & FEE LEDGER ── */}
                    {activeTab === 'collections' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                            {/* Filter Bar */}
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Inbound Student Fee Collections</h3>
                                    <p className="text-xs text-slate-500 font-medium">Real-time ledger of tuition, exam fees, and digital resource purchases</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="text"
                                        value={collectionSearch}
                                        onChange={e => setCollectionSearch(e.target.value)}
                                        placeholder="Search student or order..."
                                        className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                    />
                                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: 'exam', label: 'Exams' },
                                            { id: 'syllabus', label: 'STEM/Olympiad' },
                                            { id: 'wallet', label: 'AI Packs' }
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setCollectionTypeFilter(f.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                                                    collectionTypeFilter === f.id
                                                        ? 'bg-[#004B93] text-white'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3.5 px-6">Order / Txn ID</th>
                                            <th className="py-3.5 px-6">Date</th>
                                            <th className="py-3.5 px-6">Student Candidate</th>
                                            <th className="py-3.5 px-6">Description</th>
                                            <th className="py-3.5 px-6">Payment Mode</th>
                                            <th className="py-3.5 px-6 text-right">Amount (INR)</th>
                                            <th className="py-3.5 px-6 text-center">Status</th>
                                            <th className="py-3.5 px-6 text-right">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredCollections.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                                    No inbound collections found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCollections.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                                        {c.order_id}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 font-medium">
                                                        {formatDate(c.created_at)}
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-slate-900">
                                                        {c.student_name}
                                                        <span className="block text-[10px] text-slate-400 font-normal">{c.grade}</span>
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-slate-700">
                                                        {c.title}
                                                    </td>
                                                    <td className="py-4 px-6 font-medium text-slate-600">
                                                        {c.method}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-black text-slate-900">
                                                        ₹{c.amount.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => setSelectedReceipt(c)}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#004B93] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                                                        >
                                                            <Printer size={13} /> View Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 3: BANK DISBURSEMENTS & SETTLEMENTS ── */}
                    {activeTab === 'disbursements' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Disbursement & Settlement History</h3>
                                    <p className="text-xs text-slate-500 font-medium">Bank transfer batches, NEFT UTR tracking, and TDS deduction logs</p>
                                </div>
                                <button
                                    onClick={() => setShowWithdrawalModal(true)}
                                    className="px-5 py-2.5 bg-[#004B93] hover:bg-[#003870] text-white rounded-2xl text-xs font-black flex items-center gap-2 transition"
                                >
                                    <Landmark size={15} /> Request Payout
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3.5 px-6">Payout Reference</th>
                                            <th className="py-3.5 px-6">Requested Date</th>
                                            <th className="py-3.5 px-6">Target Bank</th>
                                            <th className="py-3.5 px-6 text-right">Gross Amount</th>
                                            <th className="py-3.5 px-6 text-right">TDS (10%)</th>
                                            <th className="py-3.5 px-6 text-right">Net Credited</th>
                                            <th className="py-3.5 px-6">Bank UTR Ref</th>
                                            <th className="py-3.5 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {disbursements.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                                    No disbursement history found.
                                                </td>
                                            </tr>
                                        ) : (
                                            disbursements.map(d => (
                                                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                                        SETTLE-{d.id.substring(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 font-medium">
                                                        {formatDate(d.requested_at)}
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-slate-800">
                                                        {bankDetails.bank_name} •••• {bankDetails.account_no.slice(-4)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                                                        ₹{d.amount.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-medium text-rose-600">
                                                        -₹{d.tds_amount.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-black text-emerald-600">
                                                        ₹{d.net_amount.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-slate-600">
                                                        {d.utr || 'Pending Batch Clearance'}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            d.status === 'settled'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                            {d.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 4: SETTLEMENT BANK ACCOUNT ── */}
                    {activeTab === 'bank' && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Settlement Bank Account & Tax Setup</h3>
                                    <p className="text-xs text-slate-500 font-medium">Configure institutional banking credentials for direct clearing and automated Friday disbursements</p>
                                </div>
                                <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-2">
                                    <ShieldCheck size={16} /> Verified Corporate Current Account
                                </div>
                            </div>

                            <form onSubmit={handleSaveBankDetails} className="space-y-6 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Account Holder Name (Trust / Legal Entity)</label>
                                        <input
                                            type="text"
                                            required
                                            value={bankDetails.account_name}
                                            onChange={e => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Bank Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={bankDetails.bank_name}
                                            onChange={e => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Account Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={bankDetails.account_no}
                                            onChange={e => setBankDetails(prev => ({ ...prev, account_no: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Bank IFSC Code</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={11}
                                            value={bankDetails.ifsc}
                                            onChange={e => setBankDetails(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Branch Location</label>
                                        <input
                                            type="text"
                                            value={bankDetails.branch}
                                            onChange={e => setBankDetails(prev => ({ ...prev, branch: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1.5 uppercase tracking-wider text-[11px]">Institutional PAN (for Form 16A TDS)</label>
                                        <input
                                            type="text"
                                            maxLength={10}
                                            value={bankDetails.pan}
                                            onChange={e => setBankDetails(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#004B93]/20"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-slate-900">Automated Weekly Clearing (Every Friday)</div>
                                        <div className="text-[11px] text-slate-500 font-medium">Automatically disburse available balance exceeding ₹5,000 every Friday</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={bankDetails.auto_settle}
                                        onChange={e => setBankDetails(prev => ({ ...prev, auto_settle: e.target.checked }))}
                                        className="h-5 w-5 rounded text-[#004B93] focus:ring-0 cursor-pointer"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-[#004B93] hover:bg-[#003870] disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition"
                                    >
                                        {saving && <Loader2 size={14} className="animate-spin" />}
                                        Save & Verify Banking Credentials
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── TAB 5: FEE CATALOG & RATES ── */}
                    {activeTab === 'catalog' && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Student Fee Structures & Assessment Rates</h3>
                                    <p className="text-xs text-slate-500 font-medium">Standard registration fees charged for institutional tests and digital passes</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateFeeModal(true)}
                                    className="px-5 py-2.5 bg-[#004B93] hover:bg-[#003870] text-white rounded-2xl text-xs font-black flex items-center gap-2 transition"
                                >
                                    <Plus size={15} /> Add Fee Structure
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3.5 px-6">Fee Structure Title</th>
                                            <th className="py-3.5 px-6">Category</th>
                                            <th className="py-3.5 px-6 text-right">Standard Rate</th>
                                            <th className="py-3.5 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {feeCatalog.map(f => (
                                            <tr key={f.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-4 px-6 font-bold text-slate-900">
                                                    {f.name}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 font-medium">
                                                    {f.category}
                                                </td>
                                                <td className="py-4 px-6 text-right font-black text-slate-900">
                                                    ₹{f.amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: WITHDRAWAL REQUEST */}
            {showWithdrawalModal && (
                <WithdrawalModal
                    availableBalance={wallet.available_balance}
                    bankDetails={bankDetails}
                    onClose={() => setShowWithdrawalModal(false)}
                    onSubmit={handleWithdrawalSubmit}
                    saving={saving}
                />
            )}

            {/* MODAL: RECORD OFFLINE FEE */}
            {showManualFeeModal && (
                <ManualFeeModal
                    onClose={() => setShowManualFeeModal(false)}
                    onSubmit={handleManualFeeSubmit}
                    saving={saving}
                />
            )}

            {/* MODAL: CREATE FEE STRUCTURE */}
            {showCreateFeeModal && (
                <CreateFeeModal
                    onClose={() => setShowCreateFeeModal(false)}
                    onSubmit={handleCreateFeeSubmit}
                    saving={saving}
                />
            )}

            {/* MODAL: STUDENT FEE RECEIPT */}
            {selectedReceipt && (
                <StudentReceiptModal
                    item={selectedReceipt}
                    schoolName={bankDetails.account_name}
                    onClose={() => setSelectedReceipt(null)}
                />
            )}
        </div>
    );
}
