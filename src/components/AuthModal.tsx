'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Brain,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
}) => {
  const { theme } = useTheme();
  const { loginWithEmail, signupWithEmail, loginWithGoogle, sendPasswordReset, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleModeChange = (newMode: 'login' | 'signup' | 'forgot-password') => {
    setMode(newMode);
    setLocalError(null);
    setResetSent(false);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (mode === 'forgot-password') {
      if (!email || !email.trim()) {
        setLocalError('Veuillez renseigner votre adresse email.');
        return;
      }
      setIsSubmitting(true);
      try {
        await sendPasswordReset(email.trim());
        setResetSent(true);
      } catch (err: any) {
        setLocalError(err.message || 'Échec de l\'envoi du lien de réinitialisation.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setLocalError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, displayName.trim() || undefined);
      }
      if (onClose) onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Échec de la connexion Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all relative ${
          theme === 'dark'
            ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-purple-950/30'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête décoratif avec Logo Syntropy */}
        <div className="pt-8 pb-4 px-6 text-center flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-purple-500/30 flex items-center justify-center">
              <img src="/logo.png" alt="Syntropy Logo" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center shadow">
              <Shield className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Syntropy <span className="text-purple-500 font-mono text-lg">OS</span>
          </h2>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {mode === 'login'
              ? 'Connectez-vous pour retrouver votre espace personnel.'
              : mode === 'signup'
              ? 'Créez votre compte personnel sécurisé.'
              : 'Récupérez l\'accès à votre compte en toute sécurité.'}
          </p>
        </div>

        {/* Onglets Commutateur Connexion / Inscription ou Bouton Retour */}
        {mode !== 'forgot-password' ? (
          <div className="px-6 mb-4">
            <div className={`grid grid-cols-2 p-1 rounded-xl border ${
              theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'login'
                    ? theme === 'dark'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'bg-white text-zinc-900 shadow-sm'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? theme === 'dark'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'bg-white text-zinc-900 shadow-sm'
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Créer un compte
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 mb-3">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </button>
          </div>
        )}

        {/* Message d'erreur */}
        {activeError && (
          <div className="mx-6 mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 font-medium">{activeError}</span>
          </div>
        )}

        {/* Vue de confirmation mot de passe oublié envoyé */}
        {mode === 'forgot-password' && resetSent ? (
          <div className="px-6 pb-6 space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex flex-col items-center text-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Email de réinitialisation envoyé !
                </h4>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Un lien sécurisé a été expédié à l'adresse{' '}
                  <strong className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}>{email}</strong>.
                </p>
                <p className={`text-[11px] mt-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Cliquez sur ce lien pour choisir un nouveau mot de passe. Pensez à vérifier vos courriers indésirables (spams).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Retour à la connexion</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Formulaire Principal */
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Votre Prénom ou Nom d'utilisateur
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'bg-zinc-900/80 border-zinc-800 focus-within:border-purple-500'
                    : 'bg-zinc-50 border-zinc-300 focus-within:border-purple-600'
                }`}>
                  <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Nathan"
                    className={`w-full bg-transparent border-none outline-none text-xs ${
                      theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {mode === 'forgot-password' ? 'Adresse Email de votre compte' : 'Adresse Email'}
              </label>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-900/80 border-zinc-800 focus-within:border-purple-500'
                  : 'bg-zinc-50 border-zinc-300 focus-within:border-purple-600'
              }`}>
                <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className={`w-full bg-transparent border-none outline-none text-xs ${
                    theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
              </div>
              {email.trim().toLowerCase() === 'ndebeaupuis@gmail.com' && mode !== 'forgot-password' && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-500 dark:text-amber-400 font-semibold animate-in fade-in duration-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>Compte Super-Administrateur reconnu</span>
                </div>
              )}
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Mot de passe
                </label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'bg-zinc-900/80 border-zinc-800 focus-within:border-purple-500'
                    : 'bg-zinc-50 border-zinc-300 focus-within:border-purple-600'
                }`}>
                  <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-transparent border-none outline-none text-xs ${
                      theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Option Mot de passe oublié (affiché en mode connexion) */}
                {mode === 'login' && (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot-password')}
                      className={`text-[11px] font-medium transition-colors hover:underline ${
                        theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                      }`}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Se connecter'
                      : mode === 'signup'
                      ? 'Créer mon compte Syntropy'
                      : 'Envoyer le lien de réinitialisation'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Séparateur et Google Sign-in uniquement en mode login / signup */}
            {mode !== 'forgot-password' && (
              <>
                <div className="relative py-2 flex items-center justify-center">
                  <div className={`w-full border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`} />
                  <span className={`absolute px-3 text-[10px] uppercase font-mono tracking-wider font-semibold ${
                    theme === 'dark' ? 'bg-zinc-950 text-zinc-500' : 'bg-white text-zinc-400'
                  }`}>
                    ou
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                    theme === 'dark'
                      ? 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                      : 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </button>
              </>
            )}

            {canDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`w-full text-center text-xs py-1 transition-colors ${
                  theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
                }`}
              >
                Fermer
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
