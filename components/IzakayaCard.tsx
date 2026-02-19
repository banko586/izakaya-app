'use client';

import Link from 'next/link';
import Image from 'next/image';
import StarRating from './StarRating';
import { MapPin, CheckCircle, Bookmark } from 'lucide-react';
interface IzakayaCardProps {
    id: number;
    name: string;
    rating: number;
    genre: string;
    mapUrl: string | null;
    status: string;
    images: { url: string }[];
}

export default function IzakayaCard({
    id,
    name,
    rating,
    genre,
    mapUrl,
    status,
    images,
}: IzakayaCardProps) {
    // Use first image from collection
    const displayImage = images && images.length > 0 ? images[0].url : null;

    return (
        <Link href={`/izakaya/${id}`} className="group block">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative">
                {/* Status Badge */}
                <div className={`absolute top-2 left-2 z-10 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm ${status === 'VISITED'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                    {status === 'VISITED' ? <CheckCircle size={12} /> : <Bookmark size={12} />}
                    {status === 'VISITED' ? '行った' : '行きたい'}
                </div>

                <div className="relative aspect-video w-full bg-muted overflow-hidden">
                    {displayImage ? (
                        <Image
                            src={displayImage}
                            alt={name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/50">
                            画像なし
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/10">
                        {genre}
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {name}
                    </h3>

                    <div className="flex items-center justify-between">
                        <StarRating rating={rating} readonly size={16} />
                    </div>

                    {mapUrl && (
                        <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin size={12} />
                            <span>地図を見る</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
