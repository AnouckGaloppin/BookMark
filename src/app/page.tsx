import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Track Your Reading Journey starting now
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover new books, track your reading progress, and build your personal library. 
            Never lose track of where you left off in your favorite books.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              🔍 Search Books
            </Link>
            <Link
              href="/books"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              📚 My Library
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need to Track Your Reading
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Discover Books</h3>
            <p className="text-gray-600">
              Search through thousands of books from Open Library. Find your next favorite read with detailed information and cover images.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Track Progress</h3>
            <p className="text-gray-600">
              Keep track of your reading progress with visual progress bars and charts. Never lose your place again.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Sync</h3>
            <p className="text-gray-600">
              Your progress syncs instantly across all your devices and browser tabs. Pick up right where you left off.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/search"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
            >
              <span className="text-2xl">🔍</span>
              <span className="font-medium text-gray-900">Search Books</span>
            </Link>
            
            <Link
              href="/books"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
            >
              <span className="text-2xl">📚</span>
              <span className="font-medium text-gray-900">View Library</span>
            </Link>
            
            <Link
              href="/profile"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
            >
              <span className="text-2xl">👤</span>
              <span className="font-medium text-gray-900">Profile</span>
            </Link>
            
            <Link
              href="/auth/register"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200"
            >
              <span className="text-2xl">🔐</span>
              <span className="font-medium text-gray-900">Get Started</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
