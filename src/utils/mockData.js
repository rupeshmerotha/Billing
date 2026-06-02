// Bhudev Seeds Billing System Mock Data & Constants

export const DEFAULT_COMPANY_INFO = {
  name: "Bhudev Agro",
  tagline: "Trust in every seed, Promise in every harvest",
  address: "REG. OFFICE - 10 , ShreeNath Awas, Bundi Road, Kota (Raj) - 324008",
  phones: "+91 97573 599491",
  email: "bhudevseeds@gmail.com",
  gst: "08AQMPM6732H1ZH",
  license1: "SS/2023-24/32367",
  license2: "KTPT-25113",
  bankDetails: {
    bankName: "BANK OF BARODA",
    accountNo: "31920400000488",
    ifsc: "BARB0MAKOTA",
    branch: "MAHAVEER NAGAR KOTA",
    accountType: "Current Account"
  }
};


// Helper to get formatted today's date (YYYY-MM-DD)
export const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const DEFAULT_INVOICES = [];
