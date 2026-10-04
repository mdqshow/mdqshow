import React, { useMemo, useState } from 'react';
import { Download, Users, Check, AlertCircle } from 'lucide-react';
import { Subscriber, markSubscribersExported } from '../services/subscribersService';
import { downloadSubscribersCsv, formatSubscriberDate } from '../utils/subscribersExport';

interface SubscribersPanelProps {
  subscribers: Subscriber[];
}

const PREVIEW_COUNT = 20;

/**
 * Lista de suscriptores al newsletter con descarga en CSV.
 * Firebase conserva SIEMPRE a todos. "Nuevos" son los que todavía no se descargaron.
 */
export const SubscribersPanel: React.FC<SubscribersPanelProps> = ({ subscribers }) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Más recientes primero
  const sorted = useMemo(
    () => [...subscribers].sort((a, b) => (b.subscribedAt || '').localeCompare(a.subscribedAt || '')),
    [subscribers]
  );
  const pending = useMemo(() => sorted.filter((s) => !s.exportedAt), [sorted]);
  const lastExport = useMemo(
    () => subscribers.reduce((max, s) => (s.exportedAt && s.exportedAt > max ? s.exportedAt : max), ''),
    [subscribers]
  );
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW_COUNT);

  const handleDownload = async (kind: 'nuevos' | 'todos') => {
    const list = kind === 'nuevos' ? pending : sorted;
    if (list.length === 0 || busy) return;

    // 1) Se genera el archivo con el estado actual (NUEVO / Ya descargado)
    downloadSubscribersCsv(list, kind);

    // 2) Recién después se marcan como descargados los que estaban pendientes (no se borra nada)
    setBusy(true);
    try {
      await markSubscribersExported(pending.map((s) => s.id));
      setMessage({
        type: 'ok',
        text:
          kind === 'nuevos'
            ? `Se descargaron ${list.length} suscriptores nuevos. Siguen guardados en Firebase y los podés volver a bajar con "Descargar todos".`
            : `Se descargaron los ${list.length} suscriptores. Desde ahora "nuevos" serán solo los que se sumen después.`,
      });
    } catch (err) {
      console.warn('No se pudo marcar a los suscriptores como descargados:', err);
      setMessage({
        type: 'warn',
        text: 'El archivo se descargó bien, pero no se pudo marcar a los suscriptores como ya descargados. La próxima vez "nuevos" podría repetir algunos.',
      });
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 9000);
    }
  };

  return (
    <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
      {/* Resumen y botones de descarga */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm">
          <span className="text-slate-300">
            Total guardados: <strong className="text-white">{sorted.length}</strong>
          </span>
          <span className="text-slate-300">
            Nuevos (sin descargar): <strong className="text-amber-300">{pending.length}</strong>
          </span>
          <span className="text-slate-400">Última descarga: {lastExport ? formatSubscriberDate(lastExport) : 'todavía no descargaste'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload('nuevos')}
            disabled={pending.length === 0 || busy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Descarga solo los suscriptores que se sumaron desde la última descarga"
          >
            <Download className="w-4 h-4" />
            Descargar nuevos ({pending.length})
          </button>
          <button
            type="button"
            onClick={() => handleDownload('todos')}
            disabled={sorted.length === 0 || busy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Descarga la lista completa de suscriptores"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Descargar todos ({sorted.length})
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Descargar no borra nada: todos los suscriptores quedan siempre guardados en Firebase. El archivo (CSV) se abre con Excel y
          tiene una columna "Estado" que indica cuáles eran nuevos.
        </p>

        {message && (
          <div
            className={`flex items-start gap-2 p-2.5 rounded-xl text-xs border ${
              message.type === 'ok'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            {message.type === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Lista */}
      {sorted.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Users className="w-6 h-6 text-slate-600" />
          Todavía no hay suscriptores.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Alta</th>
                <th className="px-3 py-2 font-semibold hidden sm:table-cell">Preferencias</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {visible.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/60">
                  <td className="px-3 py-2 text-slate-100 break-all">{s.email}</td>
                  <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{formatSubscriberDate(s.subscribedAt)}</td>
                  <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">
                    {[s.instantAlerts ? 'Alertas' : null, s.weeklyDigest ? 'Resumen semanal' : null, s.favoriteGenre ? s.favoriteGenre : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {s.exportedAt ? (
                      <span className="text-slate-500 text-[11px]">Descargado</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                        NUEVO
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full py-2.5 text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-slate-900/60 transition-colors cursor-pointer border-t border-slate-800"
            >
              {showAll ? 'Ver solo los más recientes' : `Ver los ${sorted.length} suscriptores`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscribersPanel;
