import type { Patient } from '../types';

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function relevanceScore(p: Patient, raw: string): number {
  const q = raw.trim().toLowerCase();
  if (!q) return 0;
  const tokens = q.split(/\s+/).filter(Boolean);
  const n = (p.name || '').toLowerCase();
  const e = (p.email || '').toLowerCase();
  const ph = digitsOnly(p.phone || '');
  const qd = digitsOnly(q);

  if (n === q) return 0;
  if (tokens.length >= 2 && tokens.every((t) => n.includes(t))) return 1;
  if (n.startsWith(q)) return 2;
  if (tokens.length === 1 && n.includes(tokens[0])) return 3;
  if (qd.length >= 3 && ph.includes(qd)) return 4;
  if (e.includes(q)) return 5;
  return 100;
}

export function patientMatchesQuickQuery(p: Patient, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const n = (p.name || '').toLowerCase();
  const e = (p.email || '').toLowerCase();
  const ph = digitsOnly(p.phone || '');
  const qd = digitsOnly(q);
  if (tokens.length >= 2) {
    return tokens.every((t) => n.includes(t));
  }
  return n.includes(q) || e.includes(q) || (qd.length >= 2 && ph.includes(qd));
}

export function sortPatientsForPicker(patients: Patient[], raw: string): Patient[] {
  const q = raw.trim();
  return [...patients].sort((a, b) => {
    const sa = relevanceScore(a, q);
    const sb = relevanceScore(b, q);
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name);
  });
}

export function buildPickerPatientList(recent: Patient[], server: Patient[], query: string): Patient[] {
  const q = query.trim();
  const seen = new Set<string>();
  const out: Patient[] = [];
  const rankedServer = sortPatientsForPicker(server, q);
  for (const p of rankedServer) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  if (q.length < 2) {
    const filtered = sortPatientsForPicker(
      recent.filter((p) => patientMatchesQuickQuery(p, q)),
      q
    );
    for (const p of filtered) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out.slice(0, 40);
}
