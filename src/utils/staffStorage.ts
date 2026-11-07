import { StaffMember } from '../types/staff';

const STAFF_LIST_KEY = 'fiberquote_staff_list_v2';
const CURRENT_USER_KEY = 'fiberquote_current_staff_session_v2';

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-admin-01',
    username: 'admin',
    password: 'password123',
    name: 'คุณสมชาย อนันตกุล (แอดมิน)',
    email: 'admin@thinkbigthailand.com',
    phoneNumber: '088-243-3288',
    role: 'admin',
    assignedCategories: ['all'],
    createdAt: '2026-01-10T08:00:00.000Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'staff-supervisor-01',
    username: 'supervisor',
    password: 'password123',
    name: 'คุณเกรียงไกร ชัยมงคล (หัวหน้างาน)',
    email: 'supervisor@thinkbigthailand.com',
    phoneNumber: '088-243-3288',
    role: 'supervisor',
    customRoleTitle: 'หัวหน้าฝ่ายประเมินราคา & ควบคุมงาน',
    assignedCategories: ['all'],
    createdAt: '2026-01-15T08:30:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
    isActive: true,
  },
  {
    id: 'staff-sales-01',
    username: 'sales1',
    password: 'password123',
    name: 'คุณวิภาวรรณ ชัยเจริญ (ฝ่ายขายงานอุตสาหกรรม)',
    email: 'sales1@thinkbigthailand.com',
    phoneNumber: '095-718-4959',
    role: 'sales',
    salesProductSpecialty: 'ฝ่ายขายกลุ่มงานถังเคมี ตู้ครอบเครื่องจักร และท่อ FRP',
    assignedCategories: ['industrial_tank', 'machine_cover'],
    createdAt: '2026-02-15T09:30:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 4).toISOString(),
    isActive: true,
  },
  {
    id: 'staff-sales-02',
    username: 'sales2',
    password: 'password123',
    name: 'คุณณัฐพล พัฒนศักดิ์ (ฝ่ายขายยานยนต์และปั้น)',
    email: 'sales2@thinkbigthailand.com',
    phoneNumber: '081-998-7766',
    role: 'sales',
    salesProductSpecialty: 'ฝ่ายขายกลุ่มชิ้นส่วนยานยนต์ งานปั้น 3D และหลังคา',
    assignedCategories: ['automotive', 'sculpture_arch', 'architectural_exterior'],
    createdAt: '2026-03-01T10:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(),
    isActive: true,
  },
  {
    id: 'staff-designer-01',
    username: 'designer1',
    password: 'password123',
    name: 'คุณกิตติศักดิ์ ธรรมรัตน์ (ผู้ออกแบบ 3D/CAD)',
    email: 'designer@thinkbigthailand.com',
    phoneNumber: '089-334-1122',
    role: 'designer',
    customRoleTitle: 'วิศวกรโครงสร้างและออกแบบแม่พิมพ์ 3D',
    assignedCategories: ['all'],
    createdAt: '2026-03-05T11:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
    isActive: true,
  },
];

export function getStoredStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STAFF_LIST_KEY);
    if (!raw) {
      localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(INITIAL_STAFF_MEMBERS));
      return INITIAL_STAFF_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure backwards-compatibility for existing items
      return parsed.map((item) => ({
        ...item,
        assignedCategories: Array.isArray(item.assignedCategories) && item.assignedCategories.length > 0
          ? item.assignedCategories
          : (item.role === 'admin' || item.role === 'supervisor' ? ['all'] : ['industrial_tank']),
      }));
    }
    return INITIAL_STAFF_MEMBERS;
  } catch (e) {
    console.error('Failed to parse staff list from storage', e);
    return INITIAL_STAFF_MEMBERS;
  }
}


export function saveStaffList(staffList: StaffMember[]): void {
  try {
    localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(staffList));
  } catch (e) {
    console.error('Failed to save staff list', e);
  }
}

export function getCurrentStaffUser(): StaffMember | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse current staff session', e);
    return null;
  }
}

export function setCurrentStaffUser(user: StaffMember | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to set current user', e);
  }
}

export function authenticateStaff(username: string, password: string): { success: boolean; user?: StaffMember; message?: string } {
  const staffList = getStoredStaff();
  const cleanUsername = username.trim().toLowerCase();
  
  const found = staffList.find(
    (s) => s.username.toLowerCase() === cleanUsername && s.password === password
  );

  if (!found) {
    return {
      success: false,
      message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
    };
  }

  if (!found.isActive) {
    return {
      success: false,
      message: 'บัญชีพนักงานนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ (แอดมิน)',
    };
  }

  // Update last login
  const updatedUser: StaffMember = {
    ...found,
    lastLogin: new Date().toISOString(),
  };

  const updatedList = staffList.map((s) => (s.id === found.id ? updatedUser : s));
  saveStaffList(updatedList);
  setCurrentStaffUser(updatedUser);

  return {
    success: true,
    user: updatedUser,
  };
}

export function logoutStaff(): void {
  setCurrentStaffUser(null);
}

export function createStaffMember(newStaff: Omit<StaffMember, 'id' | 'createdAt'>): { success: boolean; staffList?: StaffMember[]; message?: string } {
  const staffList = getStoredStaff();
  const cleanUsername = newStaff.username.trim().toLowerCase();

  // Check unique username
  const exists = staffList.some((s) => s.username.toLowerCase() === cleanUsername);
  if (exists) {
    return {
      success: false,
      message: `ชื่อผู้ใช้งาน "${newStaff.username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`,
    };
  }

  const created: StaffMember = {
    ...newStaff,
    id: `staff-${Date.now()}`,
    username: cleanUsername,
    createdAt: new Date().toISOString(),
  };

  const updated = [created, ...staffList];
  saveStaffList(updated);
  return { success: true, staffList: updated };
}

export function updateStaffMember(
  id: string,
  updates: Partial<Omit<StaffMember, 'id' | 'createdAt'>>
): { success: boolean; staffList?: StaffMember[]; message?: string } {
  const staffList = getStoredStaff();
  const current = getCurrentStaffUser();

  // Check unique username if username is changing
  if (updates.username) {
    const cleanUsername = updates.username.trim().toLowerCase();
    const duplicate = staffList.some(
      (s) => s.id !== id && s.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return {
        success: false,
        message: `ชื่อผู้ใช้งาน "${updates.username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`,
      };
    }
  }

  const updated = staffList.map((s) => {
    if (s.id === id) {
      const updatedItem = {
        ...s,
        ...updates,
        username: updates.username ? updates.username.trim().toLowerCase() : s.username,
      };
      // If current logged-in user is updated, update active session too
      if (current && current.id === id) {
        setCurrentStaffUser(updatedItem);
      }
      return updatedItem;
    }
    return s;
  });

  saveStaffList(updated);
  return { success: true, staffList: updated };
}

export function deleteStaffMember(id: string, currentAdminId: string): { success: boolean; staffList?: StaffMember[]; message?: string } {
  if (id === currentAdminId) {
    return {
      success: false,
      message: 'ไม่สามารถลบบัญชีของตัวคุณเองที่กำลังเข้าสู่ระบบอยู่ได้',
    };
  }

  const staffList = getStoredStaff();
  const updated = staffList.filter((s) => s.id !== id);
  saveStaffList(updated);
  return { success: true, staffList: updated };
}
