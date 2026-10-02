'use client'

import React from 'react'
import {
    ShieldCheck, BrainCircuit, BarChart3, Users, FileText, CheckCircle, Lock, UserCheck,
    Cloud, HardDrive, Zap, MessageSquare
} from 'lucide-react'

/**
 * Capabilities Section
 * Highlights the core features and capabilities of the BeBrilliant platform.
 */
export function CapabilitiesSection() {
    const CAPABILITIES = [
        {
            icon: ShieldCheck,
            title: 'Secure Online Exams',
            description: 'Conduct proctored online exams with advanced anti-cheat mechanisms and secure data handling.',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: BrainCircuit,
            title: 'AI Question Generation',
            description: 'Leverage AI to generate high-quality question papers across various subjects and difficulty levels.',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            icon: BarChart3,
            title: 'Real-time Analytics',
            description: 'Gain deep insights into student performance, curriculum effectiveness, and institutional growth with live dashboards.',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
        {
            icon: Users,
            title: 'Comprehensive Student Management',
            description: 'Effortlessly manage student profiles, batches, attendance, and communication from a single platform.',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            icon: FileText,
            title: 'Extensive Question Bank',
            description: 'Build, import, and organize a vast repository of questions, categorized by topic, difficulty, and type.',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            icon: CheckCircle,
            title: 'OMR Assessment Suite',
            description: 'Streamline offline assessments with high-speed OMR sheet scanning and automated result processing.',
            color: 'text-pink-600',
            bg: 'bg-pink-50'
        },
        {
            icon: Lock,
            title: 'Robust Anti-Cheat Proctoring',
            description: 'Ensure exam integrity with AI-powered proctoring, tab-switch detection, and malpractice prevention.',
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            icon: UserCheck,
            title: 'Teacher & Staff Management',
            description: 'Create and manage teacher accounts, assign roles, track performance, and facilitate collaboration.',
            color: 'text-teal-600',
            bg: 'bg-teal-50'
        },
        {
            icon: Cloud,
            title: 'Scalable Cloud Infrastructure',
            description: 'Powered by a robust cloud infrastructure, ensuring high availability, performance, and data security.',
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            icon: HardDrive,
            title: 'DPDP Compliant Data Isolation',
            description: 'Strict adherence to data privacy regulations with isolated tenant data architecture.',
            color: 'text-gray-600',
            bg: 'bg-gray-50'
        },
        {
            icon: Zap,
            title: '24-Hour Turnkey Deployment',
            description: 'Rapid deployment model to get your institution up and running within 24 hours.',
            color: 'text-cyan-600',
            bg: 'bg-cyan-50'
        },
        {
            icon: MessageSquare,
            title: 'Integrated Communication',
            description: 'Seamless communication tools for students, teachers, and administrators within the platform.',
            color: 'text-lime-600',
            bg: 'bg-lime-50'
        },
    ]

    return (
        <section className="w-full py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl font-manrope mb-4">
                        All-in-One Platform for Academic Excellence
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto font-worksans">
                        BeBrilliant empowers institutions with a comprehensive suite of tools designed to streamline
                        examinations, enhance learning, and simplify administration.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                    {CAPABILITIES.map((capability, index) => (
                        <div key={index} className="text-center">
                            <div className={`p-4 rounded-full inline-flex ${capability.bg}`}>
                                <capability.icon size={24} className={`${capability.color}`} />
                            </div>
                            <h3 className="mt-6 text-lg font-semibold text-gray-900 font-manrope">
                                {capability.title}
                            </h3>
                            <p className="mt-2 text-base text-gray-600 font-worksans">
                                {capability.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
