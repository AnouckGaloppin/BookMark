import { createSlice, PayloadAction } from '@reduxjs/toolkit';
     import { supabase } from './supabase';

     interface ProgressState {
       progress: { [bookId: string]: number };
     }

     const initialState: ProgressState = {
       progress: {},
     };

     const progressSlice = createSlice({
       name: 'progress',
       initialState,
       reducers: {
         setProgress: (state, action: PayloadAction<{ bookId: string; pages: number }>) => {
           state.progress[action.payload.bookId] = action.payload.pages;
         },
         updateProgress: (state, action: PayloadAction<{ bookId: string; pages: number }>) => {
           const currentPages = state.progress[action.payload.bookId] || 0;
           state.progress[action.payload.bookId] = Math.min(action.payload.pages, 1000); // Cap at 1000 pages
           saveProgressToSupabase(action.payload.bookId, state.progress[action.payload.bookId]);
         },
       },
     });

     // Async function to save to Supabase
     async function saveProgressToSupabase(bookId: string, pages: number) {
       const { error } = await supabase.from('reading_progress').upsert(
         {
           book_id: bookId,
           user_id: (await supabase.auth.getUser()).data.user?.id || '',
           pages_read: pages,
         },
         { onConflict: 'book_id,user_id' } // Changed to string
       );
       if (error) console.error('Error saving progress:', error.message);
     }

     export const { setProgress, updateProgress } = progressSlice.actions;
     export default progressSlice.reducer;