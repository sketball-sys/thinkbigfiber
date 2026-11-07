import React, { useState } from 'react';
import { 
  FolderPlus, Edit, Trash2, Check, X, AlertCircle, 
  RotateCcw, Sparkles, Layers, Eye, CheckCircle2, Plus,
  ArrowUp, ArrowDown, ArrowUpDown, ListOrdered, LayoutGrid,
  ShieldCheck, GripVertical
} from 'lucide-react';
import { WorkCategory } from '../types/fiberglass';
import { StaffMember } from '../types/staff';
import { 
  apiCreateWorkCategory, 
  apiUpdateWorkCategory, 
  apiDeleteWorkCategory, 
  apiResetWorkCategories,
  apiReorderWorkCategories
} from '../utils/api';

interface CategoryManagementProps {
  categories: WorkCategory[];
  onCategoriesChange: (updated: WorkCategory[]) => void;
  currentUser?: StaffMember;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onCategoriesChange,
  currentUser,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'order_list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkCategory | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<WorkCategory | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showCustomerPreview, setShowCustomerPreview] = useState(false);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Form states - Add
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('sky');
  const [newPosition, setNewPosition] = useState<number>(categories.length + 1);
  const [formError, setFormError] = useState('');

  // Form states - Edit
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('sky');
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(1);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState('');

  const isAdmin = !currentUser || currentUser.role === 'admin';

  const triggerOrderNotice = (msg: string) => {
    setOrderNotice(msg);
    setTimeout(() => {
      setOrderNotice(null);
    }, 3500);
  };

