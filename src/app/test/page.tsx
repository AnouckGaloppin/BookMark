import { supabase } from '@/lib/supabase';

export default async function TestPage() {
  const { data: books, error } = await supabase.from('books').select('*');
  console.log({books, error});

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Books</h1>
      {books?.length ? (
        <ul>
          {books.map((book) => (
            <li key={book.id}>{book.title} by {book.author}</li>
          ))}
        </ul>
      ) : (
        <p>No books found.</p>
      )}
    </div>
  );
}