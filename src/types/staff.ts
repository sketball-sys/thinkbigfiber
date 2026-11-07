export type PrimaryRole = 'admin' | 'supervisor' | 'sales' | 'designer' | 'custom';

// Backward compatibility type alias
export type StaffRole = PrimaryRole;

export interface RoleDefinition {
  id: PrimaryRole;
  title: string;
  badgeColor: string;
  description: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'admin',
    title: 'แอดมิน (Admin)',
    badgeColor: 'purple',
    description: 'สิทธิ์สูงสุด ควบคุมระบบทั้งหมด จัดการพนักงาน สิทธิ์ และหมวดหมู่งาน',
  },
  {
    id: 'supervisor',
    title: 'หัวหน้างาน (Supervisor)',
    badgeColor: 'indigo',
    description: 'ดูแลภาพรวม มอบหมายงานให้ทีมงาน ตรวจสอบและอนุมัติราคาเสนอ',
  },
  {
    id: 'sales',
    title: 'ฝ่ายขาย (Sales)',
    badgeColor: 'blue',
    description: 'ดูแลลูกค้าในกลุ่มงานที่ได้รับมอบหมาย ประเมินสเปกและเสนอราคา',
  },
  {
    id: 'designer',
    title: 'ผู้ออกแบบ (Designer / Engineer)',
    badgeColor: 'emerald',
    description: 'ตรวจสอบแบบ Drawing สเปกเชิงเทคนิค และเอกสารโครงการ',
  },
  {
    id: 'custom',
    title: 'ตำแหน่งกำหนดเอง (Custom Role)',
    badgeColor: 'slate',
    description: 'ตำแหน่งเพิ่มเติมที่กำหนดเอง เช่น ช่างแม่พิมพ์, ผู้จัดการฝ่ายผลิต ฯลฯ',
  },
];

export interface StaffMember {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  department?: string;
  role: PrimaryRole;
  customRoleTitle?: string; // เช่น "วิศวกรโครงสร้าง", "ผู้จัดการโรงงาน", "เจ้าหน้าที่ควบคุมคุณภาพ"
  
  // กลุ่มประเภทงานที่ได้รับมอบหมายให้ดูแล (แอดมินระบุได้มากกว่าหนึ่งกลุ่มงาน หรือ ['all'])
  assignedCategories: string[];
  
  // สำหรับฝ่ายขาย: ระบุประเภทสินค้าเฉพาะทาง เช่น "ฝ่ายขายกลุ่มงานยานยนต์"
  salesProductSpecialty?: string;

  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthState {
  currentUser: StaffMember | null;
  isAuthenticated: boolean;
}

