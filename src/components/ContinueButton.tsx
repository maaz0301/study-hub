'use client';
import Link from 'next/link';
import { useProgress } from '@/lib/progress';

export function ContinueButton({ slug, parts }: { slug: string; parts: string[] }) {
  const p = useProgress();
  const started = Object.keys(p.done).some((k) => k.startsWith(slug + '/'));
  // first part that is not complete is unknown without counts, so pick the last part touched, else the first
  let target = parts[0];
  for (const id of parts) if (Object.keys(p.done).some((k) => k.startsWith(`${slug}/${id}/`))) target = id;
  return (
    <Link href={`/topics/${slug}/${target}`} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
      {started ? 'Continue →' : 'Start reading →'}
    </Link>
  );
}
