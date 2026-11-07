import React from 'react';
import { Sun, Moon, ShieldCheck, FileText, Wrench, User, LogOut, Briefcase } from 'lucide-react';
import { StaffMember } from '../types/staff';

interface HeaderProps {
  currentView: 'form' | 'admin' | 'guide' | 'login';
  onNavigate: (view: 'form' | 'admin' | 'guide' | 'login') => void;
  pendingCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  currentUser: StaffMember | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  pendingCount,
  isDark,
  onToggleTheme,
  currentUser,
  onLogout,
}) => {
  const handleAdminClick = () => {
    if (currentUser) {
      onNavigate('admin');
    } else {
      onNavigate('login');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Brand title, one line, single text element wordmark */}
        <button
          onClick={() => onNavigate('form')}
          className="text-left group flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center font-extrabold text-base shadow-sm group-hover:from-sky-700 group-hover:to-sky-900 transition-all">
            TB
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              <span>คิดใหญ่ ไฟเบอร์กลาส</span>
              <span className="hidden lg:inline text-[10px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.2 rounded border border-sky-200/80 dark:border-sky-800">
                Think Big
              </span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none flex items-center gap-1">
              <span>www.thinkbigthailand.com</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('form')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-700 dark:hover:text-sky-400 py-1 ${
              currentView === 'form'
                ? 'text-sky-700 dark:text-sky-400 font-semibold border-b-2 border-sky-600 dark:border-sky-400'
                : ''
            }`}
          >
            แบบฟอร์มขอราคา
          </button>

          <button
            onClick={handleAdminClick}
            className={`relative transition-colors whitespace-nowrap shrink-0 hover:text-sky-700 dark:hover:text-sky-400 py-1 flex items-center gap-1.5 ${
              currentView === 'admin' || currentView === 'login'
                ? 'text-sky-700 dark:text-sky-400 font-semibold border-b-2 border-sky-600 dark:border-sky-400'
                : ''
            }`}
          >
            <span>ระบบจัดการคำขอ (ฝ่ายขาย/โรงงาน)</span>
            {pendingCount > 0 && (
              <span className="text-xs bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {pendingCount}
              </span>
            )}
          </button>

          <a
            href="https://www.thinkbigthailand.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors whitespace-nowrap shrink-0 hover:text-sky-700 dark:hover:text-sky-400 py-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
          >
            <span>เยี่ยมชมเว็บไซต์</span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400">↗</span>
          </a>
        </nav>

        {/* Zone 3: 1 primary action + theme toggle + user info */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                }`}>
                  {currentUser.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                  {currentUser.role === 'admin' ? 'แอดมิน' : 'ฝ่ายขาย'}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                  {currentUser.name}
                </span>
              </div>

              {currentView === 'admin' ? (
                <button
                  onClick={() => onNavigate('form')}
                  className="px-3 sm:px-4 py-2 text-xs md:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">ไปยังฟอร์มขอราคา</span>
                  <span className="sm:hidden">ฟอร์ม</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('admin')}
                  className="px-3 sm:px-4 py-2 text-xs md:text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Wrench className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">แดชบอร์ดจัดการ</span>
                  <span className="sm:hidden">จัดการ</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-[11px] px-1.5 py-0.2 rounded-full tabular-nums font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  aria-label="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            currentView === 'login' ? (
              <button
                onClick={() => onNavigate('form')}
                className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>กลับสู่หน้าหลัก</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-3 sm:px-4 py-2 text-xs md:text-sm font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <User className="w-4 h-4 text-sky-400" />
                <span>เข้าสู่ระบบพนักงาน</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[11px] px-1.5 py-0.2 rounded-full tabular-nums font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          )}
        </div>

      </div>
    </header>
  );
};

