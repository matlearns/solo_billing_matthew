CREATE TABLE item_record (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE selling_record (
    selling_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        grand_total DECIMAL(10, 2) NOT NULL
    );

    CREATE TABLE selling_details (
        selling_detail_id SERIAL PRIMARY KEY,
        selling_id INT NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (selling_id) REFERENCES selling_record(selling_id),
        FOREIGN KEY (item_id) REFERENCES item_record(item_id)
    );
