'use client';

import IzakayaForm from '@/components/IzakayaForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewIzakayaPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/izakayas', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to create izakaya');
            }

            router.push('/');
            router.refresh(); // Refresh to show new item
        } catch (error) {
            console.error(error);
            alert('保存に失敗しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">新しい居酒屋を追加</h1>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <IzakayaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
        </div>
    );
}
