
-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID;
  pro_plan_id UUID;
BEGIN
  -- 1. Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@bestseller.pro';
  
  IF new_user_id IS NOT NULL THEN
    RAISE NOTICE 'User admin@bestseller.pro already exists with ID: %', new_user_id;
    -- Optional: Update password if needed, but for now just skip creation
  ELSE
    -- 2. Create the user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@bestseller.pro',
      crypt('password123', gen_salt('bf')),
      NOW(), -- Confirmed immediately
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin Tester"}',
      NOW(),
      NOW()
    )
    RETURNING id INTO new_user_id;

    RAISE NOTICE 'Created new user with ID: %', new_user_id;
  END IF;

  -- 3. Create default preferences (upsert)
  INSERT INTO public.user_preferences (user_id, default_ai_provider)
  VALUES (new_user_id, 'openai')
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Assign Pro Plan (if plans table exists)
  -- First, get the Pro plan ID
  SELECT id INTO pro_plan_id FROM public.plans WHERE name = 'Pro' LIMIT 1;
  
  IF pro_plan_id IS NOT NULL THEN
    -- Insert subscription
    INSERT INTO public.subscriptions (
      user_id, 
      plan_id, 
      status, 
      current_period_start, 
      current_period_end
    )
    VALUES (
      new_user_id, 
      pro_plan_id, 
      'active', 
      NOW(), 
      NOW() + INTERVAL '1 year'
    )
    ON CONFLICT DO NOTHING; -- Assuming simple constraint or just to be safe
    
    RAISE NOTICE 'Assigned Pro plan to user';
  ELSE
    RAISE NOTICE 'Pro plan not found, skipping subscription assignment';
  END IF;

  -- 5. Add some credits
  INSERT INTO public.credit_balances (user_id, balance, lifetime_purchased)
  VALUES (new_user_id, 1000, 1000)
  ON CONFLICT (user_id) 
  DO UPDATE SET balance = credit_balances.balance + 1000;

END $$;
