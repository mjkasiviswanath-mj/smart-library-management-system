/**
 * Free Open Library API Service
 * 
 * 100% Free Public REST API provided by the Internet Archive.
 * - No API key required
 * - No account or credit card needed
 * - Runs directly on any PC or browser
 * - API documentation: https://openlibrary.org/developers/api
 */

export interface OpenLibraryBook {
  title: string;
  author: string;
  year: number;
  isbn: string;
  category: string;
}

/**
 * Fetch book metadata by ISBN using the free Open Library API.
 */
export async function lookupBookByIsbn(isbn: string): Promise<OpenLibraryBook | null> {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').trim();
  if (!cleanIsbn) return null;

  // 1. First attempt to communicate through backend server via proxy
  try {
    const serverRes = await fetch(`/api/lookup-book?isbn=${encodeURIComponent(cleanIsbn)}`);
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success) {
        return {
          title: serverData.title,
          author: serverData.author,
          year: serverData.year,
          isbn: serverData.isbn,
          category: serverData.category || 'Programming'
        };
      }
    }
  } catch {
    // If backend server is not running, proceed to direct Open Library API
  }

  // 2. Direct free Open Library REST API fallback
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const key = `ISBN:${cleanIsbn}`;
    const bookData = data[key];

    if (!bookData) return null;

    const title = bookData.title || '';
    const author = bookData.authors && bookData.authors.length > 0 
      ? bookData.authors[0].name 
      : 'Unknown Author';
    
    // Extract publish year
    let year = 2020;
    if (bookData.publish_date) {
      const match = bookData.publish_date.match(/\d{4}/);
      if (match) {
        year = parseInt(match[0], 10);
      }
    }

    // Infer category from subjects
    let category = 'Programming';
    if (bookData.subjects && Array.isArray(bookData.subjects)) {
      const subjectsStr = bookData.subjects.map((s: { name?: string }) => s.name || '').join(' ').toLowerCase();
      if (subjectsStr.includes('intelligence') || subjectsStr.includes('neural') || subjectsStr.includes('ai')) {
        category = 'Artificial Intelligence';
      } else if (subjectsStr.includes('data') || subjectsStr.includes('analytics')) {
        category = 'Data Science';
      } else if (subjectsStr.includes('database') || subjectsStr.includes('sql')) {
        category = 'Database';
      } else if (subjectsStr.includes('network') || subjectsStr.includes('cyber')) {
        category = 'Networks';
      } else if (subjectsStr.includes('system') || subjectsStr.includes('os') || subjectsStr.includes('linux')) {
        category = 'Operating Systems';
      } else {
        category = 'Programming';
      }
    }

    return {
      title,
      author,
      year,
      isbn: cleanIsbn,
      category,
    };
  } catch (err) {
    console.warn('Open Library API lookup error:', err);
    return null;
  }
}

/**
 * Search books by keyword using the free Open Library search API.
 */
export async function searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  if (!query.trim()) return [];

  // 1. First attempt to search through backend server via proxy
  try {
    const serverRes = await fetch(`/api/search-openlibrary?q=${encodeURIComponent(query)}`);
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success && Array.isArray(serverData.books) && serverData.books.length > 0) {
        return serverData.books.map((b: { title?: string; author?: string; year?: number; isbn?: string }) => ({
          title: b.title || 'Untitled',
          author: b.author || 'Unknown',
          year: b.year || 2022,
          isbn: b.isbn || 'N/A',
          category: 'Programming',
        }));
      }
    }
  } catch {
    // If backend server is not running, proceed to direct Open Library API
  }

  // 2. Direct free Open Library search fallback
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    return data.docs.map((doc: {
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      isbn?: string[];
      subject?: string[];
    }) => {
      const title = doc.title || 'Untitled';
      const author = doc.author_name && doc.author_name.length > 0 ? doc.author_name[0] : 'Unknown';
      const year = doc.first_publish_year || 2022;
      const isbn = doc.isbn && doc.isbn.length > 0 ? doc.isbn[0] : '9780000000000';

      const subjectsStr = (doc.subject || []).join(' ').toLowerCase();
      let category = 'Programming';
      if (subjectsStr.includes('intelligence') || subjectsStr.includes('learning')) {
        category = 'Artificial Intelligence';
      } else if (subjectsStr.includes('database') || subjectsStr.includes('sql')) {
        category = 'Database';
      } else if (subjectsStr.includes('network')) {
        category = 'Networks';
      } else if (subjectsStr.includes('data')) {
        category = 'Data Science';
      }

      return {
        title,
        author,
        year,
        isbn,
        category,
      };
    });
  } catch (err) {
    console.warn('Open Library search error:', err);
    return [];
  }
}
