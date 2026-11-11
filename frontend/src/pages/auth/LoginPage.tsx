import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Shield, UserCheck, Building2, User, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../lib/api';
import { getUser, setAuth, type User as AuthUser } from '../../lib/auth';

interface LoginFormValues {
  email: string;
  password: string;
}

function redirectPathForRole(role: string) {
  if (role === 'CMO_ADMIN') return '/cmo/dashboard';
  if (role === 'OFFICER') return '/officer/dashboard';
  return '/citizen/dashboard';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const existingUser = getUser();

  useEffect(() => {
    if (existingUser) {
      navigate(redirectPathForRole(existingUser.role), { replace: true });
    }
  }, [existingUser, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await api.post('/api/auth/login', data);
      return res.data?.data ?? res.data;
    },
    onSuccess: (payload: { token: string; user: AuthUser }) => {
      setAuth(payload.token, payload.user);
      toast.success(`Welcome back, ${payload.user.name}!`);
      navigate(redirectPathForRole(payload.user.role), { replace: true });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Invalid email or password';
      toast.error(msg);
    },
  });

  const fillDemo = (email: string, label: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Demo@1234', { shouldValidate: true });
    toast.success(`Filled ${label} demo credentials`);
  };

  return (
    <PageLayout>
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#1a5c38] flex items-center justify-center mb-3">
                <Landmark className="w-6 h-6 text-[#f4d068]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Portal Login</h1>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to access your Citizen, CMO, or Officer dashboard
              </p>
            </div>

            <form
              onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
                />
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1a5c38] hover:bg-[#2d7a52] text-white font-semibold transition-colors disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don’t have a citizen account?{' '}
              <Link to="/register" className="text-[#1a5c38] font-semibold hover:underline">
                Register here
              </Link>
            </div>
          </div>

          {/* 1-Click Demo Credentials Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9a7813] mb-3">
              <Shield className="w-4 h-4" />
              Quick Demo Credentials (Password: Demo@1234)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('citizen@demo.com', 'Citizen')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-xs font-semibold text-gray-800 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#1a5c38]" />
                Citizen
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cmo@demo.com', 'CMO Admin')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-xs font-semibold text-gray-800 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#c9a227]" />
                CMO Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('officer@demo.com', 'Dept Officer')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-xs font-semibold text-gray-800 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                Officer (PWD)
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
