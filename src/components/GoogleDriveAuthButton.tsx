import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  googleSignOut, 
  initGoogleAuth, 
  getGoogleAccessToken,
  getOrCreateUploadFolder 
} from '../utils/googleDrive';
import { CheckCircle2, ExternalLink, HardDrive, LogOut, Loader2 } from 'lucide-react';

interface GoogleDriveAuthButtonProps {
  onAuthChange?: (user: User | null, token: string | null) => void;
  folderName?: string;
  className?: string;
}

export const GoogleDriveAuthButton: React.FC<GoogleDriveAuthButtonProps> = ({
  onAuthChange,
  folderName = 'ThinkBig_Fiberglass_Uploads',
  className = '',
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [folderUrl, setFolderUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        if (onAuthChange) onAuthChange(currentUser, accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setFolderUrl(null);
        if (onAuthChange) onAuthChange(null, null);
      }
    );
    return () => unsubscribe();
  }, [onAuthChange]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        if (onAuthChange) onAuthChange(result.user, result.accessToken);

        // Fetch or create upload folder
        try {
          const folder = await getOrCreateUploadFolder(folderName);
          setFolderUrl(folder.folderLink);
        } catch (fErr) {
          console.warn('Folder creation warning:', fErr);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      setFolderUrl(null);
      if (onAuthChange) onAuthChange(null, null);
    } catch (err) {
      console.error('Google Sign-Out Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (user && token) {
    return (
      <div className={`p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-2.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-7 h-7 rounded-full border border-emerald-300 dark:border-emerald-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold">
              <HardDrive className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
              <span>เชื่อมต่อ Google Drive แล้ว</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {user.email || user.displayName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {folderUrl && (
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>เปิดโฟลเดอร์ใน Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoading}
            className="px-2 py-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="ยกเลิกการเชื่อมต่อ Google Drive"
          >
            <LogOut className="w-3 h-3" />
            <span>ยกเลิกเชื่อมต่อ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl ${className}`}>
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <HardDrive className="w-4 h-4 text-sky-600" />
        <span>บันทึกรูปและไฟล์แบบแปลนตรงเข้า Google Drive เพื่อสำรองข้อมูล</span>
      </div>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="gsi-material-button inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs text-xs font-medium text-slate-700 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        title="ลงชื่อเข้าใช้ด้วย Google เพื่ออนุญาตบันทึกไฟล์ใน Drive"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
        )}
        <span>เชื่อมต่อ Google Drive</span>
      </button>
    </div>
  );
};
