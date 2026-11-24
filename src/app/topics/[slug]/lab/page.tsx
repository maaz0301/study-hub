import { notFound } from 'next/navigation';
import { getTopic } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { Labs } from '@/components/labs/Labs';

export const metadata = { title: 'Playground' };

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTopic(slug);
  if (!t || !LABS[slug]) notFound();
  let data: unknown = null;
  if (slug === 'voice-ai') data = { steps: t.extras.steps || [] };
  if (slug === 'genai-rag') data = { mock: t.extras.mock || [] };
  if (slug === 'csharp') {
    // pull program + output pairs out of the lessons for "predict the output"
    data = t.parts.flatMap((p) => p.sections).map((s) => {
      const code = /<details><summary>[^<]*<\/summary>(<pre class="code-block"[\s\S]*?<\/pre>)<\/details>/.exec(s.html)?.[1] || '';
      const out = /<details class="reveal">[\s\S]*?(<pre class="code-block out"[\s\S]*?<\/pre>)/.exec(s.html)?.[1] || '';
      return { id: s.id, title: s.title, code, out };
    }).filter((x) => x.code && x.out);
  }
  return <Labs slug={slug} data={data} />;
}
