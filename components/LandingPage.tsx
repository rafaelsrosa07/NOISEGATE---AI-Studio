import React from 'react';
import Logo from './Logo';
import CyberButton from './CyberButton';
import { ArrowRight, Brain, Zap, Shield, Smartphone } from 'lucide-react';

interface Props {
  onStart: () => void;
}

const LandingPage: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute inset-0 z-0 bg-[#050505]">
          <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
          <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-emerald-900/10 to-transparent"></div>
       </div>

       {/* Navbar */}
       <nav className="relative z-10 flex justify-between items-center p-6 md:px-12 border-b border-emerald-500/10 backdrop-blur-sm">
         <div className="scale-75 origin-left">
            <Logo size="sm" />
         </div>
         <button 
           onClick={onStart}
           className="text-emerald-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
         >
           Acessar Sistema
         </button>
       </nav>

       {/* Hero Section */}
       <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
         <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/30 px-4 py-2 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               Sistema Operacional v2.0
            </div>

            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight">
               SILENCIE O <span className="text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">RUÍDO</span>.<br/>
               FOQUE NO <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">ESSENCIAL</span>.
            </h1>

            <p className="max-w-xl mx-auto text-neutral-400 text-lg md:text-xl leading-relaxed font-light">
               O Noise Gate utiliza Inteligência Artificial Tática para decompor objetivos complexos em passos executáveis. 
               Zero ansiedade. Resultado puro.
            </p>

            <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
               <CyberButton onClick={onStart} className="w-full md:w-auto px-12 py-5 text-lg shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  INICIAR OPERAÇÃO <ArrowRight className="inline-block ml-2 w-5 h-5" />
               </CyberButton>
            </div>
         </div>

         {/* Features Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto w-full px-4">
            <div className="bg-neutral-900/40 border border-emerald-500/20 p-6 rounded-xl backdrop-blur-md">
               <Brain className="w-8 h-8 text-emerald-500 mb-4" />
               <h3 className="text-white font-bold text-lg mb-2">IA Tática</h3>
               <p className="text-neutral-500 text-sm">Decomposição inteligente de tarefas complexas em micro-passos acionáveis.</p>
            </div>
            <div className="bg-neutral-900/40 border border-emerald-500/20 p-6 rounded-xl backdrop-blur-md">
               <Zap className="w-8 h-8 text-emerald-500 mb-4" />
               <h3 className="text-white font-bold text-lg mb-2">Foco Laser</h3>
               <p className="text-neutral-500 text-sm">Timers Pomodoro integrados com bloqueio de contexto para produtividade máxima.</p>
            </div>
            <div className="bg-neutral-900/40 border border-emerald-500/20 p-6 rounded-xl backdrop-blur-md">
               <Smartphone className="w-8 h-8 text-emerald-500 mb-4" />
               <h3 className="text-white font-bold text-lg mb-2">App Nativo</h3>
               <p className="text-neutral-500 text-sm">Instale como aplicativo no seu computador ou celular. Funciona offline.</p>
            </div>
         </div>
       </main>

       {/* Footer */}
       <footer className="relative z-10 border-t border-emerald-500/10 p-8 text-center">
          <p className="text-neutral-600 text-xs font-mono">NOISE GATE SYSTEMS © 2025 // SECURE CONNECTION ESTABLISHED</p>
       </footer>
    </div>
  );
};

export default LandingPage;