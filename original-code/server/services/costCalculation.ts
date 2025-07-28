interface CostCalculationData {
  estimatedRecipients: number;
  colorMode: string;
  dataCleansing?: boolean;
  ncoaUpdate?: boolean;
  firstClassPostage?: boolean;
  enclosures?: number;
}

export function calculateQuoteCost(data: CostCalculationData): number {
  // Base rates - real-world pricing
  const baseRate = data.colorMode === 'color' ? 0.65 : 0.50;
  let total = data.estimatedRecipients * baseRate;
  
  // Enclosures cost (per letter)
  if (data.enclosures && data.enclosures > 0) {
    total += data.estimatedRecipients * (data.enclosures * 0.10);
  }
  
  // Additional services - flat fees
  if (data.dataCleansing) {
    total += 25;
  }
  
  if (data.ncoaUpdate) {
    total += 50;
  }
  
  // First Class Postage - real USPS rate
  if (data.firstClassPostage) {
    total += data.estimatedRecipients * 0.68;
  }
  
  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

export function getCostBreakdown(data: CostCalculationData) {
  // Base printing cost
  const baseRate = data.colorMode === 'color' ? 0.65 : 0.50;
  const baseCost = data.estimatedRecipients * baseRate;
  
  // Enclosures cost (per letter)
  const enclosureCost = data.enclosures ? data.estimatedRecipients * (data.enclosures * 0.10) : 0;
  
  // Additional services - flat fees
  const dataCleansingCost = data.dataCleansing ? 25 : 0;
  const ncoaCost = data.ncoaUpdate ? 50 : 0;
  
  // First Class Postage - real USPS rate
  const postageCost = data.firstClassPostage ? data.estimatedRecipients * 0.68 : 0;
  
  const totalCost = baseCost + enclosureCost + dataCleansingCost + ncoaCost + postageCost;
  
  return {
    baseCost,
    enclosureCost,
    dataCleansingCost,
    ncoaCost,
    postageCost,
    totalCost: Math.round(totalCost * 100) / 100
  };
}
