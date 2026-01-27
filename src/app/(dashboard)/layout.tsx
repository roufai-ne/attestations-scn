'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();

    return (
        <>
            <Sidebar />

            <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                <Header />

                <main className="p-2 sm:p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-full">
                        <Breadcrumbs />
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t bg-white/50 backdrop-blur-sm mt-auto py-4">
                    <div className="px-4 md:px-6 lg:px-8 mx-auto max-w-7xl">
                        <p className="text-sm text-gray-600 text-center">
                            © 2026 Service Civique National - République du Niger
                        </p>
                    </div>
                </footer>
            </div>

            <Toaster />
        </>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <DashboardContent>{children}</DashboardContent>
            </div>
        </SidebarProvider>
    );
}
