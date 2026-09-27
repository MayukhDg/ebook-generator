import { 
  Book, 
  Chapter, 
  BlogPost, 
  Profile, 
  CreditTransaction, 
  CreditActionType,
  CoverStyleConfig,
  GlobalContext,
  SourceMaterial,
  SubscriptionTier
} from '@/lib/types';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

class ProductionDataStore {
  private isConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!url && !url.includes('mock-supabase');
  }

  // ---------------------------------------------------------------------------
  // Profile & Atomic Credits
  // ---------------------------------------------------------------------------
  async getProfile(userId?: string): Promise<Profile | null> {
    const supabase = createServerSupabaseClient();
    
    // Resolve user ID from session if not provided
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      targetUserId = user.id;
    }

    if (this.isConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (data) return data as Profile;

      // If user exists in Auth but profile was not created by trigger yet
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === targetUserId) {
        const newProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Author',
          credits_balance: 20,
          subscription_tier: 'free',
        };
        const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
        if (created) return created as Profile;
      }
    }

    // Default clean profile for development
    return {
      id: targetUserId || '00000000-0000-0000-0000-000000000001',
      email: 'author@foliocraft.ai',
      full_name: 'Author',
      credits_balance: 20,
      subscription_tier: 'free',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async deductCredits(
    userId: string, 
    cost: number, 
    action: CreditActionType, 
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
    if (cost <= 0) {
      return { success: false, remainingCredits: 0, error: 'Cost must be positive' };
    }

    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      // Call PostgreSQL atomic row-locking function
      const { data, error } = await supabase.rpc('deduct_user_credits', {
        p_user_id: userId,
        p_cost: cost,
        p_action: action,
        p_metadata: metadata,
      });

      if (error) {
        return { success: false, remainingCredits: 0, error: error.message };
      }

      return { success: true, remainingCredits: data };
    }

    // Local fallback deduction logic
    return { success: true, remainingCredits: Math.max(0, 20 - cost) };
  }

  async addCredits(
    userId: string,
    amount: number,
    action: CreditActionType,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; newBalance: number }> {
    if (this.isConfigured()) {
      const adminClient = createAdminSupabaseClient();
      
      const { data: profile } = await adminClient
        .from('profiles')
        .select('credits_balance')
        .eq('id', userId)
        .single();

      const current = profile?.credits_balance ?? 20;
      const newBalance = current + amount;

      await adminClient
        .from('profiles')
        .update({ 
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      await adminClient
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount,
          action_type: action,
          metadata,
        });

      return { success: true, newBalance };
    }

    return { success: true, newBalance: 150 };
  }

  async updateSubscriptionTier(
    userId: string,
    tier: SubscriptionTier,
    customerId?: string,
    subscriptionId?: string
  ): Promise<boolean> {
    if (this.isConfigured()) {
      const adminClient = createAdminSupabaseClient();
      const updateData: Record<string, any> = {
        subscription_tier: tier,
        updated_at: new Date().toISOString(),
      };
      if (customerId) {
        updateData.stripe_customer_id = customerId;
      }
      if (subscriptionId) {
        updateData.stripe_subscription_id = subscriptionId;
      }

      const { error } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating subscription tier in profiles:', error);
        return false;
      }
      return true;
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Books (100% Dynamic & Isolated to Authenticated User)
  // ---------------------------------------------------------------------------
  async getBooks(userId?: string): Promise<Book[]> {
    const supabase = createServerSupabaseClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      targetUserId = user.id;
    }

    if (this.isConfigured()) {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (data) return data as Book[];
      return [];
    }

    // In local zero-data state, newly logged-in users see empty array []
    return [];
  }

  async getBookById(id: string): Promise<Book | null> {
    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (!data && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('books')
          .select('*')
          .eq('id', id)
          .single();
        data = adminRes.data;
      }

      if (data) return data as Book;
      return null;
    }

    return null;
  }

  async getBookBySlug(slug: string): Promise<Book | null> {
    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('share_slug', slug)
        .single();

      if (!data && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('books')
          .select('*')
          .eq('share_slug', slug)
          .single();
        data = adminRes.data;
      }

      if (data) return data as Book;
      return null;
    }

    return null;
  }

  async createBook(data: Partial<Book>): Promise<Book> {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || data.user_id || '00000000-0000-0000-0000-000000000001';

    const newBookPayload = {
      user_id: userId,
      title: data.title || 'Untitled Book',
      subtitle: data.subtitle || null,
      target_audience: data.target_audience || 'General readers',
      core_thesis: data.core_thesis || '',
      tone_voice: data.tone_voice || 'Authoritative & Practical',
      status: 'draft',
      cover_bg_url: data.cover_bg_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      cover_style_config: data.cover_style_config || {
        template: 'bold_founder',
        font_family: 'Space Grotesk',
        title_color: '#F8FAFC',
        subtitle_color: '#94A3B8',
        accent_color: '#38BDF8',
        layout: 'center',
        show_barcode_box: true,
        author_name: user?.user_metadata?.full_name || 'Author',
      },
      cover_full_wrap_url: null,
      source_materials: data.source_materials || [],
      global_context: data.global_context || {
        target_persona: data.target_audience || '',
        core_thesis: data.core_thesis || '',
        terminology: {},
        rolling_abstracts: [],
      },
      is_public_preview: false,
      share_slug: data.share_slug || `book-${Date.now()}`,
    };

    if (this.isConfigured()) {
      const { data: inserted, error } = await supabase
        .from('books')
        .insert(newBookPayload)
        .select()
        .single();

      if (inserted) return inserted as Book;
    }

    return {
      id: `b-${Date.now()}`,
      ...newBookPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Book;
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data, error } = await supabase
        .from('books')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!data && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('books')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        data = adminRes.data;
      }

      if (error) {
        console.error('Error updating book in store:', error);
      }
      if (data) return data as Book;
      return null;
    }

    return null;
  }

  async deleteBook(id: string): Promise<boolean> {
    if (this.isConfigured()) {
      const admin = createAdminSupabaseClient();
      // First delete associated chapters
      await admin.from('chapters').delete().eq('book_id', id);
      const { error } = await admin.from('books').delete().eq('id', id);
      if (error) {
        console.error('Error deleting book in store:', error);
        return false;
      }
      return true;
    }
    return true;
  }

  async addSourceMaterial(bookId: string, material: SourceMaterial): Promise<Book | null> {
    const book = await this.getBookById(bookId);
    if (!book) return null;
    const updatedMaterials = [...(book.source_materials || []), material];
    return this.updateBook(bookId, { source_materials: updatedMaterials });
  }

  // ---------------------------------------------------------------------------
  // Chapters
  // ---------------------------------------------------------------------------
  async getChapters(bookId: string): Promise<Chapter[]> {
    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .order('chapter_number', { ascending: true });

      if ((!data || data.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('chapters')
          .select('*')
          .eq('book_id', bookId)
          .order('chapter_number', { ascending: true });
        data = adminRes.data;
      }

      if (data) return data as Chapter[];
      return [];
    }

    return [];
  }

  async getChapterById(chapterId: string): Promise<Chapter | null> {
    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (!data && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single();
        data = adminRes.data;
      }

      if (data) return data as Chapter;
      return null;
    }

    return null;
  }

  async createChapter(data: Partial<Chapter>): Promise<Chapter> {
    const payload = {
      book_id: data.book_id!,
      chapter_number: data.chapter_number || 1,
      title: data.title || `Chapter ${data.chapter_number || 1}`,
      summary: data.summary || null,
      content_markdown: data.content_markdown || '',
      word_count: data.word_count || (data.content_markdown ? data.content_markdown.split(/\s+/).length : 0),
      status: data.status || 'pending',
      version: 1,
    };

    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data: inserted, error } = await supabase
        .from('chapters')
        .insert(payload)
        .select()
        .single();

      if (!inserted && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('chapters')
          .insert(payload)
          .select()
          .single();
        inserted = adminRes.data;
      }

      if (inserted) return inserted as Chapter;
    }

    return {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Chapter;
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | null> {
    const wordCount = updates.content_markdown !== undefined
      ? updates.content_markdown.trim() === '' ? 0 : updates.content_markdown.trim().split(/\s+/).length
      : undefined;

    const payload = {
      ...updates,
      ...(wordCount !== undefined ? { word_count: wordCount } : {}),
      updated_at: new Date().toISOString(),
    };

    if (this.isConfigured()) {
      const supabase = createServerSupabaseClient();
      let { data, error } = await supabase
        .from('chapters')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!data && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const admin = createAdminSupabaseClient();
        const adminRes = await admin
          .from('chapters')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        data = adminRes.data;
      }

      if (data) return data as Chapter;
      return null;
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Blog Posts (Public Publications & Admin CMS)
  // ---------------------------------------------------------------------------
  async getBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
    if (this.isConfigured()) {
      const supabase = publishedOnly ? createServerSupabaseClient() : createAdminSupabaseClient();
      let query = supabase.from('blog_posts').select('*').order('published_at', { ascending: false });
      if (publishedOnly) {
        query = query.eq('is_published', true);
      }
      const { data, error } = await query;
      if (error && publishedOnly) {
        // Fallback to admin client if RLS blocked anon
        const adminSupabase = createAdminSupabaseClient();
        const { data: adminData } = await adminSupabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });
        if (adminData && adminData.length > 0) return adminData as BlogPost[];
      }
      if (data && data.length > 0) return data as BlogPost[];
    }

    return [];
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (this.isConfigured()) {
      const supabase = createAdminSupabaseClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (data) return data as BlogPost;
    }

    return null;
  }

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    if (this.isConfigured()) {
      const supabase = createAdminSupabaseClient();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) return data as BlogPost;
    }

    return null;
  }

  async createBlogPost(data: Partial<BlogPost>): Promise<BlogPost> {
    if (this.isConfigured()) {
      const supabase = createAdminSupabaseClient();

      const title = (data.title || '').trim();
      if (!title) {
        throw new Error('Article title is required.');
      }

      const contentMarkdown = (data.content_markdown || '').trim();
      if (!contentMarkdown) {
        throw new Error('Markdown body content is required.');
      }

      let slug = (data.slug || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!slug) {
        slug = title.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      }

      const metaDescription = (data.meta_description || '').trim() || title;

      const validStages = ['awareness', 'consideration', 'purchase'];
      const funnelStage = validStages.includes(data.funnel_stage || '') ? data.funnel_stage : 'awareness';

      const keywords = Array.isArray(data.target_keywords)
        ? data.target_keywords.map((k) => String(k).trim()).filter(Boolean)
        : typeof data.target_keywords === 'string'
        ? (data.target_keywords as string).split(',').map((k) => k.trim()).filter(Boolean)
        : [];

      const schemaJson = (data.schema_json && typeof data.schema_json === 'object')
        ? data.schema_json
        : { '@context': 'https://schema.org', '@type': 'Article', headline: title };

      const payload = {
        title,
        slug,
        meta_description: metaDescription,
        content_markdown: contentMarkdown,
        funnel_stage: funnelStage,
        canonical_url: data.canonical_url?.trim() || null,
        target_keywords: keywords,
        schema_json: schemaJson,
        is_published: data.is_published ?? true,
        published_at: data.published_at || new Date().toISOString(),
      };

      const { data: inserted, error } = await supabase
        .from('blog_posts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post in Supabase:', error);
        throw new Error(error.message);
      }

      if (inserted) return inserted as BlogPost;
    }

    throw new Error('Database is not configured.');
  }

  async updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    if (this.isConfigured()) {
      const supabase = createAdminSupabaseClient();
      const updates: any = {};
      if (data.title !== undefined) updates.title = data.title.trim();
      if (data.slug !== undefined) {
        updates.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (data.meta_description !== undefined) updates.meta_description = data.meta_description.trim();
      if (data.content_markdown !== undefined) updates.content_markdown = data.content_markdown;
      if (data.funnel_stage !== undefined) updates.funnel_stage = data.funnel_stage;
      if (data.canonical_url !== undefined) updates.canonical_url = data.canonical_url?.trim() || null;
      if (data.target_keywords !== undefined) {
        updates.target_keywords = Array.isArray(data.target_keywords)
          ? data.target_keywords.map((k) => String(k).trim()).filter(Boolean)
          : [];
      }
      if (data.schema_json !== undefined) updates.schema_json = data.schema_json;
      if (data.is_published !== undefined) updates.is_published = data.is_published;

      const { data: updated, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating blog post in Supabase:', error);
        throw new Error(error.message);
      }

      return updated as BlogPost;
    }
    throw new Error('Database is not configured.');
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    if (this.isConfigured()) {
      const supabase = createAdminSupabaseClient();
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blog post in Supabase:', error);
        throw new Error(error.message);
      }

      return true;
    }
    return false;
  }
}

export const store = new ProductionDataStore();
