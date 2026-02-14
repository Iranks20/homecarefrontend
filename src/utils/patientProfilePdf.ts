import { jsPDF } from 'jspdf';
import type { Patient, MedicalRecord, ProgressRecord, PatientCase, HealthRecordUpdate } from '../types';

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;
const SECTION_GAP = 10;
const TITLE_SIZE = 16;
const SECTION_SIZE = 11;
const BODY_SIZE = 9;

interface InvoiceLike {
  id: string;
  serviceName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: string;
  description?: string;
}

interface PatientProfilePdfData {
  patient: Patient;
  medicalHistory?: MedicalRecord[];
  progress?: ProgressRecord[];
  cases?: PatientCase[];
  healthRecords?: HealthRecordUpdate[];
  invoices?: InvoiceLike[];
  latestVitals?: HealthRecordUpdate | null;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(SECTION_SIZE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(title, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(60, 60, 60);
  return y + LINE_HEIGHT + 2;
}

function addLabelValue(doc: jsPDF, label: string, value: string | undefined | null, y: number): number {
  if (value === undefined || value === null || value === '') return y;
  const text = `${label}: ${value}`;
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  return y + lines.length * LINE_HEIGHT;
}

function addPageIfNeeded(doc: jsPDF, y: number, needed: number = 40): number {
  if (y + needed > 277) {
    doc.addPage();
    return MARGIN + 15;
  }
  return y;
}

/**
 * Generate a professional PDF document with all patient details.
 * Suitable for healthcare systems: clear sections, readable layout, confidential footer.
 */
export function generatePatientProfilePdf(data: PatientProfilePdfData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const {
    patient,
    medicalHistory = [],
    progress = [],
    cases = [],
    healthRecords = [],
    invoices = [],
    latestVitals,
  } = data;

  let y = MARGIN + 5;

  // Header
  doc.setFontSize(TITLE_SIZE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('Patient Summary', MARGIN, y);
  y += LINE_HEIGHT;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated ${new Date().toLocaleString()} • Confidential`, MARGIN, y);
  y += LINE_HEIGHT + SECTION_GAP;

  // Demographics
  y = addSectionTitle(doc, 'Demographics', y);
  y = addLabelValue(doc, 'Name', patient.name, y);
  y = addLabelValue(doc, 'Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '', y);
  y = addLabelValue(doc, 'Status', patient.status, y);
  y = addLabelValue(doc, 'Condition', patient.condition, y);
  y = addLabelValue(doc, 'Email', patient.email, y);
  y = addLabelValue(doc, 'Phone', patient.phone, y);
  y = addLabelValue(doc, 'Address', patient.address, y);
  y = addLabelValue(doc, 'Admission Date', patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : '', y);
  y += SECTION_GAP;
  y = addPageIfNeeded(doc, y);

  // Care team
  y = addSectionTitle(doc, 'Care Team & Emergency', y);
  y = addLabelValue(doc, 'Assigned Specialist', (patient as any).assignedSpecialistName ?? patient.assignedDoctorName, y);
  y = addLabelValue(doc, 'Assigned Therapist', (patient as any).assignedTherapistName, y);
  y = addLabelValue(doc, 'Assigned Nurse', patient.assignedNurseName, y);
  y = addLabelValue(doc, 'Emergency Contact', patient.emergencyContact ? `${patient.emergencyContact}${patient.emergencyPhone ? ` (${patient.emergencyPhone})` : ''}` : '', y);
  y += SECTION_GAP;
  y = addPageIfNeeded(doc, y);

  // Cases
  if (cases.length > 0) {
    y = addSectionTitle(doc, 'Cases', y);
    cases.slice(0, 10).forEach((c) => {
      y = addPageIfNeeded(doc, y, 25);
      doc.text(`${c.caseNumber} • ${c.status} • ${c.type} • Opened ${new Date(c.openedAt).toLocaleDateString()}`, MARGIN, y);
      y += LINE_HEIGHT;
      if (c.diagnosis) {
        doc.text(`Dx: ${c.diagnosis}`, MARGIN + 5, y);
        y += LINE_HEIGHT;
      }
      if (c.attending) {
        doc.text(`Attending: ${c.attending} • Visits: ${c.visitsCount}`, MARGIN + 5, y);
        y += LINE_HEIGHT;
      }
      y += 2;
    });
    y += SECTION_GAP;
  }

  // Latest vitals
  if (latestVitals?.recordType === 'vital' && latestVitals.data) {
    y = addPageIfNeeded(doc, y, 50);
    y = addSectionTitle(doc, 'Latest Vitals', y);
    const d = latestVitals.data as Record<string, unknown>;
    const vitals: string[] = [];
    if (d.bloodPressure) vitals.push(`BP: ${d.bloodPressure}`);
    if (d.heartRate != null) vitals.push(`HR: ${d.heartRate} bpm`);
    if (d.temperature != null) vitals.push(`Temp: ${d.temperature}°F`);
    if (d.oxygenSaturation != null) vitals.push(`SpO2: ${d.oxygenSaturation}%`);
    if (d.weight != null) vitals.push(`Weight: ${d.weight} lbs`);
    if (d.bmi != null) vitals.push(`BMI: ${d.bmi}`);
    if (vitals.length > 0) {
      doc.text(vitals.join('  |  '), MARGIN, y);
      y += LINE_HEIGHT;
    }
    doc.text(`Recorded ${new Date(latestVitals.timestamp).toLocaleString()} by ${latestVitals.updatedByName}`, MARGIN, y);
    y += LINE_HEIGHT + SECTION_GAP;
  }

  // Medical history
  if (medicalHistory.length > 0) {
    y = addPageIfNeeded(doc, y, 30);
    y = addSectionTitle(doc, 'Medical History', y);
    medicalHistory.slice(0, 15).forEach((rec) => {
      y = addPageIfNeeded(doc, y, 20);
      doc.text(`${new Date(rec.date).toLocaleDateString()} • ${rec.diagnosis}`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.text(`Treatment: ${rec.treatment} • Doctor: ${rec.doctor}`, MARGIN + 5, y);
      y += LINE_HEIGHT + 2;
    });
    y += SECTION_GAP;
  }

  // Progress
  if (progress.length > 0) {
    y = addPageIfNeeded(doc, y, 30);
    y = addSectionTitle(doc, 'Progress Records', y);
    progress.slice(-10).reverse().forEach((rec) => {
      y = addPageIfNeeded(doc, y, 15);
      doc.text(`${new Date(rec.date).toLocaleDateString()} • ${rec.metric}: ${rec.value} ${rec.unit || ''}`, MARGIN, y);
      y += LINE_HEIGHT + 1;
    });
    y += SECTION_GAP;
  }

  // Recent health records
  if (healthRecords.length > 0) {
    y = addPageIfNeeded(doc, y, 30);
    y = addSectionTitle(doc, 'Recent Health Records', y);
    healthRecords.slice(0, 8).forEach((rec) => {
      y = addPageIfNeeded(doc, y, 18);
      doc.text(`${rec.recordType} • ${new Date(rec.timestamp).toLocaleString()} • ${rec.updatedByName}`, MARGIN, y);
      y += LINE_HEIGHT;
      if (rec.notes) {
        const noteLines = doc.splitTextToSize(rec.notes, CONTENT_WIDTH - 5);
        doc.text(noteLines, MARGIN + 5, y);
        y += noteLines.length * LINE_HEIGHT;
      }
      y += 2;
    });
    y += SECTION_GAP;
  }

  // Billing summary
  if (invoices.length > 0) {
    y = addPageIfNeeded(doc, y, 50);
    y = addSectionTitle(doc, 'Billing & Invoices', y);
    const paid = invoices.filter((i) => i.status === 'paid');
    const outstanding = invoices.filter((i) => i.status !== 'paid');
    const totalPaid = paid.reduce((s, i) => s + i.amount, 0);
    const totalOutstanding = outstanding.reduce((s, i) => s + i.amount, 0);
    doc.text(`Total Paid: $${totalPaid.toFixed(2)}  |  Total Outstanding: $${totalOutstanding.toFixed(2)}`, MARGIN, y);
    y += LINE_HEIGHT + 2;
    invoices.slice(0, 8).forEach((inv) => {
      y = addPageIfNeeded(doc, y, 12);
      doc.text(`${inv.serviceName} • $${inv.amount.toFixed(2)} • ${inv.status} • Due ${new Date(inv.dueDate).toLocaleDateString()}`, MARGIN, y);
      y += LINE_HEIGHT;
    });
    y += SECTION_GAP;
  }

  // Additional information
  const hasExtra =
    patient.allergies ||
    patient.currentMedications ||
    (patient as any).paymentType ||
    patient.insuranceProvider ||
    patient.referralSource;
  if (hasExtra) {
    y = addPageIfNeeded(doc, y, 40);
    y = addSectionTitle(doc, 'Additional Information', y);
    y = addLabelValue(doc, 'Payment Type', (patient as any).paymentType, y);
    y = addLabelValue(doc, 'Insurance', patient.insuranceProvider ? `${patient.insuranceProvider}${patient.insuranceNumber ? ` (${patient.insuranceNumber})` : ''}` : '', y);
    y = addLabelValue(doc, 'Allergies', patient.allergies, y);
    y = addLabelValue(doc, 'Current Medications', patient.currentMedications, y);
    y = addLabelValue(doc, 'Referral Source', patient.referralSource, y);
    y += SECTION_GAP;
  }

  // Footer on last page
  y = addPageIfNeeded(doc, y, 20);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('This document is confidential and intended for authorized healthcare use only.', MARGIN, 285);
  doc.text(`Patient ID: ${patient.id} • Document generated ${new Date().toISOString()}`, MARGIN, 290);

  return doc;
}

/**
 * Generate and download the patient profile PDF.
 */
export function downloadPatientProfilePdf(data: PatientProfilePdfData): void {
  const doc = generatePatientProfilePdf(data);
  const safeName = data.patient.name.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  doc.save(`Patient_Summary_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
