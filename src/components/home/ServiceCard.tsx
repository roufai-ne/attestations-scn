'use client';

import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    accentColor?: 'orange' | 'green' | 'navy';
    href?: string;
}

export function ServiceCard({
    title,
    description,
    icon: Icon,
    accentColor = 'orange',
    href = '#',
}: ServiceCardProps) {
    const colorClasses = {
        orange: 'border-t-[var(--accent-orange)] hover:shadow-orange-100',
        green: 'border-t-[var(--accent-green)] hover:shadow-green-100',
        navy: 'border-t-[var(--navy)] hover:shadow-blue-100',
    };

    const iconColorClasses = {
        orange: 'text-[var(--accent-orange)]',
        green: 'text-[var(--accent-green)]',
        navy: 'text-[var(--navy)]',
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-sm hover:shadow-xl border-t-4 ${colorClasses[accentColor]} p-6 transition-all duration-300 group`}
        >
            {/* Icon */}
            <div className={`mb-4 ${iconColorClasses[accentColor]}`}>
                <Icon className="w-10 h-10 transition-transform group-hover:scale-110" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-[var(--navy)] mb-3 group-hover:text-[var(--accent-orange)] transition-colors">
                {title}
            </h3>

            {/* Description */}
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                {description}
            </p>

            {/* Link */}
            <a
                href={href}
                className={`inline-flex items-center gap-1 text-sm font-medium ${iconColorClasses[accentColor]} hover:underline group-hover:gap-2 transition-all`}
            >
                <span className="text-lg">+</span>
                <span>En savoir plus</span>
            </a>
        </div>
    );
}

export default ServiceCard;
