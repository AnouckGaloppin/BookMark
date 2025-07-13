'use client';
  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
import Image from 'next/image';
  import { supabase } from '@/lib/supabase';
  import { useAuth } from '@/lib/auth';
  import { useDispatch } from 'react-redux';
  import { loadProgressFromSupabase } from '@/lib/progressSlice';
  import type { Book, Results } from '@/types';
  // import { RootState } from '@/lib/store';
  // import ProgressUpdater from '@/components/ProgressUpdater';
  import { useCrossTabSync } from '@/lib/useCrossTabSync';
// import { PostgrestError } from '@supabase/supabase-js';
import { toast } from "sonner";

// Define payload types for Realtime
interface BookPayload {
  new: {
    id: string;
    title: string;
    author: string;
    user_id: string;
    cover_image: string | null;
    total_pages: number;
    isbn: string | null;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const { session } = useAuth();
  const dispatch = useDispatch();
  // const progress = useSelector((state: RootState) => state.progress.progress);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results[]>([]);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Enable cross-tab synchronization
  useCrossTabSync();

  // Auto-slide carousel effect
  useEffect(() => {
    if (userBooks.length <= 5 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= userBooks.length - 5) {
          return 0; // Reset to beginning when reaching the end
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [userBooks.length, isPaused]);

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
                const workResponse = await fetch(`/api/openlibrary/works/${doc.cover_edition_key}.json`, { redirect: 'follow' });
                if (workResponse.ok) {
                  const workData = await workResponse.json();
                  total_pages = workData.number_of_pages || 0;
                  if (!total_pages && workData.edition_key) {
                    const editionKey = Object.values(workData.edition_key)[0];
                    const editionResponse = await fetch(`/api/openlibrary/books/${editionKey}.json`, { redirect: 'follow' });
                    if (editionResponse.ok) {
                      const editionData = await editionResponse.json();
                      total_pages = editionData.number_of_pages || 0;
                    }
                  }
                } else {
                  const editionResponse = await fetch(`/api/openlibrary/books/${doc.cover_edition_key}.json`, { redirect: 'follow' });
                  if (editionResponse.ok) {
                    const editionData = await editionResponse.json();
                    total_pages = editionData.number_of_pages || 0;
                  }
                }
              }
              if (doc.isbn?.[0] && total_pages === 0) {
                const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${doc.isbn[0]}&key={YOUR_GOOGLE_API_KEY}`);
                const googleData = await googleResponse.json();
                total_pages = googleData.items?.[0]?.volumeInfo?.pageCount || 0;
              }
              if (doc.isbn?.[0] && total_pages === 0) {
                const worldcatResponse = await fetch(`http://www.worldcat.org/webservices/catalog/content/isbn/${doc.isbn[0]}?wskey={YOUR_WORLDCAT_API_KEY}`);
                const worldcatData = await worldcatResponse.json();
                total_pages = worldcatData?.list?.[0]?.numberOfPages || 0;
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

  // Real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return;

    const booksSubscription = (supabase as any)
      .channel('public:books')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload: BookPayload) => {
          console.log('🎉 SUBSCRIPTION: New book inserted:', payload.new);
          setUserBooks((prev) => {
            const updated = [...prev, payload.new].sort((a, b) => a.title.localeCompare(b.title));
            console.log('Updated userBooks state:', updated);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload: BookPayload) => {
          console.log('Book updated:', payload.new);
          setUserBooks((prev) =>
            prev.map((book) => (book.id === payload.new.id ? { ...book, ...payload.new } : book)).sort((a, b) => a.title.localeCompare(b.title))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload: { old: Book }) => {
          console.log('Book deleted:', payload.old);
          setUserBooks((prev) => prev.filter((book) => book.id !== payload.old?.id));
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        console.log('Books subscription status:', status);
        if (status !== 'SUBSCRIBED') {
          setError('Failed to subscribe to books updates');
        }
      });



    // Initial fetch of user books
    const fetchUserBooks = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', session.user.id)
        .order('title');
      if (error) {
        setError(`Failed to fetch user books: ${error.message}`);
      } else {
        setUserBooks(data);
      }
    };
    fetchUserBooks();

    // Load progress from database
    dispatch(loadProgressFromSupabase() as any);

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(booksSubscription);
    };
  }, [session?.user?.id, dispatch]);

