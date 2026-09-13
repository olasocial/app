import React, { useState } from 'react';
import { BookOpen, ShieldCheck, FileText, HelpCircle, AlertCircle } from 'lucide-react';

interface LegalDocsModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy' | 'compliance' | 'guides';
  onClose: () => void;
}

export const LegalDocsModal: React.FC<LegalDocsModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'compliance' | 'guides'>(
    initialTab
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600 shrink-0" />
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Centro Legal y de Ayuda</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-3 sm:px-6 pt-2 gap-1 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 sm:pb-3 px-2 text-xs font-bold transition-colors whitespace-nowrap border-b-2 shrink-0 ${
              activeTab === 'terms'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Términos de Servicio
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 sm:pb-3 px-2 text-xs font-bold transition-colors whitespace-nowrap border-b-2 shrink-0 ${
              activeTab === 'privacy'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Privacidad
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-2.5 sm:pb-3 px-2 text-xs font-bold transition-colors whitespace-nowrap border-b-2 shrink-0 ${
              activeTab === 'compliance'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cumplimiento
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`pb-2.5 sm:pb-3 px-2 text-xs font-bold transition-colors whitespace-nowrap border-b-2 shrink-0 ${
              activeTab === 'guides'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Guías & FAQ
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Términos y Condiciones de OLA SOCIAL (2026)</h4>
              <p className="p-3 bg-amber-50 rounded-xl text-amber-900 border border-amber-200">
                <strong>Aviso legal: </strong> Estos términos no sustituyen asesoramiento jurídico.
              </p>
              <p>
                <strong>1. Naturaleza de la plataforma: </strong> OLA SOCIAL es una red de descubrimiento y colaboración auténtica. Facilita el encuentro voluntario entre personas interesadas en contenido creador sin intermediar transacciones de seguidores ni engagement ficticio.
              </p>
              <p>
                <strong>2. Prohibición estricta de bots y fraude: </strong> Queda terminantemente prohibido el uso de scripts, click-farms, bots de seguimiento o cualquier automatización dirigida a alterar métricas en plataformas externas.
              </p>
              <p>
                <strong>3. Principio de No Garantía: </strong> OLA SOCIAL no promete ni garantiza seguidores, reproducciones o ventas en redes externas. El alcance obtenido es producto exclusivo de interacciones humanas voluntarias.
              </p>
              <p>
                <strong>4. Moderación y Suspensión: </strong> El equipo administrativo mantiene el derecho de suspender o revocar el acceso a cuentas que incurran en colusión, spam o evidencia falsa.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Política de Privacidad y Manejo de Datos</h4>
              <p>
                <strong>Datos recopilados: </strong> Correo electrónico autenticado mediante Google OAuth, nombre visible, identificadores públicos de redes sociales vinculadas voluntariamente y registros de auditoría de actividad interna.
              </p>
              <p>
                <strong>Finalidad: </strong> Organizar perfiles públicos, validar tareas voluntarias y mantener la seguridad contra bots.
              </p>
              <p>
                <strong>Seguridad y Terceros: </strong> Los datos se almacenan en infraestructura segura de Supabase y Vercel. Nunca comercializamos datos con intermediarios de publicidad invasiva.
              </p>
              <p>
                <strong>Derecho de Supresión: </strong> Puedes solicitar en cualquier momento la eliminación de tu cuenta en el Centro de Seguridad.
              </p>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Capa Central de Cumplimiento de Plataformas (Section 2)</h4>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900 border border-emerald-100">
                <strong>Compromiso OLA SOCIAL: </strong> No almacenamos contraseñas externas, cookies ni sesiones. Todas las acciones se abren en la plataforma oficial del creador para navegación humana.
              </div>
              <p>
                <strong>Prácticas Prohibidas: </strong> Follow-for-follow automático, sub-for-sub mecánico, scraping agresivo no autorizado, comentarios masivos y evasión de filtros antifraude de redes como YouTube, TikTok o Meta.
              </p>
            </div>
          )}

          {activeTab === 'guides' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Centro de Ayuda y Preguntas Frecuentes</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">¿Qué es un "Abrazo"?</span>
                Es un acto voluntario de apoyo humano: descubrir el perfil de otro creador, conocer su canal, ver un video inspirador o dejar un comentario reflexivo.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">¿Por qué mi perfil queda LOCKED?</span>
                Para evitar que usuarios maliciosos cambien de perfil después de recibir apoyos o intenten registrar la cuenta de otra persona.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">¿Cómo funciona el Ranking?</span>
                Se basa en una puntuación ponderada: porcentaje de validación, calificación en estrellas (1 a 5) y antigüedad, premiando la constancia real sobre el spam.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-xs hover:bg-sky-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
