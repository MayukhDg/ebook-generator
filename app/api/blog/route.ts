import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET() {
  try {
    const posts = await store.getBlogPosts(false);
    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newPost = await store.createBlogPost(data);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
