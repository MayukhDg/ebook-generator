import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { SourceMaterial } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({
      sources: book.source_materials || [],
    });
  } catch (error: any) {
    console.error('Error fetching source materials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, type, snippet } = body;

    if (!title || !snippet) {
      return NextResponse.json(
        { error: 'Title and snippet/content are required' },
        { status: 400 }
      );
    }

    const material: SourceMaterial = {
      id: `mat-text-${Date.now()}`,
      title: title.trim(),
      type: type || 'framework',
      snippet: snippet.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedBook = await store.addSourceMaterial(params.id, material);
    if (!updatedBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      material,
      sources: updatedBook.source_materials || [],
    });
  } catch (error: any) {
    console.error('Error adding source material:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const materialIdFromQuery = searchParams.get('materialId');
    let materialId = materialIdFromQuery;

    if (!materialId) {
      try {
        const body = await req.json();
        materialId = body.materialId;
      } catch {}
    }

    if (!materialId) {
      return NextResponse.json(
        { error: 'materialId is required' },
        { status: 400 }
      );
    }

    const updatedBook = await store.deleteSourceMaterial(params.id, materialId);
    if (!updatedBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sources: updatedBook.source_materials || [],
    });
  } catch (error: any) {
    console.error('Error deleting source material:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
