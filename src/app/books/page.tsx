'use client';
     import { useState, useEffect } from 'react';
     import { supabase } from '@/lib/supabase';
     import { useAuth } from '@/lib/auth';
     import ProgressUpdater from '@/components/ProgressUpdater';
     import { useDispatch } from 'react-redux';
     import { loadProgressFromSupabase } from '@/lib/progressSlice';
     import { AppDispatch } from '@/lib/store';

     export default function BooksPage() {
       const { session, loading } = useAuth();
       const [books, setBooks] = useState<any[]>([]);
       const [error, setError] = useState<string | null>(null);
       const [loadingBooks, setLoadingBooks] = useState(false);
       const dispatch = useDispatch<AppDispatch>();

       useEffect(() => {
         if (session?.user) {
           loadBooks();
           dispatch(loadProgressFromSupabase());
         }
       }, [session, dispatch]);

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
           <div className="max-w-7xl mx-auto">
             <h1 className="text-3xl font-bold mb-6 text-gray-900">Your Books</h1>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {books.map((book) => (
                 <div key={book.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                   {book.cover_image ? (
                     <div className="aspect-[3/4] overflow-hidden">
                       <img
                         src={book.cover_image}
                         alt={`Cover of ${book.title}`}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     </div>
                   ) : (
                     <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                       <p className="text-gray-500 text-sm">No cover image</p>
                     </div>
                   )}
                   <div className="p-6">
                     <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{book.title}</h2>
                     {book.author && (
                       <p className="text-gray-600 text-sm">by {book.author}</p>
                     )}
                     <ProgressUpdater bookId={book.id} totalPages={book.total_pages} />
                     <a href={`/book/${book.id}`} className="text-blue-500 hover:text-blue-600">View Details</a>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>
       );
     }