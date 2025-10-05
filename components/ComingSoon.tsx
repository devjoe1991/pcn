'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Set countdown to 24 hours from now
    const targetTime = new Date().getTime() + (24 * 60 * 60 * 1000);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically send the email to your backend
      console.log('Email added to waitlist:', email);
    }
  };

  return (
    <section className="bg-black py-16 sm:py-20" data-section="waitlist">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Waitlist
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Be the first to know when we launch
          </p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-700 shadow-2xl">
          {/* Padlock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-600">
              <svg 
                className="w-8 h-8 text-zinc-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          </div>

          {/* Coming Soon Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Coming Soon</h1>
            <p className="text-gray-400">We're putting the finishing touches on something amazing</p>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white text-center mb-4">
              Launching in:
            </h3>
            <div className="flex justify-center space-x-4">
              <div className="bg-zinc-800 rounded-lg p-4 min-w-[60px] text-center border border-zinc-700">
                <div className="text-2xl font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 uppercase">Hours</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 min-w-[60px] text-center border border-zinc-700">
                <div className="text-2xl font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 uppercase">Minutes</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 min-w-[60px] text-center border border-zinc-700">
                <div className="text-2xl font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 uppercase">Seconds</div>
              </div>
            </div>
          </div>

          {/* Waitlist Form */}
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Join the waitlist
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Get Early Access
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">You're on the list!</h3>
              <p className="text-gray-400">We'll notify you as soon as we launch.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
