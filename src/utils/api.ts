import { QuotationRequest, WorkCategory, WORK_CATEGORIES } from '../types/fiberglass';
import { StaffMember } from '../types/staff';
import { 
  getStoredRequests, 
  saveStoredRequests, 
  updateRequestStatus as localUpdateRequestStatus, 
  deleteStoredRequest 
} from './storage';
import { 
  getStoredStaff, 
  saveStaffList, 
  authenticateStaff as localAuth 
} from './staffStorage';

export interface DatabaseStatus {
  connected: boolean;
  type: string;
  host: string;
  port: number;
  name: string;
  user: string;
  latencyMs?: number;
  message: string;
  lastChecked: string;
}

// 1. Check DB Health
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('API returned status ' + res.status);
    const data = await res.json();
    return {
      connected: data.database?.connected ?? false,
      type: data.database?.type || 'MySQL',
      host: data.database?.host || '147.50.231.22',
      port: data.database?.port || 3306,
      name: data.database?.name || 'thinkbig_AI1',
      user: data.database?.user || 'thinkbig_ai1_sale',
      latencyMs: data.database?.latencyMs,
      message: data.database?.message || 'เชื่อมต่อสำเร็จ',
      lastChecked: new Date().toLocaleTimeString('th-TH')
    };
  } catch (err: any) {
    return {
      connected: false,
      type: 'MySQL',
      host: '147.50.231.22',
      port: 3306,
      name: 'thinkbig_AI1',
      user: 'thinkbig_ai1_sale',
      message: err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กำลังใช้ระบบ Local Cache สำรอง',
      lastChecked: new Date().toLocaleTimeString('th-TH')
    };
  }
}

// 2. Quotation Requests
export async function apiGetRequests(): Promise<QuotationRequest[]> {
  try {
    const res = await fetch('/api/requests');
    if (!res.ok) throw new Error('Failed to fetch from API');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      // Also sync to local storage for offline resilience
      saveStoredRequests(json.data);
      return json.data;
    }
  } catch (err) {
    console.warn('[API] Falling back to local storage for requests:', err);
  }
  return getStoredRequests();
}

export async function apiSaveRequest(req: QuotationRequest): Promise<QuotationRequest> {
  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Update local cache
        const local = getStoredRequests();
        saveStoredRequests([json.data, ...local.filter((r: QuotationRequest) => r.id !== json.data.id)]);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Could not save to DB directly, saving to local fallback:', err);
  }
  
  // Fallback
  const local = getStoredRequests();
  const updated = [req, ...local.filter((r: QuotationRequest) => r.id !== req.id)];
  saveStoredRequests(updated);
  return req;
}

