import { jsPDF } from 'jspdf';
import type { Patient, MedicalRecord, ProgressRecord, PatientCase, HealthRecordUpdate } from '../types';
import { getLogoBase64 } from './logo';

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 7;
const SECTION_GAP = 12;
const TITLE_SIZE = 18;
const SECTION_SIZE = 12;
const BODY_SIZE = 10;
const HEADER_COLOR = [30, 64, 175]; // Professional blue
const TEXT_COLOR = [31, 41, 55]; // Dark gray
const SECONDARY_COLOR = [107, 114, 128]; // Medium gray
const ACCENT_COLOR = [59, 130, 246]; // Light blue

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
  // Add subtle background bar
  doc.setFillColor(HEADER_COLOR[0], HEADER_COLOR[1], HEADER_COLOR[2]);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 4, 'F');
  
  doc.setFontSize(SECTION_SIZE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGIN + 2, y - 1);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  return y + LINE_HEIGHT + 4;
}

function addLabelValue(doc: jsPDF, label: string, value: string | undefined | null, y: number): number {
  if (value === undefined || value === null || value === '') return y;
  
  // Label in bold, secondary color
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.text(`${label}:`, MARGIN, y);
  
  // Value in normal, primary color
  const labelWidth = doc.getTextWidth(`${label}: `);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
  const valueLines = doc.splitTextToSize(value, CONTENT_WIDTH - labelWidth);
  doc.text(valueLines, MARGIN + labelWidth, y);
  
  return y + valueLines.length * LINE_HEIGHT + 1;
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
export async function generatePatientProfilePdf(data: PatientProfilePdfData): Promise<jsPDF> {
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

  let y = MARGIN + 8;

  // Professional header with logo and title
  try {
    const logoBase64 = await getLogoBase64();
    if (logoBase64) {
      const logoWidth = 45;
      const logoHeight = 14;
      doc.addImage(logoBase64, 'PNG', MARGIN, y, logoWidth, logoHeight);
      
      // Clinic name next to logo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(HEADER_COLOR[0], HEADER_COLOR[1], HEADER_COLOR[2]);
      doc.text('Teamwork Physio International', MARGIN + logoWidth + 6, y + 4);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
      doc.text('Healthcare & Rehabilitation Services', MARGIN + logoWidth + 6, y + 9);
      
      y += logoHeight + 12;
    }
  } catch (error) {
    console.warn('Could not load logo for PDF:', error);
  }

  // Document title with underline
  doc.setFontSize(TITLE_SIZE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(HEADER_COLOR[0], HEADER_COLOR[1], HEADER_COLOR[2]);
  doc.text('PATIENT SUMMARY REPORT', MARGIN, y);
  
  // Underline
  doc.setDrawColor(HEADER_COLOR[0], HEADER_COLOR[1], HEADER_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 2, MARGIN + 80, y + 2);
  
  y += LINE_HEIGHT + 4;

  // Metadata line
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  const genDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  doc.text(`Generated: ${genDate} | Patient ID: ${patient.id} | CONFIDENTIAL`, MARGIN, y);
  y += LINE_HEIGHT + SECTION_GAP + 2;

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

  // Professional footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 285, PAGE_WIDTH - MARGIN, 285);
    
    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
    
    const footerLeft = `Teamwork Physio International | Confidential Medical Document`;
    const footerRight = `Page ${i} of ${pageCount}`;
    
    doc.text(footerLeft, MARGIN, 288);
    doc.text(footerRight, PAGE_WIDTH - MARGIN - doc.getTextWidth(footerRight), 288);
    
    // Confidential watermark on last page
    if (i === pageCount) {
      doc.setFontSize(8);
      // Use very light gray color for watermark effect (opacity achieved through color)
      doc.setTextColor(240, 240, 240);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIDENTIAL', PAGE_WIDTH / 2, PAGE_WIDTH / 2, { 
        align: 'center',
        angle: 45
      });
    }
  }

  return doc;
}

/**
 * Generate and download the patient profile PDF.
 */
export async function downloadPatientProfilePdf(data: PatientProfilePdfData): Promise<void> {
  const doc = await generatePatientProfilePdf(data);
  const safeName = data.patient.name.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  doc.save(`Patient_Summary_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
