import { QuotationRequest } from '../types/fiberglass';

const STORAGE_KEY = 'fiberquote_requests_v3';

export const INITIAL_SAMPLE_REQUESTS: QuotationRequest[] = [
  {
    id: 'RFQ-2026-8910',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    customerName: 'คุณสมศักดิ์ วรภัทร',
    companyName: 'บจก. สยาม ออโต้ เทคโนโลยี',
    phoneNumber: '081-456-7890',
    email: 'somsak@siamauto.co.th',
    lineId: 'somsak_carparts',
    deliveryLocation: 'นิคมอุตสาหกรรมบางปู ซอย 12 ต.แพรกษา อ.เมือง จ.สมุทรปราการ',
    province: 'สมุทรปราการ',
    needInstallation: false,
    requiredDate: '2026-11-28',
    urgency: 'normal',
    workTitle: 'ฝาครอบสปอยเลอร์และชุดแอโร่ไฟเบอร์กลาสสำหรับรถบัสไฟฟ้า',
    workCategoryId: 'automotive',
    workCategory: 'ชิ้นส่วนยานยนต์ / งานตกแต่งรถยนต์ / บอดี้พาร์ท',
    photos: [
      '/src/assets/images/fiberglass_molded_parts_1793935020846.jpg'
    ],
    projectCloudLink: 'https://drive.google.com/drive/folders/demo-thinkbig-auto-parts-cad',
    projectCloudNote: 'ไฟล์ 3D STP Model และแบบ Drawing พาร์ทกันชนสเกิร์ต',
    projectFiles: [
      {
        id: 'file-1',
        name: 'EV-Bus-Spoiler-Aero-Draft.pdf',
        size: 3450000,
        type: 'application/pdf',
        uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'file-2',
        name: 'Chassis-Mounting-Specs.dwg',
        size: 8900000,
        type: 'application/octet-stream',
        uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    ],
    dimensions: {
      shape: 'box',
      unit: 'cm',
      width: 65,
      length: 180,
      height: 35,
      wallThicknessMm: 4,
    },
    quantity: 10,
    hasSteelFrame: true,
    notes: 'ต้องการพื้นผิวเรียบเนียนพิเศษระดับเกรดสีพ่น 2K รถยนต์ ทนแดด UV และมีจุดยึดน็อตสแตนเลสฝังในเนื้องาน',
    estimatedSurfaceAreaM2: 2.89,
    estimatedPriceMin: 85000,
    estimatedPriceMax: 112000,
    estimatedMoldCostMin: 22000,
    estimatedMoldCostMax: 29000,
    estimatedDays: 14,
    status: 'reviewing',
    assignedStaffId: 'staff-sales-02',
    assignedStaffName: 'คุณณัฐพล พัฒนศักดิ์ (ฝ่ายขายยานยนต์และปั้น)',
    assignedStaffRole: 'ฝ่ายขายยานยนต์',
    assignedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    assignedNote: 'มอบหมายคุณณัฐพลประสานงานเรื่องไฟล์แบบ CAD ร่วมกับทีมช่างแบบ',
    adminNotes: 'เจ้าหน้าที่กำลังประเมินจุดฝัง Insert น็อต M8 จำนวน 6 จุด และคำนวณโมลด์เหล็กเสริมความแข็งแรง',
  },
  {
    id: 'RFQ-2026-8904',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    customerName: 'คุณวิภาวรรณ เลิศวิมล',
    companyName: 'โรงงานเคมีภัณฑ์ ชลบุรี',
    phoneNumber: '089-234-5678',
    email: 'wipawan@chemical-tech.com',
    lineId: 'wipawan_chem',
    deliveryLocation: 'นิคมอุตสาหกรรมแหลมฉบัง ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี (อาคารผลิตสารเคมี C)',
    province: 'ชลบุรี',
    needInstallation: true,
    requiredDate: '2026-12-10',
    urgency: 'normal',
    workTitle: 'ถังไฟเบอร์กลาสทรงกระบอกแนวตั้ง ทนสารเคมีกรด-ด่าง',
    workCategoryId: 'industrial_tank',
    workCategory: 'ถังเคมี / ถังบำบัดน้ำเสีย / งานท่อ FRP',
    photos: [
      '/src/assets/images/fiberglass_industrial_tank_1793935021910.jpg'
    ],
    projectCloudLink: 'https://wetransfer.com/downloads/chem-tank-drawing-v3',
    projectCloudNote: 'แบบแปลนวิศวกรรมโครงสร้างและจุดเชื่อมต่อท่อทางเข้า-ออก',
    dimensions: {
      shape: 'cylinder',
      unit: 'm',
      width: 1.5,
      diameter: 1.5,
      length: 1.5,
      height: 2.6,
      wallThicknessMm: 8,
    },
    quantity: 2,
    hasSteelFrame: true,
    notes: 'ใช้บรรจุสารเคมีโซเดียมไฮดรอกไซด์ 20% อุณหภูมิใช้งาน 45 องศาเซลเซียส ต้องการหน้าแปลน Flange ท่อเข้า-ออก 2 นิ้ว',
    estimatedSurfaceAreaM2: 15.79,
    estimatedPriceMin: 145000,
    estimatedPriceMax: 185000,
    estimatedMoldCostMin: 35000,
    estimatedMoldCostMax: 48000,
    estimatedDays: 20,
    status: 'quoted',
    adminFinalQuote: 168000,
    assignedStaffId: 'staff-sales-01',
    assignedStaffName: 'คุณวิภาวรรณ ชัยเจริญ (ฝ่ายขายงานอุตสาหกรรม)',
    assignedStaffRole: 'ฝ่ายขายงานอุตสาหกรรม',
    assignedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    assignedNote: 'ฝ่ายขายจัดส่งใบเสนอราคาอย่างเป็นทางการพร้อมสเปกรับรองเรียบร้อยแล้ว',
    adminNotes: 'ออกใบเสนอราคาอย่างเป็นทางการแล้ว พร้อมเอกสารรับรองมาตรฐานเรซิน Vinyl Ester และส่งทีมช่างเทคนิคดูหน้างาน',
  },
  {
    id: 'RFQ-2026-8898',
    createdAt: new Date(Date.now() - 3600000 * 52).toISOString(),
    customerName: 'คุณธนพล พงศ์ประสิทธิ์',
    companyName: 'สตูดิโอ ดีไซน์ & อีเวนต์ กรุงเทพฯ',
    phoneNumber: '062-889-1234',
    email: 'thanapol@designevent.co',
    lineId: 'thanapol_d',
    deliveryLocation: 'หน้าโครงการคอมมูนิตี้มอลล์ ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ',
    province: 'กรุงเทพมหานคร',
    needInstallation: true,
    requiredDate: '2026-11-20',
    urgency: 'urgent',
    workTitle: 'หุ่นมาสคอตประติมากรรมไฟเบอร์กลาสตกแต่งหน้าโครงการ',
    workCategoryId: 'sculpture_arch',
    workCategory: 'งานปั้น / มาสคอต / ประติมากรรม 3D / โลโก้แบรนด์',
    photos: [
      '/src/assets/images/hero_fiberglass_workshop_1793935020615.jpg'
    ],
    projectCloudLink: 'https://www.dropbox.com/sh/mascot-3d-render-highres',
    dimensions: {
      shape: 'sculpture',
      unit: 'm',
      width: 1.2,
      length: 1.0,
      height: 1.8,
      wallThicknessMm: 6,
    },
    quantity: 1,
    hasSteelFrame: true,
    notes: 'งานปั้นมาสคอตกระต่ายอวกาศ สำหรับวางกลางแจ้ง ต้องถ่วงน้ำหนักฐานคอนกรีตด้านในไม่ให้ล้ม',
    estimatedSurfaceAreaM2: 8.26,
    estimatedPriceMin: 68000,
    estimatedPriceMax: 89000,
    estimatedMoldCostMin: 42000,
    estimatedMoldCostMax: 55000,
    estimatedDays: 16,
    status: 'approved',
    adminFinalQuote: 74500,
    assignedStaffId: 'staff-sales-02',
    assignedStaffName: 'คุณณัฐพล พัฒนศักดิ์ (ฝ่ายขายยานยนต์และปั้น)',
    assignedStaffRole: 'ฝ่ายขายงานปั้น/ยานยนต์',
    adminNotes: 'ลูกค้ายืนยันแบบ 3D และเริ่มขั้นตอนโฟม CNC ขึ้นต้นแบบแล้ว',
  }
];

export function getStoredRequests(): QuotationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_REQUESTS));
      return INITIAL_SAMPLE_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_REQUESTS;
  } catch (e) {
    console.error('Failed to parse stored quotation requests', e);
    return INITIAL_SAMPLE_REQUESTS;
  }
}

export function saveRequest(request: QuotationRequest): void {
  try {
    const current = getStoredRequests();
    const updated = [request, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quotation request', e);
  }
}

export function updateRequestStatus(
  id: string,
  status: QuotationRequest['status'],
  adminNotes?: string,
  adminFinalQuote?: number,
  assignedStaffId?: string,
  assignedStaffName?: string,
  assignedStaffRole?: string,
  assignedNote?: string
): QuotationRequest[] {
  try {
    const current = getStoredRequests();
    const updated = current.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : item.adminNotes,
          adminFinalQuote: adminFinalQuote !== undefined ? adminFinalQuote : item.adminFinalQuote,
          assignedStaffId: assignedStaffId !== undefined ? assignedStaffId : item.assignedStaffId,
          assignedStaffName: assignedStaffName !== undefined ? assignedStaffName : item.assignedStaffName,
          assignedStaffRole: assignedStaffRole !== undefined ? assignedStaffRole : item.assignedStaffRole,
          assignedNote: assignedNote !== undefined ? assignedNote : item.assignedNote,
          assignedAt: assignedStaffId ? (item.assignedAt || new Date().toISOString()) : item.assignedAt,
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to update request', e);
    return getStoredRequests();
  }
}

export function saveStoredRequests(requests: QuotationRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save stored requests', e);
  }
}

export function deleteStoredRequest(id: string): boolean {
  try {
    const current = getStoredRequests();
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Failed to delete stored request', e);
    return false;
  }
}


