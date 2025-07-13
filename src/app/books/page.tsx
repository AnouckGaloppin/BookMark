'use client';
     import { useState, useEffect } from 'react';
     import { supabase } from '@/lib/supabase';
     import { useAuth } from '@/lib/auth';
     import ProgressUpdater from '@/components/ProgressUpdater';
     import { useDispatch } from 'react-redux';
     import { loadProgressFromSupabase } from '@/lib/progressSlice';
     import { AppDispatch } from '@/lib/store';
     import { useCrossTabSync } from '@/lib/useCrossTabSync';
     import { toast } from 'sonner';
     import { Trash } from 'lucide-react';
     import { Book } from '@/types';
     import type { BookSubscription } from '@/types';

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





     export default function BooksPage() {
  const { session, loading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  
  // Enable cross-tab synchronization
  useCrossTabSync();

       useEffect(() => {
         if (session?.user) {
           loadBooks();
           dispatch(loadProgressFromSupabase());
         }
       }, [session, dispatch]);

       // Real-time subscriptions
       useEffect(() => {
         if (!session?.user?.id) return;

         const booksSubscription = (supabase as any)
           .channel('public:books')
           .on(
             'postgres_changes',
             { event: 'INSERT', schema: 'public', table: 'books', filter: `user_id=eq.${session.user.id}` },
             (payload: BookPayload) => {
               console.log('New book inserted:', payload.new);
               setBooks((prev) => [...prev, payload.new].sort((a, b) => a.title.localeCompare(b.title)));
             }
           )
           .on(
             'postgres_changes',
             { event: 'UPDATE', schema: 'public', table: 'books', filter: `user_id=eq.${session.user.id}` },
             (payload: BookPayload) => {
               console.log('Book updated:', payload.new);
               setBooks((prev) =>
                 prev.map((book) => (book.id === payload.new.id ? { ...book, ...payload.new } : book)).sort((a, b) => a.title.localeCompare(b.title))
               );
             }
           )
           .on(
             'postgres_changes',
             { event: 'DELETE', schema: 'public', table: 'books', filter: `user_id=eq.${session.user.id}` },
             (payload: BookSubscription) => {
               console.log('Book deleted:', payload.old);
               setBooks((prev) => prev.filter((book) => book.id !== payload.old?.id));
             }
           )
           .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
             console.log('Books subscription status:', status);
             if (status !== 'SUBSCRIBED') {
               setError('Failed to subscribe to books updates');
             }
           });



         // Cleanup subscriptions on unmount
         return () => {
           supabase.removeChannel(booksSubscription);
         };
       }, [session?.user?.id, dispatch]);

       const loadBooks = async() => {
        if(!session?.user) return;

        setLoadingBooks(true);
        setError(null);

        const { data, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, cover_image, total_pages')
        .eq('user_id', session.user.id);

        if (booksError) {
          setError(`Error loading books: ${booksError.message}`);
        } else {
          setBooks(data || []);
        }
        setLoadingBooks(false);
      };

       // Remove book handler
       const handleRemoveBook = async (bookId: string) => {
         const { error } = await supabase.from('books').delete().eq('id', bookId);
         if (!error) {
           setBooks((prev) => prev.filter((book) => book.id !== bookId));
           toast('Book removed!');
         } else {
           toast('Failed to remove book: ' + error.message);
         }
       };

       if (loading) {
         return <p className="p-4">Loading...</p>;
       }

       if (!session) {
         return <p className="p-4">Please login to view your books.</p>;
       }

       if (loadingBooks) {
         return <p className="p-4">Loading books...</p>;
       }

       if (error) {
         return <p className="p-4 text-red-500" style={{ color: 'red' }}>{error}</p>;
       }



       if (!books || books.length === 0) {
         return <p className="p-4">No books found.</p>;
       }

       return (
         <div className="min-h-screen bg-gray-50 p-4">
           <div className="max-w-6xl mx-auto">
             <h1 className="text-3xl font-bold mb-6 text-gray-900">Your Books</h1>
             <a href="/add-book" className="mb-6 inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">Add book</a>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center sm:justify-items-start justify-center sm:justify-start">
               {books.map((book) => (
                 <a
                   key={book.id}
                   href={`/book/${book.id}`}
                   className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-64 h-96 flex flex-col relative cursor-pointer"
                 >
                   {/* Remove button */}
                   <button
                     type="button"
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       handleRemoveBook(book.id);
                     }}
                     className="absolute top-2 right-2 z-10 bg-indigo-600 text-white rounded-full p-2 w-9 h-9 flex items-center justify-center shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                     title="Remove book"
                   >
                     <Trash size={20} />
                   </button>
                   {book.cover_image ? (
                     <div className="flex-[3] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                       <img
                         src={book.cover_image}
                         alt={`Cover of ${book.title}`}
                         className="max-h-full max-w-full object-contain"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     </div>
                   ) : (
                     <div className="flex-[3] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                       <p className="text-gray-500 text-sm">No cover image</p>
                     </div>
                   )}
                   <div className="flex-[1] p-2 flex flex-col h-full">
                     <div className="flex-1 min-h-0">
                       <h2 className="text-base font-semibold text-gray-900 mb-0.5 line-clamp-2">{book.title}</h2>
                       {book.author && (
                         <p className="text-gray-600 text-xs mb-0">by {book.author}</p>
                       )}
                       {/* Optionally add ISBN/pages here if desired */}
                     </div>
                     <ProgressUpdater bookId={book.id} totalPages={book.total_pages ?? 0} />
                   </div>
                 </a>
               ))}
             </div>
           </div>
         </div>
       );
     }