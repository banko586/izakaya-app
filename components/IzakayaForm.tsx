'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import StarRating from './StarRating';
import { Upload, X, MapPin, Beer, FileText, CheckCircle, Bookmark } from 'lucide-react';

interface IzakayaFormProps {
    initialData?: {
        id?: number;
        name: string;
        rating: number;
        genre: string;
        memo: string | null;
        mapUrl: string | null;
        status: string;
        images?: { id: number; url: string; caption?: string | null }[];
    };
    onSubmit: (formData: FormData) => Promise<void>;
    isSubmitting?: boolean;
}

export default function IzakayaForm({
    initialData,
    onSubmit,
    isSubmitting = false,
}: IzakayaFormProps) {
    const [rating, setRating] = useState(initialData?.rating || 3);
    const [status, setStatus] = useState(initialData?.status || 'VISITED');
    const [previews, setPreviews] = useState<string[]>([]);
    const [captions, setCaptions] = useState<string[]>([]); // Captions for NEW images
    const [existingImages, setExistingImages] = useState(initialData?.images || []);
    const [existingCaptions, setExistingCaptions] = useState<Record<number, string>>(
        Object.fromEntries((initialData?.images || []).map(img => [img.id, img.caption ?? '']))
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPreviews: string[] = [];
            const newCaptions: string[] = [];
            const fileArray = Array.from(files);

            fileArray.forEach(file => {
                newPreviews.push(URL.createObjectURL(file));
                newCaptions.push('');
            });

            setPreviews(prev => [...prev, ...newPreviews]);
            setCaptions(prev => [...prev, ...newCaptions]);
            setDroppedFiles(prev => [...prev, ...fileArray]); // Add to our managed file list
        }
    };

    const handleCaptionChange = (index: number, value: string) => {
        const newCaptions = [...captions];
        newCaptions[index] = value;
        setCaptions(newCaptions);
    };

    const handleExistingCaptionChange = (id: number, value: string) => {
        setExistingCaptions(prev => ({ ...prev, [id]: value }));
    };

    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

    const handleRemovePreview = (index: number) => {
        setPreviews(prev => prev.filter((_, i) => i !== index));
        setCaptions(prev => prev.filter((_, i) => i !== index));
        setDroppedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExisting = (id: number) => {
        setDeletedImageIds(prev => [...prev, id]);
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set('rating', rating.toString());
        formData.set('status', status);

        // Remove 'image' field if it exists
        formData.delete('image');

        // Remove 'images-input' if it exists
        formData.delete('images-input');

        // Append deleted image IDs
        formData.append('deletedImageIds', JSON.stringify(deletedImageIds));

        // Append existing image caption updates
        formData.append('existingCaptions', JSON.stringify(existingCaptions));

        // Use the state 'droppedFiles' which acts as our source of truth for all added files (clicked or dropped)
        if (droppedFiles.length > 0) {
            droppedFiles.forEach((file, index) => {
                formData.append('images', file);
                formData.append('captions', captions[index] || '');
            });
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto py-8">

            {/* Status Selection */}
            <div className="flex justify-center gap-4 p-1 bg-muted rounded-full w-fit mx-auto">
                <button
                    type="button"
                    onClick={() => setStatus('VISITED')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${status === 'VISITED'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <CheckCircle size={18} />
                    行った
                </button>
                <button
                    type="button"
                    onClick={() => setStatus('WANT_TO_GO')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${status === 'WANT_TO_GO'
                        ? 'bg-white text-amber-600 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Bookmark size={18} />
                    行きたい
                </button>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-muted-foreground">写真 (Ctrlキーで複数選択)</label>

                {/* Existing & Preview Images Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Existing Images */}
                    {existingImages.map((img) => (
                        <div key={img.id} className="space-y-2 relative group">
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                                <Image src={img.url} alt="Existing" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExisting(img.id)}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600/80 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove Image"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={existingCaptions[img.id] ?? ''}
                                onChange={(e) => handleExistingCaptionChange(img.id, e.target.value)}
                                placeholder="キャプション (例: 外観)"
                                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                        </div>
                    ))}

                    {/* New Previews with Captions */}
                    {previews.map((url, idx) => (
                        <div key={`preview-${idx}`} className="space-y-2">
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-border opacity-90 group">
                                <Image src={url} alt="Preview" fill className="object-cover" />
                                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">新規</div>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePreview(idx)}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600/80 text-white p-1 rounded-full transition-colors"
                                    title="削除"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="キャプション (例: 外観)"
                                value={captions[idx] || ''}
                                onChange={(e) => handleCaptionChange(idx, e.target.value)}
                                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                        </div>
                    ))}

                    {/* Upload Button / Drop Zone */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');

                            const files = e.dataTransfer.files;
                            if (files && files.length > 0) {
                                // reusing the logic from handleImageChange by creating a synthetic event or extracting logic
                                const newPreviews: string[] = [];
                                const newCaptions: string[] = [];
                                const fileArray = Array.from(files);

                                fileArray.forEach(file => {
                                    newPreviews.push(URL.createObjectURL(file));
                                    newCaptions.push('');
                                });

                                setPreviews(prev => [...prev, ...newPreviews]);
                                setCaptions(prev => [...prev, ...newCaptions]);

                                // We also need to update the file input if possible, or manage files in state
                                // Since file input is read-only, we should probably manage 'files' in a state 
                                // separate from the input ref if we want to support both.
                                // But for now, let's just append to the form data manually on submit 
                                // and keep track of these dropped files in a new state.
                                setDroppedFiles(prev => [...prev, ...fileArray]);
                            }
                        }}
                        className="relative aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">写真を追加 (ドラッグ＆ドロップ)</span>
                    </div>
                </div>

                <input
                    type="file"
                    name="images-input"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                />
            </div>

            <div className="grid gap-6">
                {/* Name */}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">居酒屋名</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={initialData?.name}
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-lg font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="例: 鳥貴族 渋谷店"
                    />
                </div>

                {/* Rating & Genre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">評価</label>
                        <div className="flex items-center gap-4 border border-border rounded-lg p-2 px-4 bg-card">
                            <StarRating rating={rating} onRatingChange={setRating} size={28} />
                            <span className="text-lg font-bold text-primary">{rating}.0</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="genre" className="text-sm font-medium flex items-center gap-2">
                            <Beer size={16} /> ジャンル
                        </label>
                        <input
                            type="text"
                            id="genre"
                            name="genre"
                            defaultValue={initialData?.genre}
                            required
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="例: 焼き鳥、海鮮、立ち飲み"
                            list="genre-suggestions"
                        />
                        <datalist id="genre-suggestions">
                            <option value="焼き鳥" />
                            <option value="海鮮" />
                            <option value="居酒屋" />
                            <option value="立ち飲み" />
                            <option value="バー" />
                            <option value="ダイニングバー" />
                        </datalist>
                    </div>
                </div>

                {/* Memo */}
                <div className="space-y-2">
                    <label htmlFor="memo" className="text-sm font-medium flex items-center gap-2">
                        <FileText size={16} /> メモ
                    </label>
                    <textarea
                        id="memo"
                        name="memo"
                        defaultValue={initialData?.memo || ''}
                        rows={4}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                        placeholder="良かった点や雰囲気など"
                    />
                </div>

                {/* Map URL */}
                <div className="space-y-2">
                    <label htmlFor="mapUrl" className="text-sm font-medium flex items-center gap-2">
                        <MapPin size={16} /> Googleマップ URL
                    </label>
                    <input
                        type="url"
                        id="mapUrl"
                        name="mapUrl"
                        defaultValue={initialData?.mapUrl || ''}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm font-mono text-muted-foreground"
                        placeholder="https://maps.google.com/..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-3 px-6 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
                    disabled={isSubmitting}
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 rounded-lg bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? '保存中...' : '保存する'}
                </button>
            </div>
        </form>
    );
}
