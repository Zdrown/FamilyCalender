'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotos } from '@/lib/hooks/usePhotos';

export function PhotoCarousel({ scope }: { scope?: string }) {
  const { data: photos = [] } = usePhotos(scope);
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    if (photos.length > 1) setCurrent((c) => (c + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const timer = setInterval(advance, 10000);
    return () => clearInterval(timer);
  }, [advance]);

  if (photos.length === 0) {
    return (
      <div className="h-48 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center">
        <p className="font-body text-sm text-text-muted">No photos yet</p>
      </div>
    );
  }

  return (
    <div className="relative h-48 rounded-2xl overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.img
          key={photos[current]?.id}
          src={photos[current]?.url}
          alt={photos[current]?.caption || 'Family photo'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      {photos[current]?.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
          <p className="font-body text-xs text-white/90">{photos[current].caption}</p>
        </div>
      )}
      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.slice(0, 8).map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
