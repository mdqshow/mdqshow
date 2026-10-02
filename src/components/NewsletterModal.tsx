import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Check, 
  Copy, 
  Download, 
  Users, 
  X, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { 
  Subscriber, 
  subscribeToSubscribers, 
  saveSubscriberToCloud 
} from '../services/subscribersService';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const STORAGE_KEY_SUBSCRIBERS = 'mdqshow_subscribers';

export const NewsletterModal: React.FC<NewsletterModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
}) => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Admin subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showAdminList, setShowAdminList] = useState(false);
  const [copiedSubscribers, setCopiedSubscribers] = useState(false);

  // Load existing subscribers and listen to cloud updates
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
      if (stored) {
        setSubscribers(JSON.parse(stored));
      } else {
        const initialSubscribers: Subscriber[] = [
          {
            id: 'sub-1',
            email: 'fanrock.mdq@gmail.com',
            instantAlerts: true,
            weeklyDigest: true,
            favoriteGenre: 'Rock Nacional',
            subscribedAt: '2026-09-18'
          },
          {
            id: 'sub-2',
            email: 'recitaleslafeliz@outlook.com',
            instantAlerts: true,
            weeklyDigest: true,
            favoriteGenre: 'Todos los géneros',
            subscribedAt: '2026-09-20'
          }
        ];
        localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(initialSubscribers));
        setSubscribers(initialSubscribers);
      }
    } catch {
      // ignore
    }

    const unsubscribe = subscribeToSubscribers((cloudSubs) => {
      if (cloudSubs && cloudSubs.length > 0) {
        setSubscribers(cloudSubs);
      }
    });

    return () => unsubscribe();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailClean = email.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@') || !emailClean.includes('.')) {
      setError('Por favor ingresá un correo electrónico válido.');
      return;
    }

    const existing = subscribers.find((s) => s.email === emailClean);
    let updated: Subscriber[];

    const newSubscriber: Subscriber = {
      id: existing ? existing.id : `sub-${Date.now()}`,
      email: emailClean,
      instantAlerts: true,
      weeklyDigest: true,
      favoriteGenre: 'Todos los géneros',
      subscribedAt: new Date().toISOString().split('T')[0]
    };

    if (existing) {
      updated = subscribers.map((s) => (s.email === emailClean ? newSubscriber : s));
    } else {
      updated = [newSubscriber, ...subscribers];
    }

    setSubscribers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(updated));
    } catch {
      // storage error
    }

    // Save to Firestore in background
    saveSubscriberToCloud(newSubscriber).catch((err) => {
      console.warn('Error al guardar suscriptor en Firestore:', err);
    });

    setIsSuccess(true);
    setEmail('');
  };

  const handleCopyAllSubscribers = () => {
    const emailList = subscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emailList);
    setCopiedSubscribers(true);
    setTimeout(() => setCopiedSubscribers(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = 'Email,Alertas Inmediatas,Resumen Semanal,Genero Preferido,Fecha Suscripcion\n';
    const rows = subscribers
      .map(
        (s) =>
          `"${s.email}","${s.instantAlerts ? 'SI' : 'NO'}","${s.weeklyDigest ? 'SI' : 'NO'}","${s.favoriteGenre}","${s.subscribedAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mdqshow_suscriptores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl my-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Newsletter & Alertas</h3>
              <p className="text-xs text-slate-400">
                Enterate antes de que se agoten las entradas
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminList(!showAdminList)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Ver suscriptores registrados"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{subscribers.length}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {showAdminList && isAdmin ? (
            /* ADMIN VIEW */
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Lista de Suscriptores ({subscribers.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllSubscribers}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>{copiedSubscribers ? '¡Copiados!' : 'Copiar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {subscribers.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{sub.email}</span>
                      <span className="text-[10px] text-slate-400">
                        {sub.favoriteGenre} • {sub.subscribedAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {sub.instantAlerts && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] font-semibold">
                          Alertas
                        </span>
                      )}
                      {sub.weeklyDigest && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-semibold">
                          Semanal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAdminList(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Volver al formulario
              </button>
            </div>
          ) : isSuccess ? (
            /* SUCCESS STATE */
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">¡Te suscribiste con éxito!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Te avisaremos ni bien confirmemos nuevos recitales en La Feliz o te enviaremos el resumen semanal para tu fin de semana.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  Suscribir otro email
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : (
            /* SUBSCRIPTION FORM */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tu Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Leyenda explicativa */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 leading-relaxed space-y-1">
                <p className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Enterate antes que nadie de las novedades</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Te avisamos ni bien se confirmen nuevas fechas, visitas de artistas y preventas oficiales de recitales en Mar del Plata. Cero spam.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-950/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Bell className="w-4 h-4" />
                <span>Suscribirme a las novedades</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
