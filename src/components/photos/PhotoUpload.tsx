'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X } from 'lucide-react';
import { usePhotos } from '@/lib/hooks/usePhotos';

export function PhotoUpload({ userId, scope = 'family' }: { userId?: string; scope?: string }) {
  const { uploadPhoto } = usePhotos();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadPhoto.mutateAsync({ file, caption: caption || undefined, uploadedBy: userId, photoScope: scope });
      setFile(null);
      setPreview(null);
      setCaption('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <button onClick={() => { setPreview(null); setFile(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
            <X size={16} />
          </button>
          <div className="p-3 bg-bg-card border border-border border-t-0 rounded-b-2xl space-y-2">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption..." className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border font-body text-sm text-text-primary placeholder:text-text-muted outline-none" />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-2.5 rounded-xl bg-accent-primary text-white font-body font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Photo'}
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => fileRef.current?.click()}
          className="w-full py-8 rounded-2xl border-2 border-dashed border-border bg-bg-secondary/50 flex flex-col items-center gap-2 text-text-muted hover:text-text-secondary hover:border-accent-primary/30 transition-all"
        >
          <Camera size={28} />
          <span className="font-body text-sm">Tap to add photos</span>
        </motion.button>
      )}
    </div>
  );
}
