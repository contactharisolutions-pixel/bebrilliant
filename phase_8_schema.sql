-- Phase 8 SQL Schema Update: Advanced Analytics & GST Tracking Upgrades

-- 1. Product GST Profile (HSN code metadata tracking)
ALTER TABLE product ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(50);
ALTER TABLE product ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2); -- e.g. 18.00, 12.00, 5.00

-- 2. Line Item Exact Tax Breakdowns
-- Needed for accurate GSTR-1 and GSTR-2 sales reports at transaction level
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10,2) DEFAULT 0;

-- 3. Dedicated Materialized Views Schema Prep (Optional performance boost for intense dashboards)
-- This natively allows locking high-compute 'Daily Revenue' without heavy joins during peak POS hrs.
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_summary AS
SELECT 
    business_id,
    showroom_id,
    DATE(created_at) as sale_date,
    COUNT(order_id) as total_orders,
    SUM(total_amount) as total_revenue,
    SUM(discount_amount) as total_discount,
    SUM(tax_amount) as total_tax
FROM customer_order
WHERE payment_status = 'success' OR order_status = 'completed'
GROUP BY business_id, showroom_id, DATE(created_at);

-- Add unique index for material view refresh capabilities if needed
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales ON daily_sales_summary (business_id, showroom_id, sale_date);
