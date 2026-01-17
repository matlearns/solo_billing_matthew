from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = Flask(__name__, template_folder='.', static_folder='.')
CORS(app)

# Database configuration
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'password')
DB_NAME = os.environ.get('DB_NAME', 'solo_billing')
DB_PORT = os.environ.get('DB_PORT', '5432')

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Serve main page
@app.route('/')
def index():
    return render_template('web_index.html')

# API: Get all items
@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM item_record ORDER BY item_id')
        items = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify([dict(item) for item in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API: Add new item
@app.route('/api/items', methods=['POST'])
def add_item():
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO item_record (item_name, cost_price, sell_price) VALUES (%s, %s, %s) RETURNING item_id',
            (data['item_name'], data['cost_price'], data['sell_price'])
        )
        item_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'item_id': item_id, 'message': 'Item added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API: Get all sales
@app.route('/api/sales', methods=['GET'])
def get_sales():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
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
            'INSERT INTO selling_record (customer_id, customer_name, total_amount, discount, grand_total) VALUES (%s, %s, %s, %s, %s) RETURNING selling_id',
            (1, data['customer_name'], 0, 0, 0)
        )
        selling_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'selling_id': selling_id, 'message': 'Order created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Solo Billing Web Application...")
    print("Visit http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
