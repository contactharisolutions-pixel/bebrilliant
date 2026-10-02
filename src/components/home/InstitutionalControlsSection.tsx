'use client'

import React from 'react'
import { Settings, Users, Building, GraduationCap } from 'lucide-react'

/**
 * Institutional Controls Section
 * Showcases the administrative and governance capabilities for institutions.
 */
export function InstitutionalControlsSection() {
    const CONTROLS = [
        {
            icon: Building,
            title: 'White-Label Customization',
            description: 'Brand the platform as your own with customizable logos, themes, and domain settings.',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: Users,
            title: 'Role-Based Access',
            description: 'Granular control over user roles and permissions for teachers, students, and administrators.',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            icon: Settings,
            title: 'Centralized Configuration',
            description: 'Manage all institutional settings, from academic years to notification preferences, in one place.',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
        {
            icon: GraduationCap,
            title: 'Curriculum & Syllabus Management',
            description: "Effortlessly align exams with your institution's curriculum and academic calendar.",
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
    ]

    return (
        <section className="w-full py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl font-manrope mb-4">
                        Empowering Institutions with Advanced Controls
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto font-worksans">
                        BeBrilliant provides a robust administrative console to manage every aspect of your academic operations.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {CONTROLS.map((control, index) => (
                        <div key={index} className="text-center p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className={`p-4 rounded-full inline-flex ${control.bg} mb-4`}>
                                <control.icon size={28} className={`${control.color}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 font-manrope">
                                {control.title}
                            </h3>
                            <p className="mt-2 text-base text-gray-600 font-worksans">
                                {control.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
