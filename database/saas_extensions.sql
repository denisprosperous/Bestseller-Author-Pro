
-- =============================================================================
-- BESTSELLER AUTHOR PRO - SAAS EXTENSIONS
-- =============================================================================

-- =============================================================================
-- SUBSCRIPTIONS & BILLING
-- =============================================================================

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Free', 'Pro', 'Enterprise'
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  annual_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  features JSONB DEFAULT '{}', -- e.g., {"max_projects": 5, "ai_credits": 100}
  stripe_product_id TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Balance (for usage-based billing)
CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,4) DEFAULT 0,
  lifetime_purchased DECIMAL(10,4) DEFAULT 0,
  lifetime_used DECIMAL(10,4) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,4) NOT NULL, -- Positive for purchase, negative for usage
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund', 'adjustment')),
  reference_id UUID, -- ID of the generated content or invoice
  reference_type TEXT, -- 'image_generation', 'tts_generation', 'invoice'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RLS POLICIES FOR SAAS TABLES
-- =============================================================================

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone, manageable by admins (service role)
CREATE POLICY "Public read access to active plans" ON plans
  FOR SELECT USING (is_active = true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Credit balance policies
CREATE POLICY "Users can view own credit balance" ON credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);

-- =============================================================================
-- SEED DEFAULT PLANS
-- =============================================================================

INSERT INTO plans (name, description, monthly_price, features) VALUES
('Free', 'Get started with basic features', 0, '{"max_ebooks": 1, "max_audiobooks": 0, "ai_credits": 10}'),
('Pro', 'For serious authors', 29.99, '{"max_ebooks": 10, "max_audiobooks": 5, "ai_credits": 500}'),
('Enterprise', 'For publishing houses', 99.99, '{"max_ebooks": -1, "max_audiobooks": -1, "ai_credits": 2000}')
ON CONFLICT (name) DO NOTHING;
