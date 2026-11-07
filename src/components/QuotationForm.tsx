import React, { useState, useId } from 'react';
import { 
  Upload, X, Check, Image as ImageIcon, Box, Cylinder, 
  Sparkles, Layers, ArrowRight, HelpCircle, Phone, Mail, User, Building,
  Ruler, Calculator, FileCheck, Shield, Clock, AlertCircle,
  MapPin, Calendar, Truck, Wrench, Paperclip, Link, ExternalLink, FileText, Globe, FolderPlus,
  Cloud, HardDrive, Loader2, CheckCircle2
} from 'lucide-react';
import { 
  QuotationDimensions, ShapeType, UnitType, QuotationRequest,
  WORK_CATEGORIES, WorkCategory, ProjectAttachment
} from '../types/fiberglass';
import { calculateFiberglassEstimate, formatBaht, getThicknessInfo } from '../utils/calculator';
import { GoogleDriveAuthButton } from './GoogleDriveAuthButton';
import { uploadToGoogleDrive, getOrCreateUploadFolder } from '../utils/googleDrive';
import { User as FirebaseUser } from 'firebase/auth';

interface QuotationFormProps {
  onSubmitSuccess: (newRequest: QuotationRequest) => void;
  onOpenGuide: () => void;
  categories?: WorkCategory[];
}

