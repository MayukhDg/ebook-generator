import React from 'react';
import { notFound } from 'next/navigation';
import { store } from '@/lib/data/store';
import ChapterStudio from '@/components/studio/ChapterStudio';

export const dynamic = 'force-dynamic';

export default async function ChapterStudioPage({
  params,
}: {
  params: { id: string; chapterId: string };
}) {
  const book = await store.getBookById(params.id);
  if (!book) {
    notFound();
  }

  let chapters = await store.getChapters(book.id);

  // If no chapters exist yet for this book, create Chapter 1 automatically
  if (!chapters || chapters.length === 0) {
    const firstChapter = await store.createChapter({
      book_id: book.id,
      chapter_number: 1,
      title: 'Chapter 1: Foundations',
      status: 'pending',
    });
    chapters = [firstChapter];
  }

  // Find requested chapter by ID or by chapter number (e.g. "1")
  let targetChapter = chapters.find(
    (c) => c.id === params.chapterId || String(c.chapter_number) === params.chapterId
  );

  // If chapter ID is not found, fallback to the first chapter
  if (!targetChapter) {
    targetChapter = chapters[0];
  }

  return (
    <ChapterStudio
      initialBook={book}
      initialChapters={chapters}
      initialChapterId={targetChapter.id}
    />
  );
}
