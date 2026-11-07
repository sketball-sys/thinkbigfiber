import React, { useState } from 'react';
import { Lock, User, Key, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, Sparkles, Briefcase } from 'lucide-react';
import { StaffMember } from '../types/staff';
import { apiLoginStaff } from '../utils/api';
import { setCurrentStaffUser } from '../utils/staffStorage';

interface StaffLoginProps {
  onLoginSuccess: (user: StaffMember) => void;
  onCancel: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiLoginStaff(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        setCurrentStaffUser(result.user);
        onLoginSuccess(result.user);
      } else {
        setError(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleQuickLogin = async (usernameChoice: string) => {
    setError('');
    setIsLoading(true);
    const u = usernameChoice;
    const p = 'password123';
    setUsername(u);
    setPassword(p);

    try {
      const result = await apiLoginStaff(u, p);
      setIsLoading(false);
      if (result.success && result.user) {
        setCurrentStaffUser(result.user);
        onLoginSuccess(result.user);
      } else {
        setError(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Back Link */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-sky-700 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าฟอร์มขอราคาลูกค้า</span>
          </button>
          <a
            href="https://www.thinkbigthailand.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-sky-700 dark:text-sky-400 hover:underline"
          >
            www.thinkbigthailand.com
          </a>
        </div>

        {/* Lock Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest mb-1">
            คิดใหญ่ ไฟเบอร์กลาส (Think Big Fiberglass)
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            เข้าสู่ระบบพนักงาน & โรงงาน
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ระบบจัดการคำขอประเมินราคา, แยกกลุ่มสินค้า, มอบหมายงาน และควบคุมสิทธิ์พนักงาน
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="เช่น admin, supervisor, sales1, sales2, designer1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="กรอกรหัสผ่าน (demo: password123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <>
                <span>เข้าสู่ระบบจัดการงาน</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              บัญชีทดสอบระบบด่วน (Quick Demo Accounts)
            </span>
            <span className="text-[10px] text-slate-400">รหัสผ่าน: password123</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
                  <span>แอดมิน (Admin)</span>
                </div>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono">admin</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                สิทธิ์สูงสุด: ดูทุกงาน มอบหมายงาน จัดการพนักงานและกลุ่มงาน
              </p>
            </button>

            {/* Supervisor */}
            <button
              type="button"
              onClick={() => handleQuickLogin('supervisor')}
              className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-purple-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>หัวหน้างาน (Supervisor)</span>
                </div>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono">supervisor</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                ดูทุกงาน ควบคุมการผลิต มอบหมายงานให้ทีมฝ่ายขาย
              </p>
            </button>

            {/* Sales 1 */}
            <button
              type="button"
              onClick={() => handleQuickLogin('sales1')}
              className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>ฝ่ายขาย 1 (ถังเคมี/เครื่องจักร)</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">sales1</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                เห็นเฉพาะกลุ่ม: ถังเคมี/ท่อ FRP + ฝาครอบเครื่องจักร
              </p>
            </button>

            {/* Sales 2 */}
            <button
              type="button"
              onClick={() => handleQuickLogin('sales2')}
              className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>ฝ่ายขาย 2 (ยานยนต์/ปั้น/หลังคา)</span>
                </div>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono">sales2</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                เห็นเฉพาะกลุ่ม: ชิ้นส่วนยานยนต์ + ประติมากรรม 3D + งานหลังคา
              </p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
