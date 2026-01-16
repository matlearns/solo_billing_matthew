CREATE TABLE item_record (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL
);
