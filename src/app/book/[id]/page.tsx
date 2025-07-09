'use client';
     import { useEffect, useState, use } from 'react';
     import { useDispatch } from 'react-redux';
     import { supabase } from '@/lib/supabase';
     import ProgressChart from '@/components/ProgressChart';
     import ProgressUpdater from '@/components/ProgressUpdater';
     import { loadProgressFromSupabase } from '@/lib/progressSlice';
     import { AppDispatch } from '@/lib/store';
     import { useCrossTabSync } from '@/lib/useCrossTabSync';

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



     export default function BookDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  
  // Enable cross-tab synchronization
  useCrossTabSync();

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

       // Real-time book subscription only (progress handled by cross-tab sync)
       useEffect(() => {
         let bookSubscription: any = null;

         const setupBookSubscription = async () => {
           try {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user?.id) {
               console.log('No user found, skipping book subscription');
               return;
             }

             console.log('Setting up book subscription for book:', id);

             // Book subscription only - progress is handled by cross-tab sync
             bookSubscription = supabase
               .channel(`book-${id}`)
               .on(
                 'postgres_changes',
                 { event: 'UPDATE', schema: 'public', table: 'books', filter: `id=eq.${id}` },
                 (payload: BookPayload) => {
                   console.log('Book updated:', payload.new);
                   setBook(payload.new);
                 }
               )
               .subscribe((status) => {
                 console.log('Book subscription status:', status);
                 if (status !== 'SUBSCRIBED') {
                   console.error('Failed to subscribe to book updates:', status);
                 }
               });

           } catch (error) {
             console.error('Error setting up book subscription:', error);
           }
         };

         // Add a small delay to ensure auth state is ready
         const timer = setTimeout(() => {
           setupBookSubscription();
         }, 100);

         // Cleanup subscription on unmount
         return () => {
           clearTimeout(timer);
           if (bookSubscription) {
             console.log('Cleaning up book subscription');
             supabase.removeChannel(bookSubscription);
           }
         };
       }, [id]);



       if (error) return <p className="p-4 text-red-500">{error}</p>;
       if (!book) return <p className="p-4">Loading...</p>;

       return (
         <div className="min-h-screen bg-gray-50 p-4">
           <div className="max-w-5xl mx-auto">
             <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 flex flex-col md:flex-row gap-8 items-start">
               {/* Left: Cover, Title, Author, ProgressUpdater */}
               <div className="w-full md:w-2/5 flex flex-col gap-4 items-center justify-center md:justify-start">
                 {book.cover_image ? (
                   <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 w-40 flex items-center justify-center">
                     <img
                       src={book.cover_image}
                       alt={`Cover of ${book.title}`}
                       className="w-full h-full object-cover"
                       onError={(e) => { e.currentTarget.style.display = 'none'; }}
                     />
                   </div>
                 ) : (
                   <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center rounded-lg w-40">
                     <p className="text-gray-500 text-sm">No cover image</p>
                   </div>
                 )}
                 <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center md:text-left">{book.title}</h1>
                 {book.author && <p className="text-gray-600 text-lg mb-2 text-center md:text-left">by {book.author}</p>}
                 <div className="mt-2 max-w-xs w-full">
                   <ProgressUpdater bookId={book.id} totalPages={book.total_pages} />
                 </div>
               </div>
               {/* Right: Reading Progress Chart */}
               <div className="w-full md:w-3/5 flex flex-col items-center md:items-start">
                 <h2 className="text-xl font-semibold text-gray-900 mb-4">Reading Progress</h2>
                 <ProgressChart bookId={book.id} />
               </div>
             </div>
           </div>
         </div>
       );
     }