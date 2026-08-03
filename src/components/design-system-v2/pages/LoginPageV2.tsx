'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleLogin as useGoogleOAuthLogin } from '@react-oauth/google';
import { V2Layout } from '../V2Layout';
import { useGoogleAccessTokenLogin } from '@/lib/hooks';
import { toast } from 'sonner';

export const LoginPageV2 = () => {
    const router = useRouter();
    const googleLoginMutation = useGoogleAccessTokenLogin();

    const googleLogin = useGoogleOAuthLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLoginMutation.mutateAsync(tokenResponse.access_token);
                toast.success("Welcome to UFC Picks!");
                router.push("/");
            } catch (error) {
                console.error("Login error:", error);
                toast.error(error instanceof Error ? error.message : "Login failed");
            }
        },
        onError: () => {
            toast.error("Google Sign-In failed");
        },
    });

    return (
        <V2Layout>
            <div className="login-page">
                {/* HEADER */}
                <header className="login-header">
                    <a href="/" className="login-header__logo">
                        <img src="/ufcPISK.png" alt="UFC PICKS" className="login-header__logo-img" />
                    </a>
                </header>

                {/* MAIN LOGIN CONTENT */}
                <div className="login-container">
                    <div className="login-content">
                        {/* LEFT SIDE - HERO */}
                        <div className="login-hero">
                            <div className="login-hero__icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h1 className="login-hero__title">COMPETE. PREDICT. WIN.</h1>
                            <p className="login-hero__subtitle">Join thousands of UFC fans making predictions</p>
                            
                            <div className="login-hero__features">
                                <div className="login-hero__feature">
                                    <span className="login-hero__feature-icon">&#9733;</span>
                                    <span className="login-hero__feature-text">Make picks for every fight</span>
                                </div>
                                <div className="login-hero__feature">
                                    <span className="login-hero__feature-icon">&#9830;</span>
                                    <span className="login-hero__feature-text">Climb the global leaderboard</span>
                                </div>
                                <div className="login-hero__feature">
                                    <span className="login-hero__feature-icon">&#9827;</span>
                                    <span className="login-hero__feature-text">Track your prediction accuracy</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE - LOGIN CARD */}
                        <div className="login-card">
                            <div className="login-card__header">
                                <h2 className="login-card__title">SIGN IN</h2>
                                <p className="login-card__subtitle">Access your account to make predictions</p>
                            </div>

                            {/* GOOGLE LOGIN BUTTON */}
                            <div className="google-btn-wrapper">
                                <button
                                    className="google-signin-btn"
                                    onClick={() => googleLogin()}
                                    disabled={googleLoginMutation.isPending}
                                >
                                    {googleLoginMutation.isPending ? (
                                        <svg className="google-signin-btn__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        </svg>
                                    ) : (
                                        <svg className="google-signin-btn__logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    )}
                                    <span className="google-signin-btn__text">
                                        {googleLoginMutation.isPending ? 'Signing in...' : 'Continue with Google'}
                                    </span>
                                </button>
                            </div>

                            <div className="login-card__divider">
                                <div className="login-card__divider-line"></div>
                                <span className="login-card__divider-text">Secure Login</span>
                                <div className="login-card__divider-line"></div>
                            </div>

                            <div className="login-card__footer">
                                <p className="login-card__terms">
                                    By signing in, you agree to our<br />
                                    <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="login-footer">
                    <div className="login-footer__grid">
                        <div className="login-footer__item">
                            <div className="login-footer__label">Status</div>
                            <div className="login-footer__text">ALL SYSTEMS OPERATIONAL</div>
                        </div>
                        <div className="login-footer__item">
                            <div className="login-footer__label">Version</div>
                            <div className="login-footer__text">V3.0.0</div>
                        </div>
                        <div className="login-footer__item">
                            <div className="login-footer__label">Support</div>
                            <div className="login-footer__text">HELP@UFCPICKS.COM</div>
                        </div>
                    </div>
                </footer>
            </div>
        </V2Layout>
    );
};
