'use client';
  import { useState, useEffect } from 'react';
  import { supabase } from '@/lib/supabase';
  import { useAuth } from '@/lib/auth';
  import { useDispatch, useSelector } from 'react-redux';
  import { updateProgress as updateProgressAction, loadProgressFromSupabase } from '@/lib/progressSlice';
  import { RootState } from '@/lib/store';
  import ProgressUpdater from '@/components/ProgressUpdater';
  import { useCrossTabSync } from '@/lib/useCrossTabSync';
import { PostgrestError } from '@supabase/supabase-js';

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
  const { session } = useAuth();
  const dispatch = useDispatch();
  const progress = useSelector((state: RootState) => state.progress.progress);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enable cross-tab synchronization
  useCrossTabSync();

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

    const booksSubscription = supabase
      .channel('public:books')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'books', filter: `user_id=eq.${session.user.id}` },
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
        { event: 'UPDATE', schema: 'public', table: 'books', filter: `user_id=eq.${session.user.id}` },
        (payload: BookPayload) => {
          console.log('Book updated:', payload.new);
          setUserBooks((prev) =>
            prev.map((book) => (book.id === payload.new.id ? { ...book, ...payload.new } : book)).sort((a, b) => a.title.localeCompare(b.title))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'books', filter: `user_id=eq.${session.user.id}` },
        (payload: any) => {
          console.log('Book deleted:', payload.old);
          setUserBooks((prev) => prev.filter((book) => book.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
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
  }, [session?.user?.id]);

  const addBook = async (book: any) => {
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
      setError('Book added successfully!');
      setTimeout(() => setError(null), 2000);
    }
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
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Search Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {book.cover_image ? (
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={book.cover_image} alt={`Cover of ${book.title}`} className="w-full h-full object-cover" />
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
                  <ProgressUpdater bookId={book.id} totalPages={book.total_pages} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}