-- Create table for payment transactions
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  misticpay_transaction_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  transaction_type TEXT NOT NULL DEFAULT 'DEPOSITO',
  payer_name TEXT,
  payer_document TEXT,
  description TEXT,
  qr_code_base64 TEXT,
  qr_code_url TEXT,
  copy_paste TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "Users can create their own transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System can update transactions (for webhook updates)
CREATE POLICY "System can update transactions"
ON public.payment_transactions
FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_misticpay_id ON public.payment_transactions(misticpay_transaction_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);