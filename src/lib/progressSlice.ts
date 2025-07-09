import { createSlice, PayloadAction } from '@reduxjs/toolkit';
     import { supabase } from './supabase';

     interface ProgressState {
       progress: { [bookId: string]: number };
       loaded: boolean;
     }

     const initialState: ProgressState = {
       progress: {},
       loaded: false,
     };

     const progressSlice = createSlice({
       name: 'progress',
       initialState,
       reducers: {
         setProgress: (state, action: PayloadAction<{ bookId: string; pages: number }>) => {
           console.log('🔄 Redux: setProgress called with', action.payload);
           state.progress[action.payload.bookId] = action.payload.pages;
         },
         updateProgress: (state, action: PayloadAction<{ bookId: string; pages: number }>) => {
           state.progress[action.payload.bookId] = action.payload.pages;
           saveProgressToSupabase(action.payload.bookId, action.payload.pages);
         },
         loadProgress: (state, action: PayloadAction<{ [bookId: string]: number }>) => {
           console.log('🔄 Redux: loadProgress called with', action.payload);
           state.progress = action.payload;
           state.loaded = true;
         },
       },
     });

     // Async function to save to Supabase
     async function saveProgressToSupabase(bookId: string, pages: number) {
       const { data: { user } } = await supabase.auth.getUser();
       const userId = user?.id;
       if (!userId) return;

       // Update current progress
       const { error: progressError } = await supabase.from('reading_progress').upsert(
         {
           book_id: bookId,
           user_id: userId,
           pages_read: pages,
         },
         { onConflict: 'book_id,user_id' }
       );
       if (progressError) console.error('Error saving progress:', progressError.message);

       // Check if there's already a progress entry for today
       const today = new Date();
       const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
       const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

       const { data: existingEntry } = await supabase
         .from('progress_history')
         .select('id, pages_read')
         .eq('book_id', bookId)
         .eq('user_id', userId)
         .gte('recorded_at', startOfDay.toISOString())
         .lte('recorded_at', endOfDay.toISOString())
         .single();

       if (existingEntry) {
         // Update existing entry for today if the new progress is higher
         if (pages > existingEntry.pages_read) {
           const { error: updateError } = await supabase
             .from('progress_history')
             .update({ pages_read: pages })
             .eq('id', existingEntry.id);
           if (updateError) console.error('Error updating progress history:', updateError.message);
         }
       } else {
         // Create new entry for today
         const { error: historyError } = await supabase.from('progress_history').insert({
           book_id: bookId,
           user_id: userId,
           pages_read: pages,
         });
         if (historyError) console.error('Error saving progress history:', historyError.message);
       }
     }

     // Async function to load progress from Supabase
     export const loadProgressFromSupabase = () => async (dispatch: any) => {
       console.log('🔄 Loading progress from Supabase...');
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         console.log('❌ No user found, skipping progress load');
         return;
       }

       const { data, error } = await supabase
         .from('reading_progress')
         .select('book_id, pages_read')
         .eq('user_id', user.id);

       if (error) {
         console.error('Error loading progress:', error.message);
         return;
       }

       const progressMap: { [bookId: string]: number } = {};
       data?.forEach((item) => {
         progressMap[item.book_id] = item.pages_read || 0;
       });

       console.log('📊 Loaded progress from database:', progressMap);
       dispatch(progressSlice.actions.loadProgress(progressMap));
     };

     export const { setProgress, updateProgress, loadProgress } = progressSlice.actions;
     export default progressSlice.reducer;