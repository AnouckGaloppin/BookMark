'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image: string | null;
  total_pages: number;
  updated_at: string;
  has_progress?: boolean;
  activity_type?: 'reading' | 'added';
}

// interface ReadingProgress {
//   pages_read: number;
//   updated_at: string;
// }

// interface BookWithProgress {
//   id: string;
//   title: string;
//   author: string;
//   cover_image: string | null;
//   total_pages: number;
//   updated_at: string;
//   reading_progress: ReadingProgress[];
// }

export default function ProfilePage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  // Form states
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Messages
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadRecentBooks();
    }
  }, [session]);

  const loadProfile = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } else {
        setProfile(data);
        setNewUsername(data.username || '');
        setNewEmail(session.user.email || '');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadRecentBooks = async () => {
    if (!session?.user) return;

    setLoadingBooks(true);
    try {
      const { data, error } = await supabase
        .rpc('get_user_recent_books', {
          uid: session.user.id,
          limit_count: 5,
        });

      if (error) {
        console.error('Error loading recent books:', error);
        setRecentBooks([]);
      } else {
        setRecentBooks(data || []);
      }
    } catch (err) {
      console.error('Error loading recent books:', err);
      setRecentBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateUsername = async () => {
    if (!profile || !newUsername.trim()) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim() })
        .eq('id', profile.id);

      if (error) {
        setError('Failed to update username');
      } else {
        setProfile({ ...profile, username: newUsername.trim() });
        setEditingUsername(false);
        setMessage('Username updated successfully!');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username');
    }
  };

  const updateEmail = async () => {
    if (!newEmail.trim() || !currentPassword) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
        password: currentPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setEditingEmail(false);
        setCurrentPassword('');
        setMessage('Email update initiated. Please check your email to confirm the change.');
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error updating email:', err);
      setError('Failed to update email');
    }
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('Password updated successfully!');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      console.log('Starting avatar upload for user:', profile.id);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      
      console.log('Uploading file as:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: publicUrl });
      setMessage('Profile picture updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(`Failed to upload profile picture: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar Section */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-400">👤</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                {uploadingAvatar ? '⏳' : '📷'}
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
              <p className="text-gray-600 mb-4">Email: {session.user.email}</p>
              
              {/* Username Section */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-gray-700 font-medium">Username:</span>
                {editingUsername ? (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={updateUsername}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(profile?.username || '');
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900">{profile?.username || 'No username set'}</span>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex-shrink-0">
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
                className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
            
            {/* Email Change */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Change Email</h3>
              {editingEmail ? (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={updateEmail}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Update Email
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmail(false);
                        setNewEmail(session.user.email || '');
                        setCurrentPassword('');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Change Email
                </button>
              )}
            </div>

            {/* Password Change */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Change Password</h3>
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={updatePassword}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>

          {/* Recent Books */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Books</h2>
            {loadingBooks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading recent books...</p>
              </div>
            ) : recentBooks.length > 0 ? (
              <div className="space-y-4">
                {recentBooks.map((book) => (
                  <div key={book.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    {book.cover_image ? (
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">📚</span>
                      </div>
                    )}
                                         <div className="flex-1">
                       <h3 className="font-medium text-gray-900">{book.title}</h3>
                       <p className="text-sm text-gray-600">by {book.author}</p>
                       <div className="flex items-center space-x-2 mt-1">
                         <p className="text-xs text-gray-500">
                           {new Date(book.updated_at).toLocaleDateString()}
                         </p>
                         <span
  className={`text-xs px-2 py-1 rounded-full ${
    book.activity_type === 'reading'
      ? 'bg-green-100 text-green-700'
      : 'bg-blue-100 text-blue-700'
  }`}
>
  {book.activity_type === 'reading' ? 'Recently Read' : 'Book Added'}
</span>
                       </div>
                     </div>
                    <a
                      href={`/book/${book.id}`}
                      className="text-indigo-600 hover:text-indigo-700 text-sm"
                    >
                      View →
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No books added yet</p>
                <a
                  href="/search"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Search for Books
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}