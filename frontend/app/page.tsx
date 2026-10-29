'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { initializeAuth } from '@/store/authSlice';
import Navbar from '@/components/organisms/Navbar';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import Badge from '@/components/atoms/Badge';

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'host' | 'analytics'>('player');

  // Initialize session checks
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = joinCode.trim();
    if (!code) {
      setError('Please enter a join code.');
      return;
    }

    if (code.length !== 6 || isNaN(Number(code))) {
      setError('Join code must be a 6-digit number.');
      return;
    }

    router.push(`/quiz/${code}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink transition-colors duration-200">
      <Navbar />
      
      {/* 1. Hero Band */}
      <section className="py-16 sm:py-24 border-b border-hairline-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and Join Form */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <Badge variant="info" className="mb-6">
              ⚡ Live real-time multiplayer lobbies
            </Badge>

            <h1 className="font-display-xl text-ink tracking-tight mb-6 leading-[1.05]">
              Host Interactive Quizzes with Real-Time Leaderboards
            </h1>
            
            <p className="text-muted text-lg sm:text-xl font-medium mb-10 max-w-xl leading-relaxed">
              Create customized trivia, invite players with a 6-digit code, and watch results update instantly. Extremely responsive, low latency, and built for classrooms, meetups, and corporate teams.
            </p>

            {/* PIN Join Card */}
            <div className="w-full max-w-md bg-surface-soft border border-hairline p-8 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <span>🎮</span> Join an Active Game
              </h3>

              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <FormField error={error || undefined} label="">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN (e.g. 847291)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-xl font-bold tracking-widest h-12 border-hairline"
                    fullWidth
                  />
                </FormField>
                
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-12 text-sm font-semibold"
                >
                  Join Game Lobbies ➡️
                </Button>
              </form>
            </div>

            {/* Quick dashboard access */}
            <div className="mt-6 flex items-center gap-2 text-xs text-muted font-semibold">
              <span>Looking to run a quiz instead?</span>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-accent hover:underline cursor-pointer"
              >
                Go to Host Dashboard
              </button>
            </div>
          </div>

          {/* Right Column: Hero App Mockup Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-canvas border border-hairline rounded-xl p-6 shadow-md transition-all duration-200">
              <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/25 border border-red-500/40" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/25 border border-yellow-500/40" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/25 border border-green-500/40" />
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-soft tracking-wider">LOBBY #847291</span>
              </div>

              {/* Mini App UI Viewport */}
              <div className="bg-surface-soft border border-hairline rounded-lg p-5 min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-badge-violet uppercase bg-badge-violet/10 border border-badge-violet/20 px-2 py-0.5 rounded-full">
                      Question 4 of 10
                    </span>
                    <span className="text-xs font-mono font-bold text-error bg-error/10 px-2 py-0.5 rounded border border-error/20">
                      ⏱️ 08s
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-ink leading-snug mb-4">
                    Which Next.js routing directory is used for newer React Server Component architectures?
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="border border-hairline bg-canvas p-3 rounded-md text-xs font-semibold text-muted text-left">
                    A. pages/
                  </div>
                  <div className="border border-accent/30 bg-accent/5 p-3 rounded-md text-xs font-semibold text-accent text-left ring-2 ring-accent/15">
                    B. app/ ✓
                  </div>
                  <div className="border border-hairline bg-canvas p-3 rounded-md text-xs font-semibold text-muted text-left">
                    C. routing/
                  </div>
                  <div className="border border-hairline bg-canvas p-3 rounded-md text-xs font-semibold text-muted text-left">
                    D. src/
                  </div>
                </div>

                <div className="border-t border-hairline pt-3 flex justify-between items-center text-[11px] text-muted-soft font-semibold">
                  <span>👥 14 players joined</span>
                  <span className="text-badge-emerald bg-badge-emerald/10 px-2 py-0.5 rounded">WebSocket Connected</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Interactive Product Switcher Section */}
      <section className="py-24 bg-surface-soft border-b border-hairline-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="font-display-lg text-ink tracking-tight mb-4 leading-tight">
              One Platform. Fully Interactive Experience.
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
              Explore how LiveQuiz synchronizes game states seamlessly between player devices, the big-screen leaderboard, and host dashboard.
            </p>
          </div>

          {/* nav-pill-group tabs */}
          <div className="inline-flex p-1 bg-surface-strong border border-hairline rounded-full mb-12">
            <button
              onClick={() => setActiveTab('player')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'player'
                  ? 'bg-canvas text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              📱 Player Interface
            </button>
            <button
              onClick={() => setActiveTab('host')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'host'
                  ? 'bg-canvas text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              🖥️ Live Leaderboards
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-canvas text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              📊 Host Analytics
            </button>
          </div>

          {/* Interactive Screen Container */}
          <div className="max-w-4xl mx-auto bg-canvas border border-hairline rounded-xl p-8 shadow-sm text-left transition-all duration-300">
            {activeTab === 'player' && (
              <div className="animate-scale-in">
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="primary">MOBILE VIEW</Badge>
                  <span className="text-xs text-muted-soft font-semibold">Rendered at player aspect ratio</span>
                </div>
                <div className="max-w-sm mx-auto border border-hairline rounded-xl p-4 bg-surface-soft">
                  <div className="text-center py-6 border-b border-hairline mb-4">
                    <span className="text-xs text-muted uppercase font-bold tracking-widest block mb-1">Time Remaining</span>
                    <span className="text-3xl font-mono font-bold text-ink">14.8s</span>
                  </div>
                  <h4 className="text-sm font-bold text-ink mb-6 text-center">
                    Select the correct answer to gain maximum points:
                  </h4>
                  <div className="flex flex-col gap-3">
                    <button className="w-full py-3 px-4 bg-canvas border border-hairline hover:border-ink rounded-md text-xs text-ink font-semibold text-left transition-colors">
                      Option A: HTTP Polling
                    </button>
                    <button className="w-full py-3 px-4 bg-canvas border border-accent text-accent bg-accent/5 rounded-md text-xs font-bold text-left transition-colors ring-2 ring-accent/10">
                      Option B: WebSocket Protocol ✓
                    </button>
                    <button className="w-full py-3 px-4 bg-canvas border border-hairline hover:border-ink rounded-md text-xs text-ink font-semibold text-left transition-colors">
                      Option C: Server Sent Events (SSE)
                    </button>
                  </div>
                  <div className="mt-6 text-center text-xs text-muted-soft font-semibold">
                    ⚡ Fast response gives +250 extra speed points!
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'host' && (
              <div className="animate-scale-in">
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="success">LOBBY SUMMARY</Badge>
                  <span className="text-xs text-muted-soft font-semibold">Watch scores update in real-time</span>
                </div>
                <div className="border border-hairline rounded-lg overflow-hidden bg-surface-soft">
                  <div className="p-4 border-b border-hairline bg-canvas flex justify-between items-center">
                    <h4 className="text-sm font-bold text-ink">Lobby Leaderboard — Question 8/10</h4>
                    <span className="text-xs text-muted font-bold">14 Active Players</span>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {[
                      { rank: 1, name: 'Alex Johnson', score: 7850, diff: '+980 pts', change: 'up' },
                      { rank: 2, name: 'Sarah Miller', score: 7510, diff: '+920 pts', change: 'up' },
                      { rank: 3, name: 'Daniel Craig', score: 7200, diff: '+850 pts', change: 'none' },
                      { rank: 4, name: 'Emma Watson', score: 6890, diff: '0 pts', change: 'down' },
                    ].map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-canvas border border-hairline p-3.5 rounded-md">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted w-4">{row.rank}</span>
                          <span className="text-sm font-bold text-ink">{row.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-semibold text-badge-emerald bg-badge-emerald/10 border border-badge-emerald/20 px-2 py-0.5 rounded">
                            {row.diff}
                          </span>
                          <span className="text-sm font-bold text-ink">{row.score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-scale-in">
                <div className="flex items-center gap-2 mb-6">
                  <Badge variant="warning">HOST METRICS</Badge>
                  <span className="text-xs text-muted-soft font-semibold">Post-game review dashboard</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border border-hairline p-4 rounded-lg bg-surface-soft">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">Total Attendees</span>
                    <span className="text-2xl font-bold text-ink">142 Players</span>
                    <div className="text-xs text-badge-emerald font-semibold mt-2">✓ 98% attendance rate</div>
                  </div>
                  <div className="border border-hairline p-4 rounded-lg bg-surface-soft">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">Avg Answer Time</span>
                    <span className="text-2xl font-bold text-ink">3.82 Seconds</span>
                    <div className="text-xs text-muted-soft font-semibold mt-2">⚡ 0.4s faster than global average</div>
                  </div>
                  <div className="border border-hairline p-4 rounded-lg bg-surface-soft">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">Pass Percentage</span>
                    <span className="text-2xl font-bold text-ink">84.5%</span>
                    <div className="text-xs text-badge-emerald font-semibold mt-2">📈 High question accuracy</div>
                  </div>
                </div>
                <div className="border border-hairline rounded-lg p-4 bg-surface-soft">
                  <h5 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Difficulty Breakdown (Hardest Questions)</h5>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-ink">Q5. WebSocket handshake headers</span>
                        <span className="text-error">Only 24% correct</span>
                      </div>
                      <div className="h-2 bg-surface-strong rounded-full overflow-hidden">
                        <div className="h-full bg-error" style={{ width: '24%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-ink">Q2. Redux state rehydration</span>
                        <span className="text-badge-orange">45% correct</span>
                      </div>
                      <div className="h-2 bg-surface-strong rounded-full overflow-hidden">
                        <div className="h-full bg-badge-orange" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-24 border-b border-hairline-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display-lg text-ink tracking-tight mb-4 leading-tight">
              Engineered for Seamless Engagement
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
              Everything you need to host large-scale, high-fidelity trivia nights and interactive lectures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-surface-card rounded-lg p-8 border border-hairline flex flex-col items-start text-left shadow-sm">
              <div className="w-10 h-10 rounded-md bg-canvas border border-hairline flex items-center justify-center text-lg mb-6 shadow-sm">
                💬
              </div>
              <h3 className="text-lg font-bold text-ink mb-3">Ultra-low Latency</h3>
              <p className="text-muted text-sm leading-relaxed font-medium">
                Powered by Socket.io, game lobbies sync instantly. Players answer within milliseconds and witness immediate updates on the live leaderboard.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-card rounded-lg p-8 border border-hairline flex flex-col items-start text-left shadow-sm">
              <div className="w-10 h-10 rounded-md bg-canvas border border-hairline flex items-center justify-center text-lg mb-6 shadow-sm">
                ⚙️
              </div>
              <h3 className="text-lg font-bold text-ink mb-3">Fully Customizable</h3>
              <p className="text-muted text-sm leading-relaxed font-medium">
                Add multiple choice answers, set strict countdown timers, and manage individual quiz sessions directly from a clean host dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-card rounded-lg p-8 border border-hairline flex flex-col items-start text-left shadow-sm">
              <div className="w-10 h-10 rounded-md bg-canvas border border-hairline flex items-center justify-center text-lg mb-6 shadow-sm">
                📈
              </div>
              <h3 className="text-lg font-bold text-ink mb-3">Deep Session Analytics</h3>
              <p className="text-muted text-sm leading-relaxed font-medium">
                Track leaderboard positions over time, analyze common incorrect answers, and export complete player logs to review host stats.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Testimonials Section */}
      <section className="py-24 bg-surface-soft border-b border-hairline-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-display-lg text-ink tracking-tight mb-4 leading-tight">
              Loved by Creators & Educators
            </h2>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
              Read how people utilize our platform to host real-time games at code academies, company events, and schools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "We hosted a 120-person trivia quiz at our React Dev Meetup. The live scoreboards updated instantly and the competitive vibe was amazing. Setting it up took under 5 minutes.",
                name: "Marcus Vance",
                role: "Meetup Organizer",
                initials: "MV",
                bg: "bg-badge-orange/15 text-badge-orange",
              },
              {
                quote: "Our classrooms have completely changed. Students join lobbies in seconds using the 6-digit pin. Detailed statistics help me understand what topics need review.",
                name: "Dr. Clara Sheng",
                role: "Professor of Computer Science",
                initials: "CS",
                bg: "bg-badge-pink/15 text-badge-pink",
              },
              {
                quote: "Best tool for remote team bonding. The responsive UI works flawlessly on phone browsers, and we didn't experience any of the latency lag that other apps suffer from.",
                name: "Devon Reed",
                role: "Engineering Manager",
                initials: "DR",
                bg: "bg-badge-violet/15 text-badge-violet",
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-canvas border border-hairline rounded-lg p-6 text-left shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-badge-orange text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-body text-sm leading-relaxed mb-6 font-medium">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                
                <div className="flex items-center gap-3 border-t border-hairline pt-4">
                  <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center text-xs font-bold select-none`}>
                    {t.initials}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-ink">{t.name}</h5>
                    <span className="text-[10px] text-muted font-bold block">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
             

      {/* 6. Pre-footer CTA Band */}
      <section className="py-20 bg-canvas">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface-card border border-hairline rounded-lg p-10 sm:p-12 text-center shadow-sm">
            <h2 className="font-display-sm text-ink mb-4 tracking-tight leading-tight">
              Smarter, Simpler Real-Time Quizzing
            </h2>
            <p className="text-muted text-sm sm:text-base mb-8 max-w-md mx-auto">
              Join thousands of creators hosting engaging trivia rooms, tests, and lobbies today. Set up in less than 30 seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" onClick={() => router.push('/auth/signup')}>
                Create Free Account
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Host Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Dark Footer */}
      <footer className="bg-surface-dark text-on-dark-soft py-16 border-t border-surface-dark-elevated transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            
            {/* Left Brand Col */}
            <div className="md:col-span-4 flex flex-col items-start">
              <span className="text-lg font-black tracking-tight text-white mb-4">
                livequiz<span className="text-accent font-bold">.</span>
              </span>
              <p className="text-xs text-on-dark-soft/75 max-w-xs leading-relaxed font-semibold">
                An interactive real-time platform built for multiplayer quizzes, lobbies, and performance analytics.
              </p>
            </div>

            {/* Right Link Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h5>
                <ul className="flex flex-col gap-2.5 text-xs font-semibold">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Real-time Lobbies</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Leaderboards</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Solutions</h5>
                <ul className="flex flex-col gap-2.5 text-xs font-semibold">
                  <li><a href="#" className="hover:text-white transition-colors">Classrooms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Office Trivia</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Meetups</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Hackathons</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h5>
                <ul className="flex flex-col gap-2.5 text-xs font-semibold">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Newsroom</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h5>
                <ul className="flex flex-col gap-2.5 text-xs font-semibold">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookie Settings</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                </ul>
              </div>
            </div>

          </div>

          <div className="border-t border-surface-dark-elevated pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-on-dark-soft/50 font-bold">
            <span>&copy; {new Date().getFullYear()} LiveQuiz. All rights reserved.</span>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">GitHub</a>
              <a href="#" className="hover:text-white">Discord</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
