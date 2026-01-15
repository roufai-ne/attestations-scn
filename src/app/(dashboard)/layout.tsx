import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar />

            <div className="lg:pl-72 transition-all duration-300">
                <Header />

                <main className="p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
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
        </div>
    );
}
