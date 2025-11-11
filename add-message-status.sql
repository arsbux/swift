-- Add delivered_at column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on delivered_at
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON public.messages(delivered_at);

-- Create index for unread messages count
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

