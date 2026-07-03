
import React, { useState, useEffect } from 'react';
import { login, createUserAccount } from '../services/api';
import PwaInstallModal from '../components/PwaInstallModal';

interface LoginPageProps {
    onLoginSuccess: (token: string, id: number, remember: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showInstallModal, setShowInstallModal] = useState(false);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const wasDismissed = sessionStorage.getItem('pwaInstallModalDismissed') === 'true';
        
        if (!isStandalone && !wasDismissed) {
            const timer = setTimeout(() => {
                setShowInstallModal(true);
            }, 2000); // Show modal after 2 seconds
            return () => clearTimeout(timer);
        }
    }, []);

    const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('نام کاربری و رمز عبور الزامی است.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const hashedPassword = await hashPassword(password);
            const response = await login(username, hashedPassword);
            if (response.token && response.id) {
                onLoginSuccess(response.token, response.id, rememberMe);
            } else {
                setError('خطا در ورود: توکن یا شناسه کاربر دریافت نشد.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'یک خطای ناشناخته رخ داد.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || !confirmPassword) {
            setError('تمام فیلدها الزامی است.');
            return;
        }
        if (password !== confirmPassword) {
            setError('رمزهای عبور مطابقت ندارند.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const hashedPassword = await hashPassword(password);
            await createUserAccount(username, hashedPassword);
            setSuccessMessage('کاربر جدید با موفقیت ایجاد شد. اکنون می‌توانید وارد شوید.');
            setIsLoginView(true);
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'یک خطای ناشناخته رخ داد.');
        } finally {
            setLoading(false);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccessMessage(null);
    };
    
    const handleRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setRememberMe(isChecked);
        localStorage.setItem('rememberMe', String(isChecked));
    };

    const title = isLoginView ? 'ورود به سامانه' : 'ایجاد حساب کاربری جدید';
    const subTitle = isLoginView ? 'لطفا برای ورود اطلاعات خود را وارد کنید' : 'برای ایجاد حساب کاربری، فرم زیر را تکمیل کنید';

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-300">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                     <h1 className="text-3xl font-bold text-sky-700 dark:text-sky-500">AutoLead</h1>
                     <p className="text-slate-500 dark:text-slate-400 mt-2">{subTitle}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg transition-colors duration-300">
                    <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">{title}</h2>

                    {successMessage && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center text-sm mb-4" role="alert">
                            <p>{successMessage}</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center text-sm mb-4" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={isLoginView ? handleLoginSubmit : handleSignUpSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                نام کاربری
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                                disabled={loading}
                                aria-label="Username"
                            />
                        </div>
                        <div>
                             <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                رمز عبور
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                                disabled={loading}
                                aria-label="Password"
                            />
                        </div>
                        {!isLoginView && (
                             <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    تکرار رمز عبور
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                                    disabled={loading}
                                    aria-label="Confirm Password"
                                />
                            </div>
                        )}
                         {isLoginView && (
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={handleRememberChange}
                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded ml-2"
                                />
                                <label htmlFor="remember-me" className="text-sm text-slate-600 dark:text-slate-400">
                                    مرا به خاطر بسپار
                                </label>
                            </div>
                        )}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow disabled:bg-sky-400 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>در حال پردازش...</span>
                                    </>
                                ) : (
                                    isLoginView ? 'ورود' : 'ایجاد حساب'
                                )}
                            </button>
                        </div>
                    </form>
                     <div className="text-center mt-6">
                        <button onClick={toggleView} className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:underline">
                            {isLoginView ? 'حساب کاربری ندارید؟ ایجاد کنید' : 'حساب کاربری دارید؟ وارد شوید'}
                        </button>
                    </div>
                </div>
                 <footer className="text-center mt-8 text-slate-500 dark:text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} Hoseini Khodro. All rights reserved.
                </footer>
            </div>
            <PwaInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
        </div>
    );
};

export default LoginPage;
