'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header() {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <header className="sticky top-0 z-30 bg-white border-b">
            <div className="flex items-center justify-between px-6 py-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            3
                        </Badge>
                    </Button>

                    {/* User info */}
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.role}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
