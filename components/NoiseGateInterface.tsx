
import React, { useState, useEffect, useRef } from 'react';
import { User, TaskPlan } from '../types';
import { decomposeTask } from '../services/geminiService';
import { savePlanToHistory, fetchUserHistory } from '../services/historyService';
import { playCyberpunkAlarm, playCompletionSound, playClickSound, playMissionCompleteSound } from '../services/audio';
import CyberButton from './CyberButton';
import Logo from './Logo';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Lock, 
  LogOut, 
  RefreshCw,
  Edit2,
  Trophy,
  LayoutDashboard,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Clock,
  Mic,
  MicOff
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const DEFAULT_FOCUS_TIME = 25 * 60; // 25 minutes

type ViewMode = 'INPUT' | 'PLAN' | 'SUCCESS' | 'DASHBOARD';

const NoiseGateInterface: React.FC<Props> = ({ user, onLogout }) => {
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('INPUT');
  const [history, setHistory] = useState<TaskPlan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Estados para edição de tempo
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [tempTimeInput, setTempTimeInput] = useState("");
  
  // Estado para notificação de tempo esgotado
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  const timerRef = useRef<number | null>(null);
  const titleFlashRef = useRef<number | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        playClickSound();
        recognitionRef.current.start();
      }
    } else {
      alert("Seu navegador não suporta reconhecimento de voz.");
    }
  };

  // Load active plan
  useEffect(() => {
    const savedPlan = localStorage.getItem(`noise_gate_plan_${user.id}`);
    if (savedPlan) {
      try {
        const parsedPlan = JSON.parse(savedPlan);
        setPlan(parsedPlan);
        const allCompleted = parsedPlan.steps.every((s: any) => s.is_completed);
        if (allCompleted) {
            setViewMode('SUCCESS');
        } else {
            setViewMode('PLAN');
        }
      } catch (e) {
        console.error("Failed to load saved plan", e);
      }
    }
  }, [user.id]);

  // Save active plan
  useEffect(() => {
    if (plan) {
      localStorage.setItem(`noise_gate_plan_${user.id}`, JSON.stringify(plan));
    } else {
      localStorage.removeItem(`noise_gate_plan_${user.id}`);
    }
  }, [plan, user.id]);

  // Title Flashing
  useEffect(() => {
    if (showTimeUpModal) {
      titleFlashRef.current = window.setInterval(() => {
        document.title = document.title === "⚠️ TEMPO ESGOTADO" 
          ? "NOISE GATE" 
          : "⚠️ TEMPO ESGOTADO";
      }, 1000);
    } else {
      document.title = "NOISE GATE v2.0";
      if (titleFlashRef.current) clearInterval(titleFlashRef.current);
    }
    return () => {
      if (titleFlashRef.current) clearInterval(titleFlashRef.current);
    };
  }, [showTimeUpModal]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && activeStepId && plan) {
      timerRef.current = window.setInterval(() => {
        setPlan(prevPlan => {
          if (!prevPlan) return null;

          const updatedSteps = prevPlan.steps.map(step => {
            if (step.id === activeStepId) {
              if (step.time_left <= 0) {
                setTimeout(() => handleTimeUp(), 0);
                return { ...step, time_left: 0 };
              }
              return { ...step, time_left: step.time_left - 1 };
            }
            return step;
          });

          return { ...prevPlan, steps: updatedSteps };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, activeStepId]);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    setShowTimeUpModal(true);
    playCyberpunkAlarm();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('NOISE GATE: TEMPO ESGOTADO', {
          body: 'O foco terminou. Defina o próximo passo.',
          requireInteraction: true, // Persistente
          icon: '/noise-gate-funnel-icon.png'
        });
      } catch (e) {
        console.error("Notification error", e);
      }
    }
  };

  const handleGeneratePlan = async () => {
    if (!input.trim()) return;
    requestNotificationPermission();
    setLoading(true);
    setError(null);

    try {
      const data = await decomposeTask(input);
      const newPlan: TaskPlan = {
        id: crypto.randomUUID(),
        one_thing: data.one_thing,
        steps: data.steps.map(stepText => ({
          id: crypto.randomUUID(),
          text: stepText,
          is_completed: false,
          is_active: false,
          time_left: DEFAULT_FOCUS_TIME,
          original_focus_time: DEFAULT_FOCUS_TIME
        })),
        call_to_action: data.call_to_action,
        createdAt: Date.now()
      };

      setPlan(newPlan);
      setInput("");
      setViewMode('PLAN');
      await savePlanToHistory(user, newPlan);

    } catch (err) {
      console.error(err);
      setError("FALHA DE COMUNICAÇÃO COM IA. TENTE NOVAMENTE.");
      playCyberpunkAlarm();
    } finally {
      setLoading(false);
    }
  };

  const toggleTimer = (stepId: string) => {
    if (editingTimeId) return; 
    requestNotificationPermission();

    if (activeStepId && activeStepId !== stepId) return;

    if (activeStepId === stepId) {
      setIsTimerRunning(!isTimerRunning);
    } else {
      setActiveStepId(stepId);
      setIsTimerRunning(true);
      setPlan(prev => prev ? ({
        ...prev,
        steps: prev.steps.map(s => ({
          ...s,
          is_active: s.id === stepId
        }))
      }) : null);
    }
  };

  const completeStep = (stepId: string) => {
    playCompletionSound();
    setIsTimerRunning(false);
    setActiveStepId(null);
    setShowTimeUpModal(false);
    
    setPlan(prev => {
        if (!prev) return null;
        const updatedSteps = prev.steps.map(s => 
            s.id === stepId ? { ...s, is_completed: true, is_active: false, time_left: 0 } : s
        );
        const allCompleted = updatedSteps.every(s => s.is_completed);
        if (allCompleted) {
            setTimeout(() => handleMissionComplete(), 500);
        }
        return { ...prev, steps: updatedSteps };
    });
  };

  const handleMissionComplete = () => {
    setViewMode('SUCCESS');
    playMissionCompleteSound();
  };

  const handleAddTimeRequest = () => {
    setShowTimeUpModal(false);
    if (activeStepId && plan) {
        const step = plan.steps.find(s => s.id === activeStepId);
        if (step) {
            startEditingTime(activeStepId, step.time_left);
        }
    }
  };

  const resetPlan = () => {
    setPlan(null);
    setActiveStepId(null);
    setIsTimerRunning(false);
    setInput("");
    setEditingTimeId(null);
    setShowTimeUpModal(false);
    setViewMode('INPUT');
  };

  const handleOpenDashboard = async () => {
    setLoadingHistory(true);
    setViewMode('DASHBOARD');
    const data = await fetchUserHistory(user);
    setHistory(data);
    setLoadingHistory(false);
  };

  // --- Helpers de Tempo ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const mDisplay = m.toString().padStart(2, '0');
    const sDisplay = s.toString().padStart(2, '0');
    return h > 0 ? `${h.toString().padStart(2,'0')}:${mDisplay}:${sDisplay}` : `${mDisplay}:${sDisplay}`;
  };

  const formatTimeForInput = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const parseTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':').map(p => parseInt(p.trim(), 10));
    const safeParts = parts.map(p => isNaN(p) ? 0 : p);
    if (safeParts.length === 3) return (safeParts[0] * 3600) + (safeParts[1] * 60) + safeParts[2];
    if (safeParts.length === 2) return (safeParts[0] * 60) + safeParts[1];
    if (safeParts.length === 1) return safeParts[0];
    return DEFAULT_FOCUS_TIME;
  };

  const startEditingTime = (stepId: string, currentTime: number) => {
    if (isTimerRunning && activeStepId === stepId) setIsTimerRunning(false);
    setEditingTimeId(stepId);
    setTempTimeInput(formatTimeForInput(currentTime));
  };

  const saveEditedTime = (stepId: string) => {
    if (!plan) return;
    const newSeconds = parseTimeToSeconds(tempTimeInput);
    setPlan({
        ...plan,
        steps: plan.steps.map(s => {
            if (s.id === stepId) return { ...s, time_left: newSeconds, original_focus_time: newSeconds };
            return s;
        })
    });
    setEditingTimeId(null);
    playClickSound();
    if (activeStepId === stepId) setIsTimerRunning(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, stepId: string) => {
    if (e.key === 'Enter') saveEditedTime(stepId);
    else if (e.key === 'Escape') setEditingTimeId(null);
  };

  const calculateTotalTime = (plan: TaskPlan) => {
    const totalSeconds = plan.steps.reduce((acc, step) => {
        const timeSpent = step.original_focus_time - step.time_left;
        return acc + (timeSpent > 0 ? timeSpent : 0);
    }, 0);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // --- Views ---

  if (viewMode === 'DASHBOARD') {
    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8 bg-black/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/10 shadow-2xl relative">
                <div className="flex justify-between items-center border-b border-emerald-500/30 pb-6">
                    <div className="flex items-center gap-4">
                        <Logo size="sm" className="!items-start" />
                        <div className="h-8 w-px bg-emerald-500/30 mx-2"></div>
                        <h1 className="text-xl text-white font-bold tracking-widest uppercase">Arquivos de Missão</h1>
                    </div>
                    <button 
                        onClick={() => {
                            if (plan) setViewMode(plan.steps.every(s => s.is_completed) ? 'SUCCESS' : 'PLAN');
                            else setViewMode('INPUT');
                        }} 
                        className="flex items-center gap-2 text-neutral-400 hover:text-emerald-500 transition-colors uppercase text-xs font-bold tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                </div>

                {loadingHistory ? (
                    <div className="py-20 text-center text-emerald-500 animate-pulse font-mono">RECUPERANDO DADOS CRIPTOGRAFADOS...</div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-center py-10 text-neutral-500">Nenhum registro encontrado no banco de dados.</div>
                        ) : (
                            history.map((h) => (
                                <div key={h.id} className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-500/30 transition-all hover:bg-neutral-900/60">
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase mb-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(h.createdAt).toLocaleDateString('pt-BR')} às {new Date(h.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <h3 className="text-white font-medium text-lg tracking-tight mb-1">{h.one_thing}</h3>
                                        <p className="text-neutral-500 text-sm font-mono">{h.call_to_action}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <span className="bg-emerald-900/20 text-emerald-400 px-3 py-1 rounded-md text-xs font-bold border border-emerald-500/10 whitespace-nowrap">
                                            {h.steps.length} Protocolos
                                        </span>
                                        <span className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1 whitespace-nowrap ${calculateTotalTime(h) !== '0m' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                                            <Clock className="w-3 h-3" />
                                            {calculateTotalTime(h)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
  }

  if (viewMode === 'SUCCESS' && plan) {
    return (
        <div className="min-h-screen p-4 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-1 h-20 bg-emerald-500/50 blur-xl animate-pulse"></div>
            </div>
            <div className="max-w-xl w-full bg-black/80 backdrop-blur-xl border border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.2)] rounded-3xl p-10 text-center relative z-10">
                <div className="flex justify-center mb-6">
                    <Trophy className="w-24 h-24 text-emerald-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce" />
                </div>
                
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">MISSÃO CUMPRIDA</h1>
                <p className="text-emerald-500 font-mono text-sm tracking-widest uppercase mb-8">O RUÍDO FOI ELIMINADO.</p>

                <div className="bg-neutral-900/50 p-6 rounded-xl border border-emerald-500/20 mb-8">
                    <h3 className="text-neutral-400 text-xs font-bold uppercase mb-2">Objetivo Alcançado</h3>
                    <p className="text-xl text-white font-medium">"{plan.one_thing}"</p>
                </div>

                <div className="flex flex-col gap-3">
                    <CyberButton onClick={resetPlan} className="w-full">
                        INICIAR NOVA MISSÃO
                    </CyberButton>
                    <button 
                        onClick={handleOpenDashboard}
                        className="w-full py-4 text-emerald-500 font-bold font-mono text-sm hover:bg-emerald-950/30 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30 flex items-center justify-center gap-2"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        ACESSAR HISTÓRICO
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (viewMode === 'INPUT' || !plan) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center relative">
        <div className="w-full max-w-2xl z-10 space-y-8 bg-black/60 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-emerald-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center border-b border-emerald-500/30 pb-8 relative">
            <Logo size="lg" />
            <button onClick={onLogout} className="absolute top-0 right-0 md:top-8 md:right-8 text-[10px] text-neutral-500 hover:text-white transition-colors uppercase tracking-widest">[Sair]</button>
          </div>

          <div className="space-y-6">
            <label className="block text-center text-sm md:text-xl font-bold tracking-wide text-emerald-500 max-w-lg mx-auto leading-relaxed">
              "Qual é a <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]">ÚNICA</span> Coisa que você <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]">DEVE</span> fazer <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]">AGORA</span> de modo que, ao fazê-la, o restante se torne mais fácil ou desnecessário?"
            </label>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-900 rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Escrever o relatório de vendas, Revisar código..."
                className="relative w-full bg-[#0a0a0a] text-white p-6 rounded-lg border border-emerald-500/20 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[140px] text-lg font-light placeholder:text-neutral-700 resize-none shadow-inner"
              />
              {/* Voice Button */}
              <button 
                onClick={toggleListening}
                className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_red]' : 'bg-neutral-800 text-emerald-500 hover:bg-emerald-500 hover:text-black'}`}
                title="Reconhecimento de Voz"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            
            {error && <div className="text-red-500 text-xs font-bold border border-red-500 p-3 bg-red-900/20 text-center rounded animate-pulse">{error}</div>}

            <CyberButton 
              onClick={handleGeneratePlan} 
              isLoading={loading}
              className="w-full text-lg py-5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {loading ? "PROCESSANDO DADOS..." : "ELIMINAR O RUÍDO"}
            </CyberButton>

            <div className="text-center pt-4">
                 <button 
                    onClick={handleOpenDashboard}
                    className="text-[10px] text-neutral-600 hover:text-emerald-500 uppercase tracking-widest font-bold transition-colors"
                >
                    Acessar Arquivos de Missão
                </button>
            </div>
          </div>
        </div>
        
        {/* Aviso de Notificação */}
        {notificationPermission === 'denied' && (
          <div className="absolute bottom-4 text-neutral-500 text-xs flex items-center gap-2 bg-neutral-900/80 px-4 py-2 rounded-full border border-neutral-800">
             <AlertTriangle className="w-3 h-3 text-yellow-500" />
             Habilite notificações no navegador para alertas fora da janela.
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: PLAN ---
  const progress = Math.round((plan.steps.filter(s => s.is_completed).length / plan.steps.length) * 100);

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      
      {showTimeUpModal && activeStepId && (
        <div className="fixed top-4 right-4 z-50 animate-pulse-fast">
          <div className="bg-neutral-900 border border-emerald-500 shadow-[0_0_30px_#10b981] p-6 rounded-xl max-w-sm">
            <h3 className="text-emerald-500 font-bold text-lg mb-2 flex items-center gap-2">
              ⚠️ TEMPO ESGOTADO
            </h3>
            <p className="text-white text-sm mb-4">O ciclo de foco terminou. Defina a ação.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleAddTimeRequest}
                className="flex-1 bg-neutral-800 text-emerald-500 py-2 px-3 rounded text-xs font-bold hover:bg-neutral-700 border border-emerald-500/30"
              >
                + TEMPO (EDITAR)
              </button>
              <button 
                onClick={() => completeStep(activeStepId)}
                className="flex-1 bg-emerald-500 text-black py-2 px-3 rounded text-xs font-bold hover:bg-emerald-400"
              >
                CONCLUIR TAREFA
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8 bg-black/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/10 shadow-2xl">
        
        <header className="flex justify-between items-center border-b border-emerald-500/30 pb-6">
          <div className="flex items-center gap-4">
            <Logo size="sm" className="!items-start" />
            <div className="h-8 w-px bg-emerald-500/30 mx-2"></div>
            <div>
              <h2 className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase mb-1">Missão Atual (ONE THING)</h2>
              <h1 className="text-lg md:text-xl text-white font-medium leading-tight">{plan.one_thing}</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={() => { if(window.confirm("Abortar missão?")) resetPlan() }} className="p-3 rounded-full hover:bg-white/5 text-neutral-400 hover:text-red-400 transition-colors" title="Abortar">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="p-3 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Progress Bar ENFATIZADA */}
        <div className="space-y-3">
            <div className="flex justify-between text-xs text-emerald-500/80 font-bold uppercase tracking-wider">
                <span>Progresso da Missão</span>
                <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{progress}%</span>
            </div>
            <div className="w-full h-6 bg-neutral-900 rounded-lg overflow-hidden border border-emerald-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] relative">
                <div 
                    className="h-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-white transition-all duration-700 ease-out shadow-[0_0_20px_#10b981] relative overflow-hidden flex items-center justify-end pr-2"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
            </div>
        </div>

        <div className="space-y-4 mt-8">
          {plan.steps.map((step, index) => {
            const isLocked = activeStepId !== null && activeStepId !== step.id;
            const isActive = step.id === activeStepId;
            const isEditing = editingTimeId === step.id;

            return (
              <div 
                key={step.id}
                className={`
                  relative border transition-all duration-300 rounded-xl p-6 overflow-hidden
                  ${step.is_completed ? 'border-emerald-900/30 bg-emerald-950/20 opacity-60' : ''}
                  ${isActive ? 'border-emerald-500/60 bg-emerald-900/10 shadow-[0_0_30px_rgba(16,185,129,0.1)] scale-[1.01]' : 'border-neutral-800 bg-neutral-900/40 hover:border-emerald-500/30'}
                  ${isLocked && !step.is_completed ? 'opacity-40 grayscale' : ''}
                `}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>}

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${isActive ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                        STEP 0{index + 1}
                      </span>
                      {step.is_completed && <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle className="w-3 h-3" /> CONCLUÍDO</div>}
                    </div>
                    <p className={`text-base md:text-lg font-light ${step.is_completed ? 'line-through text-neutral-500' : 'text-gray-100'}`}>
                      {step.text}
                    </p>
                  </div>

                  {!step.is_completed && (
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-neutral-800 pt-4 md:pt-0 mt-2 md:mt-0">
                      
                      <div className="relative group/timer">
                        {isEditing ? (
                             <input 
                                autoFocus
                                value={tempTimeInput}
                                onChange={(e) => setTempTimeInput(e.target.value)}
                                onBlur={() => saveEditedTime(step.id)}
                                onKeyDown={(e) => handleInputKeyDown(e, step.id)}
                                className={`font-mono text-3xl font-medium tracking-tight bg-transparent text-emerald-400 outline-none border-b border-emerald-500 w-[160px] text-center`}
                                placeholder="HH:MM:SS"
                             />
                        ) : (
                            <div 
                                onClick={() => !isLocked && startEditingTime(step.id, step.time_left)}
                                className={`
                                    font-mono text-3xl font-medium tracking-tight flex items-center gap-2 cursor-pointer transition-colors
                                    ${isActive ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-neutral-600 hover:text-emerald-500/70'}
                                    ${isLocked ? 'pointer-events-none' : ''}
                                `}
                            >
                                {formatTime(step.time_left)}
                                {!isLocked && !isActive && <Edit2 className="w-3 h-3 text-emerald-500 opacity-50 group-hover/timer:opacity-100" />}
                            </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {isLocked ? (
                          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                             <Lock className="w-5 h-5 text-neutral-600" />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleTimer(step.id)}
                              disabled={isEditing}
                              className={`p-3 rounded-lg transition-all flex items-center gap-2 ${isActive ? 'bg-emerald-500 text-black hover:bg-emerald-400 font-bold' : 'bg-neutral-800 text-emerald-500 hover:bg-neutral-700'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isActive && isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              {isActive && <span className="text-xs uppercase hidden md:inline">{isTimerRunning ? 'Pausar' : 'Focar'}</span>}
                            </button>
                            
                            {isActive && (
                               <button
                               onClick={() => completeStep(step.id)}
                               className="p-3 rounded-lg border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all"
                               title="Concluir"
                             >
                               <CheckCircle className="w-5 h-5" />
                             </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NoiseGateInterface;
