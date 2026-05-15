import React, { useMemo, useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Invoice, Patient, Service } from '../types';
import type {
  InvoiceSavePayload,
  ConsultationProvider,
  ConsultationProviderSource,
} from '../services/billing';
import type { PaymentMethod } from '../services/paymentMethods';

interface AddEditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: InvoiceSavePayload) => Promise<void>;
  invoice?: Invoice | null;
  mode: 'add' | 'edit';
  patients: Patient[];
  services: Service[];
  paymentMethods: PaymentMethod[];
  consultationProviders?: ConsultationProvider[];
}

const SERVICE_OPTION_PREFIX = 'service:';

const providerLookupKey = (source: ConsultationProviderSource, id: string) => `${source}|${id}`;

const consultOptionValue = (source: ConsultationProviderSource, id: string) =>
  `consult|${source}|${id}`;

const parseConsultOptionValue = (
  value: string
): { source: ConsultationProviderSource; id: string } | null => {
  if (!value.startsWith('consult|')) return null;
  const parts = value.split('|');
  if (parts.length < 3) return null;
  const source = parts[1] as ConsultationProviderSource;
  if (source !== 'user' && source !== 'specialist' && source !== 'therapist') return null;
  const id = parts.slice(2).join('|');
  if (!id) return null;
  return { source, id };
};

const formatSpecialization = (value?: string | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase();
};

const titleForProvider = (p: ConsultationProvider): string => {
  const spec = formatSpecialization(p.specialization);
  const roleLabel = p.role === 'specialist' ? 'specialist' : 'therapist';
  const base = spec ? `${p.name} — ${spec} ${roleLabel}` : `${p.name} — ${roleLabel}`;
  const rateHint =
    p.source === 'user'
      ? 'Consultation rates page'
      : p.role === 'specialist'
      ? 'Specialist hourly rate'
      : 'Therapist hourly rate';
  const feeLabel =
    p.consultationFee > 0 ? `${p.consultationFee.toLocaleString()} UGX` : 'set rate first';
  return `${base} (${rateHint}: ${feeLabel})`;
};

const formatDateForInput = (value?: string, fallback?: Date): string => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  const d = fallback ?? new Date();
  return d.toISOString().split('T')[0];
};

const newRowKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

type DraftLine = {
  key: string;
  kind: 'service' | 'consultation';
  serviceId: string;
  consultSource: ConsultationProviderSource | '';
  consultEntityId: string;
  quantity: number;
  unitPrice: number;
  description: string;
};

const emptyDraftLine = (): DraftLine => ({
  key: newRowKey(),
  kind: 'service',
  serviceId: '',
  consultSource: '',
  consultEntityId: '',
  quantity: 1,
  unitPrice: 0,
  description: '',
});

const draftLinesFromInvoice = (invoice?: Invoice | null): DraftLine[] => {
  if (!invoice) {
    return [emptyDraftLine()];
  }
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    return invoice.lineItems.map((li) => {
      const isUserConsult = !!li.consultationProviderId;
      const isSpecConsult = !!li.consultationSpecialistId;
      const isTherConsult = !!li.consultationTherapistId;
      const isConsult = isUserConsult || isSpecConsult || isTherConsult;
      return {
        key: newRowKey(),
        kind: isConsult ? 'consultation' : 'service',
        serviceId: isConsult ? '' : li.serviceId,
        consultSource: isUserConsult
          ? 'user'
          : isSpecConsult
          ? 'specialist'
          : isTherConsult
          ? 'therapist'
          : '',
        consultEntityId: isUserConsult
          ? String(li.consultationProviderId)
          : isSpecConsult
          ? String(li.consultationSpecialistId)
          : isTherConsult
          ? String(li.consultationTherapistId)
          : '',
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        description: li.description,
      };
    });
  }
  if (invoice.serviceId) {
    return [
      {
        key: newRowKey(),
        kind: 'service',
        serviceId: invoice.serviceId,
        consultSource: '',
        consultEntityId: '',
        quantity: 1,
        unitPrice: invoice.amount ?? 0,
        description: invoice.description || invoice.serviceName || '',
      },
    ];
  }
  return [emptyDraftLine()];
};

