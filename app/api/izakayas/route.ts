import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');

        let query = supabase
            .from('izakayas')
            .select('*, izakaya_images(*)')
            .order('created_at', { ascending: false });

        if (q) {
            query = query.ilike('name', `%${q}%`);
        }
        if (genre && genre !== 'All') {
            query = query.eq('genre', genre);
        }
        if (status && status !== 'All') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Normalize response to match existing frontend expectations
        const normalized = (data ?? []).map((row: any) => ({
            id: row.id,
            name: row.name,
            rating: row.rating,
            genre: row.genre,
            memo: row.memo,
            mapUrl: row.map_url,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            images: (row.izakaya_images ?? []).map((img: any) => ({
                id: img.id,
                url: img.url,
                caption: img.caption,
                izakayaId: img.izakaya_id,
                createdAt: img.created_at,
            })),
        }));

        return NextResponse.json(normalized);
    } catch (error) {
        console.error('Error fetching izakayas:', error);
        return NextResponse.json({ error: 'Failed to fetch izakayas' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const rating = Number(formData.get('rating'));
        const genre = formData.get('genre') as string;
        const memo = formData.get('memo') as string;
        const mapUrl = formData.get('mapUrl') as string;
        const status = formData.get('status') as string || 'VISITED';

        const images = formData.getAll('images') as File[];
        const captions = formData.getAll('captions') as string[];

        // 1. Insert izakaya record
        const { data: izakayaData, error: izakayaError } = await supabase
            .from('izakayas')
            .insert({ name, rating, genre, memo, map_url: mapUrl, status })
            .select()
            .single();

        if (izakayaError) throw izakayaError;
        const izakayaId = izakayaData.id;

        // 2. Upload images to Supabase Storage and insert image records
        const uploadedImageData: { url: string; caption: string | null }[] = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const caption = captions[i] || null;

            if (image && image.size > 0) {
                const filename = `${izakayaId}/${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name.replace(/\s/g, '-')}`;
                const buffer = Buffer.from(await image.arrayBuffer());

                const { error: uploadError } = await supabase.storage
                    .from('izakaya-images')
                    .upload(filename, buffer, { contentType: image.type, upsert: false });

                if (uploadError) {
                    console.error('Image upload error:', uploadError);
                    continue;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('izakaya-images')
                    .getPublicUrl(filename);

                uploadedImageData.push({ url: publicUrlData.publicUrl, caption });
            }
        }

        if (uploadedImageData.length > 0) {
            const { error: imgInsertError } = await supabase
                .from('izakaya_images')
                .insert(uploadedImageData.map(img => ({
                    izakaya_id: izakayaId,
                    url: img.url,
                    caption: img.caption,
                })));

            if (imgInsertError) throw imgInsertError;
        }

        // 3. Fetch final record with images
        const { data: finalData, error: finalError } = await supabase
            .from('izakayas')
            .select('*, izakaya_images(*)')
            .eq('id', izakayaId)
            .single();

        if (finalError) throw finalError;

        const normalized = {
            id: finalData.id,
            name: finalData.name,
            rating: finalData.rating,
            genre: finalData.genre,
            memo: finalData.memo,
            mapUrl: finalData.map_url,
            status: finalData.status,
            createdAt: finalData.created_at,
            updatedAt: finalData.updated_at,
            images: (finalData.izakaya_images ?? []).map((img: any) => ({
                id: img.id,
                url: img.url,
                caption: img.caption,
                izakayaId: img.izakaya_id,
                createdAt: img.created_at,
            })),
        };

        return NextResponse.json(normalized, { status: 201 });
    } catch (error) {
        console.error('Error creating izakaya:', error);
        return NextResponse.json({ error: 'Failed to create izakaya' }, { status: 500 });
    }
}
