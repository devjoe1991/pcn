export default function Containers() {
  return (
    <section className="bg-black py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Containers Section
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            This is the containers section with a plain black background
          </p>
        </div>
        
        {/* Container content will go here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder containers */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-xl font-semibold text-white mb-3">Container 1</h3>
            <p className="text-gray-400">This is a placeholder container for future content.</p>
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-xl font-semibold text-white mb-3">Container 2</h3>
            <p className="text-gray-400">This is a placeholder container for future content.</p>
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-xl font-semibold text-white mb-3">Container 3</h3>
            <p className="text-gray-400">This is a placeholder container for future content.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
