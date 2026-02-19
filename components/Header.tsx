'use client';

import Link from 'next/link';
import { PlusCircle, Beer } from 'lucide-react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-bold font-serif text-xl text-primary hover:opacity-90 transition-opacity">
                    <Beer className="w-6 h-6" />
                    <span>Izakaya Log</span>
                </Link>
                <nav className="flex items-center gap-4">
                    <Link
                        href="/izakaya/new"
                        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full font-medium transition-colors text-sm shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">新規追加</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
