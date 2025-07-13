'use client';
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import * as z from 'zod';
  import { supabase } from '@/lib/supabase';
  import Link from 'next/link';
  import { useRouter } from 'next/navigation';

  // Define validation schema
  const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    author: z.string().optional(),
    total_pages: z.number().min(1, 'Number of pages must be at least 1'),
    isbn: z.string().optional().refine((val) => !val || /^[0-9]{10}$|^[0-9]{13}$/.test(val), {
      message: 'ISBN must be 10 or 13 digits',
    }),
    cover_image: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  export default function AddBookPage() {
    const router = useRouter();
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      reset,
      setError,
    } = useForm<FormData>({
      resolver: zodResolver(formSchema),
      defaultValues: { title: '', total_pages: 0, isbn: '', author: '', cover_image: '' },
    });

    const onSubmit = async (data: FormData) => {
        const {data: {user}} = await supabase.auth.getUser();
      const { error } = await supabase.from('books').insert({
        title: data.title,
        total_pages: data.total_pages,
        isbn: data.isbn,
        author: data.author,
        cover_image: data.cover_image || null,
        user_id: user?.id,
      });

      if (error) {
        setError('root', { message: `Error adding book: ${error.message}` });
      } else {
        reset();
        router.push('/books');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📖</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Book</h2>
            <p className="text-gray-600">Add a book to your reading collection</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.root.message}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter book title"
                  disabled={isSubmitting}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Author (Optional)
                </label>
                <input
                  id="author"
                  {...register('author')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter author name"
                  disabled={isSubmitting}
                />
                {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>}
              </div>

              <div>
                <label htmlFor="total_pages" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Pages *
                </label>
                <input
                  id="total_pages"
                  {...register('total_pages', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter total pages"
                  disabled={isSubmitting}
                />
                {errors.total_pages && <p className="text-red-500 text-sm mt-1">{errors.total_pages.message}</p>}
              </div>

              <div>
                <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN (Optional)
                </label>
                <input
                  id="isbn"
                  {...register('isbn')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter 10 or 13 digit ISBN"
                  disabled={isSubmitting}
                />
                {errors.isbn && <p className="text-red-500 text-sm mt-1">{errors.isbn.message}</p>}
              </div>

              <div>
                <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL (Optional)
                </label>
                <input
                  id="cover_image"
                  {...register('cover_image')}
                  type="url"
                  placeholder="https://example.com/book-cover.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isSubmitting}
                />
                {errors.cover_image && <p className="text-red-500 text-sm mt-1">{errors.cover_image.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? 'Adding Book...' : 'Add Book'}
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link
              href="/books"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              ← Back to Books
            </Link>
          </div>
        </div>
      </div>
    );
  }