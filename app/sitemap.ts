import { MetadataRoute } from 'next';
import { store } from '@/lib/data/store';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://opuscraft.com';
  const currentDate = new Date();

  // 1. Core Static Marketing & Documentation Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 2. Dynamic Blog Posts (Defensive Try/Catch with Fallback)
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await store.getBlogPosts(true);
    if (posts && posts.length > 0) {
      blogRoutes = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.published_at ? new Date(post.published_at) : currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } else {
      // High-signal fallback for core known authority guides
      const coreSlugs = [
        'voice-to-book-framework-for-experts',
        'why-chatgpt-fails-at-writing-books',
        'best-ai-ebook-generators-compared',
      ];
      blogRoutes = coreSlugs.map((slug) => ({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.warn('[OpusCraft Sitemap] Fallback to static blog routes:', err);
    const coreSlugs = [
      'voice-to-book-framework-for-experts',
      'why-chatgpt-fails-at-writing-books',
      'best-ai-ebook-generators-compared',
    ];
    blogRoutes = coreSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }

  // 3. Dynamic Public Book Previews (if any)
  let publicBookRoutes: MetadataRoute.Sitemap = [];
  try {
    const books = await store.getBooks();
    publicBookRoutes = books
      .filter((b) => b.is_public_preview && b.share_slug)
      .map((b) => ({
        url: `${baseUrl}/read/${b.share_slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  } catch (err) {
    // Non-critical, ignore if DB is offline during build
  }

  return [...staticRoutes, ...blogRoutes, ...publicBookRoutes];
}
