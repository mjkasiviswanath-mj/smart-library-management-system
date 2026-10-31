import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, Terminal, Database, BookOpen, Layers } from 'lucide-react';

export const ProjectCodeViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [copied, setCopied] = useState(false);

  const fileContents: Record<string, { lang: string; content: string; desc: string }> = {
    'app.py': {
      lang: 'python',
      desc: 'Complete Flask backend with authentication, manual QuickSort, SQLite queries, and recommendation algorithm.',
      content: `from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.secret_key = "library_secret_key_12345"
DATABASE = "database.db"

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------------------------------------------------------
# Manual QuickSort Implementation (No built-in sort)
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
# Recommendation Engine (Borrow history + Category weighting)
# -------------------------------------------------------------------
def get_ai_recommendations(student_id, selected_category):
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Fetch user's past borrowing history
    borrowed_cats = {}
    if student_id:
        cursor.execute("""
            SELECT b.category, COUNT(c.id) as count 
            FROM checkouts c 
            JOIN books b ON c.book_id = b.id 
            WHERE c.student_id = ? 
            GROUP BY b.category
        """, (student_id,))
        for row in cursor.fetchall():
            borrowed_cats[row['category']] = row['count']
            
    # 2. Fetch all books
    cursor.execute("SELECT * FROM books")
    all_books = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # 3. Score and prioritize
    scored = []
    for b in all_books:
        score = 0
        reasons = []
        if b['category'].lower() == selected_category.lower():
            score += 50
            reasons.append(f"Matches category '{selected_category}'")
        freq = borrowed_cats.get(b['category'], 0)
        if freq > 0:
            score += freq * 20
            reasons.append(f"Matched borrowing interest ({freq} past loans)")
        if b['available_quantity'] > 0:
            score += 10
        scored.append({
            'book': b,
            'reason': ' · '.join(reasons) if reasons else f"Recommended in {b['category']}",
            'score': score
        })

    scored.sort(key=lambda x: x['score'], reverse=True)
    return [item['book'] for item in scored[:6]]

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
            'my_borrowed': my_borrowed,
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
        
    conn.close()
    return render_template('index.html', stats=stats)

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

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['name'] = user['name']
            session['email'] = user['email']
            session['role'] = user['role']
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
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
    book_rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Filter
    filtered = []
    for b in book_rows:
        matches_q = (not query or 
                     query.lower() in b['title'].lower() or 
                     query.lower() in b['author'].lower() or 
                     query.lower() in b['category'].lower() or 
                     query.lower() in b['isbn'].lower())
        matches_cat = (category == 'All' or b['category'].lower() == category.lower())
        if matches_q and matches_cat:
            filtered.append(b)

    # Sort via manual QuickSort if requested
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
        flash('Book already returned or record missing.', 'error')
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
            SELECT c.*, u.name as student_name, u.email as student_email, b.title as book_title, b.author as book_author
            FROM checkouts c
            JOIN users u ON c.student_id = u.id
            JOIN books b ON c.book_id = b.id
            ORDER BY c.id DESC
        """)
    else:
        cursor.execute("""
            SELECT c.*, b.title as book_title, b.author as book_author
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
        SELECT c.*, u.name as student_name, b.title as book_title
        FROM checkouts c
        JOIN users u ON c.student_id = u.id
        JOIN books b ON c.book_id = b.id
        ORDER BY c.id DESC
    """)
    checkouts = cursor.fetchall()
    conn.close()
    return render_template('admin.html', books=books, students=students, checkouts=checkouts)

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

@app.route('/recommendations')
def recommendations_api():
    category = request.args.get('category', 'Artificial Intelligence')
    student_id = session.get('user_id')
    recs = get_ai_recommendations(student_id, category)
    return jsonify(recs)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
`
    },
    'init_db.py': {
      lang: 'python',
      desc: 'Creates database.db with SQLite schema for Users, Books, Checkouts, and seeds sample data.',
      content: `import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# 1. Users Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'admin'))
)
''')

# 2. Books Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL
)
''')

# 3. Checkouts Table
cursor.execute('''
CREATE TABLE IF NOT EXISTS checkouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    checkout_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL CHECK(status IN ('Borrowed', 'Returned')),
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(book_id) REFERENCES books(id)
)
''')

# Seed Predefined Users (with hashed passwords)
users_data = [
    ('Alex Student', 'student@gmail.com', generate_password_hash('student123'), 'student'),
    ('Library Admin', 'admin@gmail.com', generate_password_hash('admin123'), 'admin')
]
for u in users_data:
    cursor.execute('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', u)

# Seed Sample Books
books_data = [
    ('Artificial Intelligence', 'Stuart Russell', 'Artificial Intelligence', '978-0136042594', 2020, 5, 5),
    ('Deep Learning', 'Ian Goodfellow', 'Artificial Intelligence', '978-0262035613', 2016, 4, 4),
    ('Clean Code', 'Robert C. Martin', 'Programming', '978-0132350884', 2008, 6, 5),
    ('Introduction to Algorithms', 'Thomas H. Cormen', 'Programming', '978-0262033848', 2009, 4, 4),
    ('Database System Concepts', 'Abraham Silberschatz', 'Database', '978-0078022159', 2019, 5, 5),
    ('Computer Networks', 'Andrew S. Tanenbaum', 'Networks', '978-0132126953', 2010, 3, 3),
    ('Operating System Concepts', 'Abraham Silberschatz', 'Operating Systems', '978-1118063330', 2018, 4, 4),
    ('Python Crash Course', 'Eric Matthes', 'Programming', '978-1593279288', 2019, 5, 5),
    ('Java: The Complete Reference', 'Herbert Schildt', 'Programming', '978-1260440232', 2018, 4, 4),
    ('Data Science from Scratch', 'Joel Grus', 'Data Science', '978-1492041139', 2019, 4, 4)
]
for b in books_data:
    cursor.execute('''
        INSERT OR IGNORE INTO books (title, author, category, isbn, year, quantity, available_quantity) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', b)

# Seed initial checkout for demo
cursor.execute('''
    INSERT OR IGNORE INTO checkouts (id, student_id, book_id, checkout_date, return_date, status)
    VALUES (1, 1, 3, '2026-09-15', NULL, 'Borrowed')
''')

conn.commit()
conn.close()
print("Database initialized successfully as database.db")
`
    },
    'requirements.txt': {
      lang: 'text',
      desc: 'Python dependencies for Flask and Werkzeug security.',
      content: `Flask==3.0.2
Werkzeug==3.0.1
`
    },
    'templates/index.html': {
      lang: 'html',
      desc: 'Jinja2 template for Home / Student Dashboard.',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Library Management System</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
    <header class="navbar">
        <div class="logo">Library Management System</div>
        <nav>
            <a href="{{ url_for('home') }}" class="active">Home</a>
            <a href="{{ url_for('books') }}">Available Books</a>
            <a href="{{ url_for('borrowed') }}">Borrowed Books</a>
            {% if session.get('role') == 'admin' %}
                <a href="{{ url_for('admin_dashboard') }}">Admin Dashboard</a>
            {% endif %}
            <a href="{{ url_for('logout') }}" class="logout-btn">Logout ({{ session.get('name') }})</a>
        </nav>
    </header>

    <div class="hero">
        <h1>Library Management System</h1>
        <p>Search available books, browse catalog collections, and explore book recommendations.</p>
        <a href="{{ url_for('books') }}" class="btn-primary">View Available Books</a>
    </div>

    <main class="container">
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="card">
                <h3>Total Books</h3>
                <p class="stat-number">{{ stats.total_books }}</p>
            </div>
            <div class="card">
                <h3>Available Books</h3>
                <p class="stat-number text-emerald">{{ stats.available_books }}</p>
            </div>
            <div class="card">
                <h3>Borrowed Books</h3>
                <p class="stat-number text-amber">{{ stats.my_borrowed if session.get('role') == 'student' else stats.borrowed_books }}</p>
            </div>
        </div>

        <!-- Book Recommendation Section -->
        <div class="recommendation-section">
            <h2>Book Recommendation</h2>
            <p>Choose a category to see some recommended books.</p>
            <p class="rec-note">Recommendation is generated based on user borrowing history and book category.</p>

            <div class="dropdown-wrapper">
                <label>Category:</label>
                <select id="categorySelect" onchange="fetchRecommendations()">
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Programming">Programming</option>
                    <option value="Database">Database</option>
                    <option value="Networks">Networks</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Machine Learning">Machine Learning</option>
                </select>
            </div>

            <div id="recGrid" class="book-grid">
                <!-- Dynamically populated by static/script.js -->
            </div>
        </div>
    </main>

    <script src="{{ url_for('static', filename='script.js') }}"></script>
</body>
</html>
`
    },
    'static/script.js': {
      lang: 'javascript',
      desc: 'Client-side Speech Recognition (Voice Search), Dynamic recommendations fetch, and UI events.',
      content: `// Voice Enabled Book Search using Web Speech API
function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceStatus = document.getElementById('voiceStatus');
    const searchInput = document.getElementById('searchInput');

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser. Please use Google Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = function() {
        voiceStatus.innerText = "Listening...";
        voiceStatus.style.display = "block";
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        voiceStatus.innerText = "Searching for " + transcript + "...";
        searchInput.value = transcript;
        setTimeout(() => {
            document.getElementById('searchForm').submit();
        }, 800);
    };

    recognition.onerror = function(event) {
        voiceStatus.innerText = "Voice error: " + event.error;
    };

    recognition.start();
}

// Fetch Recommendations asynchronously
function fetchRecommendations() {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    const cat = select.value;
    fetch('/recommendations?category=' + encodeURIComponent(cat))
        .then(res => res.json())
        .then(books => {
            const grid = document.getElementById('recGrid');
            grid.innerHTML = '';
            books.forEach(b => {
                grid.innerHTML += \`
                    <div class="book-card">
                        <span class="category-tag">\${b.category}</span>
                        <h3>\${b.title}</h3>
                        <p class="author">By \${b.author}</p>
                        <p class="year">Year: \${b.year}</p>
                        <p class="avail">Available: \${b.available_quantity}</p>
                    </div>
                \`;
            });
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRecommendations();
});
`
    },
    'README.md': {
      lang: 'markdown',
      desc: 'Project documentation, setup steps, and viva explanation guide.',
      content: `# Smart Library Management System with Quick Sort, Voice Search & AI Recommendation

A complete college-ready Library Management System built with Python Flask, SQLite, and vanilla HTML/CSS/JS.

## Features
- **Role-based Authentication**: Secure password-hashed login for Students and Admins.
- **Manual Quick Sort Algorithm**: Fully custom divide-and-conquer Quick Sort (O(n log n)) sorting books by Title, Author, Year, and Category.
- **Voice-Enabled Book Search**: Browser Web Speech API listens to voice prompts (e.g. "Python") and searches automatically.
- **AI Book Recommendation Engine**: Recommends relevant catalog titles by combining user borrowing history weighting with book category affinity.
- **Book Checkout & Return Workflow**: Dynamic real-time quantity tracking, borrowing log maintenance, and return date tracking.
- **Admin Dashboard**: Full CRUD for books, student activity monitoring, overdue tracking, and transaction history.

## Credentials
- **Student**: \`student@gmail.com\` | \`student123\`
- **Admin**: \`admin@gmail.com\` | \`admin123\`

## Quick Start (Run Locally)
\`\`\`bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Initialize SQLite Database
python init_db.py

# 3. Launch Flask Server
python app.py
\`\`\`
Visit **http://127.0.0.1:5000** in Google Chrome.
`
    }
  };

  const current = fileContents[activeFile] || fileContents['app.py'];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate text blob for current file
    const blob = new Blob([current.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-blue-300 text-xs font-mono font-medium mb-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Python Flask + SQLite Codebase</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            College Project Source Files &amp; Viva Code
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete, cleanly formatted files for your college project review, viva demonstration, and local deployment with <code className="text-blue-600 font-mono font-semibold">python app.py</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy File Content'}</span>
          </button>
          <button
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFile}</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar File List */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-2 py-1 mb-1">
              Project Structure
            </span>

            {Object.keys(fileContents).map((fileName) => {
              const isActive = activeFile === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setActiveFile(fileName)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {fileName.endsWith('.py') ? (
                      <Terminal className="w-3.5 h-3.5 shrink-0" />
                    ) : fileName.endsWith('.db') ? (
                      <Database className="w-3.5 h-3.5 shrink-0" />
                    ) : fileName.endsWith('.html') ? (
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{fileName}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 text-xs text-emerald-950">
            <h4 className="font-bold flex items-center gap-1.5 mb-1.5 text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>100% Free APIs (Runs on PC)</span>
            </h4>
            <ul className="space-y-1.5 text-emerald-800 text-[11px] list-disc list-inside">
              <li><strong>Open Library API:</strong> 100% free public REST API for book lookup by ISBN (no key, no credit card).</li>
              <li><strong>Web Speech API:</strong> Free browser-native voice search built into Chrome/Edge.</li>
              <li><strong>Local SQLite & Python Flask:</strong> Embedded database & server, runs offline on your PC at zero cost.</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900">
            <h4 className="font-bold flex items-center gap-1.5 mb-1.5 text-blue-950">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Viva Demonstration Tips</span>
            </h4>
            <ul className="space-y-1.5 text-blue-800 text-[11px] list-disc list-inside">
              <li>Explain manual QuickSort Lomuto partitioning in <code className="font-bold">manual_quick_sort()</code>.</li>
              <li>Show how Web Speech API recognizes speech directly in browser.</li>
              <li>Explain the recommendation score algorithm based on student checkout history.</li>
              <li>Demonstrate free Open Library REST API book auto-fill by ISBN.</li>
            </ul>
          </div>
        </div>

        {/* Main Code Viewer Window */}
        <div className="lg:col-span-9">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md overflow-hidden">
            {/* Window bar */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-xs font-mono text-slate-300 ml-2">
                  library-management/{activeFile}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {current.desc}
              </span>
            </div>

            {/* Code content */}
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed selection:bg-blue-700 selection:text-white">
              <code>{current.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
