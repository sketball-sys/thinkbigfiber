import React, { useState } from 'react';
import { 
  Search, Filter, Eye, Phone, Mail, CheckCircle2, Clock, 
  FileText, ArrowLeft, ExternalLink, Edit3, X, Save, MessageSquare,
  AlertCircle, ChevronRight, Printer, RefreshCw, MapPin, Calendar, Truck,
  Users, LogOut, ShieldCheck, Briefcase, Lock, UserCheck, Paperclip, Link,
  Compass, Palette, Tag, Building, Globe, Check, HardDrive
} from 'lucide-react';
import { QuotationRequest, RequestStatus, WORK_CATEGORIES, WorkCategory } from '../types/fiberglass';
import { StaffMember } from '../types/staff';
import { formatBaht } from '../utils/calculator';
import { StaffManagement } from './StaffManagement';
import { CategoryManagement } from './CategoryManagement';

interface AdminDashboardProps {
  currentUser: StaffMember;
  staffList: StaffMember[];
  onStaffListChange: (updatedList: StaffMember[]) => void;
  categories: WorkCategory[];
  onCategoriesChange: (updated: WorkCategory[]) => void;
  onLogout: () => void;
  requests: QuotationRequest[];
  onUpdateRequest: (
    id: string,
    status: RequestStatus,
    adminNotes?: string,
    adminFinalQuote?: number,
    assignedStaffId?: string,
    assignedStaffName?: string,
    assignedStaffRole?: string,
    assignedNote?: string
  ) => void;
  onBackToForm: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  staffList,
  onStaffListChange,
  categories,
  onCategoriesChange,
  onLogout,
  requests,
  onUpdateRequest,
  onBackToForm,
}) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'staff' | 'categories'>('quotes');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned_to_me' | 'unassigned'>('all');
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);

  // Edit states for the selected request
  const [editStatus, setEditStatus] = useState<RequestStatus>('pending');
  const [editNotes, setEditNotes] = useState('');
  const [editFinalQuote, setEditFinalQuote] = useState<string>('');
  const [editAssignedStaffId, setEditAssignedStaffId] = useState<string>('');
  const [editAssignedNote, setEditAssignedNote] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  const isFullAdmin = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  // Permission Check: does the current staff member have access to view this request?
  const canUserSeeRequest = (req: QuotationRequest): boolean => {
    // Admin and Supervisor can see all requests
    if (isFullAdmin) return true;

    // Directly assigned to this staff member
    if (req.assignedStaffId === currentUser.id) return true;

    // Staff has 'all' categories assigned
    if (currentUser.assignedCategories.includes('all')) return true;

    // Matches the request's work category
    if (req.workCategoryId && currentUser.assignedCategories.includes(req.workCategoryId)) {
      return true;
    }

    return false;
  };

  const handleOpenDetail = (req: QuotationRequest) => {
    setSelectedRequest(req);
    setEditStatus(req.status);
    setEditNotes(req.adminNotes || '');
    setEditFinalQuote(req.adminFinalQuote ? req.adminFinalQuote.toString() : '');
    setEditAssignedStaffId(req.assignedStaffId || '');
    setEditAssignedNote(req.assignedNote || '');
    setIsSaved(false);
  };

  const handleSaveDetail = () => {
    if (!selectedRequest) return;
    const finalPrice = editFinalQuote ? parseFloat(editFinalQuote) : undefined;

    // Find assigned staff details if changed
    let assignedName: string | undefined = selectedRequest.assignedStaffName;
    let assignedRole: string | undefined = selectedRequest.assignedStaffRole;

    if (editAssignedStaffId) {
      const foundStaff = staffList.find((s) => s.id === editAssignedStaffId);
      if (foundStaff) {
        assignedName = foundStaff.name;
        assignedRole = foundStaff.salesProductSpecialty || foundStaff.customRoleTitle || foundStaff.role;
      }
    } else {
      assignedName = undefined;
      assignedRole = undefined;
    }

    onUpdateRequest(
      selectedRequest.id,
      editStatus,
      editNotes,
      finalPrice,
      editAssignedStaffId || undefined,
      assignedName,
      assignedRole,
      editAssignedNote.trim() || undefined
    );
    
    // Update local selected state
    setSelectedRequest({
      ...selectedRequest,
      status: editStatus,
      adminNotes: editNotes,
      adminFinalQuote: finalPrice,
      assignedStaffId: editAssignedStaffId || undefined,
      assignedStaffName: assignedName,
      assignedStaffRole: assignedRole,
      assignedNote: editAssignedNote.trim() || undefined,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Base list visible to current user
  const visibleRequests = requests.filter(canUserSeeRequest);

  // Apply UI filters (search, status, category, assignment)
  const filteredRequests = visibleRequests.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phoneNumber.includes(searchQuery) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.companyName && r.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    const matchesCategory = categoryFilter === 'all' || r.workCategoryId === categoryFilter;

    let matchesAssignment = true;
    if (assignmentFilter === 'assigned_to_me') {
      matchesAssignment = r.assignedStaffId === currentUser.id;
    } else if (assignmentFilter === 'unassigned') {
      matchesAssignment = !r.assignedStaffId;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesAssignment;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-md">
            รอตรวจสอบ
          </span>
        );
      case 'reviewing':
        return (
          <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-md">
            กำลังประเมินสเปก
          </span>
        );
      case 'quoted':
        return (
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-md">
            ส่งใบเสนอราคาแล้ว
          </span>
        );
      case 'approved':
        return (
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-md">
            อนุมัติสั่งผลิต
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-md">
            ยกเลิก/ไม่พร้อมผลิต
          </span>
        );
    }
  };

  const getUserRoleTitle = (role: string) => {
    switch (role) {
      case 'admin': return 'แอดมิน (Admin)';
      case 'supervisor': return 'หัวหน้างาน (Supervisor)';
      case 'sales': return 'ฝ่ายขาย (Sales)';
      case 'designer': return 'ผู้ออกแบบ (Designer)';
      default: return currentUser.customRoleTitle || 'พนักงาน';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      
      {/* Top Banner with Company Branding & Staff User Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            onClick={onBackToForm}
            className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับไปยังแบบฟอร์มลูกค้าขอราคา</span>
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ระบบจัดการคำขอ (ฝ่ายขาย & โรงงาน)
            </h1>
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              คิดใหญ่ ไฟเบอร์กลาส
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>บริษัท คิดใหญ่ ไฟเบอร์กลาส จำกัด</span>
            <span>•</span>
            <a href="https://www.thinkbigthailand.com" target="_blank" rel="noreferrer" className="text-sky-700 dark:text-sky-400 hover:underline font-mono">
              www.thinkbigthailand.com
            </a>
          </p>
        </div>

        {/* Current User Card & Session Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              currentUser.role === 'admin'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : currentUser.role === 'supervisor'
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : currentUser.role === 'designer'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
            }`}>
              {currentUser.role === 'admin' ? 'AD' : currentUser.role === 'supervisor' ? 'SV' : currentUser.role === 'designer' ? 'DS' : 'SA'}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200'
                    : currentUser.role === 'supervisor'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200'
                    : 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200'
                }`}>
                  {getUserRoleTitle(currentUser.role)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentUser.salesProductSpecialty ? (
                  <span>🎯 {currentUser.salesProductSpecialty}</span>
                ) : currentUser.assignedCategories.includes('all') ? (
                  <span>🌐 ดูแลทุกกลุ่มงาน</span>
                ) : (
                  <span>ดูแล {currentUser.assignedCategories.length} กลุ่มงาน</span>
                )}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Quotations vs Staff Management */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'quotes'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>รายการคำขอประเมินราคา</span>
          <span className={`text-xs px-2 py-0.2 rounded-full tabular-nums font-mono ${
            activeTab === 'quotes' ? 'bg-sky-800 text-sky-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {visibleRequests.length}
          </span>
        </button>

        {currentUser.role === 'admin' ? (
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการพนักงานและสิทธิ์กลุ่มงาน</span>
            <span className={`text-xs px-2 py-0.2 rounded-full tabular-nums font-mono ${
              activeTab === 'staff' ? 'bg-sky-800 text-sky-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {staffList.length}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl">
            <Lock className="w-3.5 h-3.5" />
            <span>จัดการพนักงาน (เฉพาะแอดมิน)</span>
          </div>
        )}

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>กลุ่มสินค้า / บริการ</span>
            <span className={`text-xs px-2 py-0.2 rounded-full tabular-nums font-mono ${
              activeTab === 'categories' ? 'bg-sky-800 text-sky-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {categories.length}
            </span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: STAFF MANAGEMENT (ADMIN ONLY) */}
      {activeTab === 'staff' && currentUser.role === 'admin' ? (
        <StaffManagement
          currentUser={currentUser}
          staffList={staffList}
          onStaffListChange={onStaffListChange}
        />
      ) : activeTab === 'categories' && currentUser.role === 'admin' ? (
        <CategoryManagement
          currentUser={currentUser}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
        />
      ) : (
        /* TAB CONTENT 2: QUOTATIONS LIST */
        <div>
          {/* Permission Notice for Sales Reps */}
          {!isFullAdmin && (
            <div className="mb-4 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-800 dark:text-sky-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 shrink-0 text-sky-600" />
                <span>
                  <strong>มุมมองฝ่ายขาย:</strong> ระบบแสดงเฉพาะคำขอในกลุ่มงานที่ได้รับมอบหมาย หรือคำขอที่แอดมินมอบหมายให้คุณโดยตรง
                </span>
              </div>
              <span className="font-semibold text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 shrink-0">
                เห็น {visibleRequests.length} รายการ
              </span>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search */}
              <div className="sm:col-span-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, รหัส RFQ, บริษัท หรือชิ้นงาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                />
              </div>

              {/* Work Category Filter */}
              <div className="sm:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 shadow-2xs"
                >
                  <option value="all">ทุกกลุ่มประเภทงาน</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Filter */}
              <div className="sm:col-span-3">
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 shadow-2xs"
                >
                  <option value="all">สถานะมอบหมายทั้งหมด</option>
                  <option value="assigned_to_me">📌 มอบหมายให้ฉันโดยเฉพาะ</option>
                  <option value="unassigned">⏳ ยังไม่ได้มอบหมายให้ใคร</option>
                </select>
              </div>
            </div>

            {/* Status segmented filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'สถานะทั้งหมด' },
                { id: 'pending', label: 'รอตรวจสอบ' },
                { id: 'reviewing', label: 'กำลังประเมิน' },
                { id: 'quoted', label: 'เสนอราคาแล้ว' },
                { id: 'approved', label: 'อนุมัติผลิต' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Table / Requests List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">ไม่พบรายการคำขอประเมินราคาตามเงื่อนไข</p>
                <p className="text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกกลุ่มงานและสถานะอื่น</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-4">รหัส / วันที่</th>
                      <th className="py-3.5 px-4">ลูกค้า / ผู้ติดต่อ</th>
                      <th className="py-3.5 px-4">กลุ่มงาน & ชิ้นงาน</th>
                      <th className="py-3.5 px-4">ผู้รับผิดชอบงาน</th>
                      <th className="py-3.5 px-4">ขนาด (กxยxส)</th>
                      <th className="py-3.5 px-4">สถานที่จัดส่ง / กำหนด</th>
                      <th className="py-3.5 px-4 text-center">จำนวน</th>
                      <th className="py-3.5 px-4">ประมาณการราคา</th>
                      <th className="py-3.5 px-4 text-center">สถานะ</th>
                      <th className="py-3.5 px-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => handleOpenDetail(req)}
                        className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        {/* RFQ & Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400 block">
                            {req.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {req.customerName}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>📞 {req.phoneNumber}</span>
                            {req.companyName && <span>· {req.companyName}</span>}
                          </div>
                        </td>

                        {/* Work Title, Category & Thumbnail */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {req.photos.length > 0 && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                <img
                                  src={req.photos[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">
                                {req.workTitle}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
                                  {req.workCategory}
                                </span>
                                {req.projectCloudLink && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold" title="มีลิงก์ดาวน์โหลดแบบโครงการ">
                                    🔗 Cloud
                                  </span>
                                )}
                                {req.projectFiles && req.projectFiles.length > 0 && (
                                  <span className="text-[10px] text-slate-500" title={`แนบไฟล์ ${req.projectFiles.length} ไฟล์`}>
                                    📎 {req.projectFiles.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Staff */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {req.assignedStaffName ? (
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{req.assignedStaffName}</span>
                              </span>
                              {req.assignedStaffRole && (
                                <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                  {req.assignedStaffRole}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              ⏳ ยังไม่ได้มอบหมาย
                            </span>
                          )}
                        </td>

                        {/* Dimensions */}
                        <td className="py-4 px-4 whitespace-nowrap tabular-nums font-mono text-[11px]">
                          {req.dimensions.shape === 'cylinder'
                            ? `Ø${req.dimensions.diameter} x H${req.dimensions.height} ${req.dimensions.unit}`
                            : `${req.dimensions.width} x ${req.dimensions.length || req.dimensions.diameter} x ${req.dimensions.height} ${req.dimensions.unit}`}
                          <span className="text-slate-400 block font-sans">หนา {req.dimensions.wallThicknessMm} mm</span>
                        </td>

                        {/* Delivery & Timeline */}
                        <td className="py-4 px-4 whitespace-nowrap text-[11px]">
                          <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span className="truncate max-w-[130px]" title={req.deliveryLocation}>
                              {req.province || req.deliveryLocation}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{req.requiredDate}</span>
                            {req.urgency === 'urgent' && (
                              <span className="text-[9px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950 px-1 rounded">
                                ด่วน
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="py-4 px-4 text-center whitespace-nowrap font-bold tabular-nums">
                          {req.quantity} ชิ้น
                        </td>

                        {/* Estimate */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {req.adminFinalQuote ? (
                            <div>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums block">
                                {formatBaht(req.adminFinalQuote)}
                              </span>
                              <span className="text-[10px] text-slate-400">ราคาทางการ</span>
                            </div>
                          ) : (
                            <div className="tabular-nums font-semibold text-slate-900 dark:text-slate-200">
                              {formatBaht(req.estimatedPriceMin)}
                              <span className="text-[11px] text-slate-400 block font-normal">
                                ถึง {formatBaht(req.estimatedPriceMax)}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(req.status)}
                        </td>

                        {/* Action view */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(req);
                            }}
                            className="p-1.5 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="ดูรายละเอียดและประเมินราคา"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUEST DETAIL & ASSIGNMENT MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                  RFQ
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>คำขอประเมินราคา: {selectedRequest.id}</span>
                    {getStatusBadge(selectedRequest.status)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ยื่นคำขอเมื่อ {new Date(selectedRequest.createdAt).toLocaleString('th-TH')} · คิดใหญ่ ไฟเบอร์กลาส
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs">
              
              {/* Customer Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block font-semibold">ชื่อลูกค้า:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{selectedRequest.customerName}</span>
                  {selectedRequest.companyName && (
                    <span className="text-slate-500 block">{selectedRequest.companyName}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">เบอร์โทรศัพท์:</span>
                  <a href={`tel:${selectedRequest.phoneNumber}`} className="font-bold text-sky-700 dark:text-sky-400 hover:underline">
                    📞 {selectedRequest.phoneNumber}
                  </a>
                  {selectedRequest.lineId && (
                    <span className="text-slate-500 block">LINE: {selectedRequest.lineId}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">อีเมลติดต่อ:</span>
                  <a href={`mailto:${selectedRequest.email}`} className="font-medium text-slate-800 dark:text-slate-200 hover:underline truncate block">
                    ✉️ {selectedRequest.email}
                  </a>
                </div>
              </div>

              {/* Photos Gallery */}
              {selectedRequest.photos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      รูปภาพชิ้นงานที่แนบ ({selectedRequest.photos.length} รูป)
                    </span>
                    {selectedRequest.driveFolderUrl && (
                      <a
                        href={selectedRequest.driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] rounded-lg hover:underline transition-colors"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        <span>เปิดดูโฟลเดอร์ใน Google Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedRequest.photos.map((img, idx) => {
                      const driveLink = selectedRequest.drivePhotoUrls && selectedRequest.drivePhotoUrls[idx];
                      return (
                        <a
                          key={idx}
                          href={driveLink || img}
                          target="_blank"
                          rel="noreferrer"
                          className="group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-slate-100 dark:bg-slate-800"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {driveLink && (
                            <span className="absolute top-1 right-1 text-[9px] font-bold bg-emerald-600/90 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                              <Check className="w-2.5 h-2.5" /> Drive
                            </span>
                          )}
                          <span className="absolute bottom-1 right-1 p-1 bg-black/60 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Large Project: Cloud Link & Files (if provided) */}
              {(selectedRequest.projectCloudLink || (selectedRequest.projectFiles && selectedRequest.projectFiles.length > 0)) && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wider">
                      ไฟล์แบบและเอกสารโครงการขนาดใหญ่ (Large Project Documents)
                    </span>
                  </div>

                  {selectedRequest.projectCloudLink && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-slate-400 block text-[10px]">ลิงก์ดาวน์โหลดแบบ/โฟลเดอร์โครงการ:</span>
                        <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 truncate block">
                          {selectedRequest.projectCloudLink}
                        </span>
                        {selectedRequest.projectCloudNote && (
                          <span className="text-slate-500 text-[11px] block mt-0.5">
                            หมายเหตุ: {selectedRequest.projectCloudNote}
                          </span>
                        )}
                      </div>
                      <a
                        href={selectedRequest.projectCloudLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดลิงก์ดาวน์โหลด</span>
                      </a>
                    </div>
                  )}

                  {selectedRequest.projectFiles && selectedRequest.projectFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-slate-500 block text-[11px] font-medium">
                        ไฟล์เอกสารที่แนบมา ({selectedRequest.projectFiles.length} ไฟล์):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedRequest.projectFiles.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between p-2 px-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{f.name}</span>
                              <span className="text-[10px] text-slate-400">({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
                            </div>
                            {f.dataUrl && (
                              <a
                                href={f.dataUrl}
                                download={f.name}
                                className="text-sky-700 dark:text-sky-400 hover:underline text-[11px] font-bold shrink-0 ml-2"
                              >
                                ดาวน์โหลด
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Engineering Specs & Categories */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    สเปกและมิติทางวิศวกรรม
                  </span>
                  <span className="font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                    กลุ่มงาน: {selectedRequest.workCategory}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block">ชื่อเรียกงาน:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRequest.workTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">รูปทรง:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRequest.dimensions.shape}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">มิติ (กxยxส):</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                      {selectedRequest.dimensions.shape === 'cylinder'
                        ? `Ø${selectedRequest.dimensions.diameter} x H${selectedRequest.dimensions.height} ${selectedRequest.dimensions.unit}`
                        : `${selectedRequest.dimensions.width} x ${selectedRequest.dimensions.length || selectedRequest.dimensions.diameter} x ${selectedRequest.dimensions.height} ${selectedRequest.dimensions.unit}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ความหนาชิ้นงาน:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRequest.dimensions.wallThicknessMm} มม.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">พื้นที่ผิวโดยประมาณ:</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{selectedRequest.estimatedSurfaceAreaM2} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">จำนวนสั่งผลิต:</span>
                    <span className="font-bold text-sky-700 dark:text-sky-400 text-sm">{selectedRequest.quantity} ชิ้น</span>
                  </div>
                </div>

                {/* Delivery & Timeline specs */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">สถานที่จัดส่ง/ติดตั้ง: </span>
                        <span className="text-slate-600 dark:text-slate-400">{selectedRequest.deliveryLocation}</span>
                        <span className="text-sky-700 dark:text-sky-400 font-bold ml-1.5">
                          ({selectedRequest.needInstallation ? '🛠️ ต้องการทีมช่างติดตั้งหน้างาน' : '🚚 จัดส่งสินค้าอย่างเดียว'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">กำหนดวันที่ต้องการใช้งาน: </span>
                      <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{selectedRequest.requiredDate}</span>
                      <span className="text-slate-500 ml-1.5">
                        (ระดับความเร่งด่วน: {selectedRequest.urgency === 'urgent' ? 'ด่วนพิเศษ (7-25 วัน)' : selectedRequest.urgency === 'normal' ? 'ปกติ (25-45 วัน)' : 'ยืดหยุ่นได้'})
                      </span>
                    </div>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">หมายเหตุจากลูกค้า: </span>
                    {selectedRequest.notes}
                  </div>
                )}
              </div>

              {/* Action Update Form for Staff & Job Assignment */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                  การจัดการผู้รับผิดชอบ & อัปเดตราคาประเมิน
                </span>

                {/* Job Assignment Dropdown */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>มอบหมายงานให้ฝ่ายขาย/ผู้รับผิดชอบเฉพาะราย:</span>
                    </label>
                    {!isFullAdmin && (
                      <span className="text-[10px] text-slate-400">(เจ้าหน้าที่สามารถดูหรือส่งต่อให้เพื่อนร่วมทีม)</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={editAssignedStaffId}
                        onChange={(e) => setEditAssignedStaffId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                      >
                        <option value="">-- ยังไม่ระบุผู้รับผิดชอบ (ส่วนกลาง) --</option>
                        {staffList.filter(s => s.isActive).map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} ({staff.salesProductSpecialty || staff.customRoleTitle || staff.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="หมายเหตุการมอบหมาย (เช่น นัดโทรประสานงานฝ่ายจัดซื้อ)"
                        value={editAssignedNote}
                        onChange={(e) => setEditAssignedNote(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Final Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      สถานะคำขอ
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as RequestStatus)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                    >
                      <option value="pending">รอตรวจสอบ (Pending)</option>
                      <option value="reviewing">กำลังประเมินสเปก (Reviewing)</option>
                      <option value="quoted">ส่งใบเสนอราคาแล้ว (Quoted)</option>
                      <option value="approved">อนุมัติสั่งผลิต (Approved)</option>
                      <option value="rejected">ยกเลิก/ไม่พร้อมผลิต (Rejected)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ราคาทางการสุทธิ (THB)
                    </label>
                    <input
                      type="number"
                      placeholder={`เช่น ${selectedRequest.estimatedPriceMin}`}
                      value={editFinalQuote}
                      onChange={(e) => setEditFinalQuote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    บันทึกภายในฝ่ายขาย / ข้อมูลทางเทคนิค
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น นัดเข้าวัดขนาดชิ้นงานจริงวันจันทร์, ยืนยันใช้เรซิน Vinyl Ester, ออกแบบ CAD เรียบร้อย..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSaveDetail}
                    className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการมอบหมายและประเมินราคา</span>
                  </button>

                  {isSaved && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> บันทึกสำเร็จแล้ว
                    </span>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}


    </div>
  );
};
