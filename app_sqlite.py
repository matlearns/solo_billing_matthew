from flask import Flask, render_template, jsonify, request, send_file
from flask_cors import CORS
import sqlite3
import os
import sys

app = Flask(__name__, template_folder='.', static_folder='.')
CORS(app)

# SQLite database path
DB_PATH = 'd:\\solo_billing_matthew\\database.db'

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Database connection error: {e}", file=sys.stderr)
        return None

def init_db():
    """Initialize database with tables if they don't exist"""
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        
        # Create item_record table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS item_record (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name VARCHAR(255) NOT NULL,
                cost_price DECIMAL(10, 2) NOT NULL,
                sell_price DECIMAL(10, 2) NOT NULL
            )
        ''')
        
        # Create selling_record table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS selling_record (
                selling_id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(10, 2) DEFAULT 0,
                grand_total DECIMAL(10, 2) NOT NULL
            )
        ''')
        
        # Create selling_details table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS selling_details (
                selling_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
                selling_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (selling_id) REFERENCES selling_record(selling_id),
                FOREIGN KEY (item_id) REFERENCES item_record(item_id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Database initialized successfully!")

# Serve main pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/items')
def items():
    return render_template('items.html')

@app.route('/sales')
def sales():
    return render_template('sales.html')

# Serve static files
@app.route('/<path:filename>')
def serve_static(filename):
    return app.send_static_file(filename)

# API: Get all items
@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute('SELECT * FROM item_record ORDER BY item_id')
        items = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify([dict(item) for item in items])
    except Exception as e:
        print(f"Error in get_items: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Add new item
@app.route('/api/items', methods=['POST'])
def add_item():
    try:
        data = request.json
        print(f"Received data: {data}", file=sys.stderr)
        
        if not data or 'item_name' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO item_record (item_name, cost_price, sell_price) VALUES (?, ?, ?)',
            (data['item_name'], data['cost_price'], data['sell_price'])
        )
        conn.commit()
        item_id = cur.lastrowid
        cur.close()
        conn.close()
        
        print(f"Item added successfully with ID: {item_id}", file=sys.stderr)
        return jsonify({'item_id': item_id, 'message': 'Item added successfully'}), 201
    except Exception as e:
        print(f"Error in add_item: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Update item
@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute(
            'UPDATE item_record SET item_name = ?, cost_price = ?, sell_price = ? WHERE item_id = ?',
            (data['item_name'], data['cost_price'], data['sell_price'], item_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"Item {item_id} updated successfully", file=sys.stderr)
        return jsonify({'message': 'Item updated successfully'}), 200
    except Exception as e:
        print(f"Error in update_item: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Delete item
@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute('DELETE FROM item_record WHERE item_id = ?', (item_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"Item {item_id} deleted successfully", file=sys.stderr)
        return jsonify({'message': 'Item deleted successfully'}), 200
    except Exception as e:
        print(f"Error in delete_item: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Get all sales
@app.route('/api/sales', methods=['GET'])
def get_sales():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute('''
            SELECT sr.*, COUNT(sd.selling_detail_id) as items_count
            FROM selling_record sr
            LEFT JOIN selling_details sd ON sr.selling_id = sd.selling_id
            GROUP BY sr.selling_id
            ORDER BY sr.selling_id DESC
        ''')
        sales = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify([dict(sale) for sale in sales])
    except Exception as e:
        print(f"Error in get_sales: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Create new sales order
@app.route('/api/sales', methods=['POST'])
def add_sale():
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO selling_record (customer_id, customer_name, total_amount, discount, grand_total) VALUES (?, ?, ?, ?, ?)',
            (1, data['customer_name'], 0, 0, 0)
        )
        conn.commit()
        selling_id = cur.lastrowid
        cur.close()
        conn.close()
        
        return jsonify({'selling_id': selling_id, 'message': 'Order created successfully'}), 201
    except Exception as e:
        print(f"Error in add_sale: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Create new order with multiple items
@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Validate input
        if not data.get('customer_name') or not data.get('items'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        cur = conn.cursor()
        
        # Create selling record
        cur.execute(
            'INSERT INTO selling_record (customer_id, customer_name, total_amount, discount, grand_total) VALUES (?, ?, ?, ?, ?)',
            (1, data['customer_name'], data['total_amount'], data['discount'], data['grand_total'])
        )
        conn.commit()
        selling_id = cur.lastrowid
        
        # Insert items into selling_details
        for item in data['items']:
            cur.execute(
                'INSERT INTO selling_details (selling_id, item_id, quantity) VALUES (?, ?, ?)',
                (selling_id, item['id'], item['qty'])
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"Order {selling_id} created successfully", file=sys.stderr)
        return jsonify({'selling_id': selling_id, 'message': 'Order created successfully'}), 201
    except Exception as e:
        print(f"Error in create_order: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Delete sale/order
@app.route('/api/sales/<int:selling_id>', methods=['DELETE'])
def delete_sale(selling_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        # Delete selling_details entries first (foreign key constraint)
        cur.execute('DELETE FROM selling_details WHERE selling_id = ?', (selling_id,))
        
        # Delete selling_record
        cur.execute('DELETE FROM selling_record WHERE selling_id = ?', (selling_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"Order {selling_id} deleted successfully", file=sys.stderr)
        return jsonify({'message': 'Order deleted successfully'}), 200
    except Exception as e:
        print(f"Error in delete_sale: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

# API: Get order details with items
@app.route('/api/sales/<int:selling_id>/details', methods=['GET'])
def get_order_details(selling_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        # Get selling record
        cur.execute('SELECT * FROM selling_record WHERE selling_id = ?', (selling_id,))
        order = cur.fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Get selling details with item names and prices
        cur.execute('''
            SELECT sd.*, ir.item_name, ir.sell_price
            FROM selling_details sd
            LEFT JOIN item_record ir ON sd.item_id = ir.item_id
            WHERE sd.selling_id = ?
        ''', (selling_id,))
        items = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'order': dict(order),
            'items': [dict(item) for item in items]
        })
    except Exception as e:
        print(f"Error in get_order_details: {e}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("Starting Solo Billing Web Application...")
    print("Visit http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
