-- Add payment_status column to orders table
-- This migration adds the missing payment_status column to the orders table

-- Check if the column already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT;
        -- Optionally, set a default value for existing rows
        UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;
    END IF;
END
$$;