import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SaisieLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role !== 'SAISIE') {
        redirect('/login');
    }

    return <>{children}</>;
}
