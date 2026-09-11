-- 0004 — add the 'customer' value to retail_order_source ahead of 0005.
-- Split into its own migration: ALTER TYPE ... ADD VALUE cannot be used in
-- the same transaction that adds it, so it must land before the migration
-- that references it.
alter type retail_order_source add value if not exists 'customer';
