export interface Family {
  id: string;
  name: string;
  weather_location: string | null;
  weather_lat: number | null;
  weather_lng: number | null;
  theme_season: 'auto' | 'spring' | 'summer' | 'fall' | 'winter';
  notification_email?: string;
  notification_app_password?: string;
  created_at: string;
}

export interface User {
  id: string;
  family_id: string;
  name: string;
  phone_number: string | null;
  carrier: string | null;
  avatar_color: string;
  accent_color: string | null;
  hero_image_url: string | null;
  ical_url: string | null;
  personal_affirmation: string | null;
  sort_order: number;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  color: string | null;
  recurrence: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  recurrence_end: string | null;
  recurrence_parent_id: string | null;
  notify: boolean;
  notify_before: number;
  created_by: string | null;
  created_at: string;
  // Joined
  event_users?: { user_id: string; users?: User }[];
  event_tags?: { tag_id: string; tags?: Tag }[];
}

export interface Tag {
  id: string;
  family_id: string;
  name: string;
  color: string | null;
}

export interface Todo {
  id: string;
  family_id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  notify: boolean;
  created_by: string | null;
  created_at: string;
  todo_users?: { user_id: string; users?: User }[];
}

export interface Chore {
  id: string;
  family_id: string;
  title: string;
  recurrence: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  days_of_week: number[] | null;
  time_start: string | null;
  time_end: string | null;
  recurrence_end: string | null;
  notify: boolean;
  created_by: string | null;
  created_at: string;
  chore_users?: { user_id: string; users?: User }[];
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
}

export interface MustHave {
  id: string;
  user_id: string;
  title: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  sort_order: number;
  created_at: string;
}

export interface MustHaveCompletion {
  id: string;
  must_have_id: string;
  completed_date: string;
  completed_at: string;
}

export interface GroceryItem {
  id: string;
  family_id: string;
  item: string;
  description: string | null;
  quantity: string | null;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
  list_type: 'weekly' | 'biweekly';
  checked: boolean;
  added_by: string | null;
  created_at: string;
}

export interface GrocerySettings {
  id: string;
  family_id: string;
  list_type: 'weekly' | 'biweekly';
  max_budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface Affirmation {
  id: string;
  family_id: string;
  user_id: string | null;
  text: string;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  family_id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  uploaded_by: string | null;
  scope: string;
  created_at: string;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type ViewMode = 'day' | 'week' | 'month' | 'agenda';
export type TabType = 'family' | 'user' | 'settings';

export interface AppTab {
  id: string;
  type: TabType;
  label: string;
  userId?: string;
  color?: string;
}
