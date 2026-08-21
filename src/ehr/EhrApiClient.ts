// ============================================================
// EHR API Client — Mock Epic FHIR Interface
// ============================================================
// HTTP client for the mock FHIR server at localhost:3001.
// All methods return Promises to match real API patterns.

import type { PatientRecord, OrderItem, Allergy, Medication, VitalSign, ProblemListItem } from '../types';

const API_BASE = 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!res.ok) {
    throw new Error(`EHR API Error: ${res.status} ${res.statusText} at ${path}`);
  }

  return res.json() as Promise<T>;
}

// --- Patient Endpoints ---

export async function getPatients(): Promise<PatientRecord[]> {
  return request<PatientRecord[]>('/patients');
}

export async function getPatient(id: string): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}`);
}

export async function updateDemographics(
  id: string,
  data: Partial<Pick<PatientRecord, 'address' | 'phone' | 'insurance' | 'addressFlag'>>
): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/demographics`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// --- Allergy Endpoints ---

export async function addAllergy(id: string, allergy: Allergy): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/allergies`, {
    method: 'POST',
    body: JSON.stringify(allergy)
  });
}

export async function updateAllergy(
  id: string,
  allergyId: string,
  data: Partial<Allergy>
): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/allergies/${allergyId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// --- Medication Endpoints ---

export async function getMedications(id: string): Promise<Medication[]> {
  return request<Medication[]>(`/patients/${id}/medications`);
}

export async function addMedication(id: string, medication: Medication): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/medications`, {
    method: 'POST',
    body: JSON.stringify(medication)
  });
}

export async function updateMedication(
  id: string,
  medId: string,
  data: Partial<Medication>
): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/medications/${medId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// --- Order Endpoints ---

export async function createOrder(id: string, order: Omit<OrderItem, 'id'>): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/orders`, {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

export async function updateOrderStatus(
  id: string,
  orderId: string,
  status: OrderItem['status']
): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

// --- Vitals Endpoints ---

export async function recordVitals(id: string, vital: VitalSign): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/vitals`, {
    method: 'PUT',
    body: JSON.stringify(vital)
  });
}

// --- Problem List Endpoints ---

export async function updateProblemList(id: string, problem: ProblemListItem): Promise<PatientRecord> {
  return request<PatientRecord>(`/patients/${id}/problems`, {
    method: 'PUT',
    body: JSON.stringify(problem)
  });
}