export async function apiUpdateRequestStatus(
  id: string,
  status: QuotationRequest['status'],
  adminNotes?: string,
  assignment?: {
    assignedStaffId?: string;
    assignedStaffName?: string;
    assignedStaffRole?: string;
    assignedAt?: string;
    assignedNote?: string;
  }
): Promise<QuotationRequest | null> {
  try {
    const res = await fetch(`/api/requests/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes, assignment })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Sync local cache
        localUpdateRequestStatus(
          id,
          status,
          adminNotes,
          undefined,
          assignment?.assignedStaffId,
          assignment?.assignedStaffName,
          assignment?.assignedStaffRole,
          assignment?.assignedNote
        );
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error updating request via API:', err);
  }

  // Fallback to local
  const updatedList = localUpdateRequestStatus(
    id,
    status,
    adminNotes,
    undefined,
    assignment?.assignedStaffId,
    assignment?.assignedStaffName,
    assignment?.assignedStaffRole,
    assignment?.assignedNote
  );
  return updatedList.find((r: QuotationRequest) => r.id === id) || null;
}

export async function apiDeleteRequest(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      const json = await res.json();
      deleteStoredRequest(id);
      return json.success;
    }
  } catch (err) {
    console.warn('[API] Error deleting via API:', err);
  }
  return deleteStoredRequest(id);
}

// 3. Staff Members & Auth
export async function apiLoginStaff(username: string, password: string): Promise<{ success: boolean; user?: StaffMember; message?: string }> {
  try {
    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (json.success && json.user) {
      return { success: true, user: json.user };
    } else {
      return { success: false, message: json.message || 'เข้าสู่ระบบไม่สำเร็จ' };
    }
  } catch (err: any) {
    console.warn('[API] Server login failed, trying local fallback:', err);
    return localAuth(username, password);
  }
}

export async function apiGetStaffList(): Promise<StaffMember[]> {
  try {
    const res = await fetch('/api/staff');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        saveStaffList(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Could not fetch staff list, using local fallback:', err);
  }
  return getStoredStaff();
}

export async function apiCreateStaff(staff: StaffMember): Promise<StaffMember> {
  try {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const local = getStoredStaff();
        saveStaffList([...local, json.data]);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error saving staff to API:', err);
  }
  // Local fallback
  const local = getStoredStaff();
  saveStaffList([...local, staff]);
  return staff;
}

export async function apiUpdateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
  try {
    const res = await fetch(`/api/staff/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const local = getStoredStaff();
        const updated = local.map((s: StaffMember) => s.id === id ? { ...s, ...updates } : s);
        saveStaffList(updated);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error updating staff via API:', err);
  }
  const local = getStoredStaff();
  const updated = local.map((s: StaffMember) => s.id === id ? { ...s, ...updates } : s);
  saveStaffList(updated);
  return updated.find((s: StaffMember) => s.id === id) || null;
}

export async function apiDeleteStaff(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/staff/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      const local = getStoredStaff();
      saveStaffList(local.filter((s: StaffMember) => s.id !== id));
      return true;
    }
  } catch (err) {
    console.warn('[API] Error deleting staff:', err);
  }
  const local = getStoredStaff();
  saveStaffList(local.filter((s: StaffMember) => s.id !== id));
  return true;
}

// 4. Categories & Services Management
const CATEGORIES_CACHE_KEY = 'thinkbig_categories_cache_v1';

export function getLocalCategories(): WorkCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return WORK_CATEGORIES;
}

export function saveLocalCategories(categories: WorkCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
  } catch {}
}

export async function apiGetWorkCategories(includeInactive = false): Promise<WorkCategory[]> {
  try {
    const res = await fetch(`/api/categories?includeInactive=${includeInactive}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        saveLocalCategories(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Could not fetch categories from server, using local fallback:', err);
  }
  return getLocalCategories();
}

export async function apiCreateWorkCategory(cat: WorkCategory): Promise<WorkCategory> {
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const local = getLocalCategories();
        saveLocalCategories([...local, json.data]);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error creating category via API:', err);
  }
  const local = getLocalCategories();
  saveLocalCategories([...local, cat]);
  return cat;
}

export async function apiUpdateWorkCategory(id: string, updates: Partial<WorkCategory>): Promise<WorkCategory | null> {
  try {
    const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const local = getLocalCategories();
        const updated = local.map((c) => (c.id === id ? { ...c, ...updates } : c));
        saveLocalCategories(updated);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error updating category via API:', err);
  }
  const local = getLocalCategories();
  const updated = local.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveLocalCategories(updated);
  return updated.find((c) => c.id === id) || null;
}

export async function apiDeleteWorkCategory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      const local = getLocalCategories();
      saveLocalCategories(local.filter((c) => c.id !== id));
      return true;
    }
  } catch (err) {
    console.warn('[API] Error deleting category via API:', err);
  }
  const local = getLocalCategories();
  saveLocalCategories(local.filter((c) => c.id !== id));
  return true;
}

export async function apiResetWorkCategories(): Promise<WorkCategory[]> {
  try {
    const res = await fetch('/api/categories/reset', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        saveLocalCategories(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error resetting categories via API:', err);
  }
  saveLocalCategories(WORK_CATEGORIES);
  return WORK_CATEGORIES;
}

export async function apiReorderWorkCategories(orderedIds: string[]): Promise<WorkCategory[]> {
  try {
    const res = await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        saveLocalCategories(json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Error reordering categories via API:', err);
  }
  // Local fallback: sort local categories matching orderedIds
  const local = getLocalCategories();
  const sorted = [...local].sort((a, b) => {
    const idxA = orderedIds.indexOf(a.id);
    const idxB = orderedIds.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  }).map((cat, i) => ({ ...cat, displayOrder: i + 1 }));
  saveLocalCategories(sorted);
  return sorted;
}

