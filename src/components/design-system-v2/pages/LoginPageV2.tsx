'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { V2Layout } from '../V2Layout';
import { useGoogleLogin } from '@/lib/hooks';
import { toast } from 'sonner';

export const LoginPageV2 = () => {
    const router = useRouter();
    const googleLoginMutation = useGoogleLogin();

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        if (!response.credential) {
            toast.error("Failed to get Google credentials");
            return;
        }

        try {
            await googleLoginMutation.mutateAsync(response.credential);
            toast.success("Welcome to UFC Picks!");
            router.push("/");
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error instanceof Error ? error.message : "Login failed");
        }
    };

    const handleGoogleError = () => {
        toast.error("Google Sign-In failed");
    };

    return (
        <V2Layout>
            <div className="login-page">
                {/* HEADER */}
                <header className="login-header">
                    <a href="/" className="login-header__logo">UFC PICKS</a>
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
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {googleLoginMutation.isPending ? (
                                    <button className="login-btn" disabled>
                                        <svg className="login-btn__icon login-btn__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        </svg>
                                        SIGNING IN...
                                    </button>
                                ) : (
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        theme="filled_black"
                                        size="large"
                                        width="320"
                                        text="continue_with"
                                        shape="rectangular"
                                    />
                                )}
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
                            <div className="login-footer__text">V2.0.0</div>
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
