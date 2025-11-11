export type UserRole = 'freelancer' | 'client';
export type PostType = 'gig' | 'project';
export type DeliverableType = 'landing_page' | 'ad_1min' | 'bug_fix' | 'design' | 'other';
export type JobStatus = 'draft' | 'brief_complete' | 'payment_pending' | 'matched' | 'in_progress' | 'submitted' | 'accepted' | 'revision_requested' | 'completed' | 'cancelled';
export type TransactionStatus = 'pending' | 'paid' | 'released' | 'refunded';
export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'auto_assigned';
export type PaymentMethod = 'paypal' | 'mobile_money' | 'bank_transfer';
export type JobPriority = 'normal' | 'fast';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  role: UserRole | null;
  skills: string[];
  links: {
    portfolio?: string;
    twitter?: string;
    linkedin?: string;
  };
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: PostType;
  price: number | null;
  timeline: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  sender?: User;
  receiver?: User;
}

export interface Job {
  id: string;
  client_id: string;
  one_line_request: string;
  objective: string;
  deliverable_type: DeliverableType;
  acceptance_criteria: string[];
  budget: number | null;
  deadline: string;
  priority: JobPriority;
  status: JobStatus;
  estimated_price: number | null;
  final_price: number | null;
  revision_count: number;
  max_revisions: number;
  created_at: string;
  updated_at: string;
  client?: User;
  matched_freelancer?: User;
}

export interface Transaction {
  id: string;
  job_id: string;
  client_id: string;
  amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  admin_verified_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  client?: User;
}

export interface JobMatch {
  id: string;
  job_id: string;
  freelancer_id: string;
  match_score: number;
  status: MatchStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  freelancer?: User;
}

export interface JobChecklist {
  id: string;
  job_id: string;
  item: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  job?: Job;
  completed_by_user?: User;
}

export interface JobDeliverable {
  id: string;
  job_id: string;
  uploaded_by: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  version: number;
  is_final: boolean;
  created_at: string;
  job?: Job;
  uploaded_by_user?: User;
}

export interface JobReview {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  met_criteria: boolean;
  feedback: string | null;
  rating: number | null;
  created_at: string;
  job?: Job;
  client?: User;
  freelancer?: User;
}

export interface JobMessage {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  created_at: string;
  job?: Job;
  sender?: User;
}

