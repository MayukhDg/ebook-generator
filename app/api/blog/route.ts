import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get('published') === 'true';
    const posts = await store.getBlogPosts(publishedOnly);
    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Article title is required.' }, { status: 400 });
    }

    if (!data.content_markdown?.trim()) {
      return NextResponse.json({ error: 'Article markdown content is required.' }, { status: 400 });
    }

    const newPost = await store.createBlogPost(data);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: error.message || 'Failed to create blog post' }, { status: 500 });
  }
}
