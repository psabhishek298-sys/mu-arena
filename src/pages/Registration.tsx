import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';

export default function Registration() {
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('registration_enabled')
        .limit(1)
        .single();

      if (!error && data) {
        setIsRegistrationOpen(data.registration_enabled);
      } else {
        setIsRegistrationOpen(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  useLayoutEffect(() => {
    if (isRegistrationOpen && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
      });
      return () => ctx.revert();
    }
  }, [isRegistrationOpen]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only PNG, JPG, and WEBP files are allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));

      // Animate the preview appearing
      setTimeout(() => {
        if (previewRef.current) {
          gsap.fromTo(previewRef.current,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4 }
          );
        }
      }, 50);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!logoFile) {
      toast.error('Please upload a team logo');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Logo to Storage
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `team-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      const logoUrl = publicUrlData.publicUrl;

      // 2. Insert into Database
      const { error: insertError } = await supabase
        .from('teams')
        .insert({
          team_name: teamName,
          department: department,
          academic_year: academicYear,
          logo: logoUrl,
          points: 0,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('A team from this Department and Academic Year has already been registered.');
        }
        throw insertError;
      }

      toast.success('🎉 Team registered successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isRegistrationOpen === null) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Registration Closed
  if (isRegistrationOpen === false) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Closed</h2>
          <p className="text-gray-400 mb-6">Team Registration is currently closed by the administrator.</p>
          <Link to="/" className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            Return to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">

        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back to Leaderboard
        </Link>

        <div ref={containerRef} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl" style={{ opacity: 0 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
              Team Registration
            </h1>
            <p className="text-gray-400">Join the ultimate competition and claim your spot on the leaderboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team Name *</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-black/30 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="e.g. Code Ninjas"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select Department</option>
                  <option value="BCA">BCA</option>
                  <option value="Bcom finance">Bcom finance</option>
                  <option value="Bcom corparation">Bcom corparation</option>
                  <option value="English">English</option>
                  <option value="BBA">BBA</option>
                  <option value="Food Tecnolagy">Food Tecnolagy</option>
                  <option value="Botany">Botany</option>
                  <option value="Zoology">Zoology</option>
                  <option value="Physiscs">Physiscs</option>                 
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Academic Year *</label>
                <select
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select Year</option>
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="PG">PG</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team Logo * (Max 5MB)</label>

              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-xl hover:border-purple-500 transition-colors bg-black/20 group relative cursor-pointer"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />

                {logoPreview ? (
                  <div ref={previewRef} className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500">
                    <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white">Change Logo</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    <div className="flex text-sm text-gray-400 justify-center">
                      <span className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl py-4 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:shadow-none mt-8"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Registering...
                </div>
              ) : (
                'Submit Registration'
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
