'use client';

import { useRouter, useSearchParams } from 'next/navigation';
// Actually simple "Search" button is easier and safer without extra deps.
import { useState, Suspense } from 'react';
import { Search, Filter } from 'lucide-react';

export default function SearchFilter() {
    return (
        <Suspense fallback={<div>Loading search...</div>}>
            <SearchFilterContent />
        </Suspense>
    );
}

function SearchFilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [q, setQ] = useState(searchParams.get('q') || '');
    const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
    const [status, setStatus] = useState(searchParams.get('status') || 'All');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (genre && genre !== 'All') params.set('genre', genre);
        if (status && status !== 'All') params.set('status', status);

        router.push(`/?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="店名で検索..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Genre Select */}
                <select
                    className="px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                >
                    <option value="All">全ジャンル</option>
                    <option value="Yakitori">焼き鳥</option>
                    <option value="Seafood">海鮮</option>
                    <option value="Izakaya">居酒屋</option>
                    <option value="Standing Bar">立ち飲み</option>
                    <option value="Bar">バー</option>
                    <option value="Dining Bar">ダイニングバー</option>
                </select>

                {/* Status Select */}
                <select
                    className="px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="All">全ステータス</option>
                    <option value="VISITED">行った</option>
                    <option value="WANT_TO_GO">行きたい</option>
                </select>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center"
                >
                    <Filter className="h-4 w-4" />
                    検索
                </button>
            </div>
        </div>
    );
}
