export type BatchStatus = 'pending' | 'active' | 'retired';

export interface EnergyBatch {
  id: string;
  producerId: string;
  producerName: string;
  country: string;
  energyType: 'Solar' | 'Wind' | 'Hydro';
  totalKwh: number;
  availableKwh: number;
  pricePerKwh: number;
  status: BatchStatus;
  verificationStatus: 'verified' | 'pending';
  mintedAt: string;
  mintTxHash: string;
  facilityId: string;
  reportingPeriod: string;
}

export interface Transaction {
  id: string;
  type: 'mint' | 'purchase' | 'retire';
  batchId: string;
  amount: number;
  price?: number;
  timestamp: string;
  txHash: string;
  from?: string;
  to?: string;
}

export interface User {
  id: string;
  role: 'producer' | 'buyer';
  name: string;
  email: string;
  walletAddress: string;
  country: string;
}

// Mock data
export const mockBatches: EnergyBatch[] = [
  {
    id: 'BATCH-2026-001',
    producerId: 'PROD-001',
    producerName: 'SolarTech Kenya',
    country: 'Kenya',
    energyType: 'Solar',
    totalKwh: 25000,
    availableKwh: 18500,
    pricePerKwh: 0.08,
    status: 'active',
    verificationStatus: 'verified',
    mintedAt: '2026-02-15T10:30:00Z',
    mintTxHash: '0xabc123def456789...',
    facilityId: 'FAC-KE-001',
    reportingPeriod: 'January 2026',
  },
  {
    id: 'BATCH-2026-002',
    producerId: 'PROD-002',
    producerName: 'WindPower Ghana',
    country: 'Ghana',
    energyType: 'Wind',
    totalKwh: 42000,
    availableKwh: 42000,
    pricePerKwh: 0.09,
    status: 'active',
    verificationStatus: 'verified',
    mintedAt: '2026-02-18T14:20:00Z',
    mintTxHash: '0xdef456789abc123...',
    facilityId: 'FAC-GH-002',
    reportingPeriod: 'January 2026',
  },
  {
    id: 'BATCH-2026-003',
    producerId: 'PROD-003',
    producerName: 'HydroEnergy Nigeria',
    country: 'Nigeria',
    energyType: 'Hydro',
    totalKwh: 35000,
    availableKwh: 12000,
    pricePerKwh: 0.07,
    status: 'active',
    verificationStatus: 'verified',
    mintedAt: '2026-02-10T09:15:00Z',
    mintTxHash: '0x789abc123def456...',
    facilityId: 'FAC-NG-003',
    reportingPeriod: 'January 2026',
  },
  {
    id: 'BATCH-2026-004',
    producerId: 'PROD-001',
    producerName: 'SolarTech Kenya',
    country: 'Kenya',
    energyType: 'Solar',
    totalKwh: 18000,
    availableKwh: 0,
    pricePerKwh: 0.08,
    status: 'retired',
    verificationStatus: 'verified',
    mintedAt: '2026-01-20T11:45:00Z',
    mintTxHash: '0x456789def123abc...',
    facilityId: 'FAC-KE-001',
    reportingPeriod: 'December 2025',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    type: 'mint',
    batchId: 'BATCH-2026-001',
    amount: 25000,
    timestamp: '2026-02-15T10:30:00Z',
    txHash: '0xabc123def456789...',
    to: '0xPROD001',
  },
  {
    id: 'TXN-002',
    type: 'purchase',
    batchId: 'BATCH-2026-001',
    amount: 6500,
    price: 520,
    timestamp: '2026-02-16T15:20:00Z',
    txHash: '0xbcd234efg567890...',
    from: '0xPROD001',
    to: '0xBUYER001',
  },
  {
    id: 'TXN-003',
    type: 'retire',
    batchId: 'BATCH-2026-001',
    amount: 6500,
    timestamp: '2026-02-20T09:45:00Z',
    txHash: '0xcde345fgh678901...',
    from: '0xBUYER001',
  },
];

export const calculateCO2Offset = (kwh: number): number => {
  // Average: 1 kWh = 0.5 kg CO2 offset
  return kwh * 0.5;
};

export const calculateTreesEquivalent = (kwh: number): number => {
  // Rough estimate: 1 tree absorbs ~21 kg CO2/year
  const co2Kg = calculateCO2Offset(kwh);
  return Math.round(co2Kg / 21);
};

export const calculateHomesEquivalent = (kwh: number): number => {
  // Average home uses ~10,000 kWh/year
  return Math.round((kwh / 10000) * 365);
};
