'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils'; // I need to create lib/utils for cn or just use clsx/tailwind-merge inline.
// Wait, I haven't created lib/utils yet. I should probably create it or just inline the logic.
// I installed clsx and tailwind-merge. I'll include utility function inline or creating lib/utils.ts is better.

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
}

export default function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = 20,
}: StarRatingProps) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: maxRating }).map((_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= rating;

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => !readonly && onRatingChange?.(starValue)}
                        disabled={readonly}
                        className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                            }`}
                    >
                        <Star
                            size={size}
                            className={`${isFilled
                                ? 'fill-secondary text-secondary'
                                : 'fill-muted text-muted-foreground'
                                }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
