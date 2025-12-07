export interface Step {
  id: string;
  text: string;
  is_completed: boolean;
  is_active: boolean;
  time_left: number; // in seconds
  original_focus_time: number; // usually 25 * 60
}

export interface TaskPlan {
  id: string;
  one_thing: string;
  steps: Step[];
  call_to_action: string;
  createdAt: number;
}

export interface AIResponseSchema {
  one_thing: string;
  steps: string[];
  call_to_action: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
