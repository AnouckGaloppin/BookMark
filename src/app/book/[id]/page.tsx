'use client';
     import { useEffect, useState, use } from 'react';
     import { useDispatch } from 'react-redux';
     import { supabase } from '@/lib/supabase';
     import ProgressChart from '@/components/ProgressChart';
     import ProgressUpdater from '@/components/ProgressUpdater';
     import { loadProgressFromSupabase } from '@/lib/progressSlice';
     import { AppDispatch } from '@/lib/store';

     export default function BookDetails({ params }: { params: Promise<{ id: string }> }) {
       const { id } = use(params);
       const [book, setBook] = useState<any>(null);
       const [error, setError] = useState<string | null>(null);
       const dispatch = useDispatch<AppDispatch>();

       useEffect(() => {
         const fetchBook = async () => {
           const { data: { user } } = await supabase.auth.getUser();
           console.log('Fetching book with id:', id, 'for user:', user?.id, 'session:', user);
           const { data, error: bookError } = await supabase
             .from('books')
             .select('id, title, author, cover_image, total_pages, user_id')
             .eq('id', id)
             .single();

           console.log('Query result:', { data, bookError, userId: user?.id, policyCheck: data?.user_id === user?.id });

           if (bookError || !data) {
             setError(`Book not found. Error: ${bookError?.message}`);
           } else {
             setBook(data);
           }
         };
         fetchBook();
         dispatch(loadProgressFromSupabase());
       }, [id, dispatch]);

       if (error) return <p className="p-4 text-red-500">{error}</p>;
       if (!book) return <p className="p-4">Loading...</p>;

       return (
         <div className="min-h-screen bg-gray-50 p-4">
           <div className="max-w-3xl mx-auto">
             <div className="bg-white rounded-xl shadow-lg overflow-hidden">
               {book.cover_image ? (
                 <div className="aspect-[3/4] overflow-hidden">
                   <img
                     src={book.cover_image}
                     alt={`Cover of ${book.title}`}
                     className="w-full h-full object-cover"
                     onError={(e) => { e.currentTarget.style.display = 'none'; }}
                   />
                 </div>
               ) : (
                 <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                   <p className="text-gray-500 text-sm">No cover image</p>
                 </div>
               )}
               <div className="p-6">
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                 {book.author && <p className="text-gray-600 text-lg mb-4">by {book.author}</p>}
                 <ProgressUpdater bookId={book.id} totalPages={book.total_pages} />
                 <ProgressChart bookId={book.id} />
               </div>
             </div>
           </div>
         </div>
       );
     }