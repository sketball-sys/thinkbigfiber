import React from 'react';
import { X, BookOpen, ShieldCheck, Layers, HelpCircle, Check, Flame, Droplet, Sparkles } from 'lucide-react';

interface FiberglassGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FiberglassGuideModal: React.FC<FiberglassGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                คู่มือการเลือกเกรดวัสดุไฟเบอร์กลาส (FRP Material Guide)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ข้อมูลเปรียบเทียบคุณสมบัติเรซิน ชนิดใยแก้ว และต้นทุนสำหรับประเมินราคา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs text-slate-600 dark:text-slate-300">
          
          {/* Section 1: Resin types */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-600" />
              <span>1. การเลือกประเภทเรซิน (Resin Selection)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850">
                <span className="font-bold text-slate-900 dark:text-white block text-sm mb-1">
                  Orthophthalic Resin (เกรดทั่วไป)
                </span>
                <p className="text-[11px] leading-relaxed mb-2 text-slate-500 dark:text-slate-400">
                  เรซินโพลีเอสเตอร์มาตรฐาน เหมาะกับชิ้นงานทั่วไป เช่น งานปั้นมาสคอต ฝาครอบกันฝุ่น งานตกแต่งภายใน
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ ข้อดี: ราคาประหยัดที่สุด ขึ้นรูปง่าย แห้งไว
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20">
                <span className="font-bold text-sky-950 dark:text-sky-200 block text-sm mb-1">
                  Isophthalic Resin (เกรดทนเคมีและแดด UV)
                </span>
                <p className="text-[11px] leading-relaxed mb-2 text-slate-500 dark:text-slate-400">
                  โครงสร้างโมเลกุลแน่น ทนสารเคมีอ่อน น้ำมัน และทนรังสี UV กลางแจ้งได้ดี เหมาะกับชิ้นส่วนยานยนต์ ฝาครอบเครื่องจักร และเรือ
                </p>
                <div className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">
                  ✓ ข้อดี: ทนแดดฝนดีเยี่ยม ไม่กรอบแตกง่าย
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
                <span className="font-bold text-indigo-950 dark:text-indigo-200 block text-sm mb-1">
                  Vinyl Ester Resin (เกรดทนกรด-ด่างสูง)
                </span>
                <p className="text-[11px] leading-relaxed mb-2 text-slate-500 dark:text-slate-400">
                  เกรดพิเศษสำหรับอุตสาหกรรมเคมี ถังเก็บสารเคมี บ่อบำบัดน้ำเสีย ทนการกัดกร่อนจากกรดแก่-ด่างเข้มข้น และอุณหภูมิสูง
                </p>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold">
                  ✓ ข้อดี: ทนการกัดกร่อนเคมีสูงสุดในกลุ่มเทอร์โมเซ็ต
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
                <span className="font-bold text-amber-950 dark:text-amber-200 block text-sm mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fire Retardant Resin (เกรดไม่ลามไฟ)</span>
                </span>
                <p className="text-[11px] leading-relaxed mb-2 text-slate-500 dark:text-slate-400">
                  ผสมสารหน่วงการติดไฟตามมาตรฐานความปลอดภัยอาคาร เช่น UL-94 หรือ ASTM E84 เหมาะกับงานสถาปัตยกรรม รางสายไฟในโรงงาน
                </p>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                  ✓ ข้อดี: ปลอดภัย ไม่ลามไฟ มีควันน้อย
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Mold Tooling Explanation */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>2. ทำไมถึงมีค่าแม่พิมพ์ (Mold Cost) และเฉลี่ยอย่างไร?</span>
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 leading-relaxed">
              <p>
                งานไฟเบอร์กลาสจำเป็นต้องมี <strong>"แม่พิมพ์ (Master Mold)"</strong> ในการหล่อชิ้นงาน ซึ่งขั้นตอนการทำแม่พิมพ์ประกอบด้วย:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <li>การขึ้นรูปต้นแบบ (Master Plug) ด้วยโฟม CNC, ไม้ หรือดินเหนียว</li>
                <li>การขัดแต่งผิวให้เรียบเนียนระดับกระจก และลงน้ำยาถอดแบบ (Wax Release)</li>
                <li>การหล่อแม่พิมพ์ไฟเบอร์กลาสแบบหลายชิ้น (Multi-part Mold) พร้อมโครงสร้างยึด</li>
              </ul>
              <div className="mt-2 p-2.5 rounded-lg bg-sky-100/60 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 text-[11px] font-medium">
                <div>💡 <strong>การผลิตตามจำนวน:</strong> ค่าทำแม่พิมพ์ต้นแบบจะถูกเฉลี่ยหารออกไป ยิ่งสั่งผลิตจำนวนชิ้นมากขึ้น ราคาเฉลี่ยต่อชิ้นจะยิ่งประหยัดลงอย่างมาก</div>
              </div>
            </div>
          </div>

          {/* Section 3: How to prepare photos and dimensions */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>3. การเตรียมรูปภาพและขนาดเพื่อให้ประเมินราคาได้เร็วที่สุด</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">1. รูปถ่ายรอบด้าน</span>
                <p className="text-slate-500 dark:text-slate-400">ถ่ายรูปชิ้นงานเดิม หรือชิ้นงานอ้างอิง ทั้งมุมตรง มุมเฉียง และด้านในชิ้นงาน</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">2. เขียนตัวเลขกำกับ</span>
                <p className="text-slate-500 dark:text-slate-400">ภาพสเก็ตช์ด้วยมือหรือไฟล์ CAD ที่มีขนาด กว้าง ยาว สูง และจุดยึดน็อต</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">3. สภาพแวดล้อมที่ใช้</span>
                <p className="text-slate-500 dark:text-slate-400">ระบุว่าใช้ในร่มหรือกลางแจ้ง สัมผัสน้ำหรือสารเคมี ช่วยเลือกเรซินได้ถูกต้อง</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors cursor-pointer"
          >
            เข้าใจแล้ว / กลับสู่หน้าขอราคา
          </button>
        </div>

      </div>
    </div>
  );
};
