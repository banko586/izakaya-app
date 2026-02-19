import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const izakaya = await prisma.izakaya.findUnique({
            where: { id: parseInt(id) },
            include: {
                images: true,
            },
        });
        if (!izakaya) {
            return NextResponse.json({ error: 'Izakaya not found' }, { status: 404 });
        }
        return NextResponse.json(izakaya);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch izakaya' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const rating = Number(formData.get('rating'));
        const genre = formData.get('genre') as string;
        const memo = formData.get('memo') as string;
        const mapUrl = formData.get('mapUrl') as string;
        const status = formData.get('status') as string;

        const existingIzakaya = await prisma.izakaya.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingIzakaya) {
            return NextResponse.json({ error: 'Izakaya not found' }, { status: 404 });
        }

        // Handle deleted images
        const deletedImageIdsStr = formData.get('deletedImageIds') as string;
        if (deletedImageIdsStr) {
            try {
                const deletedImageIds = JSON.parse(deletedImageIdsStr) as number[];
                if (deletedImageIds.length > 0) {
                    // Find images to get file paths
                    const imagesToDelete = await prisma.izakayaImage.findMany({
                        where: {
                            id: { in: deletedImageIds },
                            izakayaId: parseInt(id) // Security check to ensure ownership
                        }
                    });

                    // Delete files from filesystem
                    for (const img of imagesToDelete) {
                        try {
                            const imgPath = path.join(process.cwd(), 'public', img.url);
                            await unlink(imgPath);
                            console.log(`Deleted file: ${imgPath}`);
                        } catch (e) {
                            console.error(`Failed to delete file ${img.url}:`, e);
                        }
                    }

                    // Delete records from database
                    await prisma.izakayaImage.deleteMany({
                        where: {
                            id: { in: deletedImageIds }
                        }
                    });
                }
            } catch (e) {
                console.error("Error processing deletedImageIds", e);
            }
        }

        // Handle existing image caption updates
        const existingCaptionsStr = formData.get('existingCaptions') as string;
        if (existingCaptionsStr) {
            try {
                const existingCaptionsMap = JSON.parse(existingCaptionsStr) as Record<string, string>;
                const updatePromises = Object.entries(existingCaptionsMap).map(([imgId, caption]) =>
                    prisma.izakayaImage.updateMany({
                        where: { id: parseInt(imgId), izakayaId: parseInt(id) },
                        data: { caption: caption || null },
                    })
                );
                await Promise.all(updatePromises);
            } catch (e) {
                console.error('Error updating existing captions:', e);
            }
        }

        // Handle multiple images (Add new ones)
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

        const updatedIzakaya = await prisma.izakaya.update({
            where: { id: parseInt(id) },
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

        return NextResponse.json(updatedIzakaya);
    } catch (error) {
        console.error('Error updating izakaya:', error);
        return NextResponse.json({ error: 'Failed to update izakaya' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const izakaya = await prisma.izakaya.findUnique({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!izakaya) {
            return NextResponse.json({ error: 'Izakaya not found' }, { status: 404 });
        }

        // Delete associated files
        // 1. Legacy imagePath cleanup removed as field is deleted from schema

        // 2. Delete new images
        for (const img of izakaya.images) {
            try {
                const imgPath = path.join(process.cwd(), 'public', img.url);
                await unlink(imgPath);
            } catch (e) {
                console.log('Error deleting image file', img.url, e);
            }
        }

        await prisma.izakaya.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting izakaya:', error);
        return NextResponse.json({ error: 'Failed to delete izakaya' }, { status: 500 });
    }
}
