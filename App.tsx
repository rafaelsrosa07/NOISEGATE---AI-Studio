import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import NoiseGateInterface from './components/NoiseGateInterface';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { User } from './types';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Capture PWA install event
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // We don't show it immediately, we wait for registration
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // Escuta mudanças reais de autenticação no Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usuário logado
        const appUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
        };
        setUser(appUser);
        setShowLanding(false); // Logged user skips landing
      } else {
        // Usuário deslogado
        setUser(null);
        // We stay on landing or auth based on interaction
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleAuthLogin = (newUser: User, isNewUser: boolean) => {
    setUser(newUser);
    // If it's a new user and we have the prompt, show it
    if (isNewUser && installPrompt) {
        setShowInstallPrompt(true);
    }
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowLanding(true); // Back to landing on logout
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const renderContent = () => {
      if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
               <div className="fixed inset-0 z-0 pointer-events-none">
                  <div className="absolute inset-0 bg-[#050505]"></div>
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px'
                    }}
                  />
               </div>
              <div className="text-emerald-500 font-mono animate-pulse tracking-widest relative z-10 flex flex-col items-center gap-4">
                  <div className="h-12 w-12 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin"></div>
                  <span>INICIALIZANDO SISTEMA...</span>
              </div>
            </div>
          );
      }

      if (user) {
          if (showInstallPrompt) {
              return <PWAInstallPrompt installPrompt={installPrompt} onInstall={handleInstallClick} onDismiss={() => setShowInstallPrompt(false)} />;
          }
          return <NoiseGateInterface user={user} onLogout={handleLogout} />;
      }

      if (showLanding) {
          return <LandingPage onStart={() => setShowLanding(false)} />;
      }

      return <Auth onLogin={handleAuthLogin} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-gray-200 font-mono">
      {/* --- FUNDO GLOBAL (CIRCUITO CYBERPUNK) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 1. Base Dark */}
        <div className="absolute inset-0 bg-[#050505]"></div>
        
        {/* 2. Grid de Circuito CSS (Linhas finas) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* 3. O "Chip" Central (Brilho Verde) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[60px] animate-pulse-fast"></div>

        {/* 4. Linhas de dados (Data streams) decorativas */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
           <defs>
             <pattern id="circuit-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
               <path d="M10 10 H 90 V 90 H 10 Z" fill="none" stroke="#10b981" strokeWidth="0.5" />
               <circle cx="10" cy="10" r="1" fill="#10b981" />
               <circle cx="90" cy="90" r="1" fill="#10b981" />
               <path d="M10 10 L 30 30" stroke="#10b981" strokeWidth="0.5" />
             </pattern>
           </defs>
           <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        </svg>
        
        {/* 5. Vinheta para focar no centro */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
      </div>

      {/* --- CONTEÚDO --- */}
      <div className="relative z-10">
        <Router>
            <Routes>
                <Route path="/" element={renderContent()} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
      </div>
    </div>
  );
};

export default App;