import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PNG, JPEG, or WebP image.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${params.id}-author-photo.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('author-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Author photo upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('author-photos')
      .getPublicUrl(fileName);

    // Update book with the author photo URL
    const updatedBook = await store.updateBook(params.id, {
      author_photo_url: publicUrl,
    });

    return NextResponse.json({
      url: publicUrl,
      book: updatedBook,
    });
  } catch (error: any) {
    console.error('Author photo upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const book = await store.getBookById(params.id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove from storage if URL exists
    if (book.author_photo_url) {
      const urlParts = book.author_photo_url.split('/author-photos/');
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from('author-photos').remove([filePath]);
      }
    }

    // Clear the URL in the book record
    const updatedBook = await store.updateBook(params.id, {
      author_photo_url: null,
    });

    return NextResponse.json({ success: true, book: updatedBook });
  } catch (error: any) {
    console.error('Author photo delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
