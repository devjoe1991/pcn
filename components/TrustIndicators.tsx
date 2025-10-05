export default function TrustIndicators() {
  return (
    <section className="bg-zinc-900 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Our AI-powered system provides proven results with a manageable dashboard for all users
          </p>
        </div>
        
        {/* Trust Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Success Rate */}
          <div className="bg-zinc-800 rounded-xl p-8 text-center border border-zinc-700">
            <div className="text-4xl font-bold text-green-400 mb-2">99.2%</div>
            <div className="text-lg font-semibold text-white mb-2">Success Rate</div>
            <div className="text-gray-400 text-sm">
              Based on feedback from our internal users
            </div>
          </div>
          
          {/* AI-Powered */}
          <div className="bg-zinc-800 rounded-xl p-8 text-center border border-zinc-700">
            <div className="text-4xl font-bold text-blue-400 mb-2">AI</div>
            <div className="text-lg font-semibold text-white mb-2">Powered System</div>
            <div className="text-gray-400 text-sm">
              Advanced AI delivers proven results
            </div>
          </div>
          
          {/* Dashboard */}
          <div className="bg-zinc-800 rounded-xl p-8 text-center border border-zinc-700">
            <div className="text-4xl font-bold text-purple-400 mb-2">Track</div>
            <div className="text-lg font-semibold text-white mb-2">Your Progress</div>
            <div className="text-gray-400 text-sm">
              Manageable dashboard for all users
            </div>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl p-8 border border-zinc-600">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              What Our Beta Testers Say
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-600">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Sarah M.</div>
                  <div className="text-gray-400 text-sm">Small Business Owner</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "Saved me £180 on a parking fine I thought I had to pay. The AI-powered system found a technicality I never would have spotted. Absolutely brilliant!"
              </p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-600">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <div>
                  <div className="text-white font-semibold">James R.</div>
                  <div className="text-gray-400 text-sm">Delivery Driver</div>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "As a delivery driver, I get tickets all the time. This AI-powered system has saved me over £500 in the last 3 months alone. Game changer!"
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="text-gray-400 text-sm mb-6">Trusted by</div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-gray-500 font-semibold">Small Businesses</div>
            <div className="text-gray-500 font-semibold">Delivery Drivers</div>
            <div className="text-gray-500 font-semibold">Fleet Managers</div>
            <div className="text-gray-500 font-semibold">Private Individuals</div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs max-w-4xl mx-auto">
            * Success rate based on feedback from our internal users between January 2025 and October 2025. 
            Our system provides all users with a manageable dashboard to track the process and uses AI to get proven results.
            Results may vary. Always consult with legal professionals for complex cases. 
            Our AI-powered system provides guidance and template letters but does not guarantee specific outcomes.
          </p>
        </div>
      </div>
    </section>
  );
}
