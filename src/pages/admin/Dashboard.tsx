import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Users, Settings as SettingsIcon, Trash2, TrendingUp, TrendingDown, Star, Home, Menu, X } from 'lucide-react';

interface Team {
  id: string;
  team_name: string;
  department: string;
  academic_year: string;
  logo: string;
  points: number;
  created_at: string;
}

export default function Dashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'settings'>('teams');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
        return;
      }
      await fetchData();
    };
    init();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Settings fetch error:', settingsError);
    }
    if (settingsData) {
      setRegistrationEnabled(settingsData.registration_enabled);
      setSettingsId(settingsData.id);
    }

    // Fetch Teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('points', { ascending: false });

    if (teamsError) {
      console.error('Teams fetch error:', teamsError);
    }
    if (teamsData) {
      setTeams(teamsData);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  const toggleRegistration = async () => {
    if (!settingsId) {
      toast.error('Settings not loaded. Please refresh the page.');
      return;
    }

    const newValue = !registrationEnabled;
    const { error } = await supabase
      .from('settings')
      .update({ registration_enabled: newValue })
      .eq('id', settingsId);

    if (error) {
      console.error('Toggle error:', error);
      toast.error(`Error: ${error.message}`);
    } else {
      setRegistrationEnabled(newValue);
      toast.success(`Registration is now ${newValue ? '✅ OPEN' : '🔒 CLOSED'}`);
    }
  };

  const updatePoints = async (id: string, currentPoints: number, change: number) => {
    const newPoints = Math.max(0, currentPoints + change);
    const { error } = await supabase.from('teams').update({ points: newPoints }).eq('id', id);

    if (error) {
      console.error('Points update error:', error);
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success(`Points updated to ${newPoints}`);
      setTeams(prev =>
        prev.map(t => t.id === id ? { ...t, points: newPoints } : t)
          .sort((a, b) => b.points - a.points)
      );
    }
  };

  const setCustomPoints = async (id: string) => {
    const value = parseInt(pointsInput[id] || '0', 10);
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    const { error } = await supabase.from('teams').update({ points: value }).eq('id', id);

    if (error) {
      console.error('Points set error:', error);
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success(`Points set to ${value}`);
      setTeams(prev =>
        prev.map(t => t.id === id ? { ...t, points: value } : t)
          .sort((a, b) => b.points - a.points)
      );
      setPointsInput(prev => ({ ...prev, [id]: '' }));
    }
  };

  const deleteTeam = async (id: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        toast.error(`Error: ${error.message}`);
      } else {
        toast.success(`"${teamName}" deleted successfully`);
        setTeams(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const totalTeams = teams.length;
  const totalDepartments = new Set(teams.map(t => t.department)).size;
  const highestScore = teams.length > 0 ? Math.max(...teams.map(t => t.points)) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col md:flex-row">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Admin Panel
        </h2>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0F19]/95 border-b border-white/10 p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('teams'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'teams' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
          >
            <Users className="w-5 h-5" /> Teams
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}
          >
            <SettingsIcon className="w-5 h-5" /> Settings
          </button>
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 transition-colors">
            <Home className="w-5 h-5" /> View Leaderboard
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="w-64 bg-white/5 border-r border-white/10 p-6 flex-col hidden md:flex min-h-screen">
        <h2 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Admin Panel
        </h2>

        <div className="space-y-2 flex-grow">
          <button
            onClick={() => setActiveTab('teams')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'teams' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <Users className="w-5 h-5" /> Teams
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <SettingsIcon className="w-5 h-5" /> Settings
          </button>
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <Home className="w-5 h-5" /> View Leaderboard
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-auto"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-xl">
            <h3 className="text-gray-400 text-xs md:text-sm font-medium mb-2">Total Teams</h3>
            <p className="text-2xl md:text-3xl font-bold">{totalTeams}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-xl">
            <h3 className="text-gray-400 text-xs md:text-sm font-medium mb-2">Departments</h3>
            <p className="text-2xl md:text-3xl font-bold">{totalDepartments}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-xl">
            <h3 className="text-gray-400 text-xs md:text-sm font-medium mb-2">Highest Score</h3>
            <p className="text-2xl md:text-3xl font-bold text-yellow-400">{highestScore}</p>
          </div>
          <div
            onClick={toggleRegistration}
            className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all group"
            title="Click to toggle registration"
          >
            <h3 className="text-gray-400 text-xs md:text-sm font-medium mb-2">Registration</h3>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm md:text-lg ${registrationEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {registrationEnabled ? '✅ OPEN' : '🔒 CLOSED'}
              </span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${registrationEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${registrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">Click to toggle</p>
          </div>
        </div>

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold">Registered Teams</h2>
                <span className="text-sm text-gray-400">{totalTeams} teams</span>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Rank</th>
                      <th className="px-6 py-4 font-medium">Team</th>
                      <th className="px-6 py-4 font-medium">Department & Year</th>
                      <th className="px-6 py-4 font-medium">Points</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No teams registered yet.</td>
                      </tr>
                    ) : (
                      teams.map((team, index) => (
                        <tr key={team.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-400">#{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                {team.logo ? (
                                  <img src={team.logo} alt={team.team_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold bg-purple-600 text-xs">
                                    {team.team_name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold">{team.team_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span>{team.department}</span>
                              <span className="text-xs text-gray-400">{team.academic_year}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-yellow-400">{team.points}</span>
                              <Star className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                min="0"
                                placeholder="Set"
                                value={pointsInput[team.id] || ''}
                                onChange={(e) => setPointsInput(prev => ({ ...prev, [team.id]: e.target.value }))}
                                className="w-16 bg-black/40 border border-gray-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() => setCustomPoints(team.id)}
                                className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded hover:bg-purple-600/50 transition-colors"
                              >
                                Set
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => updatePoints(team.id, team.points, 10)}
                                className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                                title="Add 10 Points"
                              >
                                <TrendingUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updatePoints(team.id, team.points, -10)}
                                className="p-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg transition-colors"
                                title="Deduct 10 Points"
                              >
                                <TrendingDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTeam(team.id, team.team_name)}
                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors ml-2"
                                title="Delete Team"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-3">
                {teams.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No teams registered yet.</p>
                ) : (
                  teams.map((team, index) => (
                    <div key={team.id} className="bg-black/20 border border-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-gray-400 font-bold">#{index + 1}</span>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                          {team.logo ? (
                            <img src={team.logo} alt={team.team_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold bg-purple-600 text-xs">
                              {team.team_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold">{team.team_name}</h4>
                          <p className="text-xs text-gray-400">{team.department} • {team.academic_year}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-yellow-400 text-lg">{team.points}</span>
                          <Star className="w-3 h-3 text-yellow-500 inline ml-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updatePoints(team.id, team.points, 10)} className="flex-1 p-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">+10</button>
                        <button onClick={() => updatePoints(team.id, team.points, -10)} className="flex-1 p-2 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-bold">-10</button>
                        <input
                          type="number"
                          min="0"
                          placeholder="Set"
                          value={pointsInput[team.id] || ''}
                          onChange={(e) => setPointsInput(prev => ({ ...prev, [team.id]: e.target.value }))}
                          className="w-14 bg-black/40 border border-gray-700 text-white text-xs rounded px-2 py-2 focus:outline-none focus:border-purple-500"
                        />
                        <button onClick={() => setCustomPoints(team.id)} className="p-2 bg-purple-600/30 text-purple-300 rounded-lg text-xs font-bold">Set</button>
                        <button onClick={() => deleteTeam(team.id, team.team_name)} className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-xl max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">System Settings</h2>

            <div className="flex items-center justify-between p-6 bg-black/20 rounded-xl border border-white/5">
              <div className="flex-grow mr-4">
                <h3 className="text-lg font-bold">Team Registration</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Enable or disable public registration for teams. When disabled, the registration page will be blocked.
                </p>
              </div>

              <button
                onClick={toggleRegistration}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  registrationEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span className="sr-only">Toggle Registration</span>
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    registrationEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 p-4 bg-black/10 rounded-xl border border-white/5">
              <p className="text-sm text-gray-400">
                Current Status: <span className={`font-bold ${registrationEnabled ? 'text-green-400' : 'text-red-400'}`}>{registrationEnabled ? '✅ Registration is OPEN' : '🔒 Registration is CLOSED'}</span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
