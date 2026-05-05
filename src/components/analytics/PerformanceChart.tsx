'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'

interface PerformanceProps {
    data: {
        subject: string
        accuracy: number
        attempts: number
        color: string
    }[]
}

export default function PerformanceChart({ data }: PerformanceProps) {
    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-gray-500">Not enough data to calculate performance...</div>
    }

    const avgAccuracy = Math.round(data.reduce((acc, curr) => acc + curr.accuracy, 0) / data.length)
    const isTrendingUp = avgAccuracy > 60

    return (
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 font-sans w-full relative overflow-hidden">

            {/* Header / Metric Overlays */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#672AEA]" /> Accuracy Distribution
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Topic-by-Topic Precision Analysis</p>
                </div>

                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isTrendingUp ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                    <div className="font-bold flex items-center gap-2 text-lg">
                        {isTrendingUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        {avgAccuracy}%
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Overall Accuracy</span>
                </div>
            </div>

            {/* AI Smart Suggestion Wrapper */}
            {data.find(d => d.accuracy < 50) && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4 rounded-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1 block">AI Smart Suggestion</span>
                        <p className="font-semibold text-gray-800 text-sm">Your accuracy in <span className="text-purple-700">{data.find(d => d.accuracy < 50)?.subject}</span> is dropping. Our AI generated a 2-day Revision Plan for you!</p>
                    </div>
                    <button className="whitespace-nowrap bg-[#672AEA] hover:bg-[#5A24CC] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all">
                        View Plan
                    </button>
                </div>
            )}

            {/* Recharts Component Phase 6 */}
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="subject"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B6B6B', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B6B6B', fontSize: 12, fontWeight: 500 }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '12px' }}
                            itemStyle={{ fontWeight: 700, fontSize: '15px' }}
                            labelStyle={{ color: '#6B6B6B', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}
                            formatter={(value: any) => [`${value}%`, 'Accuracy']}
                        />
                        <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#672AEA'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
