import React, { useState, useEffect } from 'react';
import { Mail, Send, Check, Copy, CheckCircle2, Info, X } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Consulta general');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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
    if (!name.trim() || !email.trim() || !message.trim()) return;

    const recipient = 'info@mdqshow.com.ar';
    const subjectLine = `[MDQSHOW Contacto] ${subject} - ${name.trim()}`;
    const bodyContent = `Hola equipo de MDQSHOW,\n\nNombre: ${name.trim()}\nEmail: ${email.trim()}\nMotivo: ${subject}\n\nMensaje:\n${message.trim()}\n\n---\nEnviado desde MDQSHOW (mdqshow.com.ar)`;

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyContent)}`;
    window.location.href = mailtoUrl;

    setIsSent(true);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('info@mdqshow.com.ar');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleReset = () => {
    setIsSent(false);
    setMessage('');
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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Contacto</h3>
              <p className="text-xs text-slate-400">
                Escribinos a <span className="text-rose-400 font-medium">info@mdqshow.com.ar</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSent ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">¡Mensaje preparado para enviar!</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Se abrió tu cliente de correo con el mensaje dirigido a <strong className="text-slate-200">info@mdqshow.com.ar</strong>. También podés copiar nuestra dirección si querés escribir desde otra casilla.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? '¡info@mdqshow.com.ar copiado!' : 'Copiar email'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  Nuevo mensaje
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Disclaimer informativo en el formulario */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-snug">
                <p>
                  <strong className="text-slate-300">Aviso importante:</strong> MDQSHOW es una agenda cultural independiente y <strong className="text-rose-400">no vende entradas</strong> ni atiende reclamos de compras. Por devoluciones o tickets consultá directamente a la ticketera donde compraste tu pase.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Marcos Pérez"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tu Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tunombre@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Motivo de la consulta
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Consulta general">Consulta general</option>
                  <option value="Quiero anunciar o publicar un show">Quiero anunciar o publicar un show / recital</option>
                  <option value="Prensa y Acreditaciones">Prensa y Acreditaciones</option>
                  <option value="Sugerencia o corrección de datos">Sugerencia o corrección de cartelera</option>
                  <option value="Publicidad o Sponsors">Publicidad o Sponsors en MDQSHOW</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mensaje *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribí aquí tu mensaje..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center text-[11px] text-slate-400 gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>info@mdqshow.com.ar</span>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-950/40 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
