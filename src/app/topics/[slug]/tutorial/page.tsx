import { redirect } from 'next/navigation';

export default async function TutorialIndex({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/topics/${slug}/tutorial/1`);
}
