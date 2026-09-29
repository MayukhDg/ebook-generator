'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  FileText, 
  Upload, 
  Trash2, 
  Sparkles, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  Layers,
  BookOpen
} from 'lucide-react';
import { SourceMaterial } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface SourceMaterialsVaultProps {
  bookId: string;
  initialSources: SourceMaterial[];
  onSourcesUpdated?: (sources: SourceMaterial[]) => void;
}

export default function SourceMaterialsVault({
  bookId,
  initialSources,
  onSourcesUpdated,
}: SourceMaterialsVaultProps) {
  const [sources, setSources] = useState<SourceMaterial[]>(initialSources);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'document' | 'manual'>('voice');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio File Upload State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState('');

  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');

  // Manual Note State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteType, setNoteType] = useState<'framework' | 'case_study' | 'text_note'>('framework');
  const [noteSnippet, setNoteSnippet] = useState('');

  // Loading & Error States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  // Sync with prop updates
  useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);

  // Clean up recorded audio object URL
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordedAudioUrl]);

  // Handle Recording Voice Note
  const startRecording = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg(err.message || 'Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Submit Voice Note for Whisper Transcription
  const handleTranscribeAudio = async (sourceBlobOrFile: Blob | File, customName?: string) => {
    setIsProcessing(true);
    setProcessingStatus('Whisper AI is transcribing audio & extracting key frameworks...');
    setErrorMsg(null);

    try {
      const formData = new FormData();
      const fileToUpload = sourceBlobOrFile instanceof File
        ? sourceBlobOrFile
        : new File([sourceBlobOrFile], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

      formData.append('file', fileToUpload);
      formData.append('bookId', bookId);
      formData.append('title', customName || audioTitle || (sourceBlobOrFile instanceof File ? sourceBlobOrFile.name : `Voice Memo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`));

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      const updated = [...sources, data.material];
      setSources(updated);
      onSourcesUpdated?.(updated);

      setSuccessMsg(`Voice note transcribed and indexed into book memory! (3 Credits applied)`);
      // Reset form
      setRecordedAudioBlob(null);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
      setAudioFile(null);
      setAudioTitle('');
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process audio transcription');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Submit Document / PDF for Ingestion
  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;

    setIsProcessing(true);
    setProcessingStatus('Parsing document text & compiling knowledge index...');
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('bookId', bookId);
      if (docTitle.trim()) {
        formData.append('title', docTitle.trim());
      }

      const res = await fetch('/api/ai/documents/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest document');
      }

      const updated = [...sources, data.material];
      setSources(updated);
      onSourcesUpdated?.(updated);

      setSuccessMsg(`Document indexed (${data.wordCount ? formatNumber(data.wordCount) : 'multiple'} words from ${data.pageCount || 1} page${data.pageCount === 1 ? '' : 's'})! (2 Credits applied)`);
      setDocFile(null);
      setDocTitle('');
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to ingest document');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Submit Manual Text / Framework
  const handleAddManualNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteSnippet) return;

    setIsProcessing(true);
    setProcessingStatus('Saving framework to memory vault...');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/books/${bookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle,
          type: noteType,
          snippet: noteSnippet,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save source');
      }

      setSources(data.sources || []);
      onSourcesUpdated?.(data.sources || []);

      setSuccessMsg('Framework note saved and active for chapter generation!');
      setNoteTitle('');
      setNoteSnippet('');
      setTimeout(() => setIsModalOpen(false), 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save source note');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Delete Source Material
  const handleDeleteSource = async (materialId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from book sources?`)) return;

    try {
      const res = await fetch(`/api/books/${bookId}/sources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete source material');
      }

      setSources(data.sources || []);
      onSourcesUpdated?.(data.sources || []);
    } catch (err: any) {
      alert(`Could not delete source: ${err.message}`);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
      {/* Box Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <Mic className="h-4 w-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Source Materials & Vault ({sources.length})
          </h3>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setSuccessMsg(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Add Source
        </button>
      </div>

      {/* AI Memory Anchor Badge */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-2.5 flex items-center justify-between text-[11px] text-emerald-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>AI Engine actively anchors prose in these sources</span>
        </div>
        <span className="text-[10px] text-emerald-400/80 font-mono">Whisper & Ingestion Active</span>
      </div>

      {/* Source Materials List */}
      <div className="space-y-2">
        {sources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-4 text-center space-y-2">
            <p className="text-xs text-slate-400">
              No voice notes or reference documents attached yet.
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload client recordings, spoken voice memos, or PDFs to prevent AI hallucinations and keep the book anchored in your real insights.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-amber-300 hover:bg-slate-700 transition-colors"
            >
              <Mic className="h-3 w-3" />
              Add Voice Note or PDF
            </button>
          </div>
        ) : (
          sources.map((mat) => {
            const isExpanded = expandedSourceId === mat.id;
            const isAudio = mat.type === 'audio_transcript';
            const isPdf = mat.type === 'pdf';
            const isDoc = mat.type === 'document';

            return (
              <div 
                key={mat.id} 
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-white truncate min-w-0">
                    {isAudio && (
                      <span className="shrink-0 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400 flex items-center gap-1">
                        <Mic className="h-2.5 w-2.5" /> Audio
                      </span>
                    )}
                    {isPdf && (
                      <span className="shrink-0 rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-400 flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5" /> PDF
                      </span>
                    )}
                    {isDoc && (
                      <span className="shrink-0 rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400 flex items-center gap-1">
                        <FileCode className="h-2.5 w-2.5" /> Document
                      </span>
                    )}
                    {!isAudio && !isPdf && !isDoc && (
                      <span className="shrink-0 rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400 flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" /> Framework
                      </span>
                    )}
                    <span className="truncate text-slate-200" title={mat.title}>{mat.title}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedSourceId(isExpanded ? null : mat.id)}
                      className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={isExpanded ? 'Collapse excerpt' : 'View full excerpt'}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteSource(mat.id, mat.title)}
                      className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete source material"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className={`text-[11px] text-slate-400 italic leading-relaxed ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                  "{mat.snippet}"
                </p>

                {mat.page_count && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{mat.page_count} page{mat.page_count > 1 ? 's' : ''} parsed</span>
                    {mat.file_name && <span>• {mat.file_name}</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ingestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Add Source Material to Knowledge Vault
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The AI uses these sources to maintain your authentic voice and coin book concepts.
                </p>
              </div>
              <button
                onClick={() => !isProcessing && setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('voice'); setErrorMsg(null); }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'voice'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                Voice Note (3 Cr)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('document'); setErrorMsg(null); }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'document'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                PDF / Doc (2 Cr)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('manual'); setErrorMsg(null); }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                  activeTab === 'manual'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Text Note (Free)
              </button>
            </div>

            {/* TAB 1: VOICE NOTE & AUDIO (WHISPER) */}
            {activeTab === 'voice' && (
              <div className="space-y-4 text-xs">
                {/* 1. In-Browser Live Voice Recorder */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Option A: Speak into Microphone</span>
                    <span className="text-[11px] text-amber-400">OpenAI Whisper AI</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-3">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 font-bold text-white hover:bg-rose-600 transition-all animate-pulse"
                        >
                          <Square className="h-3.5 w-3.5 fill-current" />
                          Stop Recording ({formatTimer(recordingSeconds)})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={isProcessing}
                          className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 transition-all disabled:opacity-50"
                        >
                          <Mic className="h-3.5 w-3.5" />
                          {recordedAudioBlob ? 'Record Again' : 'Record Voice Note'}
                        </button>
                      )}

                      {isRecording && (
                        <div className="flex items-center gap-1 text-rose-400 font-mono text-xs">
                          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-ping mr-1" />
                          Recording...
                        </div>
                      )}
                    </div>

                    {recordedAudioUrl && !isRecording && (
                      <div className="flex items-center gap-2">
                        <audio controls src={recordedAudioUrl} className="h-8 max-w-[200px]" />
                        <button
                          type="button"
                          onClick={() => handleTranscribeAudio(recordedAudioBlob!)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Transcribe & Index
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Upload Audio File */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <span className="font-bold text-slate-300 block">Option B: Upload Audio File</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Custom Title (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., Client Strategy Call"
                        value={audioTitle}
                        onChange={(e) => setAudioTitle(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Audio File (MP3, WAV, M4A, WEBM)</label>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setAudioFile(e.target.files[0]);
                        }}
                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-amber-300 hover:file:bg-slate-700"
                      />
                    </div>
                  </div>

                  {audioFile && (
                    <button
                      type="button"
                      onClick={() => handleTranscribeAudio(audioFile, audioTitle)}
                      disabled={isProcessing}
                      className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      Transcribe "{audioFile.name}" with Whisper AI
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENT / PDF INGESTION */}
            {activeTab === 'document' && (
              <form onSubmit={handleIngestDocument} className="space-y-4 text-xs">
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">
                      Upload PDF, Markdown (.md), or Text Document
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Extracts case studies, methodologies, and framework charts for zero-hallucination writing.
                    </p>
                  </div>

                  <input
                    type="file"
                    required
                    accept=".pdf,.txt,.md,text/plain,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setDocFile(e.target.files[0]);
                    }}
                    className="mx-auto block text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Document Title / Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Q3 Proprietary Diagnostic Method.pdf"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!docFile || isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Ingest & Index Document (2 Credits)
                </button>
              </form>
            )}

            {/* TAB 3: MANUAL NOTE / FRAMEWORK */}
            {activeTab === 'manual' && (
              <form onSubmit={handleAddManualNote} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., The 3-Step Execution Model"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Category</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="framework">Proprietary Framework</option>
                      <option value="case_study">Client Case Study</option>
                      <option value="text_note">Tacit Knowledge Note</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Content / Transcript / Insights *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Paste your raw notes, interview transcript excerpts, or methodology steps here..."
                    value={noteSnippet}
                    onChange={(e) => setNoteSnippet(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!noteTitle || !noteSnippet || isProcessing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Save to Knowledge Vault (Free)
                </button>
              </form>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span>{processingStatus || 'Processing source material...'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
