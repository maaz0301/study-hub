export type Section = {
  id: string;
  title: string;
  group?: string | null;
  html: string;
  isQuestion: boolean;
  summary: string;
  lesson?: boolean;
  hasVisual?: boolean;
};

export type Part = { id: string; title: string; blurb?: string; sections: Section[] };

export type Card = { id: string; q: string; a: string; part: string };

export type QuizItem = { q: string; options: string[]; answer: number; explain?: string };

export type Stats = { parts: number; sections: number; questions: number; cards: number };

export type TopicMeta = {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  category: string;
  order: number;
  source: string;
  original: string | null;
  layout: 'qa' | 'lessons';
  about?: string;
  stats: Stats;
};

export type Topic = TopicMeta & {
  parts: Part[];
  cards: Card[];
  extras: { quiz?: QuizItem[]; steps?: VoiceStep[]; utts?: VoiceUtt[]; ragSteps?: unknown; mock?: { id: string; q: string; points: string[] }[]; visuals?: Visual[] };
};

export type Visual = { name: string; part: string; partTitle: string; section: string; sectionTitle: string; svg: string };

export type TopicSummary = TopicMeta & {
  partList: { id: string; title: string; count: number; blurb: string; lesson?: boolean; questions?: number }[];
  hasQuiz: boolean;
  visualCount?: number;
  lessonCount?: number;
};

export type VoiceStep = { ic: string; nm: string; title: string; tool: string; ms: string; inp: string; out: string; risk: string; say: string };
export type VoiceUtt = { say: string; stt: string; tool: string; args: Record<string, unknown>; res: Record<string, unknown>; reply: string };