  // Reorder functions
  const handleMoveUp = async (index: number) => {
    if (!isAdmin || index <= 0 || isReordering) return;
    setIsReordering(true);
    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    // Normalize display orders 1..N
    const reordered = updated.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    onCategoriesChange(reordered);

    try {
      const orderedIds = reordered.map((c) => c.id);
      await apiReorderWorkCategories(orderedIds);
      triggerOrderNotice(`ย้าย "${temp.name}" ขึ้นเป็นลำดับที่ ${index} เรียบร้อยแล้ว`);
    } catch (e: any) {
      console.error('Reorder error:', e);
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (!isAdmin || index >= categories.length - 1 || isReordering) return;
    setIsReordering(true);
    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    // Normalize display orders 1..N
    const reordered = updated.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    onCategoriesChange(reordered);

    try {
      const orderedIds = reordered.map((c) => c.id);
      await apiReorderWorkCategories(orderedIds);
      triggerOrderNotice(`ย้าย "${temp.name}" ลงเป็นลำดับที่ ${index + 2} เรียบร้อยแล้ว`);
    } catch (e: any) {
      console.error('Reorder error:', e);
    } finally {
      setIsReordering(false);
    }
  };

  const handleSetPosition = async (catId: string, targetOrder: number) => {
    if (!isAdmin || isReordering) return;
    const currentIdx = categories.findIndex((c) => c.id === catId);
    if (currentIdx === -1) return;
    const targetIdx = Math.max(0, Math.min(categories.length - 1, targetOrder - 1));
    if (currentIdx === targetIdx) return;

    setIsReordering(true);
    const updated = [...categories];
    const [moved] = updated.splice(currentIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const reordered = updated.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    onCategoriesChange(reordered);

    try {
      const orderedIds = reordered.map((c) => c.id);
      await apiReorderWorkCategories(orderedIds);
      triggerOrderNotice(`ปรับ "${moved.name}" ไปเป็นลำดับที่ ${targetIdx + 1} เรียบร้อยแล้ว`);
    } catch (e: any) {
      console.error('Reorder error:', e);
    } finally {
      setIsReordering(false);
    }
  };

  const handleOpenAddModal = () => {
    setNewName('');
    setNewCode('');
    setNewDescription('');
    setNewColor('sky');
    setNewPosition(categories.length + 1);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim() || !newDescription.trim()) {
      setFormError('กรุณากรอกชื่อกลุ่มงาน และคำอธิบายให้ครบถ้วน');
      return;
    }

    const generatedId = `cat_${Date.now()}`;
    const generatedCode = (newCode.trim() || newName.trim().slice(0, 5)).toUpperCase();

    const newCat: WorkCategory = {
      id: generatedId,
      code: generatedCode,
      name: newName.trim(),
      description: newDescription.trim(),
      badgeColor: newColor,
      displayOrder: newPosition || categories.length + 1,
      isActive: true,
    };

    try {
      const created = await apiCreateWorkCategory(newCat);
      
      // Insert at target position and re-index
      const updated = [...categories];
      const insertIdx = Math.max(0, Math.min(updated.length, (newPosition || updated.length + 1) - 1));
      updated.splice(insertIdx, 0, created);
      const reordered = updated.map((c, i) => ({ ...c, displayOrder: i + 1 }));
      onCategoriesChange(reordered);

      const orderedIds = reordered.map((c) => c.id);
      await apiReorderWorkCategories(orderedIds);

      setIsAddModalOpen(false);
      triggerOrderNotice(`เพิ่มกลุ่มงาน "${created.name}" ในลำดับที่ ${insertIdx + 1} เรียบร้อยแล้ว`);
    } catch (err: any) {
      setFormError(err.message || 'ไม่สามารถสร้างหมวดหมู่ได้');
    }
  };

  const handleOpenEditModal = (cat: WorkCategory, currentIdx: number) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditCode(cat.code);
    setEditDescription(cat.description);
    setEditColor(cat.badgeColor || 'sky');
    setEditDisplayOrder(currentIdx + 1);
    setEditIsActive(cat.isActive !== false);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setEditError('');

    if (!editName.trim() || !editDescription.trim()) {
      setEditError('กรุณากรอกชื่อกลุ่มงาน และคำอธิบายให้ครบถ้วน');
      return;
    }

    const currentIdx = categories.findIndex((c) => c.id === editingCategory.id);
    const targetIdx = Math.max(0, Math.min(categories.length - 1, (editDisplayOrder || currentIdx + 1) - 1));

    const updates: Partial<WorkCategory> = {
      name: editName.trim(),
      code: editCode.trim().toUpperCase() || editingCategory.code,
      description: editDescription.trim(),
      badgeColor: editColor,
      displayOrder: targetIdx + 1,
      isActive: editIsActive,
    };

    try {
      const updated = await apiUpdateWorkCategory(editingCategory.id, updates);
      if (updated) {
        let newCats = categories.map((c) => (c.id === editingCategory.id ? updated : c));
        
        // If position changed, move it in array
        if (currentIdx !== -1 && currentIdx !== targetIdx) {
          const [moved] = newCats.splice(currentIdx, 1);
          newCats.splice(targetIdx, 0, moved);
        }

        const reordered = newCats.map((c, i) => ({ ...c, displayOrder: i + 1 }));
        onCategoriesChange(reordered);
        
        const orderedIds = reordered.map((c) => c.id);
        await apiReorderWorkCategories(orderedIds);

        setEditingCategory(null);
        triggerOrderNotice(`บันทึกการแก้ไขกลุ่มงาน "${updated.name}" ลำดับที่ ${targetIdx + 1} เรียบร้อยแล้ว`);
      }
    } catch (err: any) {
      setEditError(err.message || 'ไม่สามารถแก้ไขหมวดหมู่ได้');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirmCat) return;
    try {
      await apiDeleteWorkCategory(deleteConfirmCat.id);
      const remaining = categories.filter((c) => c.id !== deleteConfirmCat.id);
      const reordered = remaining.map((c, i) => ({ ...c, displayOrder: i + 1 }));
      onCategoriesChange(reordered);
      setDeleteConfirmCat(null);
      triggerOrderNotice(`ลบกลุ่มงาน "${deleteConfirmCat.name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบหมวดหมู่ได้');
    }
  };

  const handleResetDefaults = async () => {
    try {
      const resetList = await apiResetWorkCategories();
      onCategoriesChange(resetList);
      setIsResetConfirmOpen(false);
      triggerOrderNotice('คืนค่า 6 กลุ่มงานมาตรฐานตามลำดับเริ่มต้นเรียบร้อยแล้ว');
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถรีเซ็ตได้');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-sky-700 dark:text-sky-400" />
              <span>จัดการกลุ่มงานและสเปกการผลิต (Work Categories)</span>
            </h2>
            <span className="text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> เฉพาะแอดมิน
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            แอดมินสามารถ<strong>กำหนดลำดับที่ (1, 2, 3...)</strong> เพิ่ม/แก้ไข และจัดเรียงตำแหน่งของกลุ่มประเภทงานได้ตามต้องการ ลำดับที่จัดจะแสดงใน<strong>ขั้นตอนที่ 4 ของแบบฟอร์มลูกค้า</strong>และระบบจ่ายงานฝ่ายขายทันที
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="มุมมองการ์ดพร้อมปุ่มปรับลำดับ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('order_list')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'order_list'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="มุมมองตารางจัดลำดับด่วน"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>ตารางจัดลำดับ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="รีเซ็ตเป็น 6 กลุ่มงานมาตรฐาน"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มกลุ่มงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Floating or Banner Success Notice */}
      {orderNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{orderNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono">บันทึกอัตโนมัติแล้ว ✓</span>
        </div>
      )}

      {/* Reorder Guidance Bar */}
      <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-sky-900 dark:text-sky-200">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>วิธีปรับลำดับ:</strong> กดปุ่มลูกศร <strong>↑ ขึ้น</strong> / <strong>↓ ลง</strong> หรือเลือก <strong>"ลำดับที่ [1-N]"</strong> บนกลุ่มงาน เพื่อสลับตำแหน่งได้ทันที
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowCustomerPreview((prev) => !prev)}
          className="text-xs text-sky-700 dark:text-sky-300 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showCustomerPreview ? 'ซ่อนตัวอย่างมุมมองลูกค้า' : 'ดูตัวอย่างที่ลูกค้าเห็นในขั้นตอนที่ 4'}</span>
        </button>
      </div>

      {/* Collapsible Customer Preview Box */}
      {showCustomerPreview && (
        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border border-dashed border-sky-300 dark:border-sky-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                ตัวอย่างการจัดวางบนหน้าฟอร์มขอราคาลูกค้า (Step 4: กลุ่มงานและสเปกการผลิต)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              แสดงเฉพาะกลุ่มที่เปิดใช้งาน ({categories.filter((c) => c.isActive !== false).length} รายการ)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {categories
              .filter((c) => c.isActive !== false)
              .map((cat, idx) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded">
                        {cat.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* VIEW 1: GRID VIEW (Cards with integrated sequence controls) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                cat.isActive !== false
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-500/50'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                {/* Header with sequence controls */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  {/* Sequence Badge & Up/Down Arrows */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-700 text-white font-extrabold text-xs shadow-2xs flex items-center gap-1">
                      <span className="text-[10px] font-normal opacity-80">ลำดับที่</span>
                      <span className="tabular-nums font-mono text-sm">{idx + 1}</span>
                    </span>

                    {/* Up button */}
                    <button
                      type="button"
                      disabled={idx === 0 || isReordering}
                      onClick={() => handleMoveUp(idx)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        idx === 0 || isReordering
                          ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-200 hover:text-sky-700 hover:border-sky-300'
                      }`}
                      title={idx === 0 ? 'อยู่ที่ลำดับแรกแล้ว' : `เลื่อนขึ้นเป็นลำดับที่ ${idx}`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Down button */}
                    <button
                      type="button"
                      disabled={idx === categories.length - 1 || isReordering}
                      onClick={() => handleMoveDown(idx)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        idx === categories.length - 1 || isReordering
                          ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-200 hover:text-sky-700 hover:border-sky-300'
                      }`}
                      title={idx === categories.length - 1 ? 'อยู่ที่ลำดับสุดท้ายแล้ว' : `เลื่อนลงเป็นลำดับที่ ${idx + 2}`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Jump Selector */}
                    <select
                      value={idx + 1}
                      disabled={isReordering}
                      onChange={(e) => handleSetPosition(cat.id, parseInt(e.target.value, 10))}
                      className="px-2 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-sky-600"
                      title="เลือกตำแหน่งลำดับที่ต้องการโดยตรง"
                    >
                      {categories.map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          ลำดับ {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(cat, idx)}
                      className="p-1.5 text-slate-400 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลและลำดับ"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCat(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="ลบกลุ่มงานนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badges: Code & Active status */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {cat.code}
                  </span>
                  {cat.isActive === false ? (
                    <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded">
                      ปิดใช้งานชั่วคราว
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> แสดงบนหน้าฟอร์ม
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1.5">
                  {cat.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {cat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-[10px]">ID: {cat.id}</span>
                <span className="text-[11px] font-medium text-slate-500">
                  ลำดับปัจจุบัน: <strong className="text-sky-700 dark:text-sky-400 font-bold">#{idx + 1}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: LIST / QUICK SEQUENCE TABLE */}
      {viewMode === 'order_list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>ตารางจัดลำดับกลุ่มสินค้า/บริการ ({categories.length} กลุ่ม)</span>
            <span className="text-[11px] text-slate-400 font-normal">
              ปรับเปลี่ยนลำดับได้โดยตรงจากปุ่มเลื่อนหรือเลือกเลขลำดับ
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Left: Sequence Controls + Name */}
                <div className="flex items-center gap-3">
                  {/* Sequence badge & arrows */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-8 h-8 rounded-xl bg-sky-700 text-white font-mono font-bold text-sm flex items-center justify-center shadow-2xs">
                      {idx + 1}
                    </span>

                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0 || isReordering}
                        onClick={() => handleMoveUp(idx)}
                        className={`p-1 rounded border transition-colors cursor-pointer ${
                          idx === 0 || isReordering
                            ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-sky-50 text-slate-700 dark:text-slate-200 hover:text-sky-700'
                        }`}
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1 || isReordering}
                        onClick={() => handleMoveDown(idx)}
                        className={`p-1 rounded border transition-colors cursor-pointer ${
                          idx === categories.length - 1 || isReordering
                            ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-sky-50 text-slate-700 dark:text-slate-200 hover:text-sky-700'
                        }`}
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {cat.code}
                      </span>
                      {cat.isActive === false && (
                        <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 px-1.5 py-0.2 rounded">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>

                {/* Right: Direct Position Dropdown + Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">ย้ายไป:</span>
                    <select
                      value={idx + 1}
                      disabled={isReordering}
                      onChange={(e) => handleSetPosition(cat.id, parseInt(e.target.value, 10))}
                      className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:border-sky-600"
                    >
                      {categories.map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          ลำดับที่ {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(cat, idx)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCat(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="ลบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                <span>เพิ่มกลุ่มสินค้า / บริการใหม่</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อกลุ่มสินค้าหรือบริการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ตะแกรงระบายน้ำ FRP Grating / แผ่นกันลื่น"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสย่อ (Code)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น GRATING"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    กำหนดลำดับที่แสดงผล (Display Order)
                  </label>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-600"
                  >
                    <option value={1}>ลำดับที่ 1 (ตำแหน่งแรกสุด)</option>
                    {categories.map((_, i) => (
                      <option key={i + 2} value={i + 2}>
                        ลำดับที่ {i + 2} {i + 1 === categories.length ? '(ลำดับสุดท้าย)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียด / ตัวอย่างชิ้นงาน <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="เช่น ตะแกรงฝาท่อระบายน้ำไฟเบอร์กลาส แผ่นทางเดินกันลื่น พื้นโรงงานทนกรดด่าง"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 leading-relaxed"
                />
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
                  บันทึกกลุ่มงานใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                <span>แก้ไขกลุ่มสินค้า/บริการ & ลำดับการจัดวาง</span>
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
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

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อกลุ่มสินค้าหรือบริการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสย่อ (Code)
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ลำดับการจัดวาง (Display Order)
                  </label>
                  <select
                    value={editDisplayOrder}
                    onChange={(e) => setEditDisplayOrder(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-600"
                  >
                    {categories.map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        ลำดับที่ {i + 1} {i === 0 ? '(แรกสุด)' : i === categories.length - 1 ? '(ท้ายสุด)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียด / ตัวอย่างชิ้นงาน <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    เปิดใช้งานกลุ่มนี้ (แสดงในฟอร์มขอราคาลูกค้า)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  บันทึกการแก้ไขและลำดับ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              ยืนยันการลบกลุ่มสินค้า/บริการ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              คุณต้องการลบกลุ่ม <strong>"{deleteConfirmCat.name}"</strong> ออกจากระบบใช่หรือไม่? ลำดับกลุ่มงานอื่นๆ จะถูกปรับเลื่อนขึ้นโดยอัตโนมัติ
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              คืนค่าเป็น 6 กลุ่มงานมาตรฐาน?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              การรีเซ็ตจะคืนค่ากลุ่มงานเดิมทั้งหมด (ถังเคมี, ฝาครอบเครื่องจักร, ชิ้นส่วนยานยนต์, งานปั้น 3D, หลังคา/กันสาด, และงาน OEM) พร้อมจัดลำดับ 1 ถึง 6 ตามค่าเริ่มต้นจากโรงงาน
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                ยืนยันคืนค่ามาตรฐาน
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
