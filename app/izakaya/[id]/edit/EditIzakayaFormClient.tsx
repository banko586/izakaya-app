'use client';

import IzakayaForm from '@/components/IzakayaForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Izakaya, IzakayaImage } from '@prisma/client';

type IzakayaWithImages = Izakaya & { images: IzakayaImage[] };

export default function EditIzakayaFormClient({ izakaya }: { izakaya: IzakayaWithImages }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/izakayas/${izakaya.id}`, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to update izakaya');
            }

            router.push(`/izakaya/${izakaya.id}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <IzakayaForm
            initialData={{
                id: izakaya.id,
                name: izakaya.name,
                rating: izakaya.rating,
                genre: izakaya.genre,
                memo: izakaya.memo,
                mapUrl: izakaya.mapUrl,
                status: izakaya.status,
                images: izakaya.images,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
        />
    );
}
