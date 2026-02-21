import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Plane } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, token } = response.data.data;
      setAuth(user, token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-24 pb-20 px-5 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-navy-900/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
      </div>

      <div className="max-w-sm w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center">
              <Plane className="text-sky-400" size={18} />
            </div>
            <span className="text-xl font-serif text-navy-900">Flying411</span>
          </div>
          <h1 className="text-3xl font-serif text-navy-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to your account to continue.</p>
        </div>

        <div className="bg-white p-7 sm:p-8 rounded-xl shadow-card border border-slate-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-1.5 text-xs text-red-500" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                id="login-password"
                type="password"
                className="input"
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              {errors.password && (
                <p id="login-password-error" className="mt-1.5 text-xs text-red-500" role="alert">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-sm font-semibold"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
