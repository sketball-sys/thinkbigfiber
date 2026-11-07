import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  initDb,
  checkDbHealth,
  dbGetQuotationRequests,
  dbCreateQuotationRequest,
  dbUpdateRequestStatus,
  dbDeleteQuotationRequest,
  dbGetStaffMembers,
  dbAuthenticateStaff,
  dbCreateStaffMember,
  dbUpdateStaffMember,
  dbDeleteStaffMember,
  dbGetWorkCategories,
  dbCreateWorkCategory,
  dbUpdateWorkCategory,
  dbDeleteWorkCategory,
  dbReorderWorkCategories,
  dbResetWorkCategories,
  DB_CONFIG
} from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Increase body limit for attachments and images
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Database
initDb().catch((err) => {
  console.error('[DB] Failed to initialize database tables:', err.message);
});

// API Routes
// 1. Health & Database connection status
app.get('/api/health', async (_req: Request, res: Response) => {
  const health = await checkDbHealth();
  res.json({
    status: health.ok ? 'ok' : 'degraded',
    database: {
      type: 'MySQL',
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      name: DB_CONFIG.database,
      user: DB_CONFIG.user,
      connected: health.ok,
      latencyMs: health.latencyMs,
      message: health.message,
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Quotation Requests
app.get('/api/requests', async (_req: Request, res: Response) => {
  try {
    const requests = await dbGetQuotationRequests();
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err: any) {
    console.error('[API] Error fetching requests:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/requests', async (req: Request, res: Response) => {
  try {
    const requestData = req.body;
    if (!requestData.id) {
      requestData.id = `TB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }
    if (!requestData.createdAt) {
      requestData.createdAt = new Date().toISOString();
    }
    const created = await dbCreateQuotationRequest(requestData);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error('[API] Error creating request:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/requests/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignment } = req.body;
    const updated = await dbUpdateRequestStatus(id, status, adminNotes, assignment);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API] Error updating request:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dbDeleteQuotationRequest(id);
    res.json({ success: deleted });
  } catch (err: any) {
    console.error('[API] Error deleting request:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Staff Management & Authentication
app.post('/api/staff/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' });
    }
    const staff = await dbAuthenticateStaff(username, password);
    if (!staff) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ' });
    }
    // Omit sensitive password in client payload
    const { password: _, ...safeUser } = staff;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('[API] Error during staff login:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/staff', async (_req: Request, res: Response) => {
  try {
    const staffList = await dbGetStaffMembers();
    // Return staff members
    res.json({ success: true, data: staffList });
  } catch (err: any) {
    console.error('[API] Error fetching staff:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/staff', async (req: Request, res: Response) => {
  try {
    const newStaff = req.body;
    if (!newStaff.id) {
      newStaff.id = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    if (!newStaff.createdAt) {
      newStaff.createdAt = new Date().toISOString();
    }
    const created = await dbCreateStaffMember(newStaff);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error('[API] Error creating staff:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await dbUpdateStaffMember(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API] Error updating staff:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dbDeleteStaffMember(id);
    res.json({ success: deleted });
  } catch (err: any) {
    console.error('[API] Error deleting staff:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Work Categories & Services Management
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await dbGetWorkCategories(includeInactive);
    res.json({ success: true, data: categories });
  } catch (err: any) {
    console.error('[API] Error fetching categories:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const newCategory = req.body;
    if (!newCategory.name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    const created = await dbCreateWorkCategory(newCategory);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error('[API] Error creating category:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await dbUpdateWorkCategory(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API] Error updating category:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dbDeleteWorkCategory(id);
    res.json({ success: deleted });
  } catch (err: any) {
    console.error('[API] Error deleting category:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/categories/reorder', async (req: Request, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, error: 'orderedIds must be an array of category IDs' });
    }
    const updated = await dbReorderWorkCategories(orderedIds);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API] Error reordering categories:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/categories/reset', async (_req: Request, res: Response) => {
  try {
    const resetList = await dbResetWorkCategories();
    res.json({ success: true, data: resetList });
  } catch (err: any) {
    console.error('[API] Error resetting categories:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Think Big Fiberglass server running at http://0.0.0.0:${PORT}`);
    console.log(`[DB] Connected to MySQL host: ${DB_CONFIG.host}:${DB_CONFIG.port}, Database: ${DB_CONFIG.database}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Failed to start:', err);
});
