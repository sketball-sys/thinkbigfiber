import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory cache for OAuth access token (NEVER store in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedFolderId: string | null = null;
let cachedFolderLink: string | null = null;

// Initialize auth state listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not cached yet (e.g. page reload), require user interaction
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedFolderId = null;
      cachedFolderLink = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup and obtain access token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถดึง Access Token จาก Google Auth ได้');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedFolderId = null;
  cachedFolderLink = null;
};

// Find or create dedicated upload folder in Google Drive
export const getOrCreateUploadFolder = async (
  folderName: string = 'ThinkBig_Fiberglass_Uploads'
): Promise<{ folderId: string; folderLink: string }> => {
  if (cachedFolderId && cachedFolderLink) {
    return { folderId: cachedFolderId, folderLink: cachedFolderLink };
  }

  const token = await getGoogleAccessToken();
  if (!token) throw new Error('กรุณาเชื่อมต่อ Google Drive ก่อนดำเนินการ');

  // Search for folder
  const query = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`ค้นหาโฟลเดอร์ Google Drive ไม่สำเร็จ: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const foundId: string = searchData.files[0].id;
    const foundLink: string = searchData.files[0].webViewLink || `https://drive.google.com/drive/folders/${foundId}`;
    cachedFolderId = foundId;
    cachedFolderLink = foundLink;
    return { folderId: foundId, folderLink: foundLink };
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'โฟลเดอร์จัดเก็บรูปภาพและเอกสารงานไฟเบอร์กลาส - บริษัท คิดใหญ่ ไฟเบอร์กลาส จำกัด',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`สร้างโฟลเดอร์ใน Google Drive ไม่สำเร็จ: ${errText}`);
  }

  const newFolder = await createRes.json();
  const createdId: string = newFolder.id;
  const createdLink: string = newFolder.webViewLink || `https://drive.google.com/drive/folders/${createdId}`;
  cachedFolderId = createdId;
  cachedFolderLink = createdLink;
  return { folderId: createdId, folderLink: createdLink };
};

export interface DriveUploadedFile {
  fileId: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: number;
}

// Convert base64 Data URL to raw Blob
function dataURLtoBlob(dataurl: string): { blob: Blob; mimeType: string } {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { blob: new Blob([u8arr], { type: mimeType }), mimeType };
}

// Upload a single file (from Base64 or Blob) to Google Drive
export const uploadToGoogleDrive = async (
  filename: string,
  content: string | Blob, // base64 dataUrl or binary Blob
  mimeTypeOverride?: string,
  customFolderId?: string
): Promise<DriveUploadedFile> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('ไม่พบ Access Token กรุณาเข้าสู่ระบบ Google Drive');

  // Ensure folder exists
  let folderId = customFolderId;
  if (!folderId) {
    const folder = await getOrCreateUploadFolder();
    folderId = folder.folderId;
  }

  let fileBlob: Blob;
  let mimeType = mimeTypeOverride || 'application/octet-stream';

  if (typeof content === 'string') {
    if (content.startsWith('data:')) {
      const parsed = dataURLtoBlob(content);
      fileBlob = parsed.blob;
      mimeType = mimeTypeOverride || parsed.mimeType;
    } else {
      fileBlob = new Blob([content], { type: mimeType });
    }
  } else {
    fileBlob = content;
    if (content.type) mimeType = content.type;
  }

  const metadata = {
    name: filename,
    mimeType: mimeType,
    parents: [folderId],
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeaderPart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  // Construct multipart body as Blob
  const multipartBlob = new Blob(
    [metadataPart, mediaHeaderPart, fileBlob, closeDelimiter],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBlob,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`อัปโหลดไฟล์ขึ้น Google Drive ไม่สำเร็จ: ${errText}`);
  }

  const result = await uploadRes.json();
  return {
    fileId: result.id,
    name: result.name,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    webContentLink: result.webContentLink,
    thumbnailLink: result.thumbnailLink,
    size: result.size ? Number(result.size) : undefined,
  };
};
