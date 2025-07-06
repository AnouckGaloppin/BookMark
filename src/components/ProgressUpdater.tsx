'use client';
  import { useDispatch, useSelector } from 'react-redux';
  import { updateProgress } from '@/lib/progressSlice';
  import { RootState } from '@/lib/store';
  import { useState } from 'react';

  export default function ProgressUpdater({ bookId, totalPages }: { bookId: string; totalPages: number }) {
    const dispatch = useDispatch();
    const pages = useSelector((state: RootState) => state.progress.progress[bookId] || 0);
    const [error, setError] = useState<string | null>(null);

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
            style={{ width: `${Math.min((pages / totalPages) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{pages} / {totalPages} pages</p>
      </div>
    );
  }