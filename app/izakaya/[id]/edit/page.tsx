import prisma from '@/lib/prisma';
import EditIzakayaFormClient from './EditIzakayaFormClient';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditIzakayaPage({ params }: PageProps) {
    const { id } = await params;
    const izakaya = await prisma.izakaya.findUnique({
        where: { id: parseInt(id) },
        include: {
            images: true,
        },
    });

    if (!izakaya) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">居酒屋情報を編集</h1>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <EditIzakayaFormClient izakaya={izakaya} />
            </div>
        </div>
    );
}
