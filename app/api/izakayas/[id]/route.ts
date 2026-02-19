import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const { data, error } = await supabase
            .from('izakayas')
            .select('*, izakaya_images(*)')
            .eq('id', parseInt(id))
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Izakaya not found' }, { status: 404 });
        }

        const normalized = {
            id: data.id,
            name: data.name,
            rating: data.rating,
            genre: data.genre,
            memo: data.memo,
            mapUrl: data.map_url,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            images: (data.izakaya_images ?? []).map((img: any) => ({
                id: img.id,
                url: img.url,
                caption: img.caption,
                izakayaId: img.izakaya_id,
                createdAt: img.created_at,
            })),
        };

        return NextResponse.json(normalized);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch izakaya' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const izakayaId = parseInt(id);
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const rating = Number(formData.get('rating'));
        const genre = formData.get('genre') as string;
        const memo = formData.get('memo') as string;
        const mapUrl = formData.get('mapUrl') as string;
        const status = formData.get('status') as string;

        // Check existence
        const { data: existing, error: existError } = await supabase
            .from('izakayas')
            .select('id')
            .eq('id', izakayaId)
            .single();

        if (existError || !existing) {
            return NextResponse.json({ error: 'Izakaya not found' }, { status: 404 });
        }

        // Handle deleted images
        const deletedImageIdsStr = formData.get('deletedImageIds') as string;
        if (deletedImageIdsStr) {
            try {
                const deletedImageIds = JSON.parse(deletedImageIdsStr) as number[];
                if (deletedImageIds.length > 0) {
                    // Fetch image URLs to delete from Storage
                    const { data: imagesToDelete } = await supabase
                        .from('izakaya_images')
                        .select('id, url')
                        .in('id', deletedImageIds)
                        .eq('izakaya_id', izakayaId);

                    if (imagesToDelete && imagesToDelete.length > 0) {
                        // Extract storage paths from public URLs
                        const storagePaths = imagesToDelete.map((img: any) => {
                            const urlObj = new URL(img.url);
                            // Path after /storage/v1/object/public/izakaya-images/
                            const parts = urlObj.pathname.split('/izakaya-images/');
                            return parts[1] ?? '';
                        }).filter(Boolean);

                        if (storagePaths.length > 0) {
                            await supabase.storage.from('izakaya-images').remove(storagePaths);
                        }

                        // Delete DB records
                        await supabase
                            .from('izakaya_images')
                            .delete()
                            .in('id', deletedImageIds)
                            .eq('izakaya_id', izakayaId);
                    }
                }
            } catch (e) {
                console.error('Error processing deletedImageIds', e);
            }
        }

        // Handle existing image caption updates
        const existingCaptionsStr = formData.get('existingCaptions') as string;
        if (existingCaptionsStr) {
            try {
                const existingCaptionsMap = JSON.parse(existingCaptionsStr) as Record<string, string>;
                const updatePromises = Object.entries(existingCaptionsMap).map(([imgId, caption]) =>
                    supabase
                        .from('izakaya_images')
                        .update({ caption: caption || null })
                        .eq('id', parseInt(imgId))
                        .eq('izakaya_id', izakayaId)
                );
                await Promise.all(updatePromises);
            } catch (e) {
                console.error('Error updating existing captions:', e);
            }
        }

        // Handle new image uploads
        const images = formData.getAll('images') as File[];
        const captions = formData.getAll('captions') as string[];
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

        // Update izakaya main record
        const { error: updateError } = await supabase
            .from('izakayas')
            .update({ name, rating, genre, memo, map_url: mapUrl, status })
            .eq('id', izakayaId);

        if (updateError) throw updateError;

        // Fetch final record
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

        return NextResponse.json(normalized);
    } catch (error) {
        console.error('Error updating izakaya:', error);
        return NextResponse.json({ error: 'Failed to update izakaya' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const izakayaId = parseInt(id);

        // Fetch images to delete from Storage
        const { data: images } = await supabase
            .from('izakaya_images')
            .select('id, url')
            .eq('izakaya_id', izakayaId);

        if (images && images.length > 0) {
            const storagePaths = images.map((img: any) => {
                const urlObj = new URL(img.url);
                const parts = urlObj.pathname.split('/izakaya-images/');
                return parts[1] ?? '';
            }).filter(Boolean);

            if (storagePaths.length > 0) {
                await supabase.storage.from('izakaya-images').remove(storagePaths);
            }
        }

        // Delete izakaya (CASCADE will handle izakaya_images DB records)
        const { error } = await supabase
            .from('izakayas')
            .delete()
            .eq('id', izakayaId);

        if (error) throw error;

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting izakaya:', error);
        return NextResponse.json({ error: 'Failed to delete izakaya' }, { status: 500 });
    }
}
