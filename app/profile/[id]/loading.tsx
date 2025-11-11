export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-800 rounded-xl"></div>
          <div className="h-48 bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

