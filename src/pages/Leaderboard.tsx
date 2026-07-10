import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Trophy, Star, Medal, ArrowRight, Crown } from 'lucide-react';

interface Team {
  id: string;
  team_name: string;
  department: string;
  academic_year: string;
  logo: string;
  points: number;
}

const ShieldBadge = ({ rank, colorClass }: { rank: number, colorClass: string }) => (
  <div className={`relative w-12 h-14 flex items-center justify-center ${colorClass} mx-auto z-20`}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="absolute inset-0 w-full h-full drop-shadow-md">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
    <span className="relative z-10 font-black text-xl text-[#060913] mt-[-4px]">{rank}</span>
  </div>
);

const Wreath = ({ colorClass }: { colorClass: string }) => (
  <svg viewBox="0 0 60 40" fill="none" className={`absolute -top-1 -left-6 -right-6 w-[calc(100%+3rem)] h-12 ${colorClass} z-10 opacity-80`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 30,35 C 10,35 5,20 5,10 C 5,5 10,5 15,10 C 20,15 25,25 30,35 Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M 30,35 C 50,35 55,20 55,10 C 55,5 50,5 45,10 C 40,15 35,25 30,35 Z" fill="currentColor" fillOpacity="0.2"/>
    {/* Left leaves */}
    <path d="M 12,25 Q 5,20 10,15" />
    <path d="M 8,18 Q 2,12 8,8" />
    {/* Right leaves */}
    <path d="M 48,25 Q 55,20 50,15" />
    <path d="M 52,18 Q 58,12 52,8" />
  </svg>
);


export default function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();

    const teamsChannel = supabase
      .channel('leaderboard-teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchData();
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('leaderboard-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        checkRegistrationStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  useLayoutEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();

        if (headerRef.current) {
          tl.fromTo(
            Array.from(headerRef.current.children),
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
          );
        }

        if (podiumRef.current) {
          const podiumCards = podiumRef.current.querySelectorAll('[data-podium]');
          if (podiumCards.length > 0) {
            tl.fromTo(
              Array.from(podiumCards),
              { y: 80, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(1.2)' },
              '-=0.3'
            );
          }
        }

        if (listRef.current) {
          const listItems = listRef.current.querySelectorAll('[data-list-item]');
          if (listItems.length > 0) {
            tl.fromTo(
              Array.from(listItems),
              { x: -20, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' },
              '-=0.4'
            );
          }
        }
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading, teams]);

  const fetchData = async () => {
    setLoading(true);
    await checkRegistrationStatus();

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('points', { ascending: false });

    if (!error && data) {
      setTeams(data);
    }
    setLoading(false);
  };

  const checkRegistrationStatus = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('registration_enabled')
      .limit(1)
      .single();

    if (!error && data) {
      setIsRegistrationOpen(data.registration_enabled);
    }
  };

  const topThree = teams.slice(0, 3);
  const remaining = teams.slice(3);

  // Reorder podium: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder: (Team & { rank: number })[] = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B14] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin absolute"></div>
          <div className="w-16 h-16 border-4 border-pink-500/10 border-b-pink-500 rounded-full animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#090B14] text-slate-200 py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-x-hidden relative selection:bg-purple-500/30">

      {/* Confetti Particles */}
      <div className="fixed top-[-100px] left-[10%] w-3 h-8 bg-blue-600 rounded-sm rotate-45 opacity-80 z-0 hidden md:block animate-fall-1"></div>
      <div className="fixed top-[-100px] right-[20%] w-4 h-4 bg-yellow-500 rounded-sm -rotate-12 opacity-90 z-0 hidden md:block animate-fall-2"></div>
      <div className="fixed top-[-100px] left-[25%] w-3 h-3 bg-purple-500 rounded-sm rotate-12 opacity-60 z-0 hidden md:block animate-fall-3"></div>
      <div className="fixed top-[-100px] right-[15%] w-3 h-10 bg-pink-600 rounded-sm rotate-45 opacity-80 z-0 hidden md:block animate-fall-4"></div>
      <div className="fixed top-[-100px] right-[5%] w-4 h-4 bg-purple-600 rounded-full opacity-60 z-0 hidden md:block animate-fall-5"></div>
      <div className="fixed top-[-100px] left-[5%] w-2 h-2 bg-pink-400 rounded-full opacity-80 z-0 hidden md:block animate-fall-6"></div>
      <div className="fixed top-[-100px] left-[40%] w-2 h-6 bg-green-500 rounded-sm rotate-45 opacity-70 z-0 hidden md:block animate-fall-2"></div>
      <div className="fixed top-[-100px] right-[40%] w-3 h-3 bg-cyan-400 rounded-full opacity-70 z-0 hidden md:block animate-fall-3"></div>
      <div className="fixed top-[-100px] left-[60%] w-4 h-4 bg-orange-500 rounded-sm rotate-12 opacity-80 z-0 hidden md:block animate-fall-1"></div>
      <div className="fixed top-[-100px] right-[30%] w-2 h-8 bg-red-500 rounded-sm -rotate-45 opacity-75 z-0 hidden md:block animate-fall-6"></div>
      <div className="fixed top-[-100px] left-[75%] w-3 h-3 bg-teal-400 rounded-full opacity-65 z-0 hidden md:block animate-fall-4"></div>
      <div className="fixed top-[-100px] right-[60%] w-3 h-10 bg-indigo-500 rounded-sm rotate-12 opacity-85 z-0 hidden md:block animate-fall-5"></div>
      <div className="fixed top-[-100px] left-[85%] w-4 h-4 bg-yellow-400 rounded-sm rotate-45 opacity-90 z-0 hidden md:block animate-fall-2"></div>
      <div className="fixed top-[-100px] right-[75%] w-2 h-2 bg-rose-400 rounded-full opacity-80 z-0 hidden md:block animate-fall-1"></div>
      <div className="fixed top-[-100px] left-[30%] w-3 h-6 bg-blue-400 rounded-sm -rotate-12 opacity-70 z-0 hidden md:block animate-fall-5"></div>

      {/* Top Bar - Register Button */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
        {isRegistrationOpen ? (
          <Link
            to="/register"
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative font-semibold text-white tracking-wide text-sm">Register Team</span>
            <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/5 text-slate-500 backdrop-blur-md shadow-xl">
            <div className="w-2 h-2 rounded-full bg-red-500 opacity-70 animate-pulse"></div>
            <span className="text-sm font-medium">Registration Closed</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div ref={headerRef} className="max-w-4xl mx-auto text-center mb-16 relative z-10 pt-10 md:pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-bold tracking-widest text-purple-300 mb-6 uppercase shadow-lg">
          <Star className="w-3.5 h-3.5" />
          <span>Official Leaderboard</span>
        </div>

        <h1 className="text-5xl md:text-[5.5rem] font-black mb-6 tracking-tight leading-none">
          <span className="text-white drop-shadow-md">μ</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 drop-shadow-sm"> ARENA</span>
        </h1>

        <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-light">
          Muarena Leaderboard is a real-time competitive ranking system for tournaments
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Podium Top 3 */}
        {podiumOrder.length > 0 && (
          <div ref={podiumRef} className="flex flex-row items-end justify-center gap-4 sm:gap-6 md:gap-10 mb-24 mt-20">
            {podiumOrder.map((team) => {
              const isFirst = team.rank === 1;
              const isSecond = team.rank === 2;
              const isThird = team.rank === 3;

              let heightClass = 'h-[280px] md:h-[300px]';
              let widthClass = 'w-[140px] sm:w-44 md:w-56';
              let cardBorder = 'border-white/5';
              let cardBg = 'bg-white/[0.02]';
              let colorClass = 'text-slate-300';
              let rankColorClass = 'text-slate-300';
              
              if (isFirst) {
                heightClass = 'h-[340px] md:h-[360px]';
                widthClass = 'w-[150px] sm:w-48 md:w-64 z-10';
                cardBorder = 'border-yellow-500/50';
                cardBg = 'bg-gradient-to-b from-yellow-500/10 to-transparent';
                colorClass = 'text-yellow-400';
                rankColorClass = 'text-yellow-400';
              } else if (isSecond) {
                cardBorder = 'border-slate-300/40';
                cardBg = 'bg-gradient-to-b from-slate-400/10 to-transparent';
                colorClass = 'text-slate-300';
                rankColorClass = 'text-slate-300';
              } else if (isThird) {
                cardBorder = 'border-orange-500/40';
                cardBg = 'bg-gradient-to-b from-orange-500/10 to-transparent';
                colorClass = 'text-orange-500';
                rankColorClass = 'text-orange-500';
              }

              return (
                <div key={team.id} data-podium style={{ opacity: 0 }} className={`relative flex flex-col items-center justify-end ${widthClass}`}>
                  
                  {/* Rank Badge & Crown/Wreath */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center`}>
                    
                    {isFirst && (
                      <Crown className="w-10 h-10 md:w-12 md:h-12 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] absolute -top-10 md:-top-12 z-40" strokeWidth={1} />
                    )}
                    
                    {isSecond && <Wreath colorClass="text-slate-300" />}
                    {isThird && <Wreath colorClass="text-orange-500" />}

                    <ShieldBadge rank={team.rank} colorClass={rankColorClass} />
                  </div>

                  {/* Podium Card */}
                  <div className={`w-full rounded-[2rem] ${cardBg} border ${cardBorder} flex flex-col items-center justify-end pb-8 px-4 transition-all duration-500 overflow-visible relative ${heightClass} backdrop-blur-md shadow-2xl`}>
                    
                    {/* Glowing background behind card */}
                    {isFirst && (
                      <div className="absolute inset-0 bg-yellow-500/5 rounded-[2rem] blur-xl -z-10"></div>
                    )}
                    
                    {/* Avatar */}
                    <div className="absolute top-8 md:top-10 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/10 bg-black shadow-xl group">
                      {team.logo ? (
                        <img src={team.logo} alt={team.team_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-gradient-to-br from-slate-800 to-black text-white">
                          {team.team_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center w-full mt-auto">
                      <h3 className="font-bold text-sm md:text-lg text-center w-[95%] text-white/90 mb-1 leading-tight line-clamp-2 px-1 break-words">{team.team_name}</h3>
                      <p className="text-[10px] md:text-sm text-slate-500 truncate w-full text-center mb-4 px-1">{team.department}</p>

                      <div className={`font-black text-4xl md:text-5xl tracking-tighter ${colorClass} drop-shadow-md leading-none`}>
                        {team.points}
                      </div>
                      <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold mt-2">
                        Points
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Remaining list (4th place onwards) */}
        {remaining.length > 0 && (
          <div ref={listRef} className="space-y-3 mt-8 bg-[#090B14] rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl">
            {remaining.map((team, index) => (
              <div
                key={team.id}
                data-list-item
                style={{ opacity: 0 }}
                className="group relative bg-[#0C101C] border border-white/[0.03] hover:border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-4 md:gap-6 transition-all duration-300 hover:bg-white/[0.02]"
              >
                {/* Rank */}
                <div className="w-8 md:w-12 flex-shrink-0 flex justify-center">
                  <span className="font-black text-xl md:text-2xl text-slate-500">
                    {index + 4}
                  </span>
                </div>

                {/* Logo */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/5 bg-black flex-shrink-0 group-hover:border-white/20 transition-all duration-300 group-hover:scale-105">
                  {team.logo ? (
                    <img src={team.logo} alt={team.team_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold bg-gradient-to-br from-slate-700 to-slate-900 text-lg text-white">
                      {team.team_name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-base md:text-lg text-slate-200 truncate group-hover:text-white transition-colors">{team.team_name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-1">
                    <span className="text-xs md:text-sm text-slate-500 leading-tight">{team.department}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700 flex-shrink-0 hidden sm:block"></span>
                    <span className="text-xs md:text-sm text-slate-500 leading-tight opacity-80 sm:opacity-100">{team.academic_year}</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex items-baseline gap-1.5 flex-shrink-0 pr-2 md:pr-4">
                  <span className="font-black text-2xl md:text-3xl text-white group-hover:text-purple-400 transition-colors">{team.points}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {teams.length === 0 && (
          <div className="text-center py-32 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-xl relative overflow-hidden mt-8">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
            <Medal className="w-20 h-20 text-slate-700 mx-auto mb-6 relative z-10" strokeWidth={1} />
            <h3 className="text-2xl font-bold text-slate-300 relative z-10">The Arena is Empty</h3>
            <p className="text-slate-500 mt-3 relative z-10 max-w-sm mx-auto text-sm">
              No teams have entered yet. Be the first to register and claim the top spot!
            </p>
            {isRegistrationOpen && (
              <Link to="/register" className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/20 hover:bg-purple-600/30 transition-colors relative z-10">
                <ArrowRight className="w-4 h-4" />
                Register Now
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
