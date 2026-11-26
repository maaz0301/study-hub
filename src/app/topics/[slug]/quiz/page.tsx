import { notFound } from 'next/navigation';
import { getTopic } from '@/lib/content';
import { Quiz } from '@/components/Quiz';

export const metadata = { title: 'Quiz' };

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTopic(slug);
  if (!t) notFound();
  // keep the payload small: the quiz only needs short answers
  const cards = t.cards.filter((c) => c.part !== 'Lessons').map((c) => ({ ...c, a: c.a.length > 260 ? c.a.slice(0, 260).replace(/\s+\S*$/, '') + '…' : c.a }));
  return <Quiz slug={slug} authored={t.extras.quiz || []} cards={cards} />;
}
