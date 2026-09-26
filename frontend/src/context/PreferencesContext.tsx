import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';
export type Theme = 'light' | 'dark';
export type FontSize = 'normal' | 'large' | 'xl';

export interface PreferencesState {
  language: Language;
  theme: Theme;
  fontSize: FontSize;
  soundEnabled: boolean;
  voicePrompts: boolean;
  scannerMode: 'hardware' | 'camera';
  autoScan: boolean;
  notifications: {
    lowStock: boolean;
    pendingPacking: boolean;
    pendingBox: boolean;
    pendingInvoice: boolean;
    gateMismatch: boolean;
    invalidBarcode: boolean;
  };
}

interface PreferencesContextType {
  preferences: PreferencesState;
  language: Language;
  theme: Theme;
  fontSize: FontSize;
  soundFeedback: boolean;
  voiceFeedback: boolean;
  scannerMode: 'hardware' | 'camera';
  autoScan: boolean;
  notifications: PreferencesState['notifications'];
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setSoundFeedback: (enabled: boolean) => void;
  setVoiceFeedback: (enabled: boolean) => void;
  setScannerMode: (mode: 'hardware' | 'camera') => void;
  setAutoScan: (enabled: boolean) => void;
  setNotifications: (notifs: PreferencesState['notifications']) => void;
  setNotificationSetting: (key: keyof PreferencesState['notifications'], val: boolean) => void;
  t: (key: string) => string;
  playSound: (type?: 'success' | 'warning' | 'error') => void;
  speak: (text: string) => void;
  playScanSuccess: () => void;
  playScanError: () => void;
  playScanDuplicate: () => void;
}

