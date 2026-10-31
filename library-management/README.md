# Smart Library Management System with Quick Sort, Voice Search and AI Book Recommendation

A comprehensive, beginner-friendly Library Management System built with Python Flask, SQLite, and vanilla HTML/CSS/JavaScript.

## Features

0. **100% Free & Local PC Setup (No Paid APIs)**
   - **Zero Cost**: No credit card, no paid API keys, and no cloud subscriptions needed.
   - **Local Server**: Runs locally on your machine via Python Flask at `http://127.0.0.1:5000`.
   - **Local Database**: Embedded SQLite (`database.db`) requires no database installation or setup.
   - **Free External API**: Uses **Open Library REST API** (`https://openlibrary.org/api/books`) for automatic book metadata lookup by ISBN (100% free, public domain, no API key required).
   - **Free Voice API**: Uses browser's native **Web Speech API** built into Google Chrome / Microsoft Edge (zero cost).
   - **Local Recommendation Engine**: Intelligent recommendation algorithm operates directly on your local SQLite checkout records (no expensive AI model or paid token fees).

1. **User Authentication & Role Management**
   - Student and Admin separate dashboards.
   - Secure password hashing using Werkzeug / SHA-256.
   - Pre-configured Demo Accounts:
     - **Student**: `student@gmail.com` / `student123`
     - **Admin**: `admin@gmail.com` / `admin123`

2. **Manual Quick Sort Algorithm (Divide & Conquer)**
   - Custom implementation of Quick Sort (Lomuto partition scheme) without using Python or JavaScript built-in `sort()`.
   - Sort by Title, Author, Year, and Category.
   - Display label: *"Books sorted using Quick Sort"*.

3. **Voice-Enabled Book Search**
   - Web Speech API microphone integration.
   - Visual feedback: *"Listening..."* and *"Searching for [query]..."*.
   - Automatically executes search query on speech input.

4. **AI / Smart Book Recommendation**
   - Prioritizes recommendations based on:
     - Selected category
     - Student's previous borrowing history (category affinity weights)
     - Book popularity and availability.
   - Clear project attribution: *"Recommendation is generated based on user borrowing history and book category."*

5. **Book Borrow / Checkout & Return / Check-in**
   - Checks book availability before checkout.
   - Decrements available quantity by 1.
   - Records checkout date, student ID, book ID, and status ("Borrowed").
   - Returning books increments available quantity and marks loan as "Returned".

6. **Admin Dashboard**
   - Add new books, Edit books, Delete books.
   - Monitor registered student accounts.
   - Complete checkout and check-in audit history.
   - Dynamic real-time statistics cards.

## Project Structure

```text
library-management/
│
├── app.py              # Flask server and routing logic
├── database.db         # SQLite relational database
├── init_db.py          # Database initialization and sample seed
├── requirements.txt    # Python package dependencies
│
├── templates/
│   ├── login.html      # Authentication screen
│   ├── index.html      # Student home dashboard
│   ├── books.html      # Catalog with search, voice, and Quick Sort
│   ├── borrowed.html   # Active loans and return history
│   ├── admin.html      # Admin dashboard and audit log
│   └── add_book.html   # Admin book creation form
│
├── static/
│   ├── style.css       # Clean layout matching original design
│   └── script.js       # Voice recognition and dynamic interactions
│
└── README.md
```

## How to Run Locally

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Initialize SQLite Database
```bash
python init_db.py
```

### Step 3: Run the Flask Application
```bash
python app.py
```

### Step 4: Open in Web Browser
Navigate to:
```
http://127.0.0.1:5000
```
Open in **Google Chrome** to enable the Web Speech API voice search microphone.
