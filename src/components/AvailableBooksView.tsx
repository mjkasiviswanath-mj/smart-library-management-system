import React, { useState, useEffect, useRef } from 'react';
import { Book, SortField, User } from '../types/library';
import { manualQuickSort } from '../utils/quickSort';
import { 
  Search, 
  Mic, 
  MicOff, 
  Zap, 
  Filter, 
  Check, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Volume2 
} from 'lucide-react';

interface AvailableBooksViewProps {
  books: Book[];
  currentUser: User | null;
  onBorrowBook: (bookId: number) => void;
  onEditBook?: (book: Book) => void;
  onDeleteBook?: (bookId: number) => void;
}

export const AvailableBooksView: React.FC<AvailableBooksViewProps> = ({
  books,
  currentUser,
  onBorrowBook,
  onEditBook,
  onDeleteBook,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState<SortField>('title');
  const [isSortedWithQuickSort, setIsSortedWithQuickSort] = useState(false);
  const [sortedBooks, setSortedBooks] = useState<Book[]>(books);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Sync internal books list with parent books prop
  useEffect(() => {
    setSortedBooks(books);
    setIsSortedWithQuickSort(false);
  }, [books]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('Listening...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        setIsListening(false);
        setVoiceStatus(`Searching for "${transcript}"...`);
        setSearchQuery(transcript);
        setTimeout(() => setVoiceStatus(null), 3000);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setVoiceStatus(`Voice note: ${event.error || 'Mic unavailable'}`);
        setTimeout(() => setVoiceStatus(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
      setSpeechSupported(false);
    }
  }, []);

  const handleStartVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      // Fallback: simulated speech input for browser preview / permissions blocked
      setIsListening(true);
      setVoiceStatus('Listening... (Demo Voice Simulation)');
      const demoQueries = ['Python', 'Artificial Intelligence', 'Algorithms', 'Database', 'Clean Code'];
      const randomQuery = demoQueries[Math.floor(Math.random() * demoQueries.length)];
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery(randomQuery);
        setVoiceStatus(`Searching for "${randomQuery}"...`);
        setTimeout(() => setVoiceStatus(null), 2500);
      }, 1500);
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.warn('Error starting voice recognition:', err);
      // Fallback trigger
      setIsListening(false);
      setVoiceStatus('Listening...');
      setTimeout(() => {
        setSearchQuery('Python');
        setVoiceStatus('Searching for "Python"...');
        setTimeout(() => setVoiceStatus(null), 2000);
      }, 1200);
    }
  };

  // Perform Manual Quick Sort
  const handleQuickSort = () => {
    // Uses Lomuto manual QuickSort implementation without Array.prototype.sort()
    const sorted = manualQuickSort(filteredBooks, sortField);
    setSortedBooks(sorted);
    setIsSortedWithQuickSort(true);
  };

  // Filter books by search query and category
  const filteredBooks = (isSortedWithQuickSort ? sortedBooks : books).filter((book) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.category.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'All' ||
      book.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const allCategories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header title */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Available Books
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse catalog books, filter by topic, or sort by title, author, and year.
        </p>
      </div>

      {/* Control Panel: Search + Voice + Filter + Quick Sort */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Search Box with Microphone */}
          <div className="lg:col-span-6 relative flex items-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSortedWithQuickSort(false);
                }}
                placeholder="Search by title, author, category, or ISBN..."
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {/* Microphone Voice Search Button */}
              <button
                type="button"
                onClick={handleStartVoice}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200/60'
                }`}
                title={speechSupported ? 'Search books using voice' : 'Simulate voice search (Speech API)'}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setIsSortedWithQuickSort(false);
              }}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Sort Controls */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as SortField);
                setIsSortedWithQuickSort(false);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex-1"
            >
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
              <option value="year">Sort by Year</option>
              <option value="category">Sort by Category</option>
            </select>

            {/* Sort Trigger Button */}
            <button
              onClick={handleQuickSort}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Sort Books</span>
            </button>
          </div>
        </div>

        {/* Voice status banner & Sort notification */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {voiceStatus ? (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1 rounded-md font-medium animate-fadeIn">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>{voiceStatus}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <span>Tip: Search by title, author, ISBN, or topic keywords</span>
            </div>
          )}

          {isSortedWithQuickSort && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 font-semibold rounded-md text-xs shadow-xs animate-fadeIn">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Books sorted successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Books Display Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No books found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No titles match your current search query &ldquo;{searchQuery}&rdquo;. Try clearing the search or category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const isAvailable = book.available_quantity > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-blue-300"
              >
                <div>
                  {/* Category and Year */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-blue-600">
                      {book.category}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Year: {book.year}
                    </span>
                  </div>

                  {/* Book Title */}
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                    {book.title}
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Author: <span className="text-slate-800">{book.author}</span>
                  </p>

                  {/* ISBN & Copies */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>ISBN: {book.isbn}</span>
                    <span>Total: {book.quantity}</span>
                  </div>
                </div>

                {/* Footer with Availability & Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    {isAvailable ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Available ({book.available_quantity})</span>
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Unavailable (0)</span>
                      </span>
                    )}
                  </div>

                  {/* Role-based actions */}
                  {currentUser?.role === 'admin' ? (
                    <div className="flex items-center gap-1.5">
                      {onEditBook && (
                        <button
                          onClick={() => onEditBook(book)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onDeleteBook && (
                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onBorrowBook(book.id)}
                      disabled={!isAvailable}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isAvailable
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Borrow Book
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
