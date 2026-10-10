'use client';

import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  Trash2,
  Save,
  Sparkles,
  Pencil,
  X,
  Check,
  Upload,
  ImageIcon,
} from 'lucide-react';

interface AboutAuthorSectionProps {
  bookId: string;
  initialBio?: string | null;
  initialPhotoUrl?: string | null;
  authorName?: string;
}

export default function AboutAuthorSection({
  bookId,
  initialBio,
  initialPhotoUrl,
  authorName,
}: AboutAuthorSectionProps) {
  const [bio, setBio] = useState(initialBio || '');
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState(bio);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_bio: draftBio.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save bio');
      }

      setBio(draftBio.trim());
      setIsEditingBio(false);
      setSaveStatus('Bio saved successfully');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setSaveStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/books/${bookId}/author-photo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setPhotoUrl(data.url);
      setSaveStatus('Photo uploaded successfully');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/books/${bookId}/author-photo`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove photo');
      }

      setPhotoUrl('');
      setSaveStatus('Photo removed');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30">
            <User className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              About the Author
            </h3>
            <p className="text-[10px] text-slate-500">
              Appears in exports & public reader
            </p>
          </div>
        </div>
      </div>

      {/* Status Toast */}
      {saveStatus && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs font-medium animate-fade-in ${
            saveStatus.startsWith('Error')
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {saveStatus}
        </div>
      )}

      {/* Author Photo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          {photoUrl ? (
            <div className="relative">
              <img
                src={photoUrl}
                alt={`${authorName} photo`}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-700 shadow-lg shadow-black/30"
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title="Change photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleDeletePhoto}
                  disabled={isDeletingPhoto}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/30 text-red-300 hover:bg-red-500/50 transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 text-slate-500 hover:border-amber-500/40 hover:text-amber-400 transition-all cursor-pointer"
            >
              {isUploadingPhoto ? (
                <Sparkles className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">
                    Add Photo
                  </span>
                </>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            onChange={handlePhotoUpload}
            disabled={isUploadingPhoto}
          />
        </div>

        {isUploadingPhoto && (
          <p className="text-[10px] text-amber-400 animate-pulse">
            Uploading author photo...
          </p>
        )}

        <p className="text-xs font-semibold text-slate-300">{authorName}</p>
      </div>

      {/* Author Bio */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Author Bio
          </label>
          {!isEditingBio && (
            <button
              onClick={() => {
                setDraftBio(bio);
                setIsEditingBio(true);
              }}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors font-semibold"
            >
              <Pencil className="h-3 w-3" />
              {bio ? 'Edit' : 'Add Bio'}
            </button>
          )}
        </div>

        {isEditingBio ? (
          <div className="space-y-2">
            <textarea
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              rows={5}
              placeholder="Write a short bio about yourself. This will appear in your published book's 'About the Author' section..."
              className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 resize-none leading-relaxed"
              autoFocus
            />
            <p className="text-[10px] text-slate-600">
              {draftBio.length} characters • Recommended: 150-500 characters
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsEditingBio(false)}
                className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-700 transition-colors"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                onClick={handleSaveBio}
                disabled={isSavingBio}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {isSavingBio ? (
                  <Sparkles className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Save Bio
              </button>
            </div>
          </div>
        ) : bio ? (
          <div className="rounded-xl bg-slate-950/50 border border-slate-800/60 p-3">
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-4 text-center">
            <p className="text-[11px] text-slate-600">
              No author bio yet. Add a short bio to personalize your book's "About the Author" page.
            </p>
          </div>
        )}
      </div>

      {/* Preview hint */}
      {(bio || photoUrl) && (
        <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-2.5 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-[10px] text-slate-500">
            This "About the Author" section will be automatically included in your PDF exports, EPUB downloads, and public web reader.
          </p>
        </div>
      )}
    </div>
  );
}
