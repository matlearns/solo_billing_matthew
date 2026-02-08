import sqlite3
DB='d:\\solo_billing_matthew\\database.db'
conn=sqlite3.connect(DB)
cur=conn.cursor()
cur.execute("PRAGMA table_info(selling_record)")
cols=cur.fetchall()
print('PRAGMA table_info(selling_record):')
for c in cols:
    print(c)

print('\nSample rows (selling_record):')
try:
    cur.execute("SELECT selling_id, customer_name, created_at FROM selling_record ORDER BY selling_id DESC LIMIT 10")
    rows=cur.fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print('Error selecting rows:', e)

conn.close()
