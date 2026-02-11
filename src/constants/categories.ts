export const HABIT_CATEGORIES = [
  { id: 'health', label: 'Health', icon: 'heart-pulse', color: '#E91E63' },
  { id: 'fitness', label: 'Fitness', icon: 'dumbbell', color: '#FF6B47' },
  { id: 'mindfulness', label: 'Mindfulness', icon: 'meditation', color: '#9B59B6' },
  { id: 'productivity', label: 'Productivity', icon: 'lightning-bolt', color: '#3498DB' },
  { id: 'learning', label: 'Learning', icon: 'book-open-variant', color: '#00BCD4' },
  { id: 'finance', label: 'Finance', icon: 'cash-multiple', color: '#2ECC71' },
  { id: 'social', label: 'Social', icon: 'account-group', color: '#FFB347' },
  { id: 'creativity', label: 'Creativity', icon: 'palette', color: '#FF8C42' },
] as const;

export type HabitCategoryId = typeof HABIT_CATEGORIES[number]['id'];