export default function AddEditInvoiceModal({
  isOpen,
  onClose,
  onSave,
  invoice,
  mode,
  patients,
  services,
  paymentMethods,
  consultationProviders = [],
}: AddEditInvoiceModalProps) {
  const providerByKey = useMemo(() => {
    const map = new Map<string, ConsultationProvider>();
    consultationProviders.forEach((p) => map.set(providerLookupKey(p.source, p.id), p));
    return map;
  }, [consultationProviders]);
  const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(formatDateForInput());
  const [dueDate, setDueDate] = useState(formatDateForInput(undefined, defaultDue));
  const [status, setStatus] = useState<Invoice['status']>('pending');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyDraftLine()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chargesLocked = mode === 'edit' && invoice?.status !== 'pending';

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setIsSubmitting(false);
    setError(null);
    if (invoice && mode === 'edit') {
      setPatientId(invoice.patientId);
      setDate(formatDateForInput(invoice.date));
      setDueDate(formatDateForInput(invoice.dueDate, defaultDue));
      setStatus(invoice.status);
      setPaymentMethod(invoice.paymentMethod ?? '');
      setDescription(invoice.description);
      setLines(draftLinesFromInvoice(invoice));
    } else {
      setPatientId('');
      setDate(formatDateForInput());
      setDueDate(formatDateForInput(undefined, defaultDue));
      setStatus('pending');
      setPaymentMethod('');
      setDescription('');
      setLines([emptyDraftLine()]);
    }
  }, [invoice, mode, isOpen]);

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const onItemPick = (key: string, value: string) => {
    const consultParsed = parseConsultOptionValue(value);
    if (consultParsed) {
      const provider = providerByKey.get(
        providerLookupKey(consultParsed.source, consultParsed.id)
      );
      if (!provider) return;
      const spec = formatSpecialization(provider.specialization);
      const roleLabel = provider.role === 'specialist' ? 'specialist' : 'therapist';
      const descriptionSuffix = spec ? ` (${spec} ${roleLabel})` : ` (${roleLabel})`;
      updateLine(key, {
        kind: 'consultation',
        consultSource: consultParsed.source,
        consultEntityId: consultParsed.id,
        serviceId: '',
        unitPrice: provider.consultationFee > 0 ? provider.consultationFee : 0,
        description: `Consultation — ${provider.name}${descriptionSuffix}`,
      });
      return;
    }

    const serviceId = value.startsWith(SERVICE_OPTION_PREFIX)
      ? value.slice(SERVICE_OPTION_PREFIX.length)
      : value;
    if (!serviceId) {
      updateLine(key, {
        kind: 'service',
        serviceId: '',
        consultSource: '',
        consultEntityId: '',
        unitPrice: 0,
        description: '',
      });
      return;
    }
    const svc = services.find((s) => s.id === serviceId);
    updateLine(key, {
      kind: 'service',
      serviceId,
      consultSource: '',
      consultEntityId: '',
      unitPrice: svc?.price ?? 0,
      description: svc?.name ?? '',
    });
  };

  const currentItemValue = (row: DraftLine): string => {
    if (row.kind === 'consultation' && row.consultSource && row.consultEntityId) {
      return consultOptionValue(row.consultSource, row.consultEntityId);
    }
    if (row.kind === 'service' && row.serviceId) {
      return `${SERVICE_OPTION_PREFIX}${row.serviceId}`;
    }
    return '';
  };

  const lineHasSelection = (row: DraftLine): boolean =>
    (row.kind === 'service' && !!row.serviceId) ||
    (row.kind === 'consultation' && !!row.consultSource && !!row.consultEntityId);

  const addLine = () => {
    setLines((prev) => [...prev, emptyDraftLine()]);
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const lineTotal = (row: DraftLine) => Math.round(row.quantity * row.unitPrice * 100) / 100;
  const invoiceTotal = lines.reduce((sum, row) => sum + lineTotal(row), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payloadLines = lines
        .filter((row) => lineHasSelection(row))
        .map((row) => {
          const base = {
            quantity: Math.max(1, Math.floor(row.quantity)),
            unitPrice: row.unitPrice,
            description: row.description.trim() || undefined,
          };
          if (row.kind === 'consultation') {
            if (row.consultSource === 'user') {
              return { ...base, consultationProviderId: row.consultEntityId };
            }
            if (row.consultSource === 'specialist') {
              return { ...base, consultationSpecialistId: row.consultEntityId };
            }
            if (row.consultSource === 'therapist') {
              return { ...base, consultationTherapistId: row.consultEntityId };
            }
            throw new Error('Invalid consultation line');
          }
          return { ...base, serviceId: row.serviceId };
        });

      if (payloadLines.length === 0) {
        setError('Add at least one service or consultation line.');
        setIsSubmitting(false);
        return;
      }

      if (!patientId) {
        setError('Select a patient.');
        setIsSubmitting(false);
        return;
      }

      if (!description.trim()) {
        setError('Invoice description / memo is required.');
        setIsSubmitting(false);
        return;
      }

      const payload: InvoiceSavePayload = {
        patientId,
        date,
        dueDate,
        description: description.trim(),
        status,
        paymentMethod: status === 'paid' ? (paymentMethod || undefined) : undefined,
        lines: chargesLocked && invoice?.lineItems?.length
          ? invoice.lineItems.map((li) => {
              const base = {
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                description: li.description,
              };
              if (li.consultationProviderId) {
                return { ...base, consultationProviderId: li.consultationProviderId };
              }
              if (li.consultationSpecialistId) {
                return { ...base, consultationSpecialistId: li.consultationSpecialistId };
              }
              if (li.consultationTherapistId) {
                return { ...base, consultationTherapistId: li.consultationTherapistId };
              }
              return { ...base, serviceId: li.serviceId };
            })
          : payloadLines,
      };

      await onSave(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Unable to save invoice. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[min(100vw-1.5rem,90rem)] sm:max-w-[min(100vw-2rem,90rem)] max-h-[90vh] overflow-y-auto min-w-0">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Create New Invoice' : 'Edit Invoice'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {chargesLocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
              This invoice is not pending. Service lines cannot be changed; you can still update dates,
              status, or memo.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.condition}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Invoice['status'])} required className="input-field">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {status === 'paid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className="input-field"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Charge lines *</label>
              {!chargesLocked && (
                <button type="button" onClick={addLine} className="text-sm text-primary-600 flex items-center gap-1 hover:text-primary-800">
                  <Plus className="h-4 w-4" />
                  Add line
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Pick a service, a staff consultation rate from the Consultation rates page (user accounts), or a roster
              specialist/therapist (uses the hourly rate on their profile).
            </p>
            <div className="border rounded-lg divide-y border-gray-200">
              {lines.map((row) => {
                const specialistProviders = consultationProviders.filter((p) => p.role === 'specialist');
                const therapistProviders = consultationProviders.filter((p) => p.role === 'therapist');
                return (
                <div key={row.key} className="p-4 space-y-3 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-6 xl:col-span-7 min-w-0">
                      <label className="block text-xs text-gray-600 mb-1">Service or consultation</label>
                      <select
                        value={currentItemValue(row)}
                        onChange={(e) => onItemPick(row.key, e.target.value)}
                        required={!chargesLocked}
                        disabled={chargesLocked}
                        className="input-field text-sm min-w-0 max-w-full"
                      >
                        <option value="">Select a service or consultation</option>
                        {services.length > 0 && (
                          <optgroup label="Services">
                            {services.map((s) => (
                              <option key={s.id} value={`${SERVICE_OPTION_PREFIX}${s.id}`}>
                                {s.name}
                                {typeof s.price === 'number' ? ` — ${s.price.toLocaleString()} UGX` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {specialistProviders.length > 0 && (
                          <optgroup label="Specialist consultations">
                            {specialistProviders.map((p) => (
                              <option
                                key={`${p.source}-${p.id}`}
                                value={consultOptionValue(p.source, p.id)}
                                disabled={p.consultationFee <= 0}
                              >
                                {titleForProvider(p)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {therapistProviders.length > 0 && (
                          <optgroup label="Therapist consultations">
                            {therapistProviders.map((p) => (
                              <option
                                key={`${p.source}-${p.id}`}
                                value={consultOptionValue(p.source, p.id)}
                                disabled={p.consultationFee <= 0}
                              >
                                {titleForProvider(p)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {row.kind === 'consultation' && row.consultSource && row.consultEntityId && (
                        <p className="mt-1 text-[11px] text-primary-700">
                          Consultation billed for{' '}
                          {providerByKey.get(providerLookupKey(row.consultSource, row.consultEntityId))?.name ??
                            'selected provider'}
                          .
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2 xl:col-span-1 min-w-0">
                      <label className="block text-xs text-gray-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={row.quantity}
                        onChange={(e) => updateLine(row.key, { quantity: Number(e.target.value) })}
                        disabled={chargesLocked}
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 xl:col-span-2 min-w-0">
                      <label className="block text-xs text-gray-600 mb-1">Unit price (UGX)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.unitPrice}
                        onChange={(e) => updateLine(row.key, { unitPrice: Number(e.target.value) })}
                        disabled={chargesLocked}
                        className="input-field text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 xl:col-span-2 flex justify-between items-center gap-2 min-w-0">
                      <div>
                        <p className="text-xs text-gray-600">Line</p>
                        <p className="text-sm font-semibold text-gray-900">{lineTotal(row).toLocaleString()} UGX</p>
                      </div>
                      {!chargesLocked && lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(row.key)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Line description (optional)</label>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateLine(row.key, { description: e.target.value })}
                      disabled={chargesLocked}
                      className="input-field text-sm"
                      placeholder="Defaults to service or consultation name"
                    />
                  </div>
                </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-2 text-right font-medium">
              Invoice total: <span className="text-gray-900">{invoiceTotal.toLocaleString()} UGX</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice memo / description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="input-field"
              placeholder="Summary shown on the invoice header (e.g. visit date, payer notes)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Invoice' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
