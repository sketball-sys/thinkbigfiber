import React, { useState } from 'react';
import { CheckCircle2, Printer, Share2, Copy, Check, X, ArrowRight, Phone, Mail, FileText } from 'lucide-react';
import { QuotationRequest } from '../types/fiberglass';
import { formatBaht } from '../utils/calculator';

interface QuotationSuccessModalProps {
  request: QuotationRequest | null;
  onClose: () => void;
  onViewInAdmin: () => void;
}

export const QuotationSuccessModal: React.FC<QuotationSuccessModalProps> = ({
  request,
  onClose,
  onViewInAdmin,
}) => {
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `[ใบขอประเมินราคางานไฟเบอร์กลาส - บริษัท คิดใหญ่ ไฟเบอร์กลาส จำกัด (www.thinkbigthailand.com)]
รหัสอ้างอิง: ${request.id}
ชื่อลูกค้า: ${request.customerName}
เบอร์โทร: ${request.phoneNumber}
อีเมล: ${request.email}
กลุ่มงาน/ชิ้นงาน: ${request.workTitle} (${request.workCategory})
ขนาด: ${request.dimensions.width} x ${request.dimensions.length || request.dimensions.diameter} x ${request.dimensions.height} ${request.dimensions.unit} (ความหนา ${request.dimensions.wallThicknessMm} มม.)
จำนวน: ${request.quantity} ชิ้น
สถานที่จัดส่ง/ติดตั้ง: ${request.deliveryLocation} (${request.needInstallation ? 'ต้องการทีมช่างติดตั้งหน้างาน' : 'จัดส่งสินค้าอย่างเดียว'})
กำหนดวันที่ต้องการใช้งาน: ${request.requiredDate} (${request.urgency === 'urgent' ? 'ด่วนพิเศษ (7-25 วัน)' : 'ปกติ (25-45 วัน)'})
${request.projectCloudLink ? `ลิงก์ดาวน์โหลดแบบโครงการ: ${request.projectCloudLink}` : ''}
ประมาณการราคาเบื้องต้น: ${formatBaht(request.estimatedPriceMin)} - ${formatBaht(request.estimatedPriceMax)}
ระยะเวลาผลิต: ประมาณ ${request.estimatedDays} วันทำการ
ติดต่อฝ่ายขาย: 088-243-3288 / 095-718-4959 | sales@thinkbigthailand.com`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shapeLabel = {
    box: 'ทรงกล่อง/ฝาครอบ',
    cylinder: 'ทรงกระบอก/ถัง',
    sculpture: 'งานปั้น 3D / มาสคอต',
    flat_panel: 'แผ่นเรียบ/ผนังกันเคมี',
  }[request.dimensions.shape];


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-sky-700 px-6 py-6 text-white text-center relative no-print">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-sky-100 hover:text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 bg-white text-sky-700 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            บันทึกคำขอประเมินราคาเรียบร้อยแล้ว
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1">
            รหัสใบขอราคาอ้างอิง: <span className="font-mono font-bold tracking-wider">{request.id}</span>
          </p>
        </div>

        {/* Printable Sheet */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Customer & Job Info Box */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span>วันที่ขอราคา: {new Date(request.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="font-mono text-sky-700 dark:text-sky-400 font-bold">{request.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">ชื่อผู้ติดต่อ:</span>
                <span className="font-bold text-slate-900 dark:text-white">{request.customerName}</span>
                {request.companyName && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{request.companyName}</span>
                )}
              </div>
              <div>
                <span className="text-xs text-slate-400 block">ช่องทางติดต่อ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">📞 {request.phoneNumber}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">✉️ {request.email}</span>
                {request.lineId && <span className="text-xs text-emerald-600 block">💬 LINE: {request.lineId}</span>}
              </div>
            </div>
          </div>

          {/* Job Specifications & Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Thumbnail */}
            {request.photos.length > 0 && (
              <div className="sm:col-span-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square bg-slate-100 dark:bg-slate-800">
                <img
                  src={request.photos[0]}
                  alt="Fiberglass quote"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Spec details */}
            <div className={`${request.photos.length > 0 ? 'sm:col-span-2' : 'sm:col-span-3'} space-y-2 text-xs`}>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                {request.workTitle}
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block">รูปทรง:</span>
                  <span className="font-semibold">{shapeLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ขนาด:</span>
                  <span className="font-semibold tabular-nums">
                    {request.dimensions.shape === 'cylinder'
                      ? `Ø ${request.dimensions.diameter} x สูง ${request.dimensions.height} ${request.dimensions.unit}`
                      : `${request.dimensions.width} x ${request.dimensions.length} x ${request.dimensions.height} ${request.dimensions.unit}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">ความหนาเนื้องาน:</span>
                  <span className="font-semibold">{request.dimensions.wallThicknessMm} มม.</span>
                </div>
                <div>
                  <span className="text-slate-400 block">จำนวนสั่งผลิต:</span>
                  <span className="font-semibold font-mono text-sky-700 dark:text-sky-400">{request.quantity} ชิ้น</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ความหนาชิ้นงาน:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {request.dimensions.wallThicknessMm} มม.
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">กลุ่มประเภทงาน:</span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300">{request.workCategory}</span>
                </div>
              </div>

              {request.hasSteelFrame && (
                <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                  ✓ มีการเสริมโครงสร้างเหล็กกล่อง / หน้าแปลนยึด
                </div>
              )}

              {/* Cloud Link or Attached Files (if any) */}
              {(request.projectCloudLink || (request.projectFiles && request.projectFiles.length > 0)) && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1 bg-sky-50/50 dark:bg-sky-950/20 p-2.5 rounded-xl">
                  {request.projectCloudLink && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400 font-medium shrink-0">🔗 ลิงก์ดาวน์โหลด:</span>
                      <a
                        href={request.projectCloudLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 dark:text-sky-400 hover:underline font-mono truncate"
                      >
                        {request.projectCloudLink}
                      </a>
                    </div>
                  )}
                  {request.projectFiles && request.projectFiles.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-medium">📎 ไฟล์แนบโครงการ ({request.projectFiles.length} ไฟล์): </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {request.projectFiles.map(f => f.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery & Timeline Box */}
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div>
                  <span className="text-slate-400 font-medium">📍 สถานที่จัดส่ง/ติดตั้ง: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{request.deliveryLocation}</span>
                  {request.deliveryCoordinates?.distanceKm && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold font-mono text-[10px]">
                      ~{request.deliveryCoordinates.distanceKm} กม.
                    </span>
                  )}
                  <span className="text-slate-500 ml-1">
                    ({request.needInstallation ? '🛠️ ต้องการทีมช่างติดตั้งหน้างาน' : '🚚 จัดส่งอย่างเดียว'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">📅 กำหนดส่งมอบ/ใช้งาน: </span>
                  <span className="font-semibold text-sky-700 dark:text-sky-400 font-mono">{request.requiredDate}</span>
                  <span className="text-slate-500 ml-1">
                    (ระดับความเร่งด่วน: {request.urgency === 'urgent' ? 'ด่วนพิเศษ (7-25 วัน)' : 'ปกติ (25-45 วัน)'})
                  </span>
                </div>
              </div>

              {request.notes && (
                <div className="pt-1 text-[11px] text-slate-500 italic">
                  หมายเหตุ: {request.notes}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Recap Box */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-sky-800 dark:text-sky-300 font-medium block">
                  ราคาประมาณการเบื้องต้น (รวมค่าโมลด์และผลิต {request.quantity} ชิ้น)
                </span>
                <div className="text-2xl font-extrabold text-sky-950 dark:text-sky-100 tabular-nums">
                  {formatBaht(request.estimatedPriceMin)} - {formatBaht(request.estimatedPriceMax)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <div>ค่าแม่พิมพ์: {formatBaht(request.estimatedMoldCostMin)} - {formatBaht(request.estimatedMoldCostMax)}</div>
                <div>เวลาผลิตโดยประมาณ: ~{request.estimatedDays} วันทำการ</div>
              </div>
            </div>
          </div>

          {/* Action buttons (hidden when printing) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 no-print">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบขอราคา / เซฟเป็น PDF</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกสรุปส่ง LINE</span>
                </>
              )}
            </button>

            <button
              onClick={onViewInAdmin}
              className="w-full sm:w-auto py-2.5 px-4 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>ดูในระบบงาน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center no-print">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              ปิดหน้าต่างและส่งคำขอรายการใหม่
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
