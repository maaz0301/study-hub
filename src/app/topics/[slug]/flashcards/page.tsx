import { notFound } from 'next/navigation';
import { getTopic } from '@/lib/content';
import { Flashcards } from '@/components/Flashcards';

export const metadata = { title: 'Flashcards' };

export default async function FlashcardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTopic(slug);
  if (!t) notFound();
  return <Flashcards slug={slug} cards={t.cards} />;
}
