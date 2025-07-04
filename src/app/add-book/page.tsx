'use client';
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import * as z from 'zod';
  import { supabase } from '@/lib/supabase';

  // Define validation schema
  const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    isbn: z.string().optional().refine((val) => !val || /^[0-9]{10}$|^[0-9]{13}$/.test(val), {
      message: 'ISBN must be 10 or 13 digits',
    }),
    author: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  export default function AddBookPage() {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
      reset,
    } = useForm<FormData>({
      resolver: zodResolver(formSchema),
      defaultValues: { title: '', isbn: '', author: '' },
    });

    const onSubmit = async (data: FormData) => {
      const { error } = await supabase.from('books').insert({
        title: data.title,
        isbn: data.isbn,
        author: data.author,
      });

      if (error) {
        alert(`Error adding book: ${error.message}`);
      } else {
        alert('Book added successfully!');
        reset();
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Add Book</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                {...register('title')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                disabled={isSubmitting}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1" style={{color: 'red'}}>{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ISBN (Optional)</label>
              <input
                {...register('isbn')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                disabled={isSubmitting}
              />
              {errors.isbn && <p className="text-red-500 text-sm mt-1" style={{color: 'red'}}>{errors.isbn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Author (Optional)</label>
              <input
                {...register('author')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                disabled={isSubmitting}
              />
              {errors.author && <p className="text-red-500 text-sm mt-1" style={{color: 'red'}}>{errors.author.message}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Book'}
            </button>
          </form>
        </div>
      </div>
    );
  }