'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function SearchPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPages, setManualPages] = useState<{ [key: string]: number }>({});
  const [showManualInput, setShowManualInput] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!query) return;

    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/openlibrary/search.json?q=${encodeURIComponent(query)}&limit=10`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Search API response:', data);
        if (data.docs) {
          const detailedResults = await Promise.all(data.docs.map(async (doc: any) => {
            let total_pages = 0;
            try {
              if (doc.cover_edition_key) {
                // Try works endpoint first
                const workResponse = await fetch(`/api/openlibrary/works/${doc.cover_edition_key}.json`, { redirect: 'follow' });
                if (workResponse.ok) {
                  const workData = await workResponse.json();
                  total_pages = workData.number_of_pages || 0;
                  // Check for edition key if work data lacks pages
                  if (!total_pages && workData.edition_key) {
                    const editionKey = Object.values(workData.edition_key)[0];
                    const editionResponse = await fetch(`/api/openlibrary/books/${editionKey}.json`, { redirect: 'follow' });
                    if (editionResponse.ok) {
                      const editionData = await editionResponse.json();
                      total_pages = editionData.number_of_pages || 0;
                    }
                  }
                } else {
                  // Fallback to books endpoint if works fails
                  const editionResponse = await fetch(`/api/openlibrary/books/${doc.cover_edition_key}.json`, { redirect: 'follow' });
                  if (editionResponse.ok) {
                    const editionData = await editionResponse.json();
                    total_pages = editionData.number_of_pages || 0;
                  }
                }
              }
              // Fallback to Google Books with ISBN if still no pages
              if (doc.isbn?.[0] && total_pages === 0) {
                const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${doc.isbn[0]}&key={YOUR_API_KEY}`);
                const googleData = await googleResponse.json();
                total_pages = googleData.items?.[0]?.volumeInfo?.pageCount || 0;
                console.log('Google Books API response for', doc.title, ':', googleData);
              }
            } catch (fetchErr) {
              console.warn(`Fetch error for ${doc.title}, skipping page count:`, fetchErr);
            }
            return {
              title: doc.title,
              author: doc.author_name?.[0] || 'Unknown Author',
              isbn: doc.isbn?.[0],
              cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
              total_pages: total_pages,
            };
          }));
          setResults(detailedResults);
        } else {
          setResults([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to fetch books from Open Library: ${errorMessage}`);
        console.error('Fetch error:', err);
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchBooks, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  const addBook = async (book: any) => {
    if (!session?.user) {
      setError('Please log in to add books.');
      return;
    }

    // Use manual pages if available, otherwise use API pages
    const finalPages = manualPages[book.title] || book.total_pages || 0;

    const { error } = await supabase
      .from('books')
      .insert({
        id: crypto.randomUUID(),
        title: book.title,
        author: book.author,
        user_id: session.user.id,
        cover_image: book.cover,
        total_pages: finalPages,
        isbn: book.isbn,
      });

    if (error) {
      setError(`Failed to add book: ${error.message}`);
    } else {
      setError('Book added successfully!');
      setTimeout(() => setError(null), 2000);
      // Clear manual input after successful addition
      setManualPages(prev => ({ ...prev, [book.title]: undefined }));
      setShowManualInput(prev => ({ ...prev, [book.title]: false }));
    }
  };

  const handleManualPagesChange = (bookTitle: string, pages: string) => {
    const numPages = parseInt(pages) || 0;
    setManualPages(prev => ({ ...prev, [bookTitle]: numPages }));
  };

  const toggleManualInput = (bookTitle: string) => {
    setShowManualInput(prev => ({ ...prev, [bookTitle]: !prev[bookTitle] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Books</h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter book title or author..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {loading && <p className="mt-4 text-gray-600">Loading...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((book, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {book.cover ? (
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={book.cover} alt={`Cover of ${book.title}`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No cover image</p>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{book.title}</h2>
                <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                {book.isbn && <p className="text-gray-500 text-xs">ISBN: {book.isbn}</p>}
                {book.total_pages > 0 && <p className="text-gray-500 text-xs">Pages: {book.total_pages}</p>}
                {book.total_pages === 0 && (
                  <div className="mt-2">
                    {showManualInput[book.title] ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Enter pages"
                          value={manualPages[book.title] || ''}
                          onChange={(e) => handleManualPagesChange(book.title, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          min="1"
                        />
                        <button
                          onClick={() => toggleManualInput(book.title)}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleManualInput(book.title)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Add page count manually
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => addBook(book)}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}