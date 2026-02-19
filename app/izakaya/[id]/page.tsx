import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import StarRating from '@/components/StarRating';
import { MapPin, ArrowLeft, Edit, CheckCircle, Bookmark } from 'lucide-react';
import DeleteButton from './DeleteButton';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function IzakayaDetailPage({ params }: PageProps) {
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

    // Collect all images for gallery
    // Collect all images for gallery
    const uniqueImages = izakaya.images.map((img: any) => ({
        url: img.url,
        caption: img.caption
    }));

    // Use first image as hero, others as gallery
    const heroImage = uniqueImages.length > 0 ? uniqueImages[0].url : null;
    const galleryImages = uniqueImages.slice(1);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <Link
                href="/"
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                リストに戻る
            </Link>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="relative aspect-video w-full bg-muted">
                    {heroImage ? (
                        <Image
                            src={heroImage}
                            alt={izakaya.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            画像なし
                        </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <Link
                            href={`/izakaya/${izakaya.id}/edit`}
                            className="bg-white/90 hover:bg-white text-foreground p-2 rounded-full shadow-sm backdrop-blur transition-colors"
                        >
                            <Edit className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="absolute top-4 left-4">
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold shadow-sm backdrop-blur-md ${izakaya.status === 'VISITED'
                            ? 'bg-emerald-100/90 text-emerald-800'
                            : 'bg-amber-100/90 text-amber-800'
                            }`}>
                            {izakaya.status === 'VISITED' ? <CheckCircle size={16} /> : <Bookmark size={16} />}
                            <span className="text-sm">{izakaya.status === 'VISITED' ? '行った' : '行きたい'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 font-serif">
                                {izakaya.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                    {izakaya.genre}
                                </span>
                                <div className="flex items-center gap-2">
                                    <StarRating rating={izakaya.rating} readonly size={20} />
                                    <span className="font-semibold text-foreground text-lg">{izakaya.rating}.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Gallery */}
                    {galleryImages.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-xl">ギャラリー</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {galleryImages.map((img, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity shadow-sm">
                                            <Image
                                                src={img.url}
                                                alt={`${izakaya.name} - ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        {img.caption && (
                                            <p className="text-sm text-muted-foreground font-medium font-serif pl-1 border-l-2 border-primary/30">
                                                {img.caption}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold border-l-4 border-primary pl-3">
                            メモ
                        </h2>
                        <div className="prose prose-stone max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-6 rounded-xl">
                            {izakaya.memo || "メモはありません。"}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                        {izakaya.mapUrl && (
                            <a
                                href={izakaya.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-full font-bold transition-colors flex-1"
                            >
                                <MapPin className="w-5 h-5" />
                                Googleマップで見る
                            </a>
                        )}
                        <DeleteButton id={izakaya.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
