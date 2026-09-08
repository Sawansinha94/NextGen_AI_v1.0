export interface User {
  user_id: string;
  username: string;
  first_name?: string;
  email?: string;
  subscription: "Free" | "Paid";
  license_key?: string | null;
  comments?: string;
  snowuser?: {
    snow_username: string;
    snow_password?: string;
    snow_instance: string;
  } | null;
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  title: string;
  model_used?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
  tableData?: any[];
  tier?: string;
}

export interface UsageStats {
  totalSessions: number;
  totalMessages: number;
  totalLogins: number;
  apiQuotaUsed: string;
}
