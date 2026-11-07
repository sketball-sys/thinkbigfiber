import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
import { QuotationRequest, WorkCategory, WORK_CATEGORIES } from '../types/fiberglass';
import { StaffMember } from '../types/staff';
import { INITIAL_SAMPLE_REQUESTS } from '../utils/storage';
import { INITIAL_STAFF_MEMBERS } from '../utils/staffStorage';

dotenv.config();

export const DB_CONFIG = {
  host: process.env.DB_HOST || '147.50.231.22',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'thinkbig_ai1_sale',
  password: process.env.DB_PASSWORD || 'Home@ai1_sales',
  database: process.env.DB_NAME || 'thinkbig_AI1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

export async function checkDbHealth(): Promise<{ ok: boolean; host: string; database: string; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    const p = getPool();
    await p.query('SELECT 1');
    return {
      ok: true,
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      latencyMs: Date.now() - start,
      message: 'เชื่อมต่อฐานข้อมูล MySQL 147.50.231.22:3306 สำเร็จ'
    };
  } catch (err: any) {
    return {
      ok: false,
      host: DB_CONFIG.host,
      database: DB_CONFIG.database,
      latencyMs: Date.now() - start,
      message: err?.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'
    };
  }
}

export async function initDb(): Promise<void> {
  const p = getPool();

  // Create staff_members table
  await p.query(`
    CREATE TABLE IF NOT EXISTS staff_members (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      custom_role_title VARCHAR(255) NULL,
      department VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(100) NULL,
      assigned_categories_json JSON NULL,
      sales_product_specialty VARCHAR(255) NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create quotation_requests table
  await p.query(`
    CREATE TABLE IF NOT EXISTS quotation_requests (
      id VARCHAR(64) PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(100) NULL,
      email VARCHAR(255) NULL,
      work_category_id VARCHAR(100) NULL,
      status VARCHAR(50) DEFAULT 'pending',
      assigned_staff_id VARCHAR(64) NULL,
      data_json MEDIUMTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS work_categories (
      id VARCHAR(100) PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      badge_color VARCHAR(50) DEFAULT 'sky',
      display_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed work categories if empty
  const [catRows]: any = await p.query('SELECT COUNT(*) as cnt FROM work_categories');
  if (catRows[0]?.cnt === 0) {
    let order = 1;
    for (const cat of WORK_CATEGORIES) {
      await p.query(
        `INSERT INTO work_categories (id, code, name, description, badge_color, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [cat.id, cat.code, cat.name, cat.description, cat.badgeColor || 'sky', order++]
      );
    }
    console.log('[DB] Default work categories seeded successfully');
  }

  // Seed staff if empty
  const [staffRows]: any = await p.query('SELECT COUNT(*) as cnt FROM staff_members');
  if (staffRows[0]?.cnt === 0) {
    for (const staff of INITIAL_STAFF_MEMBERS) {
      await p.query(
        `INSERT INTO staff_members (
          id, username, password, name, role, custom_role_title, department, email, phone, assigned_categories_json, sales_product_specialty, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          staff.id,
          staff.username,
          staff.password,
          staff.name,
          staff.role,
          staff.customRoleTitle || null,
          staff.department || null,
          staff.email || null,
          staff.phoneNumber || staff.phone || null,
          JSON.stringify(staff.assignedCategories || []),
          staff.salesProductSpecialty || null,
          staff.isActive ? 1 : 0,
          new Date(staff.createdAt)
        ]
      );
    }
    console.log('[DB] Default staff members seeded successfully');
  }

  // Seed sample requests if empty
  const [reqRows]: any = await p.query('SELECT COUNT(*) as cnt FROM quotation_requests');
  if (reqRows[0]?.cnt === 0) {
    for (const req of INITIAL_SAMPLE_REQUESTS) {
      await p.query(
        `INSERT INTO quotation_requests (
          id, customer_name, phone_number, email, work_category_id, status, assigned_staff_id, data_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.id,
          req.customerName,
          req.phoneNumber,
          req.email,
          req.workCategoryId,
          req.status,
          req.assignedStaffId || null,
          JSON.stringify(req),
          new Date(req.createdAt)
        ]
      );
    }
    console.log('[DB] Sample quotation requests seeded successfully');
  }
}

// Convert DB row to QuotationRequest
function mapRowToQuotation(row: any): QuotationRequest {
  if (row.data_json) {
    try {
      const parsed = JSON.parse(row.data_json);
      // Ensure row overrides for status and assignment
      if (row.status) parsed.status = row.status;
      if (row.assigned_staff_id !== undefined) parsed.assignedStaffId = row.assigned_staff_id || undefined;
      return parsed;
    } catch {}
  }

  return {
    id: row.id,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    customerName: row.customer_name || '',
    phoneNumber: row.phone_number || row.phone || '',
    email: row.email || '',
    photos: [],
    dimensions: {
      shape: 'box',
      unit: 'cm',
      width: 100,
      length: 100,
      height: 100,
      wallThicknessMm: 3
    },
    workTitle: 'งานผลิตไฟเบอร์กลาสสั่งทำพิเศษ',
    workCategoryId: row.work_category_id || 'industrial_tank',
    workCategory: 'ถังเคมี / ถังบำบัดน้ำเสีย / งานท่อ FRP',
    quantity: 1,
    hasSteelFrame: false,
    deliveryLocation: '',
    requiredDate: '',
    urgency: 'normal',
    needInstallation: false,
    estimatedSurfaceAreaM2: 1.0,
    estimatedPriceMin: 15000,
    estimatedPriceMax: 20000,
    estimatedMoldCostMin: 10000,
    estimatedMoldCostMax: 15000,
    estimatedDays: 14,
    status: (row.status || 'pending') as any,
    assignedStaffId: row.assigned_staff_id || undefined,
  };
}

// Convert DB row to StaffMember
function mapRowToStaff(row: any): StaffMember {
  let assignedCategories: string[] = [];
  try {
    assignedCategories = typeof row.assigned_categories_json === 'string'
      ? JSON.parse(row.assigned_categories_json)
      : (row.assigned_categories_json || []);
  } catch {}

  return {
    id: row.id,
    username: row.username,
    password: row.password,
    name: row.name,
    role: row.role as any,
    customRoleTitle: row.custom_role_title || undefined,
    department: row.department || '',
    email: row.email || '',
    phone: row.phone || '',
    phoneNumber: row.phone || '',
    assignedCategories,
    salesProductSpecialty: row.sales_product_specialty || undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    lastLogin: row.last_login ? new Date(row.last_login).toISOString() : undefined,
  };
}

// Quotation Requests Operations
export async function dbGetQuotationRequests(): Promise<QuotationRequest[]> {
  const p = getPool();
  const [rows]: any = await p.query('SELECT * FROM quotation_requests ORDER BY created_at DESC');
  return rows.map(mapRowToQuotation);
}

export async function dbCreateQuotationRequest(req: QuotationRequest): Promise<QuotationRequest> {
  const p = getPool();
  const jsonStr = JSON.stringify(req);
  await p.query(
    `INSERT INTO quotation_requests (
      id, customer_name, phone_number, email, work_category_id, status, assigned_staff_id, data_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      customer_name = VALUES(customer_name),
      phone_number = VALUES(phone_number),
      email = VALUES(email),
      work_category_id = VALUES(work_category_id),
      status = VALUES(status),
      assigned_staff_id = VALUES(assigned_staff_id),
      data_json = VALUES(data_json),
      updated_at = CURRENT_TIMESTAMP`,
    [
      req.id,
      req.customerName,
      req.phoneNumber,
      req.email,
      req.workCategoryId,
      req.status || 'pending',
      req.assignedStaffId || null,
      jsonStr,
      new Date(req.createdAt)
    ]
  );
  return req;
}

export async function dbUpdateRequestStatus(
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
  const p = getPool();
  
  // First load existing request
  const [rows]: any = await p.query('SELECT * FROM quotation_requests WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;

  const currentReq = mapRowToQuotation(rows[0]);
  currentReq.status = status;
  if (adminNotes !== undefined) currentReq.adminNotes = adminNotes;

  if (assignment) {
    if (assignment.assignedStaffId !== undefined) {
      currentReq.assignedStaffId = assignment.assignedStaffId || undefined;
    }
    if (assignment.assignedStaffName !== undefined) {
      currentReq.assignedStaffName = assignment.assignedStaffName || undefined;
    }
    if (assignment.assignedStaffRole !== undefined) {
      currentReq.assignedStaffRole = assignment.assignedStaffRole || undefined;
    }
    if (assignment.assignedAt !== undefined) {
      currentReq.assignedAt = assignment.assignedAt || undefined;
    }
    if (assignment.assignedNote !== undefined) {
      currentReq.assignedNote = assignment.assignedNote || undefined;
    }
  }

  const updatedJson = JSON.stringify(currentReq);

  await p.query(
    `UPDATE quotation_requests SET 
      status = ?,
      assigned_staff_id = ?,
      data_json = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [status, currentReq.assignedStaffId || null, updatedJson, id]
  );

  return currentReq;
}

export async function dbDeleteQuotationRequest(id: string): Promise<boolean> {
  const p = getPool();
  const [res]: any = await p.query('DELETE FROM quotation_requests WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// Staff Operations
export async function dbGetStaffMembers(): Promise<StaffMember[]> {
  const p = getPool();
  const [rows]: any = await p.query('SELECT * FROM staff_members ORDER BY created_at ASC');
  return rows.map(mapRowToStaff);
}

export async function dbAuthenticateStaff(username: string, pass: string): Promise<StaffMember | null> {
  const p = getPool();
  const [rows]: any = await p.query(
    'SELECT * FROM staff_members WHERE username = ? AND password = ? AND is_active = 1',
    [username.trim(), pass]
  );
  if (!rows || rows.length === 0) return null;

  const staff = mapRowToStaff(rows[0]);
  // Update last login
  await p.query('UPDATE staff_members SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [staff.id]);
  return staff;
}

export async function dbCreateStaffMember(staff: StaffMember): Promise<StaffMember> {
  const p = getPool();
  await p.query(
    `INSERT INTO staff_members (
      id, username, password, name, role, custom_role_title, department, email, phone, assigned_categories_json, sales_product_specialty, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      staff.id,
      staff.username.trim(),
      staff.password,
      staff.name.trim(),
      staff.role,
      staff.customRoleTitle || null,
      staff.department || null,
      staff.email || null,
      staff.phoneNumber || staff.phone || null,
      JSON.stringify(staff.assignedCategories || []),
      staff.salesProductSpecialty || null,
      staff.isActive ? 1 : 0,
      new Date(staff.createdAt)
    ]
  );
  return staff;
}

export async function dbUpdateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
  const p = getPool();
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name.trim());
  }
  if (updates.role !== undefined) {
    setClauses.push('role = ?');
    values.push(updates.role);
  }
  if (updates.customRoleTitle !== undefined) {
    setClauses.push('custom_role_title = ?');
    values.push(updates.customRoleTitle || null);
  }
  if (updates.department !== undefined) {
    setClauses.push('department = ?');
    values.push(updates.department || null);
  }
  if (updates.email !== undefined) {
    setClauses.push('email = ?');
    values.push(updates.email || null);
  }
  if (updates.phoneNumber !== undefined || updates.phone !== undefined) {
    setClauses.push('phone = ?');
    values.push(updates.phoneNumber || updates.phone || null);
  }
  if (updates.assignedCategories !== undefined) {
    setClauses.push('assigned_categories_json = ?');
    values.push(JSON.stringify(updates.assignedCategories));
  }
  if (updates.salesProductSpecialty !== undefined) {
    setClauses.push('sales_product_specialty = ?');
    values.push(updates.salesProductSpecialty || null);
  }
  if (updates.isActive !== undefined) {
    setClauses.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  if (updates.password !== undefined && updates.password) {
    setClauses.push('password = ?');
    values.push(updates.password);
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  await p.query(`UPDATE staff_members SET ${setClauses.join(', ')} WHERE id = ?`, values);

  const [rows]: any = await p.query('SELECT * FROM staff_members WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;
  return mapRowToStaff(rows[0]);
}

export async function dbDeleteStaffMember(id: string): Promise<boolean> {
  const p = getPool();
  const [res]: any = await p.query('DELETE FROM staff_members WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

// Work Categories Operations
export async function dbGetWorkCategories(includeInactive = false): Promise<WorkCategory[]> {
  const p = getPool();
  const query = includeInactive 
    ? 'SELECT * FROM work_categories ORDER BY display_order ASC, name ASC'
    : 'SELECT * FROM work_categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC';
  const [rows]: any = await p.query(query);
  return rows.map((r: any): WorkCategory => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    badgeColor: r.badge_color || 'sky',
    displayOrder: Number(r.display_order ?? 0),
    isActive: Boolean(r.is_active),
  }));
}

export async function dbCreateWorkCategory(cat: WorkCategory): Promise<WorkCategory> {
  const p = getPool();
  const id = cat.id || `cat_${Date.now()}`;
  const code = cat.code || id.slice(0, 6).toUpperCase();
  const displayOrder = cat.displayOrder !== undefined ? Number(cat.displayOrder) : 99;
  await p.query(
    `INSERT INTO work_categories (id, code, name, description, badge_color, display_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [id, code, cat.name.trim(), cat.description.trim(), cat.badgeColor || 'sky', displayOrder]
  );
  return { ...cat, id, code, displayOrder, isActive: true };
}

export async function dbUpdateWorkCategory(id: string, updates: Partial<WorkCategory>): Promise<WorkCategory | null> {
  const p = getPool();
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name.trim());
  }
  if (updates.code !== undefined) {
    setClauses.push('code = ?');
    values.push(updates.code.trim().toUpperCase());
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description.trim());
  }
  if (updates.badgeColor !== undefined) {
    setClauses.push('badge_color = ?');
    values.push(updates.badgeColor);
  }
  if (updates.displayOrder !== undefined) {
    setClauses.push('display_order = ?');
    values.push(Number(updates.displayOrder));
  }
  if (updates.isActive !== undefined) {
    setClauses.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  await p.query(`UPDATE work_categories SET ${setClauses.join(', ')} WHERE id = ?`, values);

  const [rows]: any = await p.query('SELECT * FROM work_categories WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    badgeColor: r.badge_color || 'sky',
    displayOrder: Number(r.display_order ?? 0),
    isActive: Boolean(r.is_active),
  };
}

export async function dbReorderWorkCategories(orderedIds: string[]): Promise<WorkCategory[]> {
  const p = getPool();
  for (let i = 0; i < orderedIds.length; i++) {
    await p.query('UPDATE work_categories SET display_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
  }
  return dbGetWorkCategories(true);
}

export async function dbDeleteWorkCategory(id: string): Promise<boolean> {
  const p = getPool();
  // Instead of hard deleting, we can deactivate or delete if safe
  const [res]: any = await p.query('DELETE FROM work_categories WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

export async function dbResetWorkCategories(): Promise<WorkCategory[]> {
  const p = getPool();
  await p.query('DELETE FROM work_categories');
  let order = 1;
  for (const cat of WORK_CATEGORIES) {
    await p.query(
      `INSERT INTO work_categories (id, code, name, description, badge_color, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [cat.id, cat.code, cat.name, cat.description, cat.badgeColor || 'sky', order++]
    );
  }
  return dbGetWorkCategories(true);
}

