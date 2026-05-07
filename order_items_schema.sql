-- Order Items Table
CREATE TABLE IF NOT EXISTS customer_order_item (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES product(product_id),
    variant_id VARCHAR(50) REFERENCES variant(variant_id),
    qty INT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
