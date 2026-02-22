import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar, Users, BookOpen, Award } from 'lucide-react';
import { api } from '@/utils/api';


export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student',
    department: '',
    student_id: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        onLogin(response.data.token, response.data.user);
        toast.success('Welcome back!');
      } else {
        await api.post('/auth/register', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role || 'student',
          department: formData.department || 'IT',
          student_id: formData.student_id || '123',
        });

        toast.success('Account created! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      console.log(error);
      console.log(error.response);
      toast.error(error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div>
            <h1 className="text-6xl font-bold text-indigo-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              CampusPulse
            </h1>
            <p className="text-2xl text-gray-600 mb-8">
              University Event Management System
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-900 transition-colors">
                <Calendar className="w-6 h-6 text-indigo-900 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Scheduling</h3>
                <p className="text-gray-600">Manage seminars, workshops, and cultural programs</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-400 transition-colors">
                <Users className="w-6 h-6 text-rose-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Easy Registration</h3>
                <p className="text-gray-600">One-click registration for students</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-400 transition-colors">
                <BookOpen className="w-6 h-6 text-amber-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
                <p className="text-gray-600">Get instant notifications about events</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Award className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Track Participation</h3>
                <p className="text-gray-600">Monitor attendance and generate reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-600">
                {isLogin ? 'Sign in to continue' : 'Join the campus community'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Department"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  {formData.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                      <input
                        type="text"
                        name="student_id"
                        value={formData.student_id}
                        onChange={handleChange}
                        placeholder="Student ID"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  )}
                </div>
              )}

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-900 text-white py-3 rounded-xl font-semibold hover:bg-indigo-800 transition-colors disabled:opacity-60"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-900 hover:text-indigo-700 font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
