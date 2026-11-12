import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { UserPlus, Landmark, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../lib/api';
import { getUser, setAuth, type User as AuthUser } from '../../lib/auth';

interface RegisterFormValues {
  name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const existingUser = getUser();
  const [registeredUser, setRegisteredUser] = useState<AuthUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (existingUser && !registeredUser) {
      navigate('/citizen/dashboard', { replace: true });
    }
  }, [existingUser, registeredUser, navigate]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (payload: { token: string; user: AuthUser }) => {
      setAuth(payload.token, payload.user);
      setRegisteredUser(payload.user);
      try {
        localStorage.setItem('cm_kerala_new_user', 'true');
      } catch {}
      toast.success('Registration successful! Welcome to CM Keralam Portal.');
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration failed';
      toast.error(msg);
    },
  });

  return (
    <PageLayout>
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#1a5c38] flex items-center justify-center mb-3">
              <Landmark className="w-6 h-6 text-[#f4d068]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Citizen Registration</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create your account to submit and track grievances
            </p>
          </div>

          <form
            onSubmit={handleSubmit((data) => registerMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                placeholder="e.g. Anjali Menon"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="anjali@example.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                {...register('mobile', {
                  required: 'Mobile number is required',
                  minLength: { value: 10, message: 'Enter a valid 10-digit mobile number' },
                })}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
              />
              {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters required' },
                  })}
                  placeholder="Create a password"
                  className="w-full px-3.5 py-2.5 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === getValues('password') || 'Passwords do not match',
                  })}
                  placeholder="Re-enter your password"
                  className="w-full px-3.5 py-2.5 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              {registerMutation.isPending ? 'Creating Account...' : 'Create Citizen Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already registered?{' '}
            <Link to="/login" className="text-[#1a5c38] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Welcome Pop-up for Newly Registered Citizen */}
      {registeredUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 text-center space-y-5 relative overflow-hidden">
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1a5c38] via-[#c9a227] to-[#1a5c38]" />

            {/* Success icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#1a5c38] flex items-center justify-center mx-auto ring-8 ring-emerald-50/60 border border-emerald-200">
              <CheckCircle2 className="w-7 h-7 text-[#1a5c38]" />
            </div>

            {/* Header & greeting */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a5c38] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Account Created Successfully
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                Welcome, {registeredUser.name}!
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your citizen account is ready to use.
              </p>
            </div>

            {/* Simple visual 3-step explanation */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                How CM Keralam works:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                  <div className="text-base mb-0.5">✍️</div>
                  <div className="text-xs font-bold text-gray-800">1. Submit</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">AI pre-fills your form</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                  <div className="text-base mb-0.5">🏛️</div>
                  <div className="text-xs font-bold text-gray-800">2. Review</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">CMO reviews & assigns</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                  <div className="text-base mb-0.5">✅</div>
                  <div className="text-xs font-bold text-gray-800">3. Resolve</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">Officers fix & report</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('cm_kerala_new_user');
                  } catch {}
                  navigate('/how-it-works');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <span>See Full How It Works Guide</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('cm_kerala_new_user');
                  } catch {}
                  navigate('/citizen/dashboard', { replace: true });
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Go Directly to My Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
