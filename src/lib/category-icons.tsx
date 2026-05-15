import {
  Atom,
  BookOpen,
  Brain,
  Dumbbell,
  FlaskConical,
  Flame,
  Gamepad2,
  Globe2,
  GraduationCap,
  Lightbulb,
  LucideIcon,
  NotebookPen,
  Palette,
  Sigma,
  Sparkles,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CATEGORY_ICON_OPTIONS = [
  { key: 'book-open', label: 'Study', icon: BookOpen },
  { key: 'target', label: 'Target', icon: Target },
  { key: 'brain', label: 'Brain', icon: Brain },
  { key: 'lightbulb', label: 'Idea', icon: Lightbulb },
  { key: 'flame', label: 'Focus', icon: Flame },
  { key: 'star', label: 'Special', icon: Star },
  { key: 'graduation-cap', label: 'School', icon: GraduationCap },
  { key: 'notebook-pen', label: 'Notes', icon: NotebookPen },
  { key: 'sigma', label: 'Math', icon: Sigma },
  { key: 'gamepad-2', label: 'Game', icon: Gamepad2 },
  { key: 'sparkles', label: 'Spark', icon: Sparkles },
  { key: 'dumbbell', label: 'Practice', icon: Dumbbell },
  { key: 'flask-conical', label: 'Science', icon: FlaskConical },
  { key: 'globe-2', label: 'World', icon: Globe2 },
  { key: 'palette', label: 'Art', icon: Palette },
  { key: 'zap', label: 'Quick', icon: Zap },
  { key: 'atom', label: 'Concepts', icon: Atom },
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_OPTIONS)[number]['key'];

const iconMap = CATEGORY_ICON_OPTIONS.reduce<Record<string, LucideIcon>>((acc, item) => {
  acc[item.key] = item.icon;
  return acc;
}, {});

const legacyEmojiMap: Record<string, CategoryIconKey> = {
  '\uD83D\uDCDA': 'book-open',
  '\uD83C\uDFAF': 'target',
  '\uD83E\uDDE0': 'brain',
  '\uD83D\uDCA1': 'lightbulb',
  '\uD83D\uDD25': 'flame',
  '\u2B50': 'star',
  '\uD83C\uDF93': 'graduation-cap',
  '\uD83D\uDCDD': 'notebook-pen',
  '\uD83E\uDDEE': 'sigma',
  '\uD83C\uDFAE': 'gamepad-2',
  '\uD83C\uDF1F': 'sparkles',
  '\uD83D\uDCAA': 'dumbbell',
  '\uD83D\uDD2C': 'flask-conical',
  '\uD83C\uDF0D': 'globe-2',
  '\uD83C\uDFA8': 'palette',
  '\u26A1': 'zap',
};

export function normalizeCategoryIcon(icon?: string | null): CategoryIconKey {
  if (!icon) return 'book-open';
  if (icon in iconMap) return icon as CategoryIconKey;
  return legacyEmojiMap[icon] || 'book-open';
}

export function getCategoryIcon(icon?: string | null): LucideIcon {
  return iconMap[normalizeCategoryIcon(icon)];
}

export function CategoryIcon({
  icon,
  className,
  color,
}: {
  icon?: string | null;
  className?: string;
  color?: string;
}) {
  const Icon = getCategoryIcon(icon);
  return <Icon className={cn('h-5 w-5', className)} style={color ? { color } : undefined} />;
}