export const QuotationForm: React.FC<QuotationFormProps> = ({ onSubmitSuccess, onOpenGuide, categories }) => {
  // Dynamic categories list (falling back to WORK_CATEGORIES)
  const availableCategories = (categories && categories.length > 0 ? categories : WORK_CATEGORIES).filter(
    (c) => c.isActive !== false
  );

  // Required fields
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Dimensions & Shape
  const [shape, setShape] = useState<ShapeType>('box');
  const [unit, setUnit] = useState<UnitType>('cm');
  const [width, setWidth] = useState<string>('80');
  const [length, setLength] = useState<string>('120');
  const [height, setHeight] = useState<string>('40');
  const [diameter, setDiameter] = useState<string>('60');
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(3); // 3 mm is standard base

  // Additional options & Categorization
  const [companyName, setCompanyName] = useState('');
  const [lineId, setLineId] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [workCategoryId, setWorkCategoryId] = useState<string>('machine_cover');
  const [workCategory, setWorkCategory] = useState<string>('ฝาครอบเครื่องจักร / ตู้ชิ้นส่วนอุตสาหกรรม');
  const [quantity, setQuantity] = useState<number>(1);
  const [hasSteelFrame, setHasSteelFrame] = useState(false);
  const [notes, setNotes] = useState('');

  // Large Project attachments & Cloud download link (สำหรับงานโครงการใหญ่ ข้อมูลเยอะ)
  const [projectFiles, setProjectFiles] = useState<ProjectAttachment[]>([]);
  const [projectCloudLink, setProjectCloudLink] = useState('');
  const [projectCloudNote, setProjectCloudNote] = useState('');
  const projectFileInputId = useId();

  // Google Drive Integration states
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [drivePhotoUrls, setDrivePhotoUrls] = useState<string[]>([]);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isDriveUploaded, setIsDriveUploaded] = useState(false);

  // Delivery & Timeline states (Required by user)
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number; distanceKm?: number } | undefined>(undefined);
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [needInstallation, setNeedInstallation] = useState(false);
  const [requiredDate, setRequiredDate] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'flexible'>('normal');

  // UI / Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);

  const fileInputId = useId();

  // Handle category change
  const handleCategorySelect = (catId: string) => {
    setWorkCategoryId(catId);
    const found = availableCategories.find((c) => c.id === catId);
    if (found) {
      setWorkCategory(found.name);
    }
  };

  // Preset sample templates for 1-click test
  const handleApplyPreset = (type: 'tank' | 'cover' | 'sculpture' | 'auto') => {
    if (type === 'tank') {
      setWorkTitle('ถังเก็บสารเคมีและบำบัดน้ำเสียไฟเบอร์กลาส (FRP Tank)');
      setWorkCategoryId('industrial_tank');
      setWorkCategory('ถังเคมี / ถังบำบัดน้ำเสีย / งานท่อ FRP');
      setShape('cylinder');
      setUnit('cm');
      setDiameter('120');
      setWidth('120');
      setLength('120');
      setHeight('180');
      setWallThicknessMm(6); // 6mm (+30%)
      setQuantity(1);
      setHasSteelFrame(true);
      setDeliveryLocation('นิคมอุตสาหกรรมแหลมฉบัง ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี (อาคารผลิต C)');
      setProvince('ชลบุรี');
      setNeedInstallation(true);
      setRequiredDate('2026-12-10');
      setUrgency('normal');
      setNotes('ถังทรงกระบอกตั้ง วางกลางแจ้ง ทนสารละลายเคมี ต้องการหน้าแปลน Flange');
      setProjectCloudLink('https://drive.google.com/drive/folders/sample-tank-cad-drawing');
      setProjectCloudNote('แบบ Drawing และสเปกท่อทางเข้า-ออกขนาด 2 นิ้ว');
      if (photos.length === 0) {
        setPhotos(['/src/assets/images/fiberglass_industrial_tank_1793935021910.jpg']);
      }
    } else if (type === 'cover') {
      setWorkTitle('ฝาครอบเครื่องจักรอุตสาหกรรมขึ้นรูปไฟเบอร์กลาส');
      setWorkCategoryId('machine_cover');
      setWorkCategory('ฝาครอบเครื่องจักร / ตู้ชิ้นส่วนอุตสาหกรรม');
      setShape('box');
      setUnit('cm');
      setWidth('70');
      setLength('110');
      setHeight('35');
      setWallThicknessMm(4); // 4mm (+10%)
      setQuantity(5);
      setHasSteelFrame(false);
      setDeliveryLocation('นิคมอุตสาหกรรมบางปู ต.แพรกษา อ.เมือง จ.สมุทรปราการ');
      setProvince('สมุทรปราการ');
      setNeedInstallation(false);
      setRequiredDate('2026-11-28');
      setUrgency('normal');
      setNotes('ต้องการผิวเจลโค้ตขาวเงาสวยงาม มีขอบปีกสำหรับยึดน็อต M6 รอบตัว');
      if (photos.length === 0) {
        setPhotos(['/src/assets/images/fiberglass_molded_parts_1793935020846.jpg']);
      }
    } else if (type === 'auto') {
      setWorkTitle('ชุดพาร์ทกันชนและสปอยเลอร์รถบัสไฟฟ้า FRP');
      setWorkCategoryId('automotive');
      setWorkCategory('ชิ้นส่วนยานยนต์ / งานตกแต่งรถยนต์ / บอดี้พาร์ท');
      setShape('box');
      setUnit('cm');
      setWidth('65');
      setLength('180');
      setHeight('35');
      setWallThicknessMm(4); // 4mm (+10%)
      setQuantity(10);
      setHasSteelFrame(true);
      setDeliveryLocation('โรงงานประกอบยานยนต์ นิคมฯ อมตะซิตี้ ชลบุรี');
      setProvince('ชลบุรี');
      setNeedInstallation(false);
      setRequiredDate('2026-12-05');
      setUrgency('normal');
      setNotes('ชิ้นงานน้ำหนักเบา ผิวเรียบเนียนพร้อมจุดยึดแชสซี');
      setProjectCloudLink('https://wetransfer.com/downloads/ev-bus-bodykit-drawings');
      if (photos.length === 0) {
        setPhotos(['/src/assets/images/fiberglass_molded_parts_1793935020846.jpg']);
      }
    } else if (type === 'sculpture') {
      setWorkTitle('งานปั้นมาสคอตประติมากรรม 3D ไฟเบอร์กลาส');
      setWorkCategoryId('sculpture_arch');
      setWorkCategory('งานปั้น / มาสคอต / ประติมากรรม 3D / โลโก้แบรนด์');
      setShape('sculpture');
      setUnit('cm');
      setWidth('90');
      setLength('80');
      setHeight('160');
      setWallThicknessMm(6); // 6mm (+30%)
      setQuantity(1);
      setHasSteelFrame(true);
      setDeliveryLocation('หน้าโครงการคอมมูนิตี้มอลล์ ถนนพระราม 9 แขวงห้วยขวาง กรุงเทพฯ');
      setProvince('กรุงเทพมหานคร');
      setNeedInstallation(true);
      setRequiredDate('2026-11-20');
      setUrgency('urgent');
      setNotes('งานวางตกแต่งหน้าร้านกลางแจ้ง เคลือบเงาพิเศษ มีโครงเหล็กยึดฐานพื้น');
      setProjectCloudLink('https://dropbox.com/sh/mascot-3d-model-obj-stp');
      if (photos.length === 0) {
        setPhotos(['/src/assets/images/hero_fiberglass_workshop_1793935020615.jpg']);
      }
    }
  };

  // Convert numbers for calculation
  const numW = parseFloat(width) || 0;
  const numL = parseFloat(length) || 0;
  const numH = parseFloat(height) || 0;
  const numDia = parseFloat(diameter) || numW;

  const currentDimensions: QuotationDimensions = {
    shape,
    unit,
    width: numW,
    length: numL,
    height: numH,
    diameter: numDia,
    wallThicknessMm,
  };

  const calc = calculateFiberglassEstimate(
    currentDimensions,
    quantity,
    'general_ortho',
    'gelcoat_gloss',
    hasSteelFrame
  );


  // Handle photo upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (errors.photos) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photos;
        return next;
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (errors.photos) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photos;
        return next;
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload attached photos to Google Drive
  const handleUploadPhotosToDrive = async () => {
    if (!googleUser || !googleToken) {
      alert('กรุณาคลิกเชื่อมต่อ Google Drive ก่อนทำการอัปโหลด');
      return;
    }
    if (photos.length === 0) {
      alert('กรุณาแนบรูปภาพงานไฟเบอร์กลาสก่อนอย่างน้อย 1 รูป');
      return;
    }

    setIsUploadingToDrive(true);
    try {
      const folder = await getOrCreateUploadFolder('ThinkBig_Fiberglass_Uploads');
      setDriveFolderUrl(folder.folderLink);

      const uploadedList: string[] = [...drivePhotoUrls];
      for (let i = 0; i < photos.length; i++) {
        const photoItem = photos[i];
        const filename = `ThinkBig_${Date.now()}_img${i + 1}.jpg`;
        const res = await uploadToGoogleDrive(filename, photoItem, 'image/jpeg', folder.folderId);
        if (!uploadedList.includes(res.webViewLink)) {
          uploadedList.push(res.webViewLink);
        }
      }

      setDrivePhotoUrls(uploadedList);
      setIsDriveUploaded(true);
      if (!projectCloudLink) {
        setProjectCloudLink(folder.folderLink);
        setProjectCloudNote('โฟลเดอร์จัดเก็บรูปภาพและเอกสารงานไฟเบอร์กลาสใน Google Drive');
      }
    } catch (err: any) {
      console.error('Google Drive Upload Error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดขึ้น Google Drive: ' + err.message);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Handle project document files (for large projects)
  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const newAtt: ProjectAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      };

      if (file.size < 6 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          newAtt.dataUrl = event.target?.result as string;
          setProjectFiles((prev) => [...prev, newAtt]);
        };
        reader.readAsDataURL(file);
      } else {
        setProjectFiles((prev) => [...prev, newAtt]);
      }
    });
  };

  const handleProjectFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const newAtt: ProjectAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      };

      if (file.size < 6 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          newAtt.dataUrl = event.target?.result as string;
          setProjectFiles((prev) => [...prev, newAtt]);
        };
        reader.readAsDataURL(file);
      } else {
        setProjectFiles((prev) => [...prev, newAtt]);
      }
    });
  };

  const handleRemoveProjectFile = (id: string) => {
    setProjectFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'กรุณากรอกชื่อผู้ติดต่อ';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (phoneNumber.replace(/[^0-9]/g, '').length < 9) {
      newErrors.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (อย่างน้อย 9-10 หลัก)';
    }

    if (!email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (photos.length === 0) {
      newErrors.photos = 'กรุณาแนบรูปภาพงาน หรือเลือกตัวอย่างเพื่อประเมินราคา';
    }

    if (numW <= 0 || numH <= 0 || (shape !== 'cylinder' && numL <= 0)) {
      newErrors.dimensions = 'กรุณาระบุขนาดความกว้าง ยาว สูง ให้ครบถ้วนและมากกว่า 0';
    }

    if (!deliveryLocation.trim()) {
      newErrors.deliveryLocation = 'กรุณาระบุสถานที่จัดส่งหรือสถานที่ติดตั้ง';
    }

    if (!requiredDate.trim()) {
      newErrors.requiredDate = 'กรุณาระบุกำหนดระยะเวลาหรือวันที่ต้องการใช้งาน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newRequest: QuotationRequest = {
      id: `RFQ-${new Date().getFullYear()}-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      photos,
      dimensions: currentDimensions,
      companyName: companyName.trim() || undefined,
      lineId: lineId.trim() || undefined,
      workTitle: workTitle.trim() || `งานไฟเบอร์กลาส ${workCategory} (${numW}x${numL || numDia}x${numH} ${unit})`,
      workCategoryId,
      workCategory,
      quantity,
      hasSteelFrame,
      notes: notes.trim() || undefined,
      projectFiles: projectFiles.length > 0 ? projectFiles : undefined,
      projectCloudLink: projectCloudLink.trim() || undefined,
      projectCloudNote: projectCloudNote.trim() || undefined,
      driveFolderUrl: driveFolderUrl || undefined,
      drivePhotoUrls: drivePhotoUrls.length > 0 ? drivePhotoUrls : undefined,
      deliveryLocation: deliveryLocation.trim(),
      deliveryCoordinates,
      province,
      needInstallation,
      requiredDate,
      urgency,
      estimatedSurfaceAreaM2: calc.surfaceAreaM2,
      estimatedPriceMin: calc.totalCostMin,
      estimatedPriceMax: calc.totalCostMax,
      estimatedMoldCostMin: calc.moldCostMin,
      estimatedMoldCostMax: calc.moldCostMax,
      estimatedDays: calc.estimatedLeadDays,
      status: 'pending',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess(newRequest);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Hero Header Proposition with Think Big Fiberglass Brand */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-xs font-bold text-sky-800 dark:text-sky-300 rounded-full mb-3 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>คิดใหญ่ ไฟเบอร์กลาส (Think Big Fiberglass)</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <a 
            href="https://www.thinkbigthailand.com" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-1 hover:underline text-sky-700 dark:text-sky-400 font-semibold"
          >
            <Globe className="w-3 h-3" />
            <span>www.thinkbigthailand.com</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance leading-tight">
          ประเมินราคางานไฟเบอร์กลาสสั่งทำพิเศษ
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          โรงงานคิดใหญ่ ไฟเบอร์กลาส ผู้เชี่ยวชาญงานขึ้นรูปคอมโพสิต FRP/GRP ถังเคมี ชิ้นส่วนยานยนต์ ฝาครอบเครื่องจักร และงานโครงการขนาดใหญ่ คำนวณประเมินราคาพร้อมส่งแบบประเมินได้ทันที
        </p>

        {/* Quick test preset bar */}
        <div className="mt-6 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl inline-flex flex-wrap items-center justify-center gap-2 border border-slate-200/80 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            ทดลองเลือกตัวอย่างงานสำเร็จรูป:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('cover')}
            className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs whitespace-nowrap"
          >
            ⚙️ ฝาครอบเครื่องจักร
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('tank')}
            className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs whitespace-nowrap"
          >
            🛢️ ถังเคมี / บำบัด FRP
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('auto')}
            className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs whitespace-nowrap"
          >
            🚗 ชิ้นส่วนยานยนต์ / สปอยเลอร์
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sculpture')}
            className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs whitespace-nowrap"
          >
            🎨 มาสคอต / งานปั้น 3D
          </button>
        </div>
      </div>


      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Contact Information (Required by prompt) */}
            <div 
              id="field-customerName" 
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      ข้อมูลผู้ติดต่อสำหรับรับใบเสนอราคา
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      กรุณากรอกข้อมูลจริงเพื่อทีมงานติดต่อยืนยันสเปกและจัดส่งเอกสาร
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ชื่อ (Name) - Required */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    ชื่อ - นามสกุล ผู้ติดต่อ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="เช่น คุณสมชาย เจริญกิจ"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 transition-all ${
                        errors.customerName
                          ? 'border-rose-300 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-sky-600 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.customerName}
                    </p>
                  )}
                </div>

                {/* เบอร์โทรศัพท์ (Phone) - Required */}
                <div id="field-phoneNumber">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="เช่น 081-234-5678"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 transition-all ${
                        errors.phoneNumber
                          ? 'border-rose-300 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-sky-600 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* อีเมล (Email) - Required */}
                <div id="field-email">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    อีเมล (Email) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="เช่น somchai@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? 'border-rose-300 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-sky-600 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* บริษัท/หน่วยงาน (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    ชื่อบริษัท / ร้านค้า (ถ้ามี)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="เช่น บจก. ผลิตผลไทย"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* LINE ID (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    LINE ID (สะดวกรับส่งไฟล์แบบ)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น somchai_line"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Upload Work Photos (Required by prompt) */}
            <div 
              id="field-photos" 
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>รูปภาพงานไฟเบอร์กลาส</span>
                      <span className="text-rose-500 text-sm">*</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      แนบภาพถ่ายชิ้นงานตัวอย่าง ภาพสเก็ตช์พร้อมขนาด หรือไฟล์ 3D (JPG, PNG)
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  แนบแล้ว {photos.length} รูป
                </span>
              </div>

              {/* Google Drive Integration Bar */}
              <GoogleDriveAuthButton
                onAuthChange={(u, t) => {
                  setGoogleUser(u);
                  setGoogleToken(t);
                }}
                className="mb-4"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragOver
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                    : errors.photos
                    ? 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-sky-500/80 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <input
                  id={fileInputId}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <label
                    htmlFor={fileInputId}
                    className="cursor-pointer font-semibold text-sm text-sky-700 dark:text-sky-400 hover:underline"
                  >
                    คลิกเพื่อเลือกไฟล์รูปภาพ
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    หรือลากไฟล์ภาพมาวางที่นี่ (รองรับหลายรูปพร้อมกัน)
                  </span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    แนะนำ: รูปถ่ายชิ้นงานรอบด้าน หรือภาพสเก็ตช์ที่มีมิติ กว้าง x ยาว x สูง
                  </p>
                </div>
              </div>

              {errors.photos && (
                <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.photos}
                </p>
              )}

              {/* Photos Gallery */}
              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs"
                    >
                      <img
                        src={url}
                        alt={`Fiberglass job ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                          title="ลบรูปภาพ"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                          รูปหลัก
                        </span>
                      )}
                      {drivePhotoUrls[idx] && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                          <Check className="w-2.5 h-2.5" /> Drive
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Google Drive Upload Action Strip */}
              {photos.length > 0 && (
                <div className="mt-4 p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
                    <HardDrive className="w-4 h-4 text-sky-600" />
                    <span>
                      {isDriveUploaded || drivePhotoUrls.length > 0
                        ? `สำรองรูปลง Google Drive แล้ว (${drivePhotoUrls.length} รูป)`
                        : 'บันทึกรูปภาพงานทั้งหมดไปยัง Google Drive ของคุณ'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {driveFolderUrl && (
                      <a
                        href={driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-400 font-semibold rounded-lg hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>เปิดโฟลเดอร์ Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {googleUser ? (
                      <button
                        type="button"
                        onClick={handleUploadPhotosToDrive}
                        disabled={isUploadingToDrive}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingToDrive ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>กำลังส่งรูปขึ้น Drive...</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-3.5 h-3.5" />
                            <span>
                              {drivePhotoUrls.length > 0 ? 'อัปเดตรูปลง Drive' : 'บันทึกรูปลง Google Drive ทันที'}
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">
                        (เชื่อมต่อ Google Drive ด้านบนก่อนบันทึก)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Dimensions & Shape (Required by prompt) */}
            <div 
              id="field-dimensions" 
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>ขนาดและมิติของชิ้นงาน</span>
                      <span className="text-rose-500 text-sm">*</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ระบุรูปทรงและขนาด เพื่อคำนวณพื้นที่ผิวและน้ำหนักเรซิน-ใยแก้ว
                    </p>
                  </div>
                </div>

                {/* Unit Switcher */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUnit('cm')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      unit === 'cm'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    ซม. (cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('m')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      unit === 'm'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    เมตร (m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('mm')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      unit === 'mm'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    มม. (mm)
                  </button>
                </div>
              </div>

              {/* Shape selection */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  เลือกรูปทรงชิ้นงาน
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShape('box')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start ${
                      shape === 'box'
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Box className="w-5 h-5 mb-1.5 text-sky-700 dark:text-sky-400" />
                    <span className="text-xs font-bold">ทรงกล่อง/ฝาครอบ</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">กว้าง x ยาว x สูง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShape('cylinder')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start ${
                      shape === 'cylinder'
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Cylinder className="w-5 h-5 mb-1.5 text-sky-700 dark:text-sky-400" />
                    <span className="text-xs font-bold">ทรงกระบอก/ถัง</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">เส้นผ่านศูนย์กลาง x สูง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShape('sculpture')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start ${
                      shape === 'sculpture'
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 mb-1.5 text-sky-700 dark:text-sky-400" />
                    <span className="text-xs font-bold">งานปั้น 3D / มาสคอต</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">สัดส่วนพื้นที่รอบด้าน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShape('flat_panel')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start ${
                      shape === 'flat_panel'
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Layers className="w-5 h-5 mb-1.5 text-sky-700 dark:text-sky-400" />
                    <span className="text-xs font-bold">แผ่นเรียบ/ผนังกันเคมี</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">กว้าง x ยาว</span>
                  </button>
                </div>
              </div>

              {/* Dimension inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {shape === 'cylinder' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        เส้นผ่านศูนย์กลาง ({unit}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={diameter}
                        onChange={(e) => {
                          setDiameter(e.target.value);
                          setWidth(e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ความสูง / ยาว ({unit}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ความกว้าง ({unit}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ความยาว ({unit}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ความสูง / ลึก ({unit}) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tabular-nums text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </>
                )}

                {/* Wall thickness with user requested percentages:
                    3 มม = ราคาถูกต้องแล้ว
                    4 มม = เพิ่มราคา 10%
                    6 มม = เพิ่มราคา 30%
                    8 มม = เพิ่มราคา 50%
                    10 มม = เพิ่มราคา 70%
                */}
                <div className="col-span-2 sm:col-span-3 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      ความหนาชิ้นงาน (มม.)
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { mm: 3, label: '3 มม.', note: 'ความหนามาตรฐาน' },
                      { mm: 4, label: '4 มม.', note: 'เพิ่มความแข็งแรง' },
                      { mm: 6, label: '6 มม.', note: 'ทนทานสูง/งานถัง' },
                      { mm: 8, label: '8 มม.', note: 'งานโครงสร้างหนัก' },
                      { mm: 10, label: '10 มม.', note: 'งานอุตสาหกรรมหนักพิเศษ' },
                    ].map((item) => (
                      <button
                        key={item.mm}
                        type="button"
                        onClick={() => setWallThicknessMm(item.mm)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          wallThicknessMm === item.mm
                            ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50 text-slate-900 dark:text-white ring-2 ring-sky-500/20 shadow-2xs'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {item.note}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errors.dimensions && (
                <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.dimensions}
                </p>
              )}
            </div>

            {/* Step 4: Work Categorization & Specs (Resin Grade and Finish removed as requested) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      กลุ่มงานและสเปกการผลิต
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      เลือกกลุ่มประเภทงานและจำนวนชิ้นงานที่ต้องการผลิต
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Work Category Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    เลือกกลุ่มประเภทงาน / หมวดหมู่สินค้า <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          workCategoryId === cat.id
                            ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-2 ring-sky-500/20 shadow-2xs'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                          workCategoryId === cat.id
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {workCategoryId === cat.id && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {cat.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    ชื่อเรียกงาน / โครงการ / ชิ้นงาน (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ฝาครอบมอเตอร์โรงสีข้าว, ถังบำบัดน้ำเสีย 5,000 ลิตร, สปอยเลอร์รถตู้"
                    value={workTitle}
                    onChange={(e) => setWorkTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      จำนวนที่ต้องการผลิต (ชิ้น)
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-2 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 py-2 text-center text-sm font-bold tabular-nums text-slate-900 dark:text-white bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3.5 py-2 text-base font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[1, 5, 10, 25, 50].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuantity(q)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all tabular-nums ${
                            quantity === q
                              ? 'bg-sky-700 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {q} ชิ้น
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span>
                      *ค่าแม่พิมพ์และต้นทุนการผลิตจะเฉลี่ยประหยัดลงตามจำนวนชิ้นที่สั่งผลิต
                    </span>
                    {quantity > 1 && (
                      <span className="text-sky-700 dark:text-sky-400 font-medium whitespace-nowrap">
                        เฉลี่ยเหลือชิ้นละ {formatBaht(calc.unitPartCostMin)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Steel frame checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSteelFrame}
                      onChange={(e) => setHasSteelFrame(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        เสริมโครงเหล็กกล่อง / หน้าแปลนยึดด้านใน (Steel Frame Reinforcement)
                      </span>
                      <p className="text-slate-500 dark:text-slate-400">
                        สำหรับงานที่ต้องรับแรงดันสูง งานถังสารเคมี หรือชิ้นงานขนาดใหญ่ที่ต้องมีจุดยึดฐาน
                      </p>
                    </div>
                  </label>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    ข้อกำหนดเพิ่มเติม / สภาพแวดล้อมการใช้งาน
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น สีที่ต้องการ ทนสารเคมีชนิดใด อุณหภูมิใช้งาน มีจุดเจาะรูหรือฝังน็อต Insert..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Large Project Attachments & Cloud Download Links (Requested by user) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>ไฟล์แบบ & ลิงก์ดาวน์โหลด (สำหรับงานโครงการใหญ่)</span>
                      <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        ไม่บังคับ
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      กรณีงานโครงการใหญ่ ข้อมูลเยอะ มีไฟล์แบบ CAD, Drawing, BOQ หรือไฟล์ 3D ขนาดใหญ่ สามารถแนบไฟล์หรือวางลิงก์ฝากไฟล์ได้
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cloud link input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>ลิงก์ดาวน์โหลดไฟล์แบบ / โฟลเดอร์โครงการ (Cloud Link)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 lowercase font-normal">
                      (Google Drive, Dropbox, OneDrive, WeTransfer)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="เช่น https://drive.google.com/drive/folders/... หรือ https://wetransfer.com/downloads/..."
                      value={projectCloudLink}
                      onChange={(e) => setProjectCloudLink(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    หมายเหตุสำหรับลิงก์ดาวน์โหลด (เช่น รหัสผ่านเข้าไฟล์, ชื่อโฟลเดอร์ย่อย)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รหัสผ่านเปิดไฟล์: 1234 หรือ ดูในโฟลเดอร์ Final-Design"
                    value={projectCloudNote}
                    onChange={(e) => setProjectCloudNote(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none transition-all"
                  />
                </div>

                {/* File Attachment Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>แนบไฟล์เอกสารเพิ่มเติม (PDF, CAD DWG/DXF, STP/STEP, ZIP, Excel)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      แนบแล้ว {projectFiles.length} ไฟล์
                    </span>
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setFileDragOver(true);
                    }}
                    onDragLeave={() => setFileDragOver(false)}
                    onDrop={handleProjectFileDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                      fileDragOver
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                        : 'border-slate-300 dark:border-slate-700 hover:border-sky-500/80 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <input
                      id={projectFileInputId}
                      type="file"
                      multiple
                      accept=".pdf,.dwg,.dxf,.stp,.step,.zip,.rar,.xlsx,.xls,.docx,.doc,image/*"
                      onChange={handleProjectFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center py-2">
                      <FolderPlus className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-2" />
                      <label
                        htmlFor={projectFileInputId}
                        className="cursor-pointer font-semibold text-xs text-sky-700 dark:text-sky-400 hover:underline"
                      >
                        คลิกเพื่อเลือกไฟล์เอกสารโครงการ
                      </label>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        หรือลากไฟล์ PDF, DWG, STEP, ZIP มาวางที่นี่
                      </span>
                    </div>
                  </div>

                  {/* Attached file list */}
                  {projectFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {projectFiles.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2.5 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {f.name}
                            </span>
                            <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                              ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectFile(f.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                            title="ลบไฟล์"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 6: Delivery / Installation Site & Required Timeline (Requested by user) */}
            <div 
              id="field-deliveryLocation" 
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                    6
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>สถานที่จัดส่ง/ติดตั้ง และกำหนดเวลาใช้งาน</span>
                      <span className="text-rose-500 text-sm">*</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ระบุสถานที่ส่งมอบ บริการติดตั้งหน้างาน และวันที่ต้องการรับชิ้นงานเพื่อวางแผนผลิต
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Delivery Location Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      <span>สถานที่จัดส่งหรือสถานที่ติดตั้งหน้างาน <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ระบุชื่อโรงงาน นิคมฯ หรือที่อยู่
                    </span>
                  </label>

                  <textarea
                    rows={3}
                    placeholder="ระบุสถานที่จัดส่งหรือติดตั้ง เช่น ชื่อโรงงาน/บริษัท, นิคมอุตสาหกรรม, ซอย/ถนน, อำเภอ/เขต หรือจุดสังเกตหน้างาน..."
                    value={deliveryLocation}
                    onChange={(e) => {
                      setDeliveryLocation(e.target.value);
                      if (errors.deliveryLocation) setErrors((prev) => ({ ...prev, deliveryLocation: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all ${
                      errors.deliveryLocation
                        ? 'border-rose-400 ring-2 ring-rose-500/10'
                        : 'border-slate-200 dark:border-slate-700 focus:border-sky-600'
                    }`}
                  />

                  {/* Quick Industrial Hubs Selection */}
                  <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <span className="text-slate-400 shrink-0 font-medium">นิคมฯ ยอดนิยม:</span>
                    {[
                      { name: 'นิคมฯ บางปู (สมุทรปราการ)', prov: 'สมุทรปราการ' },
                      { name: 'นิคมฯ ลาดกระบัง (กทม.)', prov: 'กรุงเทพมหานคร' },
                      { name: 'นิคมฯ อมตะซิตี้ (ชลบุรี)', prov: 'ชลบุรี' },
                      { name: 'นิคมฯ มาบตาพุด (ระยอง)', prov: 'ระยอง' },
                      { name: 'นิคมฯ นวนคร (ปทุมธานี)', prov: 'ปทุมธานี' },
                      { name: 'นิคมฯ โรจนะ (อยุธยา)', prov: 'พระนครศรีอยุธยา' },
                      { name: 'แก่งคอย / หนองแค (สระบุรี)', prov: 'สระบุรี' },
                    ].map((hub, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDeliveryLocation(hub.name);
                          setProvince(hub.prov);
                          if (errors.deliveryLocation) setErrors((prev) => ({ ...prev, deliveryLocation: '' }));
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-400 shrink-0 transition-colors cursor-pointer"
                      >
                        {hub.name}
                      </button>
                    ))}
                  </div>

                  {errors.deliveryLocation && (
                    <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.deliveryLocation}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      จังหวัดหลัก
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-sky-600 focus:outline-none"
                    >
                      <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
                      <option value="สมุทรปราการ">สมุทรปราการ</option>
                      <option value="นนทบุรี">นนทบุรี</option>
                      <option value="ปทุมธานี">ปทุมธานี</option>
                      <option value="ชลบุรี">ชลบุรี</option>
                      <option value="ระยอง">ระยอง</option>
                      <option value="ฉะเชิงเทรา">ฉะเชิงเทรา</option>
                      <option value="สมุทรสาคร">สมุทรสาคร</option>
                      <option value="พระนครศรีอยุธยา">พระนครศรีอยุธยา</option>
                      <option value="สระบุรี">สระบุรี</option>
                      <option value="นครราชสีมา">นครราชสีมา</option>
                      <option value="ขอนแก่น">ขอนแก่น</option>
                      <option value="เชียงใหม่">เชียงใหม่</option>
                      <option value="สงขลา / หาดใหญ่">สงขลา / หาดใหญ่</option>
                      <option value="ภูเก็ต">ภูเก็ต</option>
                      <option value="ต่างจังหวัดอื่นๆ">ต่างจังหวัดอื่นๆ (จัดส่งทั่วประเทศ)</option>
                    </select>
                  </div>
                </div>

                {/* Installation service option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() => setNeedInstallation(false)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      !needInstallation
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-white">
                        จัดส่งสินค้าอย่างเดียว
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        แพ็กชิ้นงานอย่างดี จัดส่งถึงสถานที่หรือไซต์งาน
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setNeedInstallation(true)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      needInstallation
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Wrench className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block text-slate-900 dark:text-white">
                        ต้องการทีมช่างเข้าติดตั้งหน้างาน
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        พร้อมทีมวิศวกรและช่างติดตั้ง ยึดฐานประกอบสมบูรณ์
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline & Required Date */}
                <div id="field-requiredDate" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      กำหนดวันที่ต้องการใช้งาน / วันที่ส่งมอบ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <input
                        type="date"
                        required
                        value={requiredDate}
                        onChange={(e) => {
                          setRequiredDate(e.target.value);
                          if (errors.requiredDate) setErrors((prev) => ({ ...prev, requiredDate: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 transition-all ${
                          errors.requiredDate
                            ? 'border-rose-300 focus:ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:border-sky-600 focus:ring-sky-500/20'
                        }`}
                      />
                    </div>
                    {errors.requiredDate && (
                      <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.requiredDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      ความเร่งด่วนของโครงการ
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'normal', label: 'ปกติ (25-45 วัน)' },
                        { id: 'urgent', label: 'ด่วนพิเศษ (7-25 วัน)' },
                        { id: 'flexible', label: 'ยืดหยุ่นได้' },
                      ].map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUrgency(u.id as any)}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-lg transition-colors text-center ${
                            urgency === u.id
                              ? 'bg-sky-700 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Column: Live Instant Estimation & Submission Card (5 cols) */}
          <div className="lg:col-span-5 sticky top-20 space-y-6">
            
            {/* Live Estimation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-sky-700 dark:text-sky-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    สรุปการคำนวณประเมินราคาเบื้องต้น
                  </h3>
                </div>
                <span className="text-xs text-sky-700 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              {/* Price Range Display */}
              <div className="my-5 p-4 rounded-xl bg-gradient-to-br from-sky-50 to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-sky-100 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  ช่วงราคาประเมินรวมทั้งโครงการ ({quantity} ชิ้น)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {formatBaht(calc.totalCostMin)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm font-semibold">ถึง</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                    {formatBaht(calc.totalCostMax)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-tight">
                  {quantity === 1 
                    ? '*ราคาสำหรับผลิต 1 ชิ้น (รวมค่าทำแม่พิมพ์ต้นแบบและชิ้นงาน)'
                    : `*ราคารวมประเมินสำหรับสั่งผลิต ${quantity} ชิ้น (รวมค่าแม่พิมพ์ต้นแบบ)`
                  }
                </p>
              </div>

              {/* Breakdown metrics list */}
              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" /> พื้นที่ผิวโดยประมาณ:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {calc.surfaceAreaM2} ตร.ม. (m²)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> ใยแก้ว + เรซินต่อชิ้น:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    ใย {calc.glassFiberKg} กก. / เรซิน {calc.resinKg} กก.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-slate-400" /> ราคาผลิต 1 ชิ้นเต็ม (แม่พิมพ์+ชิ้นงาน):
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBaht(calc.onePiecePriceMin)} - {formatBaht(calc.onePiecePriceMax)}
                  </span>
                </div>

                {quantity > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-slate-400" /> ยอดรวมโดยประมาณ ({quantity} ชิ้น):
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatBaht(calc.totalCostMin)} - {formatBaht(calc.totalCostMax)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400" /> ราคาเฉลี่ยต่อชิ้น:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBaht(calc.unitPartCostMin)} - {formatBaht(calc.unitPartCostMax)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> ระยะเวลาผลิตโดยประมาณ:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    ~{calc.estimatedLeadDays} วันทำการ
                  </span>
                </div>

              </div>

              {/* Trust Badges */}
              <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>รับประกันคุณภาพชิ้นงานไฟเบอร์กลาสและมิติ 1 ปี</span>
                </div>
                <p>
                  • วิศวกรตรวจสเกลจากภาพถ่ายและส่งใบเสนอราคาทางการพร้อมแบบ 3D
                </p>
                <p>
                  • จัดส่งทั่วประเทศ พร้อมทีมงานบริการติดตั้งหน้างาน (ถ้าต้องการ)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึกข้อมูลและประเมินราคา...</span>
                ) : (
                  <>
                    <span>ส่งข้อมูลเพื่อขอรับใบเสนอราคา</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา · ยินดีให้คำปรึกษาฟรี
              </p>
            </div>

            {/* Factory showcase snippet */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <div className="aspect-video relative">
                <img
                  src="/src/assets/images/hero_fiberglass_workshop_1793935020615.jpg"
                  alt="Fiberglass Workshop"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    มาตรฐานการผลิตระดับอุตสาหกรรม
                  </span>
                  <h4 className="text-sm font-semibold mt-0.5">
                    โรงงานผลิตไฟเบอร์กลาสและขึ้นรูปโมลด์ความละเอียดสูง
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                    รองรับงานทั้งขนาดเล็กและขนาดใหญ่พิเศษ ชิ้นงานทนแดด ทนสารเคมี และทนแรงดัน
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </form>

    </div>
  );
};
