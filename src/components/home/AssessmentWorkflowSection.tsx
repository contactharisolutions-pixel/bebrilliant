'use client'

import React from 'react'
import { FileEdit, Scan, BarChart2, Award } from 'lucide-react'

/**
 * Assessment Workflow Section
 * Visualizes the streamlined examination process on the BeBrilliant platform.
 */
export function AssessmentWorkflowSection() {
    const STEPS = [
        {
            icon: FileEdit,
            title: 'Create & Customize',
            description: 'Design question papers with our intuitive editor or generate them using AI. Customize exam settings, durations, and question types.',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: Scan,
            title: 'Conduct & Proctor',
            description: 'Deploy online proctored exams or conduct offline OMR-based assessments. Ensure fairness with advanced anti-cheat mechanisms.',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            icon: BarChart2,
            title: 'Evaluate & Analyze',
            description: 'Automated grading for objective questions and AI-assisted evaluation for subjective answers. Generate detailed performance analytics.',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
        {
            icon: Award,
            title: 'Certify & Progress',
            description: 'Issue digital certificates, track student progress over time, and identify areas for improvement with personalized insights.',
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
    ]

    return (
        <section className="w-full py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl font-manrope mb-4">
                        Our Streamlined Assessment Workflow
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto font-worksans">
                        From creation to certification, BeBrilliant simplifies every step of the examination process.
                    </p>
                </div>
                <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {STEPS.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <div className={`p-5 rounded-full inline-flex ${step.bg}`}>
                                <step.icon size={32} className={`${step.color}`} />
                            </div>
                            <h3 className="mt-8 text-xl font-semibold text-gray-900 font-manrope">
                                {step.title}
                            </h3>
                            <p className="mt-3 text-base text-gray-600 font-worksans">
                                {step.description}
                            </p>
                        </div>
                    ))}
                    {/* Line connectors for larger screens */}
                    <div className="hidden lg:block absolute inset-y-0 left-0 right-0 mx-auto w-full max-w-7xl px-6 lg:px-8 pointer-events-none">
                        <div className="h-full flex items-center justify-between">
                            <span className="block w-8 h-px bg-gray-300" />
                            <span className="block w-8 h-px bg-gray-300" />
                            <span className="block w-8 h-px bg-gray-300" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}