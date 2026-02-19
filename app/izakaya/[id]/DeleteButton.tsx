'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ id }: { id: number }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('本当にこの居酒屋を削除しますか？')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/izakayas/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('削除に失敗しました');

            router.push('/');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-lg font-medium transition-colors flex-1 sm:flex-none border border-red-200"
        >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? '削除中...' : '削除'}
        </button>
    );
}
