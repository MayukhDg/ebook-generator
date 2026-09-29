import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SourceMaterial } from '@/lib/types';
import { extractText as extractPdfText } from 'unpdf';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bookId = formData.get('bookId') as string | null;
    const customTitle = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No document file provided' }, { status: 400 });
    }

    const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    const isText = fileName.endsWith('.txt') || fileName.endsWith('.md') || file.type.startsWith('text/');

    if (!isPdf && !isText) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PDF, Markdown (.md), or Plain Text (.txt) file.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

    // 1. Credit Deduction (2 Credits for Document Ingestion & Knowledge Indexing)
    const deduction = await store.deductCredits(
      userId,
      2,
      'chapter_revision',
      { sub_action: 'document_ingestion', bookId: bookId || 'draft', title, fileName: file.name }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || 'Insufficient credits (2 required for document ingestion)' },
        { status: 402 }
      );
    }

    let extractedText = '';
    let pageCount = 1;

    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        const parsed = await extractPdfText(new Uint8Array(arrayBuffer));
        extractedText = Array.isArray(parsed.text) ? parsed.text.join('\n\n') : (parsed.text || '');
        pageCount = parsed.totalPages || 1;
      } catch (pdfErr: any) {
        console.error('PDF parsing error:', pdfErr);
        const isPassword = /password|encrypt/i.test(pdfErr.message || '');
        return NextResponse.json(
          { 
            error: isPassword
              ? 'This PDF is password-protected (encrypted). Please upload an unprotected PDF or re-save it without a password.'
              : `Failed to read PDF text: ${pdfErr.message || 'Corrupt or unreadable PDF'}`
          },
          { status: 422 }
        );
      }
    } else {
      extractedText = await file.text();
    }

    // Clean up excessive whitespace while preserving paragraph structure
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        { error: 'The document appears to be empty or contains only non-selectable scanned images. Please provide a document with selectable text.' },
        { status: 422 }
      );
    }

    // Limit snippet to ~12,000 words to ensure it fits safely in subsequent LLM prompts
    const words = extractedText.split(/\s+/);
    const wordCount = words.length;
    let snippet = extractedText;
    if (wordCount > 12000) {
      snippet = words.slice(0, 12000).join(' ') + `\n\n[... Truncated: Extracted 12,000 words of ${wordCount} total words for optimal AI context ...]`;
    }

    // 2. Prepare Source Material Object
    const newMaterial: SourceMaterial = {
      id: `mat-doc-${Date.now()}`,
      title,
      type: isPdf ? 'pdf' : 'document',
      snippet,
      created_at: new Date().toISOString(),
      file_name: file.name,
      file_size: file.size,
      page_count: pageCount,
    };

    // If attached to a specific book, persist immediately in store/database
    if (bookId) {
      await store.addSourceMaterial(bookId, newMaterial);
    }

    return NextResponse.json({
      success: true,
      material: newMaterial,
      pageCount,
      wordCount,
      remainingCredits: deduction.remainingCredits,
    });
  } catch (error: any) {
    console.error('Error ingesting document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
