import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const chapter = await store.getChapterById(params.chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    return NextResponse.json({ chapter });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const updates = await req.json();

    // Prevent user from passing arbitrary fields; only allow safe updates
    const { content_markdown, title, summary, status } = updates;
    const safeUpdates: Record<string, any> = {};
    if (content_markdown !== undefined) safeUpdates.content_markdown = content_markdown;
    if (title !== undefined) safeUpdates.title = title;
    if (summary !== undefined) safeUpdates.summary = summary;
    if (status !== undefined) safeUpdates.status = status;

    const updated = await store.updateChapter(params.chapterId, safeUpdates);
    if (!updated) {
      return NextResponse.json({ error: 'Chapter not found or update failed' }, { status: 404 });
    }
    return NextResponse.json({ chapter: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
