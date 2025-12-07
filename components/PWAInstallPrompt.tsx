import React from 'react';
import CyberButton from './CyberButton';
import { Download, X } from 'lucide-react';

interface Props {
  installPrompt: any;
  onInstall: () => void;
  onDismiss: () => void;
}

const PWAInstallPrompt: React.FC<Props> = ({ installPrompt, onInstall, onDismiss }) => {
  if (!installPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
       <div className="bg-neutral-900 border border-emerald-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.2)] relative animate-fadeIn">
          <button 
            onClick={onDismiss}
            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center border border-emerald-500/50">
               <Download className="w-8 h-8 text-emerald-500 animate-bounce" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-center text-white mb-2 uppercase tracking-tight">
             Instalar Aplicativo
          </h2>
          <p className="text-center text-neutral-400 mb-8 text-sm leading-relaxed">
             Para máxima performance e acesso offline, instale o <strong>NOISE GATE</strong> diretamente no seu dispositivo.
          </p>

          <div className="space-y-3">
             <CyberButton onClick={onInstall} className="w-full shadow-lg">
                INSTALAR AGORA
             </CyberButton>
             <button 
               onClick={onDismiss}
               className="w-full py-3 text-neutral-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
             >
                Continuar no Navegador
             </button>
          </div>
       </div>
    </div>
  );
};

export default PWAInstallPrompt;