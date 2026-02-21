import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Plane } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        email: data.email,
        username: data.username,
        password: data.password,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-24 pb-20 px-5 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-navy-900/5 rounded-full blur-3xl -translate-y-1/3 -translate-x-1/3" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />
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
          <h1 className="text-3xl font-serif text-navy-900 mb-2">Create an account</h1>
          <p className="text-slate-500 text-sm">Sign up to manage your inventory.</p>
        </div>

        <div className="bg-white p-7 sm:p-8 rounded-xl shadow-card border border-slate-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
              />
              {errors.email && (
                <p id="reg-email-error" className="mt-1.5 text-xs text-red-500" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <input
                {...register('username')}
                id="reg-username"
                type="text"
                className="input"
                placeholder="Choose a username"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'reg-username-error' : undefined}
              />
              {errors.username && (
                <p id="reg-username-error" className="mt-1.5 text-xs text-red-500" role="alert">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                id="reg-password"
                type="password"
                className="input"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'reg-password-error' : undefined}
              />
              {errors.password && (
                <p id="reg-password-error" className="mt-1.5 text-xs text-red-500" role="alert">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                id="reg-confirm-password"
                type="password"
                className="input"
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="reg-confirm-error" className="mt-1.5 text-xs text-red-500" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-dark py-3 text-sm font-semibold"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