// Comprehensive Tri-lingual Dictionary (English, Hindi, Marathi)
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Topbar
    dashboard: 'Dashboard',
    profile: 'My Profile',
    settings: 'Settings',
    settingsTitle: 'Settings & Preferences',
    settingsSubtitle: 'Role-Based Configuration & Personal Preferences',
    logout: 'Logout',
    welcome: 'Welcome',
    refresh: 'Refresh Data',
    saveChanges: 'Save Changes',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    successSave: 'Settings saved successfully!',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    active: 'Active',
    status: 'Status',
    role: 'Role',
    activeRole: 'Active Role',
    department: 'Department',
    employeeId: 'Employee ID',
    mobileNumber: 'Mobile Number',
    emailAddress: 'Email Address',
    lastLogin: 'Last Login',
    actions: 'Actions',
    action: 'Action',
    overview: 'Overview',
    erpTitle: 'Barcode Stock Management & ERP System',
    home: 'Home',

    // Sidebar Menus & Submenus
    master: 'Master',
    users: 'Users',
    partMaster: 'Part Master',
    partStock: 'Part Stock',
    customer: 'Customer',
    customerMaster: 'Customer Master',
    packing: 'Packing',
    createPacking: 'Create Packing',
    createBulkPacking: 'Create Bulk Packing',
    viewPacking: 'View Packing',
    box: 'Box',
    createBox: 'Create Box',
    viewBox: 'View Box',
    invoice: 'Invoice',
    createInvoice: 'Create Invoice',
    viewInvoice: 'View Invoice',
    gateSecurity: 'Gate-Security',
    verifyInvoice: 'Verify Invoice',
    gateOutReport: 'Gate Out Report',

    // Station Steps
    packItems: 'Pack Items',
    fillBox: 'Fill & Lock Box',
    gateClearance: 'Gate Clearance',

    // Actions & Buttons
    startPacking: 'Start Single Packing',
    bulkPacking: 'Bulk Batch Packing',
    createDispatchInvoice: 'Create Dispatch Invoice',
    mapBoxes: 'Map Master Boxes',
    scanVerifyGate: 'Scan & Verify Invoice',
    gateReport: 'Gate-Out Audit Log',
    exportExcel: 'Export Excel',
    addCustomer: 'Add Customer',
    addPart: 'Add Part',
    addUser: 'Add ERP User',
    submit: 'Submit',
    save: 'Save',
    close: 'Close',
    pack: 'Pack',
    show: 'Show',
    entries: 'entries',
    search: 'Search',
    searchPlaceholder: 'Search...',
    loadingData: 'Loading data...',
    noData: 'No data available in table',

    // Table Columns & Pagination
    srNo: 'Sr. No.',
    partNumber: 'Part Number',
    partDescription: 'Part Description',
    customerName: 'Customer Name',
    remainingStock: 'Remaining Stock',
    quantity: 'Quantity',
    showing: 'Showing',
    to: 'to',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    goTo: 'Go to:',
    go: 'Go',

    // Settings Titles & Categories
    myPreferences: 'My Preferences',
    language: 'Language',
    languageSetting: 'Language (भाषा / बोली)',
    appearance: 'Appearance & Display',
    theme: 'Display Theme',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode (Night Shift)',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    fontSize: 'Font Scaling',
    fontSizeNormal: 'Standard (14px)',
    fontSizeLarge: 'Large (16px)',
    fontSizeXl: 'Extra Large (18px)',
    fontSizeExtraLarge: 'Extra Large (18px)',

    // Sound & Scanner
    soundFeedback: 'Sound Feedback',
    soundScanBeep: 'Scan Confirmation Beep',
    scanBeepSound: 'Scan Beep Sound',
    voicePrompts: 'Factory Voice Prompts',
    soundVoicePrompts: 'Spoken Voice Prompts',
    scannerSettings: 'Scanner Settings',
    scannerConfig: 'Barcode Scanner Configuration',
    scannerMode: 'Default Scanner Input Mode',
    scannerHardware: 'USB / Bluetooth Handheld Laser Scanner',
    scannerCamera: 'Built-in Device Camera Scanner',
    autoScan: 'Auto Scan',
    autoScanMode: 'Auto Scan on Detection',
    autoScanToggle: 'Auto-Trigger Scan on Barcode Detection',

    // Notifications
    notifications: 'Notifications & Alerts',
    notificationsTitle: 'Alerts & Notifications',
    lowStockAlerts: 'Low Stock Warnings',
    pendingPackingAlerts: 'Pending Packing Alerts',
    pendingBoxAlerts: 'Pending Box Alerts',
    pendingInvoiceAlerts: 'Pending Invoice Alerts',
    gateMismatchAlerts: 'Gate Mismatch Alerts',

    // Station Settings
    companySettings: 'Company Master Profile',
    barcodeSettings: 'Barcode Numbering & Sequences',
    packingSettings: 'Packing Preferences',
    boxSettings: 'Box Preferences',
    invoiceSettings: 'Invoice Preferences',
    gateSettings: 'Gate Verification',
    systemHealth: 'System Health & Diagnostics',
    systemStatus: 'System Health & Database Engine',

    // Sound Prompts
    verified: 'Barcode verified.',
    invalidBarcode: 'Invalid barcode. Please scan again.',
    duplicateBarcode: 'Barcode already used.',
  },

  hi: {
    // Nav & Topbar
    dashboard: 'डैशबोर्ड',
    profile: 'मेरी प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    settingsTitle: 'सिस्टम और स्टेशन सेटिंग्स',
    settingsSubtitle: 'भूमिका-आधारित विन्यास और व्यक्तिगत प्राथमिकताएं',
    logout: 'लॉग आउट',
    welcome: 'स्वागत है',
    refresh: 'ताज़ा करें',
    saveChanges: 'बदलाव सहेजें',
    saveSettings: 'सेटिंग्स सहेजें',
    saving: 'सहेजा जा रहा है...',
    successSave: 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',
    cancel: 'रद्द करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    active: 'सक्रिय',
    status: 'स्थिति',
    role: 'भूमिका',
    activeRole: 'सक्रिय भूमिका',
    department: 'विभाग',
    employeeId: 'कर्मचारी आईडी',
    mobileNumber: 'मोबाइल नंबर',
    emailAddress: 'ईमेल पता',
    lastLogin: 'अंतिम लॉगिन',
    actions: 'कार्रवाई',
    action: 'कार्रवाई',
    overview: 'अवलोकन',
    erpTitle: 'बारकोड स्टॉक प्रबंधन और ईआरपी प्रणाली',
    home: 'होम',

    // Sidebar Menus & Submenus
    master: 'मास्टर',
    users: 'उपयोगकर्ता (Users)',
    partMaster: 'पार्ट मास्टर',
    partStock: 'पार्ट स्टॉक',
    customer: 'ग्राहक (Customer)',
    customerMaster: 'ग्राहक मास्टर',
    packing: 'पैकिंग (Packing)',
    createPacking: 'सिंगल पैकिंग बनाएं',
    createBulkPacking: 'बल्क पैकिंग बनाएं',
    viewPacking: 'पैकिंग सूची देखें',
    box: 'बॉक्स (Box)',
    createBox: 'मास्टर बॉक्स बनाएं',
    viewBox: 'बॉक्स सूची देखें',
    invoice: 'इनवॉइस (Invoice)',
    createInvoice: 'इनवॉइस बनाएं',
    viewInvoice: 'इनवॉइस सूची देखें',
    gateSecurity: 'गेट सुरक्षा (Gate)',
    verifyInvoice: 'इनवॉइस सत्यापित करें',
    gateOutReport: 'गेट आउट रिपोर्ट',

    // Station Steps
    packItems: 'पार्ट्स पैकिंग करें',
    fillBox: 'बॉक्स भरें और लॉक करें',
    gateClearance: 'गेट सुरक्षा जांच',

    // Actions & Buttons
    startPacking: 'सिंगल पैकिंग शुरू करें',
    bulkPacking: 'बल्क बैच पैकिंग करें',
    createDispatchInvoice: 'डिस्पैच इनवॉइस बनाएं',
    mapBoxes: 'बॉक्स असाइन करें',
    scanVerifyGate: 'गेट पर इनवॉइस स्कैन करें',
    gateReport: 'गेट पास ऑडिट रिपोर्ट देखें',
    exportExcel: 'एक्सेल निर्यात (Excel)',
    addCustomer: 'ग्राहक जोड़ें',
    addPart: 'पार्ट जोड़ें',
    addUser: 'यूजर जोड़ें',
    submit: 'सबमिट करें',
    save: 'सहेजें',
    close: 'बंद करें',
    pack: 'पैक करें',
    show: 'दिखाएं',
    entries: 'प्रविष्टियां',
    search: 'खोजें',
    searchPlaceholder: 'खोजें...',
    loadingData: 'डेटा लोड हो रहा है...',
    noData: 'तालिका में कोई डेटा उपलब्ध नहीं है',

    // Table Columns & Pagination
    srNo: 'क्र. सं.',
    partNumber: 'पार्ट नंबर',
    partDescription: 'पार्ट विवरण',
    customerName: 'ग्राहक का नाम',
    remainingStock: 'शेष स्टॉक',
    quantity: 'मात्रा (Qty)',
    showing: 'दिखा रहा है',
    to: 'से',
    of: 'कुल',
    previous: 'पिछला',
    next: 'अगला',
    goTo: 'पेज पर जाएं:',
    go: 'जाएं',

    // Settings Titles & Categories
    myPreferences: 'मेरी प्राथमिकताएं',
    language: 'भाषा',
    languageSetting: 'भाषा चुनें (Select Language)',
    appearance: 'दिखावट (Appearance)',
    theme: 'थीम चुनें',
    themeLight: 'लाइट मोड',
    themeDark: 'डार्क मोड (नाइट शिफ्ट)',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    fontSize: 'फॉन्ट का आकार',
    fontSizeNormal: 'सामान्य (14px)',
    fontSizeLarge: 'बड़ा (16px)',
    fontSizeXl: 'बहुत बड़ा (18px)',
    fontSizeExtraLarge: 'बहुत बड़ा (18px)',

    // Sound & Scanner
    soundFeedback: 'ध्वनि और ऑडियो',
    soundScanBeep: 'स्कैन पुष्टिकरण बीप',
    scanBeepSound: 'स्कैन पुष्टिकरण बीप',
    voicePrompts: 'बोलने वाले वॉयस निर्देश',
    soundVoicePrompts: 'बोलने वाले वॉयस निर्देश',
    scannerSettings: 'स्कैनर सेटिंग्स',
    scannerConfig: 'बारकोड स्कैनर विन्यास',
    scannerMode: 'स्कैनर इनपुट मोड',
    scannerHardware: 'हैंडहेल्ड लेजर स्कैनर (USB/BT)',
    scannerCamera: 'कैमरा स्कैनर (Mobile/Tab)',
    autoScan: 'ऑटो-स्कैन',
    autoScanMode: 'पहचानते ही तुरंत स्कैन',
    autoScanToggle: 'बारकोड पहचानते ही ऑटो-स्कैन',

    // Notifications
    notifications: 'अलर्ट और सूचनाएं',
    notificationsTitle: 'अलर्ट और सूचनाएं',
    lowStockAlerts: 'कम स्टॉक चेतावनी',
    pendingPackingAlerts: 'लंबित पैकिंग अलर्ट',
    pendingBoxAlerts: 'लंबित बॉक्स अलर्ट',
    pendingInvoiceAlerts: 'लंबित इनवॉइस अलर्ट',
    gateMismatchAlerts: 'गेट विसंगति अलर्ट',

    // Station Settings
    companySettings: 'कंपनी का विवरण',
    barcodeSettings: 'बारकोड नियम और नंबरिंग',
    packingSettings: 'पैकिंग स्टेशन सेटिंग्स',
    boxSettings: 'मास्टर बॉक्स सेटिंग्स',
    invoiceSettings: 'इनवॉइस और डिस्पैच सेटिंग्स',
    gateSettings: 'गेट सुरक्षा सत्यापन',
    systemHealth: 'सिस्टम स्वास्थ्य और डेटाबेस',
    systemStatus: 'सिस्टम स्वास्थ्य और डेटाबेस',

    // Sound Prompts
    verified: 'बारकोड सत्यापित हुआ।',
    invalidBarcode: 'अमान्य बारकोड। कृपया दोबारा स्कैन करें।',
    duplicateBarcode: 'बारकोड पहले से उपयोग किया गया है।',
  },

  mr: {
    // Nav & Topbar
    dashboard: 'डॅशबोर्ड',
    profile: 'माझी प्रोफाइल',
    settings: 'सेटिंग्ज',
    settingsTitle: 'सिस्टीम आणि स्टेशन सेटिंग्ज',
    settingsSubtitle: 'भूमिका-आधारित सेटिंग्ज आणि वैयक्तिक पसंती',
    logout: 'लॉग आउट',
    welcome: 'स्वागत आहे',
    refresh: 'रिफ्रेश करा',
    saveChanges: 'बदल जतन करा',
    saveSettings: 'सेटिंग्ज जतन करा',
    saving: 'जतन करत आहे...',
    successSave: 'सेटिंग्ज यशस्वीरित्या जतन केल्या!',
    cancel: 'रद्द करा',
    edit: 'संपादित करा',
    delete: 'हटवा',
    active: 'सक्रिय',
    status: 'स्थिती',
    role: 'भूमिका',
    activeRole: 'सक्रिय भूमिका',
    department: 'विभाग',
    employeeId: 'कर्मचारी क्रमांक',
    mobileNumber: 'मोबाईल नंबर',
    emailAddress: 'ईमेल पत्ता',
    lastLogin: 'शेवटचे लॉगिन',
    actions: 'कृती',
    action: 'कृती',
    overview: 'आढावा',
    erpTitle: 'बारकोड स्टॉक मॅनेजमेंट आणि ईआरपी सिस्टीम',
    home: 'मुख्यपृष्ठ',

    // Sidebar Menus & Submenus
    master: 'मास्टर',
    users: 'वापरकर्ते (Users)',
    partMaster: 'पार्ट मास्टर',
    partStock: 'पार्ट स्टॉक',
    customer: 'ग्राहक (Customer)',
    customerMaster: 'ग्राहक मास्टर',
    packing: 'पॅकिंग (Packing)',
    createPacking: 'सिंगल पॅकिंग तयार करा',
    createBulkPacking: 'बल्क पॅकिंग तयार करा',
    viewPacking: 'पॅकिंग यादी पहा',
    box: 'बॉक्स (Box)',
    createBox: 'मास्टर बॉक्स तयार करा',
    viewBox: 'बॉक्स यादी पहा',
    invoice: 'इनव्हॉइस (Invoice)',
    createInvoice: 'इनव्हॉइस तयार करा',
    viewInvoice: 'इनव्हॉइस यादी पहा',
    gateSecurity: 'गेट सुरक्षा (Gate)',
    verifyInvoice: 'इनव्हॉइस तपासा',
    gateOutReport: 'गेट आउट अहवाल',

    // Station Steps
    packItems: 'पार्ट पॅकिंग करा',
    fillBox: 'बॉक्स भरा आणि लॉक करा',
    gateClearance: 'गेट सुरक्षा तपासणी',

    // Actions & Buttons
    startPacking: 'सिंगल पॅकिंग सुरू करा',
    bulkPacking: 'बल्क बॅच पॅकिंग करा',
    createDispatchInvoice: 'डिस्पॅच इनव्हॉइस तयार करा',
    mapBoxes: 'बॉक्स जोडा',
    scanVerifyGate: 'गेटवर इनव्हॉइस स्कॅन करा',
    gateReport: 'गेट पास अहवाल पहा',
    exportExcel: 'एक्सेल निर्यात करा (Excel)',
    addCustomer: 'ग्राहक जोडा',
    addPart: 'पार्ट जोडा',
    addUser: 'वापरकर्ता जोडा',
    submit: 'सबमिट करा',
    save: 'जतन करा',
    close: 'बंद करा',
    pack: 'पॅक करा',
    show: 'दाखवा',
    entries: 'नोंदी',
    search: 'शोधा',
    searchPlaceholder: 'शोधा...',
    loadingData: 'माहिती लोड होत आहे...',
    noData: 'टेबलमध्ये माहिती उपलब्ध नाही',

    // Table Columns & Pagination
    srNo: 'अनुक्रमांक',
    partNumber: 'पार्ट क्रमांक',
    partDescription: 'पार्ट वर्णन',
    customerName: 'ग्राहकाचे नाव',
    remainingStock: 'शिल्लक स्टॉक',
    quantity: 'नग (Qty)',
    showing: 'दाखवत आहे',
    to: 'ते',
    of: 'पैकी',
    previous: 'मागील',
    next: 'पुढील',
    goTo: 'पेजवर जा:',
    go: 'जा',

    // Settings Titles & Categories
    myPreferences: 'माझ्या पसंती',
    language: 'भाषा',
    languageSetting: 'भाषा निवडा (Select Language)',
    appearance: 'दिसणे आणि फॉन्ट',
    theme: 'थीम निवडा',
    themeLight: 'लाईट मोड',
    themeDark: 'डार्क मोड (नाईट शिफ्ट)',
    lightMode: 'लाईट मोड',
    darkMode: 'डार्क मोड',
    fontSize: 'फॉन्ट आकार',
    fontSizeNormal: 'सामान्य (14px)',
    fontSizeLarge: 'मोठा (16px)',
    fontSizeXl: 'खूप मोठा (18px)',
    fontSizeExtraLarge: 'खूप मोठा (18px)',

    // Sound & Scanner
    soundFeedback: 'ध्वनी आणि आवाज',
    soundScanBeep: 'स्कॅन झाल्यावर बीप आवाज',
    scanBeepSound: 'स्कॅन झाल्यावर बीप आवाज',
    voicePrompts: 'बोलणाऱ्या व्हॉइस सूचना',
    soundVoicePrompts: 'बोलणाऱ्या व्हॉइस सूचना',
    scannerSettings: 'स्कॅनर सेटिंग्ज',
    scannerConfig: 'बारकोड स्कॅनर सेटिंग्ज',
    scannerMode: 'स्कॅनर प्रकार निवडा',
    scannerHardware: 'हँडहेल्ड लेसर स्कॅनर (USB/BT)',
    scannerCamera: 'कॅमेरा स्कॅनर (Mobile/Tab)',
    autoScan: 'ऑटो-स्कॅन',
    autoScanMode: 'बारकोड दिसताच ऑटो-स्कॅन',
    autoScanToggle: 'बारकोड दिसताच ऑटो-स्कॅन',

    // Notifications
    notifications: 'सूचना आणि अलर्ट्स',
    notificationsTitle: 'सूचना आणि अलर्ट्स',
    lowStockAlerts: 'कमी स्टॉक चेतावणी',
    pendingPackingAlerts: 'प्रलंबित पॅकिंग अलर्ट',
    pendingBoxAlerts: 'प्रलंबित बॉक्स अलर्ट',
    pendingInvoiceAlerts: 'प्रलंबित इनव्हॉइस अलर्ट',
    gateMismatchAlerts: 'गेट विसंगति अलर्ट',

    // Station Settings
    companySettings: 'कंपनीची माहिती',
    barcodeSettings: 'बारकोड नियम आणि नंबरिंग',
    packingSettings: 'पॅकिंग स्टेशन सेटिंग्ज',
    boxSettings: 'मास्टर बॉक्स सेटिंग्ज',
    invoiceSettings: 'इनव्हॉइस आणि बिलिंग सेटिंग्ज',
    gateSettings: 'गेट सुरक्षा तपासणी',
    systemHealth: 'सिस्टम आरोग्य आणि डेटाबेस',
    systemStatus: 'सिस्टम आरोग्य आणि डेटाबेस',

    // Sound Prompts
    verified: 'बारकोड तपासला गेला.',
    invalidBarcode: 'अवैध बारकोड. पुन्हा स्कॅन करा.',
    duplicateBarcode: 'हा बारकोड आधीच वापरला गेला आहे.',
  },
};

