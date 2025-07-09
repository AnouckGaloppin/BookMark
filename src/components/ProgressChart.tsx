'use client';
  import { useState, useEffect } from 'react';
  import { useSelector } from 'react-redux';
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
  import { supabase } from '@/lib/supabase';
  import { RootState } from '@/lib/store';

  interface ProgressData {
    date: string;
    pages_read: number;
  }

  export default function ProgressChart({ bookId }: { bookId: string }) {
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [loading, setLoading] = useState(true);
    const currentProgress = useSelector((state: RootState) => state.progress.progress[bookId] || 0);

    useEffect(() => {
      const fetchProgress = async () => {
        setLoading(true);
        
        // First try to get progress history
        const { data: historyData, error: historyError } = await supabase
          .from('progress_history')
          .select('pages_read, recorded_at')
          .eq('book_id', bookId)
          .order('recorded_at', { ascending: true });

        if (historyError) {
          console.error('Error fetching progress history:', historyError.message);
        }

        let formattedData: ProgressData[] = [];
        
        if (historyData && historyData.length > 0) {
          // Use history data if available
          formattedData = historyData.map((item) => ({
            date: new Date(item.recorded_at).toLocaleDateString(),
            pages_read: item.pages_read || 0,
          }));
        }
        
        // Add current progress from Redux if it's higher than the last history entry
        if (currentProgress > 0) {
          console.log('📊 ProgressChart: Current progress from Redux:', currentProgress, 'for book', bookId);
          const today = new Date().toLocaleDateString();
          const lastEntry = formattedData[formattedData.length - 1];
          
          if (!lastEntry || lastEntry.date !== today || currentProgress > lastEntry.pages_read) {
            // Add or update today's entry with current progress
            const todayEntry = { date: today, pages_read: currentProgress };
            
            if (lastEntry && lastEntry.date === today) {
              // Update today's entry
              formattedData[formattedData.length - 1] = todayEntry;
            } else {
              // Add new entry for today
              formattedData.push(todayEntry);
            }
          }
        }
        
        setProgressData(formattedData);
        setLoading(false);
      };

      fetchProgress();
    }, [bookId, currentProgress]); // Add currentProgress as dependency

    if (loading) {
      return <p className="p-4 text-gray-600">Loading progress chart...</p>;
    }

    if (progressData.length === 0) {
      return <p className="p-4 text-gray-600">No progress data available. Start reading to see your progress chart!</p>;
    }

    return (
      <div className="w-full h-96 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Progress Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
              itemStyle={{ color: '#333' }}
              formatter={(value: any) => [`${value} pages`, 'Pages Read']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="pages_read"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
              dot={{ r: 4, fill: '#8884d8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }