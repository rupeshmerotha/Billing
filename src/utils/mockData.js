// Bhudev Seeds Billing System Mock Data & Constants

export const DEFAULT_COMPANY_INFO = {
  name: "Bhudev Seeds (BTC)",
  logoText: "BTC",
  tagline: "Quality Seeds for Prosperous Farmers",
  address: "Seed Plaza, Near New Grain Market, G.T. Road, Karnal, Haryana - 132001",
  phones: "+91 94160 12345",
  email: "billing@bhudevseeds.com",
  gstin: "08AQMPM6732H1ZH",
  license1: "SS/2023-24/32367",
  license2: "KTPT-25113",
  bankDetails: {
    bankName: "State Bank of India",
    accountNo: "39876543210",
    ifsc: "SBIN0001234",
    branch: "Karnal Main Branch",
    accountType: "Current Account"
  }
};

export const AVAILABLE_SEEDS = [
  { name: "BTC Hybrid Cotton-33", manufacturer: "Bhudev Seeds", lotNumber: "BTC-CT-2026A", expiryDate: "2027-12", packing: "450g", rate: 750 },
  { name: "BTC Super Gold Wheat-99", manufacturer: "Bhudev Seeds", lotNumber: "BTC-WH-2026B", expiryDate: "2027-08", packing: "40kg", rate: 1600 },
  { name: "BTC Hybrid Mustard-55", manufacturer: "Bhudev Seeds", lotNumber: "BTC-MS-2026C", expiryDate: "2027-11", packing: "1kg", rate: 480 },
  { name: "Pioneer Paddy Premium", manufacturer: "Pioneer Seeds Ltd", lotNumber: "PIO-PD-8871", expiryDate: "2027-09", packing: "10kg", rate: 1250 },
  { name: "Monsanto Gold Maize-22", manufacturer: "Monsanto India Ltd", lotNumber: "MON-MZ-5050", expiryDate: "2027-10", packing: "5kg", rate: 1100 },
  { name: "BTC Hybrid Bajra-77", manufacturer: "Bhudev Seeds", lotNumber: "BTC-BJ-2026F", expiryDate: "2027-07", packing: "1.5kg", rate: 320 },
  { name: "Syngenta Vegetable Tomato", manufacturer: "Syngenta Seeds", lotNumber: "SYN-TM-9102", expiryDate: "2028-02", packing: "50g", rate: 950 }
];

// Helper to get formatted today's date (YYYY-MM-DD)
export const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const DEFAULT_INVOICES = [];
