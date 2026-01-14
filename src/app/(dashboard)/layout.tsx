import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="lg:pl-64">
                <Header />

                <main className="p-6">
                    {children}
                </main>
            </div>

            <Toaster />
        </div>
    );
}
