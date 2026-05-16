import { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Send, 
  TrainFront, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Volume2, 
  Settings,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

// Types
interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const QUICK_ACTIONS = [
  "How to energize Kavach?",
  "Brake test success process",
  "How to isolate Kavach?",
  "SOS trigger procedure",
  "Override mode rules",
  "Staff Responsible mode limit"
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'hi-IN'; // Default to Hindi

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        handleSend(transcript);
      };

      recognitionInstance.onerror = () => {
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleRecording = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      setInput('');
      recognition?.start();
      setIsRecording(true);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          history: messages 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'API Error');
      }
      
      const modelMessage: Message = { role: 'model', parts: [{ text: data.text }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      let errorText = "क्षमा करें, कुछ तकनीकी समस्या आई है।";
      const errorDetail = error.message || 'Unknown Error';
      
      if (errorDetail.includes('API_KEY_INVALID') || errorDetail.includes('API_KEY_MISSING')) {
        errorText = "API Key missing or invalid. Check your Vercel/Hosting Environment Variables (GEMINI_API_KEY).";
      } else if (errorDetail.toLowerCase().includes('quota')) {
        errorText = "API quota exceeded. Please try again later.";
      }
      
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: errorText }] }]);
      
      // If deployed, suggest checking logs
      if (window.location.hostname.includes('vercel.app')) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          parts: [{ text: `🔧 **Vercel Log:** ${errorDetail}` }] 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#05070a] text-slate-300 flex flex-col font-sans overflow-hidden antialiased selection:bg-emerald-500/30">
      {/* TOP NAVIGATION / STATUS BAR */}
      <header className="h-14 bg-[#0d1117] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <h1 className="font-mono text-sm tracking-widest text-emerald-500 uppercase font-bold">
              <span className="inline-block relative">
                KAVACH SYSTEM v4.2 // AI ASSISTANT
                <span className="absolute inset-0 bg-emerald-500/10 animate-pulse blur-sm -z-10" />
              </span>
            </h1>
          </div>
          <div className="hidden md:flex gap-8 items-center text-[11px] font-mono text-slate-500 uppercase">
            <div>LOCO ID: <span className="text-slate-200 font-bold blur-[0.5px] hover:blur-0 transition-all cursor-crosshair">WAP7-31047</span></div>
            <div>REGION: <span className="text-slate-200 blur-[0.5px] hover:blur-0 transition-all cursor-crosshair">WR / MUMBAI CENTRAL</span></div>
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-emerald-500 animate-[bounce_1s_infinite_0s] opacity-80"></div>
              <div className="w-1 h-3 bg-emerald-500 animate-[bounce_1s_infinite_0.2s] opacity-80"></div>
              <div className="w-1 h-3 bg-emerald-500 animate-[bounce_1s_infinite_0.4s] opacity-80"></div>
              <div className="w-1 h-3 bg-slate-700"></div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Scanning lines effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 bg-[length:100%_4px,3px_100%]" />
        {/* LEFT SIDE: MANUAL REFERENCE */}
        <section className="hidden lg:flex w-80 border-r border-slate-800 bg-[#080a0e] p-6 flex-col">
          <div className="mb-4 flex justify-between items-end">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Manual Context</h2>
            <span className="text-[10px] text-amber-500/80 italic tracking-wide">HANDBOOK 2024</span>
          </div>
          <div className="flex-1 border border-slate-800 rounded-lg p-5 bg-[#030406] overflow-y-auto custom-scrollbar">
            <div className="text-[13px] leading-relaxed opacity-80 space-y-4">
              <p className="border-l-2 border-slate-700 pl-3 italic text-slate-400">Reference: Kavach Operational Guidelines</p>
              
              <div className="space-y-2">
                <h3 className="text-slate-200 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  System Overview
                </h3>
                <p>KAVACH is an ATP system designed to prevent collisions and SPAD incidents. It utilizes RFID technology and UHF radio communication.</p>
              </div>

              <div className="my-6 py-4 border-y border-dashed border-slate-800">
                <div className="h-32 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800/50">
                  <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 border border-emerald-500/30 flex items-center justify-center rounded-lg bg-emerald-500/5">
                      <div className="w-8 h-1.5 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="w-16 h-[1px] bg-slate-700 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-400 rounded-full shadow-[0_0_5px_white]" />
                    </div>
                    <div className="w-12 h-12 border border-slate-700 rounded-full flex items-center justify-center text-[8px] font-mono font-bold bg-slate-800">RFID</div>
                  </div>
                </div>
                <p className="text-[9px] font-mono text-center mt-3 text-slate-500 uppercase tracking-widest">Fig 4.2: RFID Trackside Interface</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-slate-200 font-bold flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4 text-amber-500" />
                   Emergency Protocols
                </h3>
                <p>In case of communication failure for &gt;7 seconds, the system automatically triggers a service brake application.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
             <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-slate-500">
                <span>Signal Link</span>
                <span className="text-emerald-500 font-bold">READY</span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
             </div>
          </div>
        </section>

        {/* RIGHT SIDE: AI INTERACTION */}
        <section className="flex-1 flex flex-col p-4 md:p-8 bg-gradient-to-br from-[#05070a] to-[#0a121d] relative">
          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-2 space-y-8 mb-6 scroll-smooth custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto py-12">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <TrainFront className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Kavach Technical Assistant</h2>
                  <p className="text-sm text-slate-400 leading-relaxed font-serif italic max-w-sm mx-auto">
                    Athenticated access to Mumbai Division Kavach manual. Voice or text commands enabled.
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {QUICK_ACTIONS.map((action, i) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      onClick={() => handleSend(action)}
                      className="text-[10px] text-center p-3 rounded-xl bg-[#0d1117] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all border border-slate-800 shadow-sm uppercase font-mono font-bold tracking-wider"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={i}
                className={cn(
                  "flex items-start gap-4 max-w-[90%] md:max-w-[80%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg",
                  msg.role === 'user' 
                    ? "bg-slate-800 border border-slate-700 text-slate-400" 
                    : "bg-emerald-900/50 border border-emerald-500/30 text-emerald-400"
                )}>
                  {msg.role === 'user' ? 'LP' : <Mic size={14} />}
                </div>
                
                <div className={cn(
                  "px-5 py-4 rounded-2xl shadow-xl space-y-1 relative group",
                  msg.role === 'user' 
                    ? "bg-[#1c1f26] text-slate-200 rounded-tr-none border border-slate-700" 
                    : "bg-emerald-900/10 text-slate-200 rounded-tl-none border border-emerald-500/20"
                )}>
                  <div className="prose prose-sm prose-invert max-w-none prose-emerald">
                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                  </div>
                  <div className={cn(
                    "absolute -bottom-5 text-[9px] font-mono uppercase tracking-widest opacity-20 group-hover:opacity-50 transition-opacity whitespace-nowrap",
                    msg.role === 'user' ? "right-0" : "left-0"
                  )}>
                    {msg.role === 'user' ? 'PILOT_COMMS' : 'SYS_RESPONSE'} // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-2 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl w-fit">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
            )}
          </div>

          {/* INPUT CONTROLS */}
          <div className="bg-[#0d1117] border border-slate-800 rounded-3xl p-2 flex items-center gap-2 shadow-2xl relative z-10 transition-all focus-within:border-emerald-500/50 group">
            <button 
              onClick={toggleRecording}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 shrink-0",
                isRecording 
                  ? "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              <div className={cn(
                "transition-all",
                isRecording ? "w-4 h-4 rounded-full bg-white scale-125" : ""
              )}>
                {!isRecording && <Mic size={20} />}
              </div>
            </button>
            
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Bol kar ya likh kar sawal puchein..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 placeholder:text-slate-600 text-slate-200 outline-none" 
            />
            
            <div className="hidden sm:flex items-center px-4 border-l border-slate-800 gap-4">
              <div className="flex gap-1 h-4 items-end">
                <div className={cn("w-1 h-3 bg-emerald-500/50 rounded-full", isRecording && "animate-[bounce_0.6s_infinite_0s]")}></div>
                <div className={cn("w-1 h-5 bg-emerald-500/50 rounded-full", isRecording && "animate-[bounce_0.6s_infinite_0.1s]")}></div>
                <div className={cn("w-1 h-4 bg-emerald-500/50 rounded-full", isRecording && "animate-[bounce_0.6s_infinite_0.2s]")}></div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap uppercase tracking-tighter">
                VOICE: <span className={isRecording ? "text-emerald-500 font-bold" : ""}>{isRecording ? 'STREAMING' : 'READY'}</span>
              </span>
            </div>

            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-500 disabled:opacity-30 disabled:grayscale transition-all shadow-lg active:scale-95 shrink-0"
            >
               <Send size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER STATUS BAR */}
      <footer className="h-12 bg-[#05070a] border-t border-slate-800 px-6 flex items-center gap-6 shrink-0 text-slate-500 overflow-hidden">
        <div className="flex gap-4">
          <FooterBtn label="BRAKE INTERFACE" />
          <FooterBtn label="RFID MAP" />
          <FooterBtn label="GLOSSARY" />
        </div>
        <div className="ml-auto text-[10px] font-mono flex gap-8 items-center whitespace-nowrap">
          <div className="hidden sm:block">CPU TEMP: <span className="text-slate-400">42°C</span></div>
          <div className="hidden sm:block">UPTIME: <span className="text-slate-400">08:42:12</span></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse transition-all"></div>
            <span className="text-emerald-500/80 font-bold uppercase tracking-wider">● Secure Connection Active</span>
          </div>
        </div>
      </footer>

      {/* Global CSS for scrollbars */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </div>
  );
}

function FooterBtn({ label }: { label: string }) {
  return (
    <button className="px-3 py-1 rounded bg-slate-900/50 border border-slate-800 text-[10px] font-bold text-slate-400 cursor-pointer hover:border-slate-600 hover:text-slate-200 transition-all uppercase tracking-tighter">
      {label}
    </button>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
      active 
        ? "bg-[#141414] text-white shadow-md" 
        : "text-[#141414]/60 hover:bg-[#141414]/5 hover:text-[#141414]"
    )}>
      <span className={cn(
        "transition-colors",
        active ? "text-white" : "text-[#141414]/40 group-hover:text-[#141414]/60"
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

