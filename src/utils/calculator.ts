import { QuotationDimensions, ResinType, FinishType } from '../types/fiberglass';

export interface CalculationResult {
  surfaceAreaM2: number;
  glassFiberKg: number;
  resinKg: number;
  moldCostMin: number;
  moldCostMax: number;
  onePiecePriceMin: number;
  onePiecePriceMax: number;
  nominalTotalMin: number;
  nominalTotalMax: number;
  baseUnitPartCostMin: number;
  baseUnitPartCostMax: number;
  unitPartCostMin: number;
  unitPartCostMax: number;
  discountPercent: number;
  totalCostMin: number;
  totalCostMax: number;
  estimatedLeadDays: number;
}

// Convert input value to meters
function toMeters(val: number, unit: string): number {
  if (isNaN(val) || val <= 0) return 0;
  if (unit === 'mm') return val / 1000;
  if (unit === 'cm') return val / 100;
  return val; // already meters
}

export function calculateFiberglassEstimate(
  dim: QuotationDimensions,
  quantity: number = 1,
  resinType: ResinType = 'general_ortho',
  finishType: FinishType = 'gelcoat_gloss',
  hasSteelFrame: boolean = false
): CalculationResult {
  const w = toMeters(dim.width, dim.unit);
  const l = toMeters(dim.length, dim.unit);
  const h = toMeters(dim.height, dim.unit);
  const dia = toMeters(dim.diameter || dim.width, dim.unit);

  let areaM2 = 0;

  switch (dim.shape) {
    case 'box':
      // Open or closed box / cover shell: Base + 4 sides
      // Approx 2*(w*l + w*h + l*h) * 0.7 for hollow enclosure/shell
      areaM2 = Math.max(0.1, (w * l) + 2 * (w * h) + 2 * (l * h));
      break;

    case 'cylinder':
      // Cylinder surface: lateral (pi * d * h) + 2 ends (2 * pi * r^2)
      const r = dia / 2;
      const lateral = Math.PI * dia * h;
      const ends = 2 * (Math.PI * r * r);
      areaM2 = Math.max(0.1, lateral + ends);
      break;

    case 'sculpture':
      // 3D Sculpture bounding box with curvature factor ~ 2.4 * average faces
      areaM2 = Math.max(0.15, (w * l + w * h + l * h) * 1.6);
      break;

    case 'flat_panel':
      // Single or double-sided panel
      areaM2 = Math.max(0.05, w * l * 1.15); // +15% flange/trimming
      break;

    default:
      areaM2 = Math.max(0.1, w * l + w * h);
  }

  // Rounded to 2 decimals
  // Rounded to 2 decimals
  const surfaceAreaM2 = Math.round(areaM2 * 100) / 100;

  // Thickness price calculation as requested:
  // 3 มม = ราคาถูกต้องแล้ว (ฐาน 1.0)
  // 4 มม = เพิ่มราคา 10% (1.10)
  // 6 มม = เพิ่มราคา 30% (1.30)
  // 8 มม = เพิ่มราคา 50% (1.50)
  // 10 มม = เพิ่มราคา 70% (1.70)
  const thicknessMm = dim.wallThicknessMm || 3;
  let thicknessPriceMultiplier = 1.0;
  if (thicknessMm === 4) {
    thicknessPriceMultiplier = 1.10;
  } else if (thicknessMm === 6) {
    thicknessPriceMultiplier = 1.30;
  } else if (thicknessMm === 8) {
    thicknessPriceMultiplier = 1.50;
  } else if (thicknessMm >= 10) {
    thicknessPriceMultiplier = 1.70;
  } else if (thicknessMm <= 3) {
    thicknessPriceMultiplier = 1.0;
  } else {
    // Linear interpolation for intermediate thickness
    if (thicknessMm > 8) {
      thicknessPriceMultiplier = 1.50 + ((thicknessMm - 8) / 2) * 0.20;
    } else if (thicknessMm > 6) {
      thicknessPriceMultiplier = 1.30 + ((thicknessMm - 6) / 2) * 0.20;
    } else if (thicknessMm > 4) {
      thicknessPriceMultiplier = 1.10 + ((thicknessMm - 4) / 2) * 0.20;
    } else {
      thicknessPriceMultiplier = 1.0 + ((thicknessMm - 3) / 1) * 0.10;
    }
  }

  // Material weights for engineering display
  const glassFiberKg = Math.round(surfaceAreaM2 * 1.5 * (thicknessMm / 3) * 10) / 10;
  const resinKg = Math.round(surfaceAreaM2 * 3.0 * (thicknessMm / 3) * 10) / 10;

  // Standard high-grade composite resin & gelcoat finish
  let finishAdderPerM2 = 450; // High-grade UV Gelcoat standard
  const steelCost = hasSteelFrame ? Math.round(surfaceAreaM2 * 800 + 1500) : 0;

  // Base raw material cost per piece at 3mm standard (THB)
  const baseMaterialAt3mm = (surfaceAreaM2 * 1.5 * 140) + (surfaceAreaM2 * 3.0 * 165) + (surfaceAreaM2 * finishAdderPerM2) + steelCost;

  // Labor & manufacturing overhead per piece at 3mm base
  const baseLaborAt3mm = Math.max(800, surfaceAreaM2 * 950);

  // Mold Tooling Cost (ขึ้นรูปแม่พิมพ์/โมลด์)
  let shapeComplexity = 1.0;
  if (dim.shape === 'sculpture') shapeComplexity = 2.2; // 3D hand sculpture / CNC foam master
  if (dim.shape === 'box') shapeComplexity = 1.15;
  if (dim.shape === 'cylinder') shapeComplexity = 1.0;
  if (dim.shape === 'flat_panel') shapeComplexity = 0.7;

  // Mold base cost estimate
  const baseMold = Math.max(3500, surfaceAreaM2 * 4500 * shapeComplexity);
  const moldCostMin = Math.round(baseMold * 0.9 / 100) * 100;
  const moldCostMax = Math.round(baseMold * 1.25 / 100) * 100;

  // Base Part Unit Price for casting 1 piece at 3mm
  const baseUnitPart3mm = baseMaterialAt3mm + baseLaborAt3mm;

  // Apply thickness multiplier to part production cost
  const baseUnitPartAdjusted = baseUnitPart3mm * thicknessPriceMultiplier;
  const baseUnitPartCostMin = Math.round(baseUnitPartAdjusted * 1.15 / 100) * 100;
  const baseUnitPartCostMax = Math.round(baseUnitPartAdjusted * 1.45 / 100) * 100;

  // ราคาผลิต 1 ชิ้นเต็ม (รวมแม่พิมพ์และชิ้นงานต้นแบบ 1 ชิ้น ปรับตามความหนา)
  // แม่พิมพ์ + ชิ้นงานที่ปรับความหนาแล้ว
  const onePiecePriceMin = moldCostMin + baseUnitPartCostMin;
  const onePiecePriceMax = moldCostMax + baseUnitPartCostMax;

  // คำนวณราคาตามสูตรของลูกค้า:
  // นำราคาของ 1 ชิ้น ไปคูณด้วยจำนวนที่สั่ง (qty)
  const qty = Math.max(1, quantity);
  const nominalTotalMin = onePiecePriceMin * qty;
  const nominalTotalMax = onePiecePriceMax * qty;

  // อัตราส่วนลดตามจำนวนชิ้นที่ผลิต:
  // 1 ชิ้น: ราคา 1 ชิ้นเต็ม (ลด 0%)
  // 5 ชิ้นขึ้นไป: เอาจำนวน 1 ชิ้นคูณ 5 แล้วลดลง 15%
  // 10 ชิ้นขึ้นไป: เอาราคา 1 ชิ้นคูณ 10 แล้วลดลง 20%
  // 25 ชิ้นขึ้นไป: เอาราคา 1 ชิ้นคูณ 25 แล้วลดลง 25%
  // 50 ชิ้นขึ้นไป: เอาราคา 1 ชิ้นคูณ 50 แล้วลดลง 30%
  let discountPercent = 0;
  if (qty >= 50) {
    discountPercent = 30;
  } else if (qty >= 25) {
    discountPercent = 25;
  } else if (qty >= 10) {
    discountPercent = 20;
  } else if (qty >= 5) {
    discountPercent = 15;
  }

  const discountMultiplier = (100 - discountPercent) / 100;
  const totalCostMin = Math.round(nominalTotalMin * discountMultiplier / 100) * 100;
  const totalCostMax = Math.round(nominalTotalMax * discountMultiplier / 100) * 100;

  // ราคาเฉลี่ยต่อชิ้น (Effective per-piece price after discount)
  const unitPartCostMin = Math.round(totalCostMin / qty / 100) * 100;
  const unitPartCostMax = Math.round(totalCostMax / qty / 100) * 100;

  // Estimated lead time in working days
  let estimatedLeadDays = 7;
  if (surfaceAreaM2 > 2 || dim.shape === 'sculpture') estimatedLeadDays = 12;
  if (qty > 10) estimatedLeadDays += Math.ceil(qty / 3);
  if (thicknessMm >= 8) estimatedLeadDays += 2;

  return {
    surfaceAreaM2,
    glassFiberKg,
    resinKg,
    moldCostMin,
    moldCostMax,
    onePiecePriceMin,
    onePiecePriceMax,
    nominalTotalMin,
    nominalTotalMax,
    baseUnitPartCostMin,
    baseUnitPartCostMax,
    unitPartCostMin,
    unitPartCostMax,
    discountPercent,
    totalCostMin,
    totalCostMax,
    estimatedLeadDays,
  };
}

export function getThicknessInfo(thicknessMm: number): { percent: number; label: string; badge: string } {
  if (thicknessMm <= 3) return { percent: 0, label: '3 มม.', badge: 'ราคามาตรฐาน (ถูกต้องแล้ว)' };
  if (thicknessMm === 4) return { percent: 10, label: '4 มม.', badge: '+10% เพิ่มความแข็งแรง' };
  if (thicknessMm === 6) return { percent: 30, label: '6 มม.', badge: '+30% งานทนทานสูง/งานถัง' };
  if (thicknessMm === 8) return { percent: 50, label: '8 มม.', badge: '+50% งานโครงสร้างหนัก' };
  if (thicknessMm >= 10) return { percent: 70, label: '10 มม.', badge: '+70% งานอุตสาหกรรมหนักพิเศษ' };
  return { percent: 0, label: `${thicknessMm} มม.`, badge: 'สเปกเฉพาะ' };
}

export function formatBaht(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}