  const addBook = async (book: Results) => {
    if (!session?.user) {
      setError('Please log in to add books.');
      return;
    }

    const bookId = crypto.randomUUID();
    console.log('Adding book with ID:', bookId);

    const newBook = {
      id: bookId,
      title: book.title,
      author: book.author,
      user_id: session.user.id,
      cover_image: book.cover,
      total_pages: book.total_pages || 0,
      isbn: book.isbn,
    };

    const { error } = await supabase
      .from('books')
      .insert(newBook);

    if (error) {
      setError(`Failed to add book: ${error.message}`);
      console.error('Error adding book:', error);
    } else {
      console.log('Book added successfully, updating state immediately...');
      // Update state immediately as fallback
      setUserBooks((prev) => [...prev, newBook].sort((a, b) => a.title.localeCompare(b.title)));
      toast('Book added successfully!');
    }
  };

  // Remove book handler (not used, so removed)


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
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Search Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((book, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 max-w-64 flex flex-col h-96">
                {book.cover ? (
                  <div className="flex-[3] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <Image 
                      src={book.cover} 
                      alt={`Cover of ${book.title}`} 
                      width={200}
                      height={300}
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="flex-[3] w-full bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No cover image</p>
                  </div>
                )}
                <div className="flex-[1] p-2 flex flex-col h-full">
                  <div className="flex-1 min-h-0">
                    <h2 className="text-base font-semibold text-gray-900 mb-0.5 line-clamp-2">{book.title}</h2>
                    <p className="text-gray-600 text-xs mb-0">by {book.author}</p>
                    {book.isbn && <p className="text-gray-500 text-xs mb-0">ISBN: {book.isbn}</p>}
                    {typeof book.total_pages === 'number' && book.total_pages > 0 && (
                      <p className="text-gray-500 text-xs mb-0">Pages: {book.total_pages}</p>
                    )}
                  </div>
                  <button
                    onClick={() => addBook(book)}
                    className="mt-1 w-full bg-indigo-600 text-white py-1 rounded-lg hover:bg-indigo-700 transition-colors text-xs"
                  >
                    Add Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Books</h2>
          {userBooks.length > 0 ? (
            <div 
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Carousel Container */}
              <div className="overflow-hidden rounded-lg">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * (100 / 5)}%)` }}
                >
                  {userBooks.map((book) => (
                    <div key={book.id} className="w-1/5 flex-shrink-0 px-1 relative">
                      <button
                        onClick={() => router.push(`/book/${book.id}`)}
                        className="w-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-36 relative"
                      >
                        {book.cover_image ? (
                          <div className="aspect-[3/4] overflow-hidden bg-gray-100 flex items-center justify-center">
                            <Image 
                              src={book.cover_image} 
                              alt={`Cover of ${book.title}`} 
                              width={144}
                              height={192}
                              className="w-full h-full object-contain" 
                            />
                          </div>
                        ) : (
                          <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-gray-500 text-sm font-medium">{book.title}</p>
                              <p className="text-gray-400 text-xs">No cover</p>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Dots */}
              {userBooks.length > 5 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {Array.from({ length: userBooks.length - 4 }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        index === currentSlide ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to position ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Previous/Next Buttons */}
              {userBooks.length > 5 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                    disabled={currentSlide === 0}
                    className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full shadow-md transition-all duration-200 ${
                      currentSlide === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-white/80 hover:bg-white text-gray-800 hover:shadow-lg'
                    }`}
                    aria-label="Previous book"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => Math.min(userBooks.length - 5, prev + 1))}
                    disabled={currentSlide >= userBooks.length - 5}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full shadow-md transition-all duration-200 ${
                      currentSlide >= userBooks.length - 5 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-white/80 hover:bg-white text-gray-800 hover:shadow-lg'
                    }`}
                    aria-label="Next book"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No books added yet. Search for books above to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}