'use client';
  import { useState, useEffect } from 'react';
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
  import { supabase } from '@/lib/supabase';

  interface ProgressData {
    date: string;
    pages_read: number;
  }

  export default function ProgressChart({ bookId }: { bookId: string }) {
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [loading, setLoading] = useState(true);

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
        } else {
          // Fall back to current progress if no history
          const { data: currentData, error: currentError } = await supabase
            .from('reading_progress')
            .select('pages_read, updated_at')
            .eq('book_id', bookId)
            .single();

          if (!currentError && currentData && currentData.pages_read > 0) {
            formattedData = [{
              date: new Date(currentData.updated_at).toLocaleDateString(),
              pages_read: currentData.pages_read || 0,
            }];
          }
        }
        
        setProgressData(formattedData);
        setLoading(false);
      };

      fetchProgress();
    }, [bookId]);

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