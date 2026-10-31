from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import urllib.request
import urllib.parse
import json
import re

app = Flask(__name__)
app.secret_key = "smart_library_secret_key_12345"
DATABASE = os.path.join(os.path.dirname(__file__), "database.db")

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------------------------------------------------
# Manual Quick Sort Algorithm (Divide & Conquer, Lomuto Partition)
# Does NOT use python's built-in sorted() or .sort()
# -------------------------------------------------------------------
def compare_books(a, b, field):
    if field == 'year':
        return a['year'] - b['year']
    val_a = str(a[field] or '').lower()
    val_b = str(b[field] or '').lower()
    if val_a < val_b:
        return -1
    elif val_a > val_b:
        return 1
    return 0

def partition(arr, low, high, field):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if compare_books(arr[j], pivot, field) <= 0:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort_helper(arr, low, high, field):
    if low < high:
        pi = partition(arr, low, high, field)
        quick_sort_helper(arr, low, pi - 1, field)
        quick_sort_helper(arr, pi + 1, high, field)

def manual_quick_sort(books_list, field='title'):
    if not books_list or len(books_list) <= 1:
        return books_list
    books_copy = list(books_list)
    quick_sort_helper(books_copy, 0, len(books_copy) - 1, field)
    return books_copy

# -------------------------------------------------------------------
# AI / Simple Book Recommendation Algorithm
# Recommends books based on user borrowing history & category affinity
# -------------------------------------------------------------------
def get_ai_recommendations(student_id, selected_category):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Fetch user's previous borrowing frequencies by category
    category_freq = {}
    if student_id:
        cursor.execute("""
            SELECT b.category, COUNT(c.id) as count 
            FROM checkouts c 
            JOIN books b ON c.book_id = b.id 
            WHERE c.student_id = ? 
            GROUP BY b.category
        """, (student_id,))
        for row in cursor.fetchall():
            category_freq[row['category']] = row['count']

    # 2. Fetch all books
    cursor.execute("SELECT * FROM books")
    all_books = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # 3. Score books
    scored = []
    for b in all_books:
        score = 0
        reasons = []
        if b['category'].lower() == selected_category.lower():
            score += 50
            reasons.append(f"Matches category '{selected_category}'")
        freq = category_freq.get(b['category'], 0)
        if freq > 0:
            score += freq * 20
            reasons.append(f"Based on your {freq} previous checkout(s) in this topic")
        if b['available_quantity'] > 0:
            score += 10
        scored.append({
            'book': b,
            'reason': ' · '.join(reasons) if reasons else f"Recommended in {b['category']}",
            'score': score
        })

    scored.sort(key=lambda x: x['score'], reverse=True)
    return scored[:6]

# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

@app.route('/')
def home():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as count FROM books")
    total_books = cursor.fetchone()['count']
    
    cursor.execute("SELECT SUM(available_quantity) as count FROM books")
    available_books = cursor.fetchone()['count'] or 0
    
    if session.get('role') == 'student':
        cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE student_id = ? AND status = 'Borrowed'", (session['user_id'],))
        my_borrowed = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE student_id = ? AND status = 'Returned'", (session['user_id'],))
        returned_count = cursor.fetchone()['count']
        stats = {
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': my_borrowed,
            'returned_count': returned_count
        }
    else:
        cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE status = 'Borrowed'")
        borrowed_books = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
        total_students = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM checkouts")
        total_checkouts = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE status = 'Returned'")
        total_returns = cursor.fetchone()['count']
        stats = {
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': borrowed_books,
            'total_students': total_students,
            'total_checkouts': total_checkouts,
            'total_returns': total_returns
        }

    # Initial AI recommendations
    recommendations = get_ai_recommendations(session.get('user_id'), 'Artificial Intelligence')
    conn.close()

    return render_template('index.html', stats=stats, recommendations=recommendations)

