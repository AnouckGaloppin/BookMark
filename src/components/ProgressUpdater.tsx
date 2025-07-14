'use client';
  import { useDispatch, useSelector } from 'react-redux';
  import { setProgress } from '@/lib/progressSlice';
  import { RootState } from '@/lib/store';
  import { useState, useEffect } from 'react';
  import { supabase } from '@/lib/supabase';
  import { progressSync, ProgressUpdateMessage } from '@/lib/crossTabSync';

  export default function ProgressUpdater({ bookId, totalPages }: { bookId: string; totalPages: number }) {
  const dispatch = useDispatch();
  const pages = useSelector((state: RootState) => state.progress.progress[bookId] || 0);
  const [error, setError] = useState<string | null>(null);
  const [editingTotalPages, setEditingTotalPages] = useState(false);
  const [localTotalPages, setLocalTotalPages] = useState(totalPages);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Update local total pages when prop changes
  useEffect(() => {
    setLocalTotalPages(totalPages);
  }, [totalPages]);

    const handleProgressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const newPages = parseInt(inputValue, 10) || 0;
      
      if (newPages > localTotalPages) {
        setError(`Pages read cannot exceed the total pages (${localTotalPages})`);
        return;
      }
      
      setError(null);
      console.log('🔄 ProgressUpdater: Updating progress to', newPages, 'for book', bookId);
      // Update Redux state immediately
      dispatch(setProgress({ bookId, pages: newPages }));
      
      // Notify other tabs
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const message: ProgressUpdateMessage = {
          type: 'PROGRESS_UPDATE',
          bookId,
          pages: newPages,
          userId: user.id
        };
        progressSync.send(message);
        console.log('📡 Cross-tab: Sent progress update to other tabs');
      }
      
      // Save to database
      saveProgressToSupabase(bookId, newPages);
    };

    const saveProgressToSupabase = async (bookId: string, pages: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) return;

      console.log('💾 Saving progress to database:', { bookId, pages, userId });

      const { error } = await supabase.from('reading_progress').upsert(
        {
          book_id: bookId,
          user_id: userId,
          pages_read: pages,
        },
        { onConflict: 'book_id,user_id' }
      );
      
      if (error) {
        console.error('Error saving progress:', error.message);
        setError(`Failed to save progress: ${error.message}`);
      } else {
        console.log('✅ Progress saved to database successfully');
      }
    };

    const handleTotalPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10) || 0;
      setLocalTotalPages(value);
    };

    const updateTotalPages = async () => {
      if (localTotalPages < pages) {
        setUpdateError(`Total pages cannot be less than pages read (${pages})`);
        return;
      }

      const { error: updateError } = await supabase
        .from('books')
        .update({ total_pages: localTotalPages })
        .eq('id', bookId);

      if (updateError) {
        setUpdateError(`Failed to update total pages: ${updateError.message}`);
      } else {
        setUpdateError(null);
        setEditingTotalPages(false);
        // Update local state immediately
        setLocalTotalPages(localTotalPages);
      }
    };

    const toggleEditTotalPages = () => {
      setEditingTotalPages(!editingTotalPages);
      if (!editingTotalPages) {
        setLocalTotalPages(totalPages);
      }
    };

    return (
      <div 
        className="p-4 bg-white rounded-lg shadow-md"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label className="block text-sm font-medium text-gray-700">Pages Read</label>
        <input
          type="number"
          value={pages === 0 ? '' : pages}
          onChange={handleProgressChange}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-indigo-200 ${
            error ? 'border-red-300 focus:border-red-300' : 'border-gray-300 focus:border-indigo-300'
          }`}
          min="0"
          max={localTotalPages}
          placeholder="0"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${Math.min((pages / localTotalPages) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-600">{pages} / {localTotalPages} pages</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleEditTotalPages();
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            Edit total
          </button>
        </div>
        {editingTotalPages && (
          <div 
            className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Total Pages</label>
            <input
              type="number"
              value={localTotalPages || ''}
              onChange={handleTotalPagesChange}
              className="w-full min-w-[120px] mb-3 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min={pages}
              placeholder="Total pages"
            />
            <div className="flex justify-center gap-3 w-full">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateTotalPages();
                }}
                className="px-4 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm hover:shadow-md font-medium"
                style={{ minWidth: 90 }}
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleEditTotalPages();
                }}
                className="px-4 py-1.5 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors duration-200 shadow-sm hover:shadow-md font-medium"
                style={{ minWidth: 90 }}
              >
                Cancel
              </button>
            </div>
            {updateError && <p className="text-red-500 text-xs mt-2 text-center">{updateError}</p>}
          </div>
        )}
      </div>
    );
  }