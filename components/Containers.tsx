export default function Containers() {
  return (
    <section className="bg-black py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            How It Works
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Get out of paying that ticket in 3 simple steps
          </p>
        </div>
        
        {/* 3 Steps Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Upload Ticket */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-blue-500 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-6 mx-auto">
              <span className="text-white font-bold text-lg">1</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Upload Ticket</h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Simply upload a photo of your parking ticket or traffic violation. We&apos;ll analyze the details and get started on your case.
            </p>
          </div>
          
          {/* Step 2: Tell Us The Situation */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-green-500 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full mb-6 mx-auto">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Tell Us The Situation</h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Share the circumstances around your ticket. Every detail matters - we&apos;ll use this information to build your strongest defense.
            </p>
          </div>
          
          {/* Step 3: Find Loopholes & Track Progress */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-700 hover:border-purple-500 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-6 mx-auto">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">We Find The Best Loopholes</h3>
            <p className="text-gray-300 text-center leading-relaxed">
              Our AI-powered system analyzes your case and identifies the best legal loopholes and practices to get you out of paying. Track your progress every step of the way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
