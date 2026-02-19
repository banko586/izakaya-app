import IzakayaCard from '@/components/IzakayaCard';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import SearchFilter from '@/components/SearchFilter';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home(props: PageProps) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const genre = typeof searchParams.genre === 'string' && searchParams.genre !== 'All' ? searchParams.genre : undefined;
  const status = typeof searchParams.status === 'string' && searchParams.status !== 'All' ? searchParams.status : undefined;

  let query = supabase
    .from('izakayas')
    .select('*, izakaya_images(*)')
    .order('created_at', { ascending: false });

  if (q) query = query.ilike('name', `%${q}%`);
  if (genre) query = query.eq('genre', genre);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  const izakayas = (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    rating: row.rating,
    genre: row.genre,
    mapUrl: row.map_url,
    status: row.status,
    images: (row.izakaya_images ?? []).map((img: any) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      izakayaId: img.izakaya_id,
      createdAt: img.created_at,
    })),
  }));

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-serif">
          居酒屋コレクション
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          個人的に厳選した最高の飲み屋リスト
        </p>
      </section>

      <SearchFilter />

      {izakayas.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
          <h3 className="text-xl font-medium mb-4">居酒屋が見つかりません</h3>
          <p className="text-muted-foreground mb-6">検索条件を変えるか、新しいお店を追加してください。</p>
          <Link
            href="/izakaya/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            最初のお店を追加
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {izakayas.map((izakaya) => (
            <IzakayaCard
              key={izakaya.id}
              id={izakaya.id}
              name={izakaya.name}
              rating={izakaya.rating}
              genre={izakaya.genre}
              mapUrl={izakaya.mapUrl}
              status={izakaya.status}
              images={izakaya.images}
            />
          ))}
        </div>
      )}
    </div>
  );
}
