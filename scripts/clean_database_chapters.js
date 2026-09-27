const url = 'https://tvsngufucmwiujwoxqqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2c25ndWZ1Y213aXVqd294cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgwMjc4NCwiZXhwIjoyMTA1Mzc4Nzg0fQ.yxMLSS4hETbteD-tnVqk7fFj2CvXyLbTcbMAIGAIs0o';

function cleanHumanProse(text) {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove leading '# Chapter X...' title lines and duplicate titles at the top
  cleaned = cleaned.replace(/^#\s+Chapter\s+\d+[:\s\w\d'’"–—-]*\n+/i, '');
  cleaned = cleaned.replace(/^#\s+[^\n]+\n+/, '');

  // 2. Remove all markdown headings: '## Heading', '### Heading', etc. Convert to clean title on its own line
  cleaned = cleaned.replace(/^#{1,6}\s+([^\n]+)$/gm, '\n$1\n');

  // 3. Remove annoying asterisks around quotes like *"..."*, "**...**", "*...", "...*"
  cleaned = cleaned.replace(/\*+"([^"]+)"\*+/g, '"$1"');
  cleaned = cleaned.replace(/"+(\*+[^*"]+\*+)"/g, '"$1"');
  cleaned = cleaned.replace(/\*+"([^"]+)"/g, '"$1"');
  cleaned = cleaned.replace(/"([^"]+)"\*+/g, '"$1"');

  // 4. Remove standalone bold/italic asterisks: **word** or *word*
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*\n]+)\*/g, '$1');
  // Remove any remaining stray asterisks
  cleaned = cleaned.replace(/\*/g, '');

  // 5. Remove standalone horizontal rules (---)
  cleaned = cleaned.replace(/\n\s*---\s*\n/g, '\n\n');

  // 6. Remove blockquote markers (> )
  cleaned = cleaned.replace(/^>\s*/gm, '');

  // 7. Make em dashes very sparing:
  // Convert paired em dashes (—phrase—) into natural commas
  cleaned = cleaned.replace(/—([^—\n]+)—/g, ', $1, ');

  // Convert remaining em dashes in prose to natural commas
  cleaned = cleaned.replace(/(\w)\s*—\s*(\w)/g, '$1, $2');
  cleaned = cleaned.replace(/(\w)\s*--\s*(\w)/g, '$1, $2');

  // Clean double commas or comma punctuation glitches
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/,\s*\./g, '.');
  cleaned = cleaned.replace(/,\s*\?/g, '?');
  cleaned = cleaned.replace(/,\s*!/g, '!');
  cleaned = cleaned.replace(/^[ \t]*,[ \t]*/gm, '');

  // 8. Clean trailing whitespace and extra blank lines
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

async function run() {
  console.log('Fetching existing chapters from Supabase...');
  const res = await fetch(url + '/rest/v1/chapters?select=id,chapter_number,title,content_markdown,book_id', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });

  const chapters = await res.json();
  console.log(`Found ${chapters.length} chapters.`);

  let updatedCount = 0;
  for (const ch of chapters) {
    if (!ch.content_markdown || ch.content_markdown.trim() === '') continue;

    const original = ch.content_markdown;
    const cleaned = cleanHumanProse(original);

    if (cleaned !== original) {
      const words = cleaned.trim().split(/\s+/).filter(Boolean).length;
      const patchRes = await fetch(url + `/rest/v1/chapters?id=eq.${ch.id}`, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          content_markdown: cleaned,
          word_count: words,
          updated_at: new Date().toISOString()
        })
      });

      if (patchRes.ok) {
        updatedCount++;
        console.log(`✓ Cleaned CH${ch.chapter_number}: "${ch.title}" (${words} words)`);
      } else {
        console.error(`✗ Failed to update CH${ch.chapter_number}:`, await patchRes.text());
      }
    }
  }

  console.log(`\nSuccessfully cleaned and humanized ${updatedCount} chapters in the database!`);
}

run().catch(console.error);
