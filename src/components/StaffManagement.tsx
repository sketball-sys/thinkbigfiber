import React, { useState } from 'react';
import { 
  Users, UserPlus, ShieldCheck, Briefcase, Edit, Trash2, Key, Check, X, 
  AlertCircle, Phone, Mail, Search, CheckCircle2, Lock, ShieldAlert,
  Compass, Palette, Tag, CheckSquare, Square
} from 'lucide-react';
import { StaffMember, PrimaryRole, ROLE_DEFINITIONS } from '../types/staff';
import { WORK_CATEGORIES } from '../types/fiberglass';
import { apiCreateStaff, apiUpdateStaff, apiDeleteStaff } from '../utils/api';
import { createStaffMember, updateStaffMember, deleteStaffMember } from '../utils/staffStorage';

interface StaffManagementProps {
  currentUser: StaffMember;
  staffList: StaffMember[];
  onStaffListChange: (updatedList: StaffMember[]) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  currentUser,
  staffList,
  onStaffListChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null);

  // Form states for Add Staff
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<PrimaryRole>('sales');
  const [newCustomRoleTitle, setNewCustomRoleTitle] = useState('');
  const [newSalesSpecialty, setNewSalesSpecialty] = useState('');
  const [newAssignedCategories, setNewAssignedCategories] = useState<string[]>(['industrial_tank', 'machine_cover']);
  const [formError, setFormError] = useState('');

  // Form states for Edit Staff
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<PrimaryRole>('sales');
  const [editCustomRoleTitle, setEditCustomRoleTitle] = useState('');
  const [editSalesSpecialty, setEditSalesSpecialty] = useState('');
  const [editAssignedCategories, setEditAssignedCategories] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState('');

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.salesProductSpecialty && s.salesProductSpecialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customRoleTitle && s.customRoleTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    const matchesCategory =
      categoryFilter === 'all' ||
      s.assignedCategories.includes('all') ||
      s.assignedCategories.includes(categoryFilter);

    return matchesSearch && matchesRole && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setNewName('');
    setNewUsername('');
    setNewPassword('password123');
    setNewEmail('');
    setNewPhone('');
    setNewRole('sales');
    setNewCustomRoleTitle('');
    setNewSalesSpecialty('ฝ่ายขายกลุ่มงานถังเคมีและอุตสาหกรรม');
    setNewAssignedCategories(['industrial_tank', 'machine_cover']);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleToggleAddCategory = (catId: string) => {
    if (catId === 'all') {
      if (newAssignedCategories.includes('all')) {
        setNewAssignedCategories([]);
      } else {
        setNewAssignedCategories(['all']);
      }
      return;
    }

    let updated = newAssignedCategories.filter((c) => c !== 'all');
    if (updated.includes(catId)) {
      updated = updated.filter((c) => c !== catId);
    } else {
      updated.push(catId);
    }

    if (updated.length === WORK_CATEGORIES.length) {
      setNewAssignedCategories(['all']);
    } else {
      setNewAssignedCategories(updated);
    }
  };

  const handleToggleEditCategory = (catId: string) => {
    if (catId === 'all') {
      if (editAssignedCategories.includes('all')) {
        setEditAssignedCategories([]);
      } else {
        setEditAssignedCategories(['all']);
      }
      return;
    }

    let updated = editAssignedCategories.filter((c) => c !== 'all');
    if (updated.includes(catId)) {
      updated = updated.filter((c) => c !== catId);
    } else {
      updated.push(catId);
    }

    if (updated.length === WORK_CATEGORIES.length) {
      setEditAssignedCategories(['all']);
    } else {
      setEditAssignedCategories(updated);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim() || !newUsername.trim() || !newPassword) {
      setFormError('กรุณากรอกชื่อ-นามสกุล, ชื่อผู้ใช้งาน และรหัสผ่าน');
      return;
    }

    const categoriesToSave =
      newRole === 'admin' || newRole === 'supervisor'
        ? ['all']
        : newAssignedCategories.length > 0
        ? newAssignedCategories
        : ['all'];

    const newStaffItem: StaffMember = {
      id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      username: newUsername.trim(),
      password: newPassword,
      email: newEmail.trim() || `${newUsername.trim()}@thinkbigthailand.com`,
      phoneNumber: newPhone.trim() || undefined,
      role: newRole,
      customRoleTitle: newRole === 'custom' ? newCustomRoleTitle.trim() : undefined,
      salesProductSpecialty: newRole === 'sales' ? newSalesSpecialty.trim() : undefined,
      assignedCategories: categoriesToSave,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await apiCreateStaff(newStaffItem);
      onStaffListChange([...staffList, created]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'ไม่สามารถเพิ่มพนักงานได้');
    }
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditRole(staff.role);
    setEditCustomRoleTitle(staff.customRoleTitle || '');
    setEditSalesSpecialty(staff.salesProductSpecialty || '');
    setEditAssignedCategories(staff.assignedCategories || ['all']);
    setEditPassword('');
    setEditEmail(staff.email);
    setEditPhone(staff.phoneNumber || '');
    setEditIsActive(staff.isActive);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError('');

    if (!editName.trim()) {
      setEditError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const categoriesToSave =
      editRole === 'admin' || editRole === 'supervisor'
        ? ['all']
        : editAssignedCategories.length > 0
        ? editAssignedCategories
        : ['all'];

    const updates: Partial<StaffMember> = {
      name: editName.trim(),
      role: editRole,
      customRoleTitle: editRole === 'custom' ? editCustomRoleTitle.trim() : undefined,
      salesProductSpecialty: editRole === 'sales' ? editSalesSpecialty.trim() : undefined,
      assignedCategories: categoriesToSave,
      email: editEmail.trim(),
      phoneNumber: editPhone.trim() || undefined,
      isActive: editIsActive,
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    try {
      const updated = await apiUpdateStaff(editingStaff.id, updates);
      if (updated) {
        onStaffListChange(staffList.map((s) => (s.id === editingStaff.id ? updated : s)));
        setEditingStaff(null);
      }
    } catch (err: any) {
      setEditError(err.message || 'ไม่สามารถแก้ไขข้อมูลได้');
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;

    if (deleteConfirmStaff.id === currentUser.id) {
      alert('ไม่สามารถลบบัญชีของตัวคุณเองที่กำลังใช้งานอยู่ได้');
      return;
    }

    try {
      await apiDeleteStaff(deleteConfirmStaff.id);
      onStaffListChange(staffList.filter((s) => s.id !== deleteConfirmStaff.id));
      setDeleteConfirmStaff(null);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบพนักงานได้');
    }
  };

  const getRoleBadge = (staff: StaffMember) => {
    switch (staff.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>แอดมิน (Admin)</span>
          </span>
        );
      case 'supervisor':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-lg">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>หัวหน้างาน (Supervisor)</span>
          </span>
        );
      case 'sales':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 px-2.5 py-0.5 rounded-lg">
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            <span>ฝ่ายขาย (Sales)</span>
          </span>
        );
      case 'designer':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-lg">
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>ผู้ออกแบบ (Designer)</span>
          </span>
        );
      case 'custom':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 rounded-lg">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span>{staff.customRoleTitle || 'ตำแหน่งกำหนดเอง'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-700 dark:text-sky-400" />
            <span>จัดการพนักงาน สิทธิ์ และกลุ่มงานที่รับผิดชอบ</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            แอดมินสามารถกำหนดตำแหน่งพนักงาน (แอดมิน, หัวหน้างาน, ฝ่ายขาย, ผู้ออกแบบ) และระบุกลุ่มประเภทงานที่ฝ่ายขายแต่ละคนรับผิดชอบได้ เพื่อให้ฝ่ายขายเห็นเฉพาะงานในกลุ่มของตน
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มพนักงานใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อพนักงาน, username, อีเมล, หรือความเชี่ยวชาญ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
          >
            <option value="all">ทุกตำแหน่ง (All Roles)</option>
            <option value="admin">แอดมิน (Admin)</option>
            <option value="supervisor">หัวหน้างาน (Supervisor)</option>
            <option value="sales">ฝ่ายขาย (Sales)</option>
            <option value="designer">ผู้ออกแบบ (Designer)</option>
            <option value="custom">ตำแหน่งกำหนดเอง (Custom)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
          >
            <option value="all">ทุกกลุ่มงานที่รับผิดชอบ</option>
            {WORK_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">พนักงาน</th>
                <th className="py-3.5 px-4">ตำแหน่ง & ความเชี่ยวชาญ</th>
                <th className="py-3.5 px-4">กลุ่มงานเป้าหมายที่รับผิดชอบ</th>
                <th className="py-3.5 px-4">ช่องทางติดต่อ</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  
                  {/* Name and avatar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        staff.role === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : staff.role === 'supervisor'
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : staff.role === 'designer'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                      }`}>
                        {staff.role === 'admin' ? 'AD' : staff.role === 'supervisor' ? 'SV' : staff.role === 'designer' ? 'DS' : 'SA'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{staff.name}</span>
                          {staff.id === currentUser.id && (
                            <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950 px-1.5 py-0.2 rounded">
                              คุณ
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          @{staff.username}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Position & Specialty */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div>{getRoleBadge(staff)}</div>
                      {staff.salesProductSpecialty && (
                        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          🎯 {staff.salesProductSpecialty}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Assigned categories */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {staff.assignedCategories.includes('all') ? (
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          🌐 ดูแลทุกกลุ่มงาน
                        </span>
                      ) : (
                        staff.assignedCategories.map((catId) => {
                          const cat = WORK_CATEGORIES.find((c) => c.id === catId);
                          return (
                            <span
                              key={catId}
                              className="text-[10px] font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 whitespace-nowrap"
                            >
                              {cat ? cat.code : catId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>✉️ {staff.email}</div>
                    {staff.phoneNumber && <div>📞 {staff.phoneNumber}</div>}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {staff.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> เปิดใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                        <X className="w-3 h-3" /> ระงับใช้งาน
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(staff)}
                        className="p-1.5 text-slate-500 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขข้อมูล / เปลี่ยนตำแหน่ง / กำหนดกลุ่มงาน"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {staff.id !== currentUser.id && (
                        <button
                          onClick={() => setDeleteConfirmStaff(staff)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="ลบพนักงาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                <span>เพิ่มพนักงานใหม่ & กำหนดสิทธิ์และกลุ่มงาน</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณกฤษณะ วงศ์สว่าง"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น sales3"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="รหัสผ่านเริ่มต้น"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่งงาน (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as PrimaryRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-600"
                  >
                    <option value="sales">ฝ่ายขาย (Sales)</option>
                    <option value="supervisor">หัวหน้างาน (Supervisor)</option>
                    <option value="designer">ผู้ออกแบบ (Designer / Engineer)</option>
                    <option value="admin">แอดมิน (Admin - สิทธิ์สูงสุด)</option>
                    <option value="custom">ตำแหน่งกำหนดเอง (Custom Role)</option>
                  </select>
                </div>
              </div>

              {/* Custom Role Title if selected */}
              {newRole === 'custom' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ระบุชื่อตำแหน่งกำหนดเอง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ผู้จัดการฝ่ายผลิต, เจ้าหน้าที่ QC"
                    value={newCustomRoleTitle}
                    onChange={(e) => setNewCustomRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              )}

              {/* Specialty for sales */}
              {newRole === 'sales' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ประเภทสินค้า/กลุ่มงานที่เชี่ยวชาญ (Sales Specialty)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ฝ่ายขายกลุ่มงานถังเคมีและอุตสาหกรรม, ฝ่ายขายกลุ่มงานยานยนต์"
                    value={newSalesSpecialty}
                    onChange={(e) => setNewSalesSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              )}

              {/* Target Work Categories Checkboxes */}
              {newRole !== 'admin' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>กลุ่มประเภทงานที่มอบหมายให้ดูแล (สามารถเลือกได้มากกว่า 1 กลุ่ม)</span>
                    <span className="text-[11px] text-slate-400">ฝ่ายขายจะเห็นเฉพาะงานในกลุ่มนี้</span>
                  </label>
                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer pb-1 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={newAssignedCategories.includes('all')}
                        onChange={() => handleToggleAddCategory('all')}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span>🌐 ดูแลทุกกลุ่มงาน (All Categories)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {WORK_CATEGORIES.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newAssignedCategories.includes('all') || newAssignedCategories.includes(c.id)}
                            disabled={newAssignedCategories.includes('all')}
                            onChange={() => handleToggleAddCategory(c.id)}
                            className="w-3.5 h-3.5 text-sky-600 rounded"
                          />
                          <span className="truncate">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    placeholder="email@thinkbigthailand.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    placeholder="08X-XXX-XXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  บันทึกพนักงานใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                <span>แก้ไขข้อมูลพนักงาน: @{editingStaff.username}</span>
              </h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่งงาน (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as PrimaryRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-600"
                  >
                    <option value="sales">ฝ่ายขาย (Sales)</option>
                    <option value="supervisor">หัวหน้างาน (Supervisor)</option>
                    <option value="designer">ผู้ออกแบบ (Designer / Engineer)</option>
                    <option value="admin">แอดมิน (Admin - สิทธิ์สูงสุด)</option>
                    <option value="custom">ตำแหน่งกำหนดเอง (Custom Role)</option>
                  </select>
                </div>
              </div>

              {/* Custom Role Title */}
              {editRole === 'custom' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ระบุชื่อตำแหน่งกำหนดเอง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ผู้จัดการฝ่ายผลิต, เจ้าหน้าที่ QC"
                    value={editCustomRoleTitle}
                    onChange={(e) => setEditCustomRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              )}

              {/* Specialty for sales */}
              {editRole === 'sales' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ประเภทสินค้า/กลุ่มงานที่เชี่ยวชาญ (Sales Specialty)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ฝ่ายขายกลุ่มงานถังเคมีและอุตสาหกรรม, ฝ่ายขายกลุ่มงานยานยนต์"
                    value={editSalesSpecialty}
                    onChange={(e) => setEditSalesSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              )}

              {/* Target Work Categories */}
              {editRole !== 'admin' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>กลุ่มประเภทงานที่มอบหมายให้ดูแล (เลือกได้มากกว่า 1 กลุ่ม)</span>
                    <span className="text-[11px] text-slate-400">จำกัดการมองเห็นตามกลุ่มที่เลือก</span>
                  </label>
                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer pb-1 border-b border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={editAssignedCategories.includes('all')}
                        onChange={() => handleToggleEditCategory('all')}
                        className="w-4 h-4 text-sky-600 rounded"
                      />
                      <span>🌐 ดูแลทุกกลุ่มงาน (All Categories)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {WORK_CATEGORIES.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editAssignedCategories.includes('all') || editAssignedCategories.includes(c.id)}
                            disabled={editAssignedCategories.includes('all')}
                            onChange={() => handleToggleEditCategory(c.id)}
                            className="w-3.5 h-3.5 text-sky-600 rounded"
                          />
                          <span className="truncate">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                </label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* Status toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    เปิดใช้งานบัญชีนี้ (Active)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ยืนยันการลบบัญชีพนักงาน?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              คุณต้องการลบบัญชีพนักงาน <span className="font-bold text-slate-800 dark:text-slate-200">{deleteConfirmStaff.name}</span> (@{deleteConfirmStaff.username}) หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
