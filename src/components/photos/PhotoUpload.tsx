'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X } from 'lucide-react';
import { usePhotos } from '@/lib/hooks/usePhotos';

interface PendingFile {
  file: File;
  preview: string;
  caption: string;
}

export function PhotoUpload({ userId, scope = 'family' }: { userId?: string; scope?: string }) {
  const { uploadPhoto } = usePhotos();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newPending: PendingFile[] = Array.from(files).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      caption: '',
    }));
    setPending((prev) => [...prev, ...newPending]);
    // Reset input so same files can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setPending((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setPending((prev) => prev.map((p, i) => (i === index ? { ...p, caption } : p)));
  };

  const handleUpload = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    try {
      for (const p of pending) {
        await uploadPhoto.mutateAsync({
          file: p.file,
          caption: p.caption || undefined,
          uploadedBy: userId,
          photoScope: scope,
        });
      }
      // Clean up previews
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />

      {pending.length > 0 ? (
        <div className="space-y-3">
          {/* Thumbnails */}
          <div className="grid grid-cols-2 gap-2">
            {pending.map((p, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden">
                <img src={p.preview} alt="Preview" className="w-full h-32 object-cover" />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center touch-manipulation"
                >
                  <X size={14} />
                </button>
                <input
                  value={p.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Caption..."
                  className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1.5 placeholder:text-white/60 outline-none backdrop-blur-sm"
                />
              </div>
            ))}
          </div>

          {/* Add more + Upload */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-secondary font-body font-semibold text-sm flex items-center justify-center gap-2 touch-manipulation"
            >
              <Camera size={16} /> Add More
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
            >
              <Upload size={16} /> {uploading ? 'Uploading...' : `Upload ${pending.length > 1 ? `${pending.length} Photos` : 'Photo'}`}
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => fileRef.current?.click()}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-border bg-bg-secondary/50 flex flex-col items-center gap-2 text-text-muted hover:text-text-secondary hover:border-accent-primary/30 transition-all touch-manipulation"
        >
          <Camera size={28} />
          <span className="font-body text-sm">Tap to add photos</span>
        </motion.button>
      )}
    </div>
  );
}
