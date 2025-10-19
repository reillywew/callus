// Simple keyword-based triage for emergencies and priority routing.

const EMERGENCY_KEYWORDS = [
  /gas\s*(smell|leak)/i,
  /carbon\s*monoxide/i,
  /co\s*alarm/i,
  /water\s*(leak|pouring|flood)/i,
  /no\s*(heat|cool)/i,
  /infant|elderly|senior|baby/i
];

const PRIORITY_KEYWORDS = [
  /no\s*(heat|cool)/i,
  /(heater|heating|furnace|boiler|heat pump|hvac|hvac\s*system).*?(not\s*working|broken|down|out|off|failed)/i,
  /(cooler|cooling|ac|air\s*conditioner|central\s*air|central\s*air\s*unit).*?(not\s*working|broken|down|out|off|failed)/i,
  /water\s*(leak|pouring|flood)/i,
  /burning\s*smell/i,
  /strange\s*smell/i,
  /sparks/i,
  /electrical/i,
  /electrical\s*issues/i,
  /(not\s*working|broken|down|out|off|failed)\s*(heater|heating|furnace|boiler|cooler|cooling|ac)/i
];

const NON_PRIORITY_KEYWORDS = [
  /unsure/i,
  /not\s*sure/i,
  /don't\s*know/i,
  /maybe/i,
  /might\s*be/i,
  /could\s*be/i,
  /think\s*it\s*might/i
];

export default async function handler(req, res) {
  try {
    const { text } = req.body || {};
    if (!text) return res.json({ ok: true, emergency: false, priority: false });
    
    const isEmergency = EMERGENCY_KEYWORDS.some((re) => re.test(String(text)));
    const isPriority = PRIORITY_KEYWORDS.some((re) => re.test(String(text)));
    const isNonPriority = NON_PRIORITY_KEYWORDS.some((re) => re.test(String(text)));
    
    // If unsure/uncertain, definitely not priority
    const priority = isNonPriority ? false : isPriority;
    
    res.json({ ok: true, emergency: isEmergency, priority });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}




