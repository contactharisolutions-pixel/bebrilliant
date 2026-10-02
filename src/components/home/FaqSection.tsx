'use client'

import React from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQS = [
    {
        question: 'What kind of institutions can use BeBrilliant?',
        answer: 'BeBrilliant is designed for a wide range of educational institutions, including schools, coaching centers, colleges, and other academic bodies. Our multi-tenant architecture supports various organizational structures.',
    },
    {
        question: 'How does the AI Question Generator work?',
        answer: 'Our AI Question Generator leverages advanced machine learning algorithms to create diverse question papers based on specified topics, difficulty levels, and question types, saving educators significant time.',
    },
    {
        question: 'Is BeBrilliant compliant with data privacy regulations?',
        answer: 'Yes, we are fully DPDP (Digital Personal Data Protection) compliant. We employ robust data isolation and encryption protocols to ensure the highest standards of data privacy and security for all institutions and users.',
    },
    {
        question: 'Can I integrate BeBrilliant with existing systems?',
        answer: 'BeBrilliant is built with integration capabilities in mind. We offer APIs and support for various common educational and administrative tools. Please contact our support team for specific integration requirements.',
    },
    {
        question: 'What kind of support does BeBrilliant offer?',
        answer: 'We provide comprehensive support, including 24/7 online assistance, detailed documentation, video tutorials, and dedicated account managers for enterprise clients, ensuring you get the most out of our platform.',
    },
]

export function FaqSection() {
    return (
        <section className="w-full bg-white py-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-widest mb-4">
                        <HelpCircle size={13} />
                        <span>Frequently Asked Questions</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl font-manrope mb-4">
                        Your Questions, Answered.
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto font-worksans">
                        Find quick answers to the most common queries about the BeBrilliant platform.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    {FAQS.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                            <details className="group">
                                <summary className="flex justify-between items-center font-semibold text-lg text-gray-900 cursor-pointer">
                                    {faq.question}
                                    <ChevronDown size={20} className="text-gray-500 group-open:rotate-180 transition-transform duration-200" />
                                </summary>
                                <p className="mt-4 text-base text-gray-600 font-worksans leading-relaxed">
                                    {faq.answer}
                                </p>
                            </details>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
