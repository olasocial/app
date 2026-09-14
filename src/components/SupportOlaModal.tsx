import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Upload,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Smartphone,
  Coins
} from 'lucide-react';
import {
  DonationMethod,
  DonationSettings,
  DonationMethodType,
  BinancePayData,
  PayPalData,
  PagoMovilData,
  BankTransferData
} from '../types';
import {
  fetchActiveDonationMethods,
  fetchDonationSettings,
  submitDonationReport,
  uploadReceiptFile,
  DEFAULT_DONATION_SETTINGS
} from '../services/donationService';
import { supabase } from '../services/supabaseClient';
import { useI18n } from '../context/I18nContext';

interface SupportOlaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportOlaModal: React.FC<SupportOlaModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_DONATION_SETTINGS);
  const [methods, setMethods] = useState<DonationMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<DonationMethod | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showTransparency, setShowTransparency] = useState<boolean>(false);

  // Voluntary reporting form state
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [reportAmount, setReportAmount] = useState<string>('');
  const [reportReference, setReportReference] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [userComment, setUserComment] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    loadData();

    // Setup Realtime subscription
    const channel = supabase
      ?.channel('realtime_public_donations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation_methods' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation_settings' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedSettings, fetchedMethods] = await Promise.all([
        fetchDonationSettings(),
        fetchActiveDonationMethods()
      ]);
      setSettings(fetchedSettings);
      setMethods(fetchedMethods);
      if (fetchedMethods.length > 0 && !selectedMethod) {
        setSelectedMethod(fetchedMethods[0]);
      }
    } catch (err) {
      console.error('Error loading donation details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, keyId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const getMethodIcon = (type: DonationMethodType) => {
    switch (type) {
      case 'BINANCE_PAY':
        return <Coins className="w-5 h-5 text-amber-500" />;
      case 'PAYPAL':
        return <CreditCard className="w-5 h-5 text-sky-600" />;
      case 'PAGO_MOVIL':
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      default:
        return <Heart className="w-5 h-5 text-rose-500" />;
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    const amt = parseFloat(reportAmount);
    if (isNaN(amt) || amt <= 0) {
      setReportError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!reportReference.trim()) {
      setReportError('El número o comprobante de referencia es requerido.');
      return;
    }

    setSubmittingReport(true);
    setReportError(null);

    try {
      let receiptUrl: string | undefined = undefined;

      if (receiptFile) {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || 'anon';
        const uploadRes = await uploadReceiptFile(receiptFile, userId);
        if (uploadRes.success && uploadRes.path) {
          receiptUrl = uploadRes.path;
        }
      }

      const res = await submitDonationReport({
        method_id: selectedMethod.id,
        method_name: selectedMethod.name,
        method_type: selectedMethod.type,
        amount: amt,
        currency: selectedMethod.currency || 'USD',
        reference: reportReference.trim(),
        donor_name: isAnonymous ? 'Donante Anónimo' : donorName.trim() || 'Donante Anónimo',
        is_anonymous: isAnonymous,
        user_comment: userComment.trim() || undefined,
        receipt_url: receiptUrl
      });

      if (res.success) {
        setReportSuccess(true);
        setIsReporting(false);
        setReportAmount('');
        setReportReference('');
        setUserComment('');
        setReceiptFile(null);
      } else {
        setReportError(res.message);
      }
    } catch (err: any) {
      setReportError(err.message || 'Error al procesar el reporte.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Render specific public payment parameters
  const renderPaymentDetails = (method: DonationMethod) => {
    const data = method.public_data || {};

    switch (method.type) {
      case 'BINANCE_PAY': {
        const bData = data as BinancePayData;
        return (
          <div className="space-y-3">
            {bData.binance_id && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-amber-800 uppercase">Binance Pay ID / Pay ID</span>
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 break-all select-all">
                    {bData.binance_id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bData.binance_id, 'binance_id')}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 shadow-2xs"
                >
                  {copiedKey === 'binance_id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'binance_id' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {bData.pay_link && (
              <a
                href={bData.pay_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs"
              >
                <span>Abrir Enlace de Binance Pay</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      }

      case 'PAYPAL': {
        const pData = data as PayPalData;
        return (
          <div className="space-y-3">
            {pData.account_email && (
              <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-sky-800 uppercase">Cuenta / Correo PayPal</span>
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 break-all select-all">
                    {pData.account_email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pData.account_email, 'paypal_email')}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-900 text-xs font-bold hover:bg-sky-100 flex items-center gap-1 shadow-2xs"
                >
                  {copiedKey === 'paypal_email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'paypal_email' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {pData.pay_link && (
              <a
                href={pData.pay_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs"
              >
                <span>Pagar con PayPal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      }

      case 'PAGO_MOVIL': {
        const pmData = data as PagoMovilData;
        return (
          <div className="space-y-2.5">
            {pmData.bank_name && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Banco:</span>
                <span className="text-xs font-extrabold text-slate-900">{pmData.bank_name}</span>
              </div>
            )}

            {pmData.phone && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Teléfono</span>
                  <span className="font-mono text-xs font-extrabold text-slate-900 select-all">{pmData.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pmData.phone, 'pm_phone')}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  {copiedKey === 'pm_phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'pm_phone' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {pmData.holder_id && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Cédula / RIF</span>
                  <span className="font-mono text-xs font-extrabold text-slate-900 select-all">{pmData.holder_id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pmData.holder_id, 'pm_id')}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  {copiedKey === 'pm_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'pm_id' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {pmData.holder_name && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Titular</span>
                  <span className="text-xs font-bold text-slate-800">{pmData.holder_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pmData.holder_name, 'pm_holder')}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  {copiedKey === 'pm_holder' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'pm_holder' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {pmData.recommended_concept && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                <span className="font-bold">Concepto sugerido: </span>
                {pmData.recommended_concept}
              </div>
            )}
          </div>
        );
      }

      case 'BANK_TRANSFER': {
        const btData = data as BankTransferData;
        return (
          <div className="space-y-2.5">
            {btData.bank_name && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Banco:</span>
                <span className="text-xs font-extrabold text-slate-900">{btData.bank_name}</span>
              </div>
            )}

            {btData.account_number && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">
                    Número de Cuenta ({btData.account_type || 'Cuenta'})
                  </span>
                  <span className="font-mono text-xs font-extrabold text-slate-900 select-all break-all">
                    {btData.account_number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(btData.account_number, 'bt_account')}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1 shrink-0"
                >
                  {copiedKey === 'bt_account' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bt_account' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {btData.holder_name && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Titular</span>
                  <span className="text-xs font-bold text-slate-800">{btData.holder_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(btData.holder_name, 'bt_holder')}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  {copiedKey === 'bt_holder' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bt_holder' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}

            {btData.holder_id && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Documento / C.I. / RIF</span>
                  <span className="font-mono text-xs font-extrabold text-slate-900 select-all">{btData.holder_id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(btData.holder_id, 'bt_id')}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  {copiedKey === 'bt_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bt_id' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="space-y-2 text-xs text-slate-700">
            {Object.entries(data).map(([key, val]) => {
              if (typeof val !== 'string' && typeof val !== 'number') return null;
              return (
                <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono font-bold text-slate-900">{String(val)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(val), key)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100"
                  >
                    {copiedKey === key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {settings.title || 'Apoyar OLA SOCIAL'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {settings.subtitle || 'Tu aporte es voluntario y ayuda a mantener y mejorar OLA SOCIAL.'}
            </p>
          </div>
        </div>

        {/* Success Alert Banner for Reported Donations */}
        {reportSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-emerald-900">¡Muchas gracias por tu generosidad!</h4>
              <p className="text-xs text-emerald-700">
                Tu reporte voluntario fue registrado y será revisado por el equipo. Gracias por mantener OLA SOCIAL libre e independiente.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            {t('common.loading')}
          </div>
        ) : methods.length === 0 ? (
          /* Empty state when admin has not published any method yet */
          <div className="py-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-800">Los métodos de apoyo aún no están configurados.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              El equipo administrador está configurando los canales oficiales de recepción. No se solicitan transferencias en cuentas no autorizadas.
            </p>
          </div>
        ) : (
          <>
            {/* Method Selection Tabs */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Selecciona un Método de Aporte:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {methods.map((m) => {
                  const isSelected = selectedMethod?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMethod(m);
                        setIsReporting(false);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        {getMethodIcon(m.type)}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {m.currency}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">{m.type.replace('_', ' ')}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Method Details Panel */}
            {selectedMethod && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">{selectedMethod.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Moneda: {selectedMethod.currency}
                      </span>
                    </div>
                    {selectedMethod.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{selectedMethod.description}</p>
                    )}
                  </div>
                </div>

                {/* Warning note if present */}
                {selectedMethod.warning_note && (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{selectedMethod.warning_note}</span>
                  </div>
                )}

                {/* Instructions */}
                {selectedMethod.instructions && (
                  <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-1">Instrucciones:</span>
                    <p className="whitespace-pre-line">{selectedMethod.instructions}</p>
                  </div>
                )}

                {/* Specific Public Payment Data with Copy Buttons */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-2">Datos para el Aporte:</span>
                  {renderPaymentDetails(selectedMethod)}
                </div>

                {/* QR Code Section if present */}
                {selectedMethod.qr_image_url && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-slate-500" />
                      Código QR para Escaneo
                    </span>
                    <img
                      src={selectedMethod.qr_image_url}
                      alt={`QR ${selectedMethod.name}`}
                      className="w-44 h-44 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] text-slate-400">Escanea directamente desde tu aplicación de pago</span>
                  </div>
                )}

                {/* Action button to Voluntary Report */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    ¿Ya realizaste el aporte voluntario fuera de la plataforma?
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReporting(!isReporting)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{isReporting ? 'Cerrar Reporte' : 'Reportar Mi Aporte'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Voluntary Donation Reporting Drawer / Form */}
            {isReporting && selectedMethod && (
              <form
                onSubmit={handleReportSubmit}
                className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    Reportar Aporte Voluntario ({selectedMethod.name})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Revisión administrativa</span>
                </div>

                {reportError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {reportError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Monto Aportado ({selectedMethod.currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={reportAmount}
                      onChange={(e) => setReportAmount(e.target.value)}
                      placeholder="Ej. 10.00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Número o Código de Referencia *
                    </label>
                    <input
                      type="text"
                      value={reportReference}
                      onChange={(e) => setReportReference(e.target.value)}
                      placeholder="Ej. 984512349 o TxID"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-sky-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonCheck"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <label htmlFor="anonCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Mantener como Donante Anónimo (Recomendado)
                    </label>
                  </div>

                  {!isAnonymous && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre o Alias Público</label>
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Ej. Amigo Solidario"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comprobante de Pago (Opcional - Imagen o PDF, máx 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReceiptFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Almacenado de forma confidencial en bucket privado con acceso restringido.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensaje o Comentario (Opcional)</label>
                  <textarea
                    rows={2}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Escribe un mensaje de apoyo para la comunidad..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReporting(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submittingReport ? 'Enviando Reporte...' : 'Enviar Reporte Voluntario'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Transparency & Disclaimer Dropdown */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowTransparency(!showTransparency)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-sky-500" />
            <span>¿Para qué se utilizan los aportes?</span>
          </button>

          {showTransparency && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1.5 animate-in fade-in">
              <p>
                <strong>Destino del apoyo: </strong>
                {settings.transparency_text ||
                  'Infraestructura en la nube, servidores de alta disponibilidad, auditorías de seguridad, optimización de velocidad y desarrollo de nuevas herramientas para la comunidad.'}
              </p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <strong>Aviso: </strong>
                {settings.disclaimer_text ||
                  'Los aportes son voluntarios. Verifica cuidadosamente los datos del método seleccionado antes de realizar cualquier transferencia o pago.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
