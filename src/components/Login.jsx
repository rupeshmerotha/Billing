import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for a premium feel
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/');
      } else {
        setError('Invalid username or password. Please try again.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-4 font-sans relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden relative z-10 transition-all duration-300">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-emerald-100">
              <Sprout className="w-9 h-9 text-emerald-600 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bhudev Seeds (BTC)</h1>
            <p className="text-sm text-emerald-700 font-medium">Billing Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter admin username"
                  className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-md disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>
        </div>

        {/* Credentials Help Box */}
        <div className="px-8 py-4 bg-emerald-50/60 border-t border-emerald-100 flex flex-col gap-1 items-center justify-center">
          <p className="text-xs text-emerald-800 font-semibold">Demo Credentials</p>
          <div className="flex gap-4 text-[11px] text-gray-600">
            <span>Username: <strong className="text-emerald-700 font-bold">admin</strong></span>
            <span>Password: <strong className="text-emerald-700 font-bold">admin123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