def verify_user_password(user, password):
    stored_hash = user['password']

    # 1. Standard Werkzeug hash check
    try:
        if check_password_hash(stored_hash, password):
            return True
    except Exception:
        pass

    # 2. Legacy mock string fallback: pbkdf2:sha256:600000$<sha256>
    import hashlib
    raw_sha = hashlib.sha256(password.encode('utf-8')).hexdigest()
    if stored_hash == f"pbkdf2:sha256:600000${raw_sha}" or stored_hash == raw_sha or stored_hash == password:
        # Auto-upgrade to modern Werkzeug hash
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET password = ? WHERE id = ?", (generate_password_hash(password), user['id']))
            conn.commit()
            conn.close()
        except Exception:
            pass
        return True

    return False

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email'].strip().lower()
        password = request.form['password']
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if user and verify_user_password(user, password):
            session['user_id'] = user['id']
            session['name'] = user['name']
            session['email'] = user['email']
            session['role'] = user['role']
            flash(f"Welcome, {user['name']}!", 'success')
            if user['role'] == 'admin':
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password.', 'error')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('login'))

@app.route('/books')
def books():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    query = request.args.get('q', '').strip()
    category = request.args.get('category', 'All')
    sort_by = request.args.get('sort_by', '')
    is_quick_sorted = False

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books")
    raw_books = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Search filter
    filtered = []
    for b in raw_books:
        matches_q = (not query or 
                     query.lower() in b['title'].lower() or 
                     query.lower() in b['author'].lower() or 
                     query.lower() in b['category'].lower() or 
                     query.lower() in b['isbn'].lower())
        matches_cat = (category == 'All' or b['category'].lower() == category.lower())
        if matches_q and matches_cat:
            filtered.append(b)

    # Manual Quick Sort
    if sort_by in ['title', 'author', 'year', 'category']:
        filtered = manual_quick_sort(filtered, sort_by)
        is_quick_sorted = True

    return render_template('books.html', books=filtered, query=query, category=category, sort_by=sort_by, is_quick_sorted=is_quick_sorted)

