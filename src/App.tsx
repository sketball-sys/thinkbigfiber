/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuotationForm } from './components/QuotationForm';
import { QuotationSuccessModal } from './components/QuotationSuccessModal';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffLogin } from './components/StaffLogin';
import { FiberglassGuideModal } from './components/FiberglassGuideModal';
import { QuotationRequest, RequestStatus, WorkCategory } from './types/fiberglass';
import { StaffMember } from './types/staff';
import {
  apiGetRequests,
  apiSaveRequest,
  apiUpdateRequestStatus,
  apiGetStaffList,
  apiGetWorkCategories,
  checkDatabaseHealth,
  DatabaseStatus
} from './utils/api';
import { getCurrentStaffUser, setCurrentStaffUser, logoutStaff } from './utils/staffStorage';
import { ShieldCheck, Phone, Mail, Clock, MapPin } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'admin' | 'guide' | 'login'>('form');
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [successRequest, setSuccessRequest] = useState<QuotationRequest | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => getCurrentStaffUser());
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync dark theme class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load stored requests, categories & staff from MySQL on mount & check DB health
  const refreshData = async () => {
    try {
      const [fetchedRequests, fetchedStaff, health, fetchedCategories] = await Promise.all([
        apiGetRequests(),
        apiGetStaffList(),
        checkDatabaseHealth(),
        apiGetWorkCategories()
      ]);
      setRequests(fetchedRequests);
      setStaffList(fetchedStaff);
      setDbStatus(health);
      setCategories(fetchedCategories);
    } catch (e) {
      console.error('Error refreshing MySQL data:', e);
    }
  };

  useEffect(() => {
    refreshData();
    // Poll DB status every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleFormSubmitSuccess = async (newRequest: QuotationRequest) => {
    const saved = await apiSaveRequest(newRequest);
    setRequests((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
    setSuccessRequest(saved);
  };

  const handleUpdateStatus = async (
    id: string,
    status: RequestStatus,
    adminNotes?: string,
    _adminFinalQuote?: number,
    assignedStaffId?: string,
    assignedStaffName?: string,
    assignedStaffRole?: string,
    assignedNote?: string
  ) => {
    const updated = await apiUpdateRequestStatus(id, status, adminNotes, {
      assignedStaffId,
      assignedStaffName,
      assignedStaffRole,
      assignedAt: assignedStaffId ? new Date().toISOString() : undefined,
      assignedNote
    });
    if (updated) {
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  };

  const handleLoginSuccess = async (user: StaffMember) => {
    setCurrentUser(user);
    const freshStaff = await apiGetStaffList();
    setStaffList(freshStaff);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    logoutStaff();
    setCurrentUser(null);
    setCurrentView('form');
  };

  const handleStaffListChange = (updatedList: StaffMember[]) => {
    setStaffList(updatedList);
    // If the current user's profile was updated, refresh session
    if (currentUser) {
      const refreshedUser = updatedList.find((s) => s.id === currentUser.id);
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
        setCurrentStaffUser(refreshedUser);
      }
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar Header */}
        <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'guide') {
            setIsGuideOpen(true);
          } else if (view === 'admin' && !currentUser) {
            setCurrentView('login');
          } else {
            setCurrentView(view);
          }
        }}
        pendingCount={pendingCount}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'form' && (
          <QuotationForm
            onSubmitSuccess={handleFormSubmitSuccess}
            onOpenGuide={() => setIsGuideOpen(true)}
            categories={categories}
          />
        )}

        {currentView === 'login' && (
          <StaffLogin
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setCurrentView('form')}
          />
        )}

        {currentView === 'admin' && (
          currentUser ? (
            <AdminDashboard
              currentUser={currentUser}
              staffList={staffList}
              onStaffListChange={handleStaffListChange}
              categories={categories}
              onCategoriesChange={setCategories}
              onLogout={handleLogout}
              requests={requests}
              onUpdateRequest={handleUpdateStatus}
              onBackToForm={() => setCurrentView('form')}
            />
          ) : (
            <StaffLogin
              onLoginSuccess={handleLoginSuccess}
              onCancel={() => setCurrentView('form')}
            />
          )
        )}
      </main>

      {/* Modals */}
      <QuotationSuccessModal
        request={successRequest}
        onClose={() => setSuccessRequest(null)}
        onViewInAdmin={() => {
          setSuccessRequest(null);
          if (currentUser) {
            setCurrentView('admin');
          } else {
            setCurrentView('login');
          }
        }}
      />

      <FiberglassGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Quiet Corporate Industrial Footer */}
      <footer className="mt-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
            
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center font-extrabold text-sm">
                  TB
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                    บริษัท คิดใหญ่ ไฟเบอร์กลาส จำกัด
                  </span>
                  <a 
                    href="https://www.thinkbigthailand.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-sky-700 dark:text-sky-400 hover:underline font-medium"
                  >
                    www.thinkbigthailand.com
                  </a>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                โรงงานรับผลิตชิ้นงานไฟเบอร์กลาส (FRP/GRP) สั่งทำตามแบบทุกชนิด ถังเคมี ฝาครอบเครื่องจักร ชิ้นส่วนยานยนต์ ประติมากรรม และงานขึ้นรูปโมลด์ความแม่นยำสูง
              </p>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> มาตรฐานอุตสาหกรรม FRP
                </span>
                <span>·</span>
                <span>ผลิตและจัดส่งทั่วประเทศ</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                ติดต่อฝ่ายวิศวกรรม & ประเมินราคา
              </h4>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>088-243-3288 / 095-718-4959</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>sales@thinkbigthailand.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>จันทร์ - เสาร์: 08:30 - 17:30 น.</span>
                </li>
                <li className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <a
                    href="https://maps.google.com/?q=13.6025,100.6872"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sky-700 dark:hover:text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>โรงงาน: บางพลี สมุทรปราการ (Google Maps)</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                เมนูด่วน
              </h4>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    onClick={() => setCurrentView('form')}
                    className="hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                  >
                    ขอใบเสนอราคาใหม่
                  </button>
                </li>
                <li>
                  <a
                    href="https://www.thinkbigthailand.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sky-700 dark:hover:text-sky-400 transition-colors inline-flex items-center gap-1"
                  >
                    <span>เว็บไซต์ www.thinkbigthailand.com</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => {
                      if (currentUser) {
                        setCurrentView('admin');
                      } else {
                        setCurrentView('login');
                      }
                    }}
                    className="hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                  >
                    ระบบจัดการคำขอ (ฝ่ายขาย/โรงงาน)
                  </button>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} บริษัท คิดใหญ่ ไฟเบอร์กลาส จำกัด (www.thinkbigthailand.com) สงวนลิขสิทธิ์.</span>
            <div className="flex items-center gap-4">
              <span>นโยบายความเป็นส่วนตัว</span>
              <span>·</span>
              <span>ข้อกำหนดการรับประกันงานไฟเบอร์กลาส</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    );
}