const DEFAULT_PREFERENCES: PreferencesState = {
  language: 'en',
  theme: 'light',
  fontSize: 'normal',
  soundEnabled: true,
  voicePrompts: true,
  scannerMode: 'hardware',
  autoScan: true,
  notifications: {
    lowStock: true,
    pendingPacking: true,
    pendingBox: true,
    pendingInvoice: true,
    gateMismatch: true,
    invalidBarcode: true,
  },
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<PreferencesState>(() => {
    try {
      const saved = localStorage.getItem('erp_preferences');
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('erp_preferences', JSON.stringify(preferences));
    } catch {}

    // Apply font size and theme attributes to html root & body
    document.documentElement.setAttribute('data-theme', preferences.theme);
    document.documentElement.setAttribute('data-font-size', preferences.fontSize);
    document.body.setAttribute('data-theme', preferences.theme);
    document.body.setAttribute('data-font-size', preferences.fontSize);

    // Apply inline style adjustments to root
    if (preferences.fontSize === 'large') {
      document.documentElement.style.fontSize = '16px';
    } else if (preferences.fontSize === 'xl') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '14px';
    }

    if (preferences.theme === 'dark') {
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }
  }, [preferences]);

  const setLanguage = (lang: Language) => {
    setPreferences((prev) => ({ ...prev, language: lang }));
  };

  const setTheme = (theme: Theme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  };

  const setFontSize = (size: FontSize) => {
    setPreferences((prev) => ({ ...prev, fontSize: size }));
  };

  const setSoundEnabled = (soundEnabled: boolean) => {
    setPreferences((prev) => ({ ...prev, soundEnabled }));
  };

  const setVoicePrompts = (voicePrompts: boolean) => {
    setPreferences((prev) => ({ ...prev, voicePrompts }));
  };

  const setScannerMode = (scannerMode: 'hardware' | 'camera') => {
    setPreferences((prev) => ({ ...prev, scannerMode }));
  };

  const setAutoScan = (autoScan: boolean) => {
    setPreferences((prev) => ({ ...prev, autoScan }));
  };

  const setNotificationSetting = (key: keyof PreferencesState['notifications'], val: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: val },
    }));
  };

  // Translation helper
  const t = (key: string): string => {
    const lang = preferences.language || 'en';
    return translations[lang]?.[key] || translations.en?.[key] || key;
  };

  // Web Audio API Synthesizer (Zero external dependencies, clean factory sound tones)
  const playBeep = (freq: number, type: OscillatorType, duration: number) => {
    if (!preferences.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  const playScanSuccess = () => {
    playBeep(880, 'sine', 0.15); // Clear high tone
  };

  const playScanError = () => {
    playBeep(220, 'sawtooth', 0.35); // Low warning buzz
  };

  const playScanDuplicate = () => {
    playBeep(330, 'square', 0.25); // Mid warning alert
  };

  const playSound = (type: 'success' | 'warning' | 'error' = 'success') => {
    if (type === 'error') playScanError();
    else if (type === 'warning') playScanDuplicate();
    else playScanSuccess();
  };

  const setNotifications = (notifs: PreferencesState['notifications']) => {
    setPreferences((prev) => ({ ...prev, notifications: notifs }));
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        language: preferences.language,
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        soundFeedback: preferences.soundEnabled,
        voiceFeedback: false,
        scannerMode: preferences.scannerMode,
        autoScan: preferences.autoScan,
        notifications: preferences.notifications,
        setLanguage,
        setTheme,
        setFontSize,
        setSoundFeedback: setSoundEnabled,
        setVoiceFeedback: () => {},
        setScannerMode,
        setAutoScan,
        setNotifications,
        setNotificationSetting,
        t,
        playSound,
        speak: () => {},
        playScanSuccess,
        playScanError,
        playScanDuplicate,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
  return context;
};