@app.route('/borrow/<int:book_id>', methods=['POST'])
def borrow(book_id):
    if 'user_id' not in session or session.get('role') != 'student':
        flash('Access Denied. Only students can borrow books.', 'error')
        return redirect(url_for('books'))

    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    book = cursor.fetchone()
    
    if not book or book['available_quantity'] <= 0:
        conn.close()
        flash('Book is unavailable for borrowing.', 'error')
        return redirect(url_for('books'))

    # Check already borrowed
    cursor.execute("SELECT * FROM checkouts WHERE student_id = ? AND book_id = ? AND status = 'Borrowed'", (session['user_id'], book_id))
    if cursor.fetchone():
        conn.close()
        flash('You have already borrowed a copy of this book.', 'error')
        return redirect(url_for('borrowed'))

    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute("""
        INSERT INTO checkouts (student_id, book_id, checkout_date, return_date, status)
        VALUES (?, ?, ?, NULL, 'Borrowed')
    """, (session['user_id'], book_id, today))
    
    cursor.execute("UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()

    flash(f"Book '{book['title']}' borrowed successfully.", 'success')
    return redirect(url_for('borrowed'))

@app.route('/return/<int:checkout_id>', methods=['POST'])
def return_book(checkout_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM checkouts WHERE id = ?", (checkout_id,))
    checkout = cursor.fetchone()

    if not checkout or checkout['status'] == 'Returned':
        conn.close()
        flash('Book already returned or record not found.', 'error')
        return redirect(url_for('borrowed'))

    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute("UPDATE checkouts SET return_date = ?, status = 'Returned' WHERE id = ?", (today, checkout_id))
    cursor.execute("UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?", (checkout['book_id'],))
    conn.commit()
    conn.close()

    flash('Book returned successfully.', 'success')
    return redirect(url_for('borrowed'))

@app.route('/borrowed')
def borrowed():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    conn = get_db()
    cursor = conn.cursor()
    if session.get('role') == 'admin':
        cursor.execute("""
            SELECT c.*, u.name as student_name, u.email as student_email, b.title as book_title, b.author as book_author, b.category as book_category
            FROM checkouts c
            JOIN users u ON c.student_id = u.id
            JOIN books b ON c.book_id = b.id
            ORDER BY c.id DESC
        """)
    else:
        cursor.execute("""
            SELECT c.*, b.title as book_title, b.author as book_author, b.category as book_category
            FROM checkouts c
            JOIN books b ON c.book_id = b.id
            WHERE c.student_id = ?
            ORDER BY c.id DESC
        """, (session['user_id'],))
        
    records = cursor.fetchall()
    conn.close()
    return render_template('borrowed.html', checkouts=records)

@app.route('/admin')
def admin_dashboard():
    if session.get('role') != 'admin':
        flash('Access Denied', 'error')
        return redirect(url_for('home'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books")
    books = cursor.fetchall()
    cursor.execute("SELECT * FROM users WHERE role = 'student'")
    students = cursor.fetchall()
    cursor.execute("""
        SELECT c.*, u.name as student_name, u.email as student_email, b.title as book_title
        FROM checkouts c
        JOIN users u ON c.student_id = u.id
        JOIN books b ON c.book_id = b.id
        ORDER BY c.id DESC
    """)
    checkouts = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) as count FROM books")
    total_books = cursor.fetchone()['count']
    cursor.execute("SELECT SUM(available_quantity) as count FROM books")
    available_books = cursor.fetchone()['count'] or 0
    cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE status = 'Borrowed'")
    borrowed_books = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
    total_students = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM checkouts")
    total_checkouts = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE status = 'Returned'")
    total_returns = cursor.fetchone()['count']

    stats = {
        'total_books': total_books,
        'available_books': available_books,
        'borrowed_books': borrowed_books,
        'total_students': total_students,
        'total_checkouts': total_checkouts,
        'total_returns': total_returns
    }

    conn.close()
    return render_template('admin.html', stats=stats, books=books, students=students, checkouts=checkouts)

@app.route('/admin/add-book', methods=['GET', 'POST'])
def add_book():
    if session.get('role') != 'admin':
        flash('Access Denied', 'error')
        return redirect(url_for('home'))

    if request.method == 'POST':
        title = request.form['title'].strip()
        author = request.form['author'].strip()
        category = request.form['category'].strip()
        isbn = request.form['isbn'].strip()
        year = int(request.form['year'])
        quantity = int(request.form['quantity'])

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO books (title, author, category, isbn, year, quantity, available_quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (title, author, category, isbn, year, quantity, quantity))
        conn.commit()
        conn.close()
        flash(f"Book '{title}' added successfully.", 'success')
        return redirect(url_for('admin_dashboard'))

    return render_template('add_book.html')

@app.route('/admin/delete-book/<int:book_id>', methods=['POST'])
def delete_book(book_id):
    if session.get('role') != 'admin':
        flash('Access Denied', 'error')
        return redirect(url_for('home'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()
    flash('Book deleted successfully.', 'info')
    return redirect(url_for('admin_dashboard'))

@app.route('/recommendations')
def recommendations():
    category = request.args.get('category', 'Artificial Intelligence')
    student_id = session.get('user_id')
    recs = get_ai_recommendations(student_id, category)
    clean_recs = [{'book': r['book'], 'reason': r['reason']} for r in recs]
    return jsonify(clean_recs)

@app.route('/api/lookup-book')
def lookup_book():
    """
    100% Free Public Open Library API endpoint.
    Runs locally on user's PC with NO API key or external credentials required.
    """
    isbn = request.args.get('isbn', '').strip().replace('-', '')
    if not isbn:
        return jsonify({'error': 'Please provide an ISBN'}), 400

    try:
        url = f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data"
        req = urllib.request.Request(url, headers={'User-Agent': 'CampusLibrarySystem/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            key = f"ISBN:{isbn}"
            if key in data:
                b = data[key]
                title = b.get('title', '')
                authors = [a.get('name') for a in b.get('authors', [])]
                author = authors[0] if authors else 'Unknown'
                publish_date = b.get('publish_date', '')
                match = re.search(r'\d{4}', publish_date)
                year = int(match.group(0)) if match else 2022
                
                # Category inference
                subjects = [s.get('name', '').lower() for s in b.get('subjects', [])]
                subj_text = ' '.join(subjects)
                category = 'Programming'
                if any(k in subj_text for k in ['intelligence', 'neural', 'machine']):
                    category = 'Artificial Intelligence'
                elif any(k in subj_text for k in ['data', 'analytics']):
                    category = 'Data Science'
                elif any(k in subj_text for k in ['database', 'sql']):
                    category = 'Database'
                elif any(k in subj_text for k in ['network']):
                    category = 'Networks'
                elif any(k in subj_text for k in ['system', 'operating', 'linux']):
                    category = 'Operating Systems'

                return jsonify({
                    'success': True,
                    'title': title,
                    'author': author,
                    'year': year,
                    'isbn': isbn,
                    'category': category
                })
            else:
                return jsonify({'error': 'Book not found in Open Library database'}), 404
    except Exception as e:
        return jsonify({'error': f'Lookup failed: {str(e)}'}), 500

@app.route('/api/books', methods=['GET'])
def api_books():
    """
    JSON API endpoint returning books catalog.
    Supports query parameter filtering (q, category) and manual QuickSort (sort_by).
    """
    query = request.args.get('q', '').strip()
    category = request.args.get('category', 'All')
    sort_by = request.args.get('sort_by', '')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books")
    raw_books = [dict(row) for row in cursor.fetchall()]
    conn.close()

    filtered = []
    for b in raw_books:
        matches_q = (not query or 
                     query.lower() in b['title'].lower() or 
                     query.lower() in b['author'].lower() or 
                     query.lower() in b['category'].lower() or 
                     query.lower() in b['isbn'].lower())
        matches_cat = (category == 'All' or b['category'].lower() == category.lower())
        if matches_q and matches_cat:
            filtered.append(b)

    if sort_by in ['title', 'author', 'year', 'category']:
        filtered = manual_quick_sort(filtered, sort_by)

    return jsonify({'success': True, 'books': filtered, 'total': len(filtered)})

@app.route('/api/search-openlibrary', methods=['GET'])
def api_search_openlibrary():
    """
    100% Free Open Library REST Search API endpoint.
    Searches public books catalog by keyword with zero API key requirement.
    """
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'success': True, 'books': []})

    try:
        url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(q)}&limit=6"
        req = urllib.request.Request(url, headers={'User-Agent': 'CampusLibrarySystem/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            docs = data.get('docs', [])
            books = []
            for doc in docs:
                books.append({
                    'title': doc.get('title', 'Untitled'),
                    'author': doc.get('author_name', ['Unknown'])[0] if doc.get('author_name') else 'Unknown',
                    'year': doc.get('first_publish_year', 2022),
                    'isbn': doc.get('isbn', ['9780000000000'])[0] if doc.get('isbn') else 'N/A'
                })
            return jsonify({'success': True, 'books': books})
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Returns library statistics as JSON."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM books")
    total_books = cursor.fetchone()['count']
    cursor.execute("SELECT SUM(available_quantity) as count FROM books")
    available_books = cursor.fetchone()['count'] or 0
    cursor.execute("SELECT COUNT(*) as count FROM checkouts WHERE status = 'Borrowed'")
    borrowed_books = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
    total_students = cursor.fetchone()['count']
    conn.close()

    return jsonify({
        'total_books': total_books,
        'available_books': available_books,
        'borrowed_books': borrowed_books,
        'total_students': total_students
    })

if __name__ == '__main__':
    # Auto-initialize database if not present
    if not os.path.exists(DATABASE):
        import init_db
    app.run(debug=True, port=5000)
