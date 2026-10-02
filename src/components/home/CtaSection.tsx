'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Call to Action Section
 * A compelling call to action using brand colors and a full-width layout.
 */
export function CtaSection() {
    return (
        <section className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-20 text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-extrabold sm:text-5xl font-manrope mb-4">
                    Ready to Transform Your Institution?
                </h2>
                <p className="mt-4 text-xl font-light max-w-3xl mx-auto font-worksans">
                    Join hundreds of leading institutions already leveraging BeBrilliant for smarter exams, deeper insights, and seamless administration.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/request-demo"
                        className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base text-blue-800 bg-white hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 shadow-lg hover:shadow-xl"
                    >
                        <span>Book a Live Demo</span>
                        <ArrowRight size={18} />
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-base text-white border border-white/40 hover:bg-white/10 active:scale-[0.98] transition-all duration-150"
                    >
                        <span>Contact Our Team</span>
                    </Link>
                </div>
            </div>
        </section>
    )
}
