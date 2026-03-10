-- Add loan and financing to account_type ENUM
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'loan';
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'financing';
