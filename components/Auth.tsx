
import React, { useState } from 'react';
import { User as AppUser } from '../types';
import { playClickSound } from '../services/audio';
import CyberButton from './CyberButton';
import Logo from './Logo';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface Props {
  onLogin: (user: AppUser, isNewUser: boolean) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);

  const mapFirebaseError = (err: AuthError) => {
    console.error("Firebase Auth Error:", err.code, err.message);
    
    // Tratamento especial para erro de domínio (CRÍTICO)
    if (err.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      setDomainError(currentDomain);
      return null; 
    }

    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return isLoginView 
          ? 'Credenciais inválidas. Verifique senha ou crie uma conta.' 
          : 'Falha no cadastro. Tente novamente.';
      case 'auth/email-already-in-use':
        return 'Email já cadastrado. Tente fazer login.';
      case 'auth/weak-password':
        return 'Senha muito fraca (mínimo 6 caracteres).';
      case 'auth/popup-closed-by-user':
        return 'Operação cancelada pelo usuário.';
      default:
        return `Erro: ${err.message}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMethod('email');
    setLoading(true);
    setError(null);
    playClickSound();

    try {
      let userCredential;
      let isNew = false;

      if (isLoginView) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        isNew = true;
      }
      
      const firebaseUser = userCredential.user;
      const appUser: AppUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
      };

      onLogin(appUser, isNew);
      
    } catch (err: any) {
      const msg = mapFirebaseError(err);
      if (msg) setError(msg);
      setLoading(false);
      setAuthMethod(null);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthMethod('google');
    setLoading(true);
    setError(null);
    playClickSound();

    try {
      const result = await signInWithPopup(auth, googleProvider);
      // O firebase indica se é novo usuário no additionalUserInfo, mas aqui vamos simplificar assumindo login
      // A menos que queiramos lógica complexa de metadata. Vamos considerar Google login sempre como "não novo" para install prompt por simplicidade, ou passar true se creationTime == lastSignInTime
      const isNew = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      const appUser: AppUser = {
        id: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || result.user.email?.split('@')[0]
      };

      onLogin(appUser, isNew);

    } catch (err: any) {
      const msg = mapFirebaseError(err);
      if (msg) setError(msg);
      setLoading(false);
      setAuthMethod(null);
    }
  }

  // --- MODAL DE ERRO DE DOMÍNIO (CRÍTICO) ---
  if (domainError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="bg-neutral-900 border-2 border-red-500 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.4)] relative">
          <div className="absolute -top-6 -left-6 bg-red-600 text-white font-bold p-4 rounded-full shadow-lg text-2xl">⚠️</div>
          <h2 className="text-2xl font-black text-red-500 mb-4 tracking-tighter uppercase">Acesso Bloqueado</h2>
          <p className="text-white mb-4">O Firebase bloqueou este domínio por segurança.</p>
          
          <div className="bg-black p-4 rounded border border-neutral-700 mb-6 font-mono text-sm break-all text-yellow-400 select-all">
            {domainError}
          </div>

          <p className="text-neutral-400 text-sm mb-6">
            <strong>COMO RESOLVER:</strong><br/>
            1. Vá no <a href="https://console.firebase.google.com/" target="_blank" className="text-emerald-500 underline">Firebase Console</a>.<br/>
            2. Menu: <em>Authentication &gt; Settings &gt; Authorized Domains</em>.<br/>
            3. Clique em "Add Domain" e cole o endereço acima.
          </p>

          <CyberButton onClick={() => window.location.reload()} className="w-full" variant="danger">
            JÁ ADICIONEI, RECARREGAR PÁGINA
          </CyberButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md relative z-10">
        
        <div className="bg-black/80 backdrop-blur-xl border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
          
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          
          <h2 className="text-center text-white mb-8 text-sm font-bold uppercase tracking-wide">
            SILENCIE O RUÍDO.<br/>
            <span className="text-emerald-500 text-lg drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse font-black">FOQUE NO ESSENCIAL.</span>
          </h2>

          {/* Toggle Login/Cadastro */}
          <div className="flex bg-neutral-900/50 p-1 rounded-lg mb-6 border border-emerald-500/20">
            <button 
              onClick={() => { setIsLoginView(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${isLoginView ? 'bg-emerald-500 text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Acessar
            </button>
            <button 
              onClick={() => { setIsLoginView(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${!isLoginView ? 'bg-emerald-500 text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider pl-1">Identidade (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-emerald-500/30 text-white p-4 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                placeholder="nome@exemplo.com"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider pl-1">Chave de Acesso (Senha)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-emerald-500/30 text-white p-4 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded text-red-200 text-xs font-mono font-bold text-center">
                {error}
              </div>
            )}

            <CyberButton 
                type="submit" 
                className="w-full mt-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                isLoading={loading && authMethod === 'email'}
                disabled={loading}
            >
                {isLoginView ? 'ENTRAR NO SISTEMA' : 'CRIAR NOVA CONTA'}
            </CyberButton>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-emerald-500/20" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-black px-2 text-neutral-500">ou acesse via satélite</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full bg-white text-black font-bold font-mono py-3 px-4 flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all clip-path-slant disabled:opacity-50 h-[50px] shadow-lg relative group overflow-hidden"
          >
             <div className="absolute inset-0 bg-emerald-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
             {loading && authMethod === 'google' ? (
               <span className="animate-pulse">CONECTANDO...</span>
             ) : (
               <>
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                 <span>ENTRAR COM GOOGLE</span>
               </>
             )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
