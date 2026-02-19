import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');

        const where: any = {};

        if (q) {
            where.name = { contains: q };
        }
        if (genre && genre !== 'All') {
            where.genre = genre;
        }
        if (status && status !== 'All') {
            where.status = status;
        }

        const izakayas = await prisma.izakaya.findMany({
            where,
            include: {
                images: true, // Include related images
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(izakayas);
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

        // Handle multiple images and captions
        // We expect captions to be sent as 'captions' fields in the same order as 'images'
        // OR as a JSON string if that's easier for the frontend. 
        // Let's assume the frontend sends 'captions' as an array of strings corresponding to 'images'.
        const images = formData.getAll('images') as File[];
        const captions = formData.getAll('captions') as string[];

        const uploadedImageData: { url: string; caption: string | null }[] = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const caption = captions[i] || null;

            if (image && image.size > 0) {
                const buffer = Buffer.from(await image.arrayBuffer());
                const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name.replace(/\s/g, '-')}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads');
                const filepath = path.join(uploadDir, filename);

                await writeFile(filepath, buffer);
                uploadedImageData.push({
                    url: `/uploads/${filename}`,
                    caption: caption
                });
            }
        }

        const newIzakaya = await prisma.izakaya.create({
            data: {
                name,
                rating,
                genre,
                memo,
                mapUrl,
                status,
                images: {
                    create: uploadedImageData.map(img => ({
                        url: img.url,
                        caption: img.caption
                    })),
                },
            },
            include: {
                images: true,
            }
        });

        return NextResponse.json(newIzakaya, { status: 201 });
    } catch (error) {
        console.error('Error creating izakaya:', error);
        return NextResponse.json({ error: 'Failed to create izakaya' }, { status: 500 });
    }
}
