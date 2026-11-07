export type ShapeType = 'box' | 'cylinder' | 'sculpture' | 'flat_panel';

export type UnitType = 'cm' | 'm' | 'mm';

export type ResinType = 'general_ortho' | 'chemical_iso' | 'heavy_vinylester' | 'fire_retardant';

export type FinishType = 'gelcoat_gloss' | 'automotive_2k' | 'matte_industrial' | 'antislip';

export type RequestStatus = 'pending' | 'reviewing' | 'quoted' | 'approved' | 'rejected';

export interface WorkCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  badgeColor: string;
  isActive?: boolean;
  displayOrder?: number;
}

export const WORK_CATEGORIES: WorkCategory[] = [
  {
    id: 'industrial_tank',
    code: 'TANK',
    name: 'ถังเคมี / ถังบำบัดน้ำเสีย / งานท่อ FRP',
    description: 'ถังเก็บสารเคมี ถังน้ำมัน ถังบำบัดน้ำเสีย ท่อไฟเบอร์กลาส และถังดักไขมันอุตสาหกรรม',
    badgeColor: 'blue',
  },
  {
    id: 'machine_cover',
    code: 'COVER',
    name: 'ฝาครอบเครื่องจักร / ตู้ชิ้นส่วนอุตสาหกรรม',
    description: 'ตู้ครอบเครื่องจักรอุตสาหกรรม ฝาครอบมอเตอร์ ปลอกป้องกัน และตู้ควบคุมไฟฟ้า',
    badgeColor: 'amber',
  },
  {
    id: 'automotive',
    code: 'AUTO',
    name: 'ชิ้นส่วนยานยนต์ / งานตกแต่งรถยนต์ / บอดี้พาร์ท',
    description: 'กันชน สเกิร์ต สปอยเลอร์ ฝากระโปรง หลังคาไฟเบอร์ และชิ้นส่วนตกแต่งยานยนต์',
    badgeColor: 'emerald',
  },
  {
    id: 'sculpture_arch',
    code: 'SCULPT',
    name: 'งานปั้น / มาสคอต / ประติมากรรม 3D / โลโก้แบรนด์',
    description: 'หุ่นจำลอง 3 มิติ มาสคอตประจำแบรนด์ ประติมากรรมตกแต่งอาคาร และป้ายโลโก้ขนาดใหญ่',
    badgeColor: 'purple',
  },
  {
    id: 'architectural_exterior',
    code: 'ROOF',
    name: 'งานหลังคา / กันสาด / ตกแต่งอาคารภายนอก',
    description: 'แผ่นหลังคาโปร่งแสง กันสาดไฟเบอร์กลาส แผงฟาซาด และชิ้นงานตกแต่งภายนอกทนแดดฝน',
    badgeColor: 'cyan',
  },
  {
    id: 'custom_oem',
    code: 'OEM',
    name: 'งานสั่งทำพิเศษ OEM / งานขึ้นรูปโมลด์เฉพาะทาง',
    description: 'งานขึ้นรูปตามแบบวิศวกรรมเฉพาะด้าน งานทำโมลด์ต้นแบบ และงานโปรเจกต์พิเศษตามสั่ง',
    badgeColor: 'indigo',
  },
];

export interface ProjectAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface QuotationDimensions {
  shape: ShapeType;
  unit: UnitType;
  width: number;       // กว้าง (or diameter if cylinder)
  length: number;      // ยาว
  height: number;      // สูง / ลึก
  diameter?: number;   // เส้นผ่านศูนย์กลาง (สำหรับทรงกระบอก)
  wallThicknessMm: number; // ความหนาชิ้นงาน (มม.) 3, 4, 6, 8, 10 มม.
}

export interface QuotationRequest {
  id: string;
  createdAt: string;
  // Required fields from user request
  customerName: string;
  phoneNumber: string;
  email: string;
  photos: string[]; // Base64 data URLs or asset URLs
  dimensions: QuotationDimensions;
  
  // Work grouping & category
  workTitle: string;
  workCategoryId: string; // e.g. 'industrial_tank', 'machine_cover', 'automotive'
  workCategory: string;   // Full label for display
  companyName?: string;
  lineId?: string;
  quantity: number;
  hasSteelFrame: boolean;
  notes?: string;
  
  // Large Project attachments & Cloud download link
  projectFiles?: ProjectAttachment[];
  projectCloudLink?: string; // Google Drive, Dropbox, OneDrive, WeTransfer URL
  projectCloudNote?: string; // หมายเหตุเพิ่มเติมสำหรับลิงก์ เช่น รหัสผ่าน หรือ โฟลเดอร์ย่อย
  driveFolderUrl?: string;   // Direct Google Drive folder URL
  drivePhotoUrls?: string[]; // Direct Google Drive file URLs
  
  // Delivery and Timeline specifications
  deliveryLocation: string; // สถานที่จัดส่งหรือสถานที่ติดตั้ง
  deliveryCoordinates?: {
    lat: number;
    lng: number;
    formattedAddress?: string;
    distanceKm?: number;
  };
  province?: string;
  needInstallation: boolean; // ต้องการบริการติดตั้งหน้างาน หรือจัดส่งอย่างเดียว
  requiredDate: string; // วันที่ต้องการใช้งาน / กำหนดส่งมอบ
  urgency: 'urgent' | 'normal' | 'flexible'; // ความเร่งด่วนของงาน
  
  // Calculation / Quotation fields
  estimatedSurfaceAreaM2: number;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  estimatedMoldCostMin: number;
  estimatedMoldCostMax: number;
  estimatedDays: number;
  
  // Internal staff workflow & assignment
  status: RequestStatus;
  adminFinalQuote?: number;
  adminNotes?: string;
  assignedStaffId?: string;   // ID of the assigned staff member
  assignedStaffName?: string; // Name of the assigned staff member
  assignedStaffRole?: string; // Role/Specialty of the assigned staff member
  assignedAt?: string;
  assignedNote?: string;
}

