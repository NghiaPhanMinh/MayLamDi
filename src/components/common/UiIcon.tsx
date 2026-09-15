import {
  ArrowUpRight, BarChart3, Bell, Bot, CalendarDays, Check, CheckCircle2,
  CircleMinus, Clapperboard, ClipboardCheck, Cloud, Droplets, FileText,
  Flame, Folder, FolderKanban, Gamepad2, Ghost, Heart, Home, Image, MessageCircle,
  Leaf, Lightbulb, Link, Menu, Mountain, Pencil, Shield, ShieldCheck,
  Snowflake, Sparkles, Sprout, Star, Swords, Target, TriangleAlert,
  User, UserRound, Users, WandSparkles, Wrench, Zap, TrendingUp, Hourglass,
} from "lucide-react";

import type { SpellType } from "../../lib/character";

const ICONS = {
  ArrowUpRight, BarChart3, Bell, Bot, CalendarDays, Check, CheckCircle2,
  CircleMinus, Clapperboard, ClipboardCheck, Cloud, Droplets, FileText,
  Flame, Folder, FolderKanban, Gamepad2, Ghost, Heart, Home, Image, MessageCircle,
  Leaf, Lightbulb, Link, Menu, Mountain, Pencil, Shield, ShieldCheck,
  Snowflake, Sparkles, Sprout, Star, Swords, Target, TriangleAlert,
  User, UserRound, Users, WandSparkles, Wrench, Zap, TrendingUp, Hourglass,
};

export type UiIconName = keyof typeof ICONS;

export function UiIcon({ name, size = "1em" }: { name: UiIconName; size?: number | string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={2} style={{ display: "inline-block", verticalAlign: "-0.15em", flexShrink: 0 }} />;
}

const SPELL_ICONS: Record<SpellType | "none", UiIconName> = {
  none: "CircleMinus", spark: "Sparkles", shield: "Shield", focus: "Target",
  bloom: "Sprout", fire: "Flame", lightning: "Zap", water: "Droplets",
  nature: "Leaf", star: "Star",
};

export function SpellIcon({ spellType }: { spellType?: SpellType }) {
  return <UiIcon name={SPELL_ICONS[spellType ?? "none"]} />;
}
