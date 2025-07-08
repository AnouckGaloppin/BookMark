'use client';
  import { useDispatch, useSelector } from 'react-redux';
  import { updateProgress } from '@/lib/progressSlice';
  import { RootState } from '@/lib/store';
  import { useState, useEffect } from 'react';
  import { supabase } from '@/lib/supabase';

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

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const newPages = parseInt(inputValue, 10) || 0;
      
      if (newPages > totalPages) {
        setError(`Pages read cannot exceed the total pages (${totalPages})`);
        return;
      }
      
      setError(null);
      dispatch(updateProgress({ bookId, pages: newPages }));
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
      <div className="p-4 bg-white rounded-lg shadow-md">
        <label className="block text-sm font-medium text-gray-700">Pages Read</label>
        <input
          type="number"
          value={pages === 0 ? '' : pages}
          onChange={handleProgressChange}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-indigo-200 ${
            error ? 'border-red-300 focus:border-red-300' : 'border-gray-300 focus:border-indigo-300'
          }`}
          min="0"
          max={totalPages}
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
            onClick={toggleEditTotalPages}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            Edit total
          </button>
        </div>
        {editingTotalPages && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Total Pages</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={localTotalPages || ''}
                onChange={handleTotalPagesChange}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min={pages}
                placeholder="Total pages"
              />
              <button
                onClick={updateTotalPages}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={toggleEditTotalPages}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            {updateError && <p className="text-red-500 text-xs mt-1">{updateError}</p>}
          </div>
        )}
      </div>
    );
  }