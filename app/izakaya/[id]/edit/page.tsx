import EditIzakayaFormClient from './EditIzakayaFormClient';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditIzakayaPage({ params }: PageProps) {
    const { id } = await params;

    const { data, error } = await supabase
        .from('izakayas')
        .select('*, izakaya_images(*)')
        .eq('id', parseInt(id))
        .single();

    if (error || !data) {
        notFound();
    }

    const izakaya = {
        id: data.id,
        name: data.name,
        rating: data.rating,
        genre: data.genre,
        memo: data.memo ?? null,
        mapUrl: data.map_url ?? null,
        status: data.status,
        images: (data.izakaya_images ?? []).map((img: any) => ({
            id: img.id,
            url: img.url,
            caption: img.caption ?? null,
            izakayaId: img.izakaya_id,
            createdAt: img.created_at,
        })),
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">居酒屋情報を編集</h1>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <EditIzakayaFormClient izakaya={izakaya} />
            </div>
        </div>
    );
}
