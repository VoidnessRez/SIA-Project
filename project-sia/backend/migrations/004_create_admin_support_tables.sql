-- Create missing tables used by admin pages so all modules are DB-backed (no mock UI data)

-- Products table used by Inventory Reports and Reviews join
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT DEFAULT 'spare-parts',
  brand TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages page
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback page
CREATE TABLE IF NOT EXISTS public.feedback (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'suggestion' CHECK (type IN ('bug', 'feature', 'suggestion', 'complaint', 'praise')),
  subject TEXT,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews page
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NULL REFERENCES public.products(id) ON DELETE SET NULL,
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Return Management page
CREATE TABLE IF NOT EXISTS public.return_requests (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id BIGINT NULL REFERENCES public.order_items(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'other',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_profile_id ON public.messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_feedback_profile_id ON public.feedback(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order_item_id ON public.return_requests(order_item_id);
