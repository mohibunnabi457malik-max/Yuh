import type { Language } from '../types';

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // App
    appName: 'Hire One',
    appTagline: 'Find Local Service Providers',
    
    // Common
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try Again',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    and: 'and',
    
    // Auth
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    loginSuccess: 'Welcome back!',
    signupSuccess: 'Account created successfully!',
    loginError: 'Invalid email or password',
    signupError: 'Failed to create account',
    passwordMismatch: 'Passwords do not match',
    
    // Location
    detectingLocation: 'Detecting your location...',
    locationDetected: 'Location detected',
    locationError: 'Could not detect location',
    enableLocation: 'Enable Location',
    searchLocation: 'Search location...',
    yourLocation: 'Your Location',
    changeLocation: 'Change Location',
    kmAway: 'km away',
    mAway: 'm away',
    
    // Home
    home: 'Home',
    nearYou: 'Near You',
    topRated: 'Top Rated',
    availableNow: 'Available Now',
    categories: 'Categories',
    viewAll: 'View All',
    noProviders: 'No providers found in your area yet',
    beFirstProvider: 'Be the first to offer services here!',
    
    // Search
    searchPlaceholder: 'Search services or providers...',
    searchResults: 'Search Results',
    noResults: 'No results found',
    tryDifferent: 'Try a different search term',
    recentSearches: 'Recent Searches',
    
    // Provider
    provider: 'Provider',
    providers: 'Providers',
    verified: 'Verified',
    available: 'Available',
    busy: 'Busy',
    featured: 'Featured',
    rating: 'Rating',
    reviews: 'Reviews',
    jobs: 'Jobs',
    experience: 'Experience',
    years: 'years',
    year: 'year',
    bio: 'About',
    serviceAreas: 'Service Areas',
    serviceRange: 'Service Range',
    memberSince: 'Member since',
    noReviews: 'No reviews yet',
    
    // Booking
    bookNow: 'Book Now',
    chat: 'Chat',
    call: 'Call',
    bookings: 'Bookings',
    myBookings: 'My Bookings',
    newBooking: 'New Booking',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    describeIssue: 'Describe your issue',
    addPhotos: 'Add Photos',
    address: 'Address',
    paymentMethod: 'Payment Method',
    cashPayment: 'Cash on Service',
    confirmBooking: 'Confirm Booking',
    bookingConfirmed: 'Booking Confirmed!',
    bookingPending: 'Waiting for provider to accept',
    
    // Booking Status
    pending: 'Pending',
    accepted: 'Accepted',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    
    // Chat
    chats: 'Chats',
    messages: 'Messages',
    typeMessage: 'Type a message...',
    sendImage: 'Send Image',
    noChats: 'No conversations yet',
    startChatting: 'Start chatting with providers',
    
    // Profile
    profile: 'Profile',
    editProfile: 'Edit Profile',
    phone: 'Phone',
    saveChanges: 'Save Changes',
    profileUpdated: 'Profile updated successfully',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    english: 'English',
    urdu: 'اردو',
    notifications: 'Notifications',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    deleteAccount: 'Delete Account',
    deleteAccountConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
    
    // Provider Registration
    becomeProvider: 'Become a Provider',
    providerRegistration: 'Provider Registration',
    step1: 'Personal Info',
    step2: 'Services',
    step3: 'Location',
    step4: 'Review',
    personalInfo: 'Personal Information',
    selectCategories: 'Select Service Categories',
    selectCategoriesDesc: 'Choose the services you offer',
    minOneCategory: 'Select at least one category',
    locationAndRange: 'Location & Service Range',
    serviceRangeDesc: 'Customers within this distance will see your profile',
    reviewAndSubmit: 'Review & Submit',
    registrationSuccess: 'Registration successful! Welcome to Hire One.',
    goToDashboard: 'Go to Dashboard',
    
    // Provider Dashboard
    dashboard: 'Dashboard',
    totalJobs: 'Total Jobs',
    totalEarnings: 'Total Earnings',
    pendingRequests: 'Pending Requests',
    activeJobs: 'Active Jobs',
    availabilityStatus: 'Availability Status',
    toggleAvailability: 'Toggle Availability',
    youAreAvailable: 'You are available for work',
    youAreBusy: 'You are marked as busy',
    
    // Provider Jobs
    jobRequests: 'Job Requests',
    accept: 'Accept',
    reject: 'Reject',
    markComplete: 'Mark Complete',
    noRequests: 'No pending requests',
    noActiveJobs: 'No active jobs',
    jobHistory: 'Job History',
    
    // Earnings
    earnings: 'Earnings',
    totalEarned: 'Total Earned',
    thisMonth: 'This Month',
    recentTransactions: 'Recent Transactions',
    noEarnings: 'No earnings yet',
    
    // Saved
    saved: 'Saved',
    savedProviders: 'Saved Providers',
    noSaved: 'No saved providers',
    saveProviderDesc: 'Save providers you like for quick access',
    unsave: 'Remove',
    
    // Notifications
    noNotifications: 'No notifications',
    markAllRead: 'Mark All Read',
    
    // Admin
    admin: 'Admin',
    adminPanel: 'Admin Panel',
    users: 'Users',
    totalUsers: 'Total Users',
    totalProviders: 'Total Providers',
    totalBookings: 'Total Bookings',
    totalReviews: 'Total Reviews',
    recentSignups: 'Recent Signups',
    pendingVerification: 'Pending Verification',
    manageUsers: 'Manage Users',
    manageProviders: 'Manage Providers',
    manageCategories: 'Manage Categories',
    manageBookings: 'Manage Bookings',
    reports: 'Reports',
    verify: 'Verify',
    unverify: 'Unverify',
    makeFeatured: 'Make Featured',
    removeFeatured: 'Remove Featured',
    deactivate: 'Deactivate',
    activate: 'Activate',
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    categoryNameEn: 'Category Name (English)',
    categoryNameUr: 'Category Name (Urdu)',
    categoryIcon: 'Icon (Emoji)',
    categoryColor: 'Color',
    
    // Empty States
    emptyBookings: 'No bookings yet',
    emptyBookingsDesc: 'Your booking history will appear here',
    
    // Errors
    errorLoadingData: 'Error loading data',
    errorSavingData: 'Error saving data',
    networkError: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to view this page',
    
    // Footer
    allRightsReserved: 'All rights reserved',
  },
  ur: {
    // App
    appName: 'ہائر ون',
    appTagline: 'مقامی خدمت فراہم کنندگان تلاش کریں',
    
    // Common
    loading: 'لوڈ ہو رہا ہے...',
    error: 'کچھ غلط ہو گیا',
    retry: 'دوبارہ کوشش کریں',
    save: 'محفوظ کریں',
    cancel: 'منسوخ',
    confirm: 'تصدیق',
    delete: 'حذف کریں',
    edit: 'ترمیم',
    view: 'دیکھیں',
    back: 'واپس',
    next: 'اگلا',
    submit: 'جمع کرائیں',
    search: 'تلاش',
    filter: 'فلٹر',
    sort: 'ترتیب',
    all: 'تمام',
    none: 'کوئی نہیں',
    yes: 'ہاں',
    no: 'نہیں',
    or: 'یا',
    and: 'اور',
    
    // Auth
    login: 'لاگ ان',
    signup: 'سائن اپ',
    logout: 'لاگ آؤٹ',
    email: 'ای میل',
    password: 'پاس ورڈ',
    confirmPassword: 'پاس ورڈ کی تصدیق',
    fullName: 'پورا نام',
    forgotPassword: 'پاس ورڈ بھول گئے؟',
    noAccount: 'اکاؤنٹ نہیں ہے؟',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    loginSuccess: 'خوش آمدید!',
    signupSuccess: 'اکاؤنٹ کامیابی سے بن گیا!',
    loginError: 'غلط ای میل یا پاس ورڈ',
    signupError: 'اکاؤنٹ بنانے میں ناکامی',
    passwordMismatch: 'پاس ورڈ مماثل نہیں',
    
    // Location
    detectingLocation: 'آپ کا مقام معلوم کیا جا رہا ہے...',
    locationDetected: 'مقام معلوم ہو گیا',
    locationError: 'مقام معلوم نہیں ہو سکا',
    enableLocation: 'لوکیشن آن کریں',
    searchLocation: 'مقام تلاش کریں...',
    yourLocation: 'آپ کا مقام',
    changeLocation: 'مقام تبدیل کریں',
    kmAway: 'کلومیٹر دور',
    mAway: 'میٹر دور',
    
    // Home
    home: 'ہوم',
    nearYou: 'آپ کے قریب',
    topRated: 'بہترین درجہ',
    availableNow: 'ابھی دستیاب',
    categories: 'زمرے',
    viewAll: 'سب دیکھیں',
    noProviders: 'ابھی آپ کے علاقے میں کوئی فراہم کنندہ نہیں ملا',
    beFirstProvider: 'یہاں خدمات پیش کرنے والے پہلے بنیں!',
    
    // Search
    searchPlaceholder: 'خدمات یا فراہم کنندگان تلاش کریں...',
    searchResults: 'تلاش کے نتائج',
    noResults: 'کوئی نتیجہ نہیں ملا',
    tryDifferent: 'کوئی اور تلاش کریں',
    recentSearches: 'حالیہ تلاش',
    
    // Provider
    provider: 'فراہم کنندہ',
    providers: 'فراہم کنندگان',
    verified: 'تصدیق شدہ',
    available: 'دستیاب',
    busy: 'مصروف',
    featured: 'نمایاں',
    rating: 'درجہ بندی',
    reviews: 'جائزے',
    jobs: 'کام',
    experience: 'تجربہ',
    years: 'سال',
    year: 'سال',
    bio: 'تعارف',
    serviceAreas: 'خدمت کے علاقے',
    serviceRange: 'خدمت کی حد',
    memberSince: 'رکن از',
    noReviews: 'ابھی کوئی جائزہ نہیں',
    
    // Booking
    bookNow: 'ابھی بک کریں',
    chat: 'چیٹ',
    call: 'کال',
    bookings: 'بکنگز',
    myBookings: 'میری بکنگز',
    newBooking: 'نئی بکنگ',
    selectDate: 'تاریخ منتخب کریں',
    selectTime: 'وقت منتخب کریں',
    describeIssue: 'اپنا مسئلہ بیان کریں',
    addPhotos: 'تصاویر شامل کریں',
    address: 'پتہ',
    paymentMethod: 'ادائیگی کا طریقہ',
    cashPayment: 'خدمت پر نقد',
    confirmBooking: 'بکنگ کی تصدیق',
    bookingConfirmed: 'بکنگ کی تصدیق ہو گئی!',
    bookingPending: 'فراہم کنندہ کی قبولیت کا انتظار',
    
    // Booking Status
    pending: 'زیر التواء',
    accepted: 'قبول',
    inProgress: 'جاری',
    completed: 'مکمل',
    cancelled: 'منسوخ',
    rejected: 'مسترد',
    
    // Chat
    chats: 'چیٹس',
    messages: 'پیغامات',
    typeMessage: 'پیغام لکھیں...',
    sendImage: 'تصویر بھیجیں',
    noChats: 'ابھی کوئی گفتگو نہیں',
    startChatting: 'فراہم کنندگان سے بات چیت شروع کریں',
    
    // Profile
    profile: 'پروفائل',
    editProfile: 'پروفائل ترمیم',
    phone: 'فون',
    saveChanges: 'تبدیلیاں محفوظ کریں',
    profileUpdated: 'پروفائل اپڈیٹ ہو گیا',
    
    // Settings
    settings: 'ترتیبات',
    language: 'زبان',
    english: 'English',
    urdu: 'اردو',
    notifications: 'اطلاعات',
    privacyPolicy: 'رازداری کی پالیسی',
    termsOfService: 'سروس کی شرائط',
    deleteAccount: 'اکاؤنٹ حذف کریں',
    deleteAccountConfirm: 'کیا آپ واقعی اپنا اکاؤنٹ حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔',
    
    // Provider Registration
    becomeProvider: 'فراہم کنندہ بنیں',
    providerRegistration: 'فراہم کنندہ رجسٹریشن',
    step1: 'ذاتی معلومات',
    step2: 'خدمات',
    step3: 'مقام',
    step4: 'جائزہ',
    personalInfo: 'ذاتی معلومات',
    selectCategories: 'خدمت کے زمرے منتخب کریں',
    selectCategoriesDesc: 'وہ خدمات منتخب کریں جو آپ پیش کرتے ہیں',
    minOneCategory: 'کم از کم ایک زمرہ منتخب کریں',
    locationAndRange: 'مقام اور خدمت کی حد',
    serviceRangeDesc: 'اس فاصلے کے اندر صارفین آپ کی پروفائل دیکھ سکیں گے',
    reviewAndSubmit: 'جائزہ اور جمع',
    registrationSuccess: 'رجسٹریشن کامیاب! ہائر ون میں خوش آمدید۔',
    goToDashboard: 'ڈیش بورڈ پر جائیں',
    
    // Provider Dashboard
    dashboard: 'ڈیش بورڈ',
    totalJobs: 'کل کام',
    totalEarnings: 'کل آمدنی',
    pendingRequests: 'زیر التواء درخواستیں',
    activeJobs: 'فعال کام',
    availabilityStatus: 'دستیابی کی حیثیت',
    toggleAvailability: 'دستیابی تبدیل کریں',
    youAreAvailable: 'آپ کام کے لیے دستیاب ہیں',
    youAreBusy: 'آپ مصروف ہیں',
    
    // Provider Jobs
    jobRequests: 'کام کی درخواستیں',
    accept: 'قبول',
    reject: 'رد',
    markComplete: 'مکمل کریں',
    noRequests: 'کوئی زیر التواء درخواست نہیں',
    noActiveJobs: 'کوئی فعال کام نہیں',
    jobHistory: 'کام کی تاریخ',
    
    // Earnings
    earnings: 'آمدنی',
    totalEarned: 'کل کمائی',
    thisMonth: 'اس ماہ',
    recentTransactions: 'حالیہ لین دین',
    noEarnings: 'ابھی کوئی آمدنی نہیں',
    
    // Saved
    saved: 'محفوظ',
    savedProviders: 'محفوظ فراہم کنندگان',
    noSaved: 'کوئی محفوظ فراہم کنندہ نہیں',
    saveProviderDesc: 'اپنی پسند کے فراہم کنندگان کو فوری رسائی کے لیے محفوظ کریں',
    unsave: 'ہٹائیں',
    
    // Notifications
    noNotifications: 'کوئی اطلاع نہیں',
    markAllRead: 'سب پڑھے ہوئے',
    
    // Admin
    admin: 'ایڈمن',
    adminPanel: 'ایڈمن پینل',
    users: 'صارفین',
    totalUsers: 'کل صارفین',
    totalProviders: 'کل فراہم کنندگان',
    totalBookings: 'کل بکنگز',
    totalReviews: 'کل جائزے',
    recentSignups: 'حالیہ سائن اپ',
    pendingVerification: 'زیر التواء تصدیق',
    manageUsers: 'صارفین کا انتظام',
    manageProviders: 'فراہم کنندگان کا انتظام',
    manageCategories: 'زمروں کا انتظام',
    manageBookings: 'بکنگز کا انتظام',
    reports: 'رپورٹس',
    verify: 'تصدیق کریں',
    unverify: 'تصدیق ختم',
    makeFeatured: 'نمایاں کریں',
    removeFeatured: 'نمایاں ہٹائیں',
    deactivate: 'غیر فعال',
    activate: 'فعال',
    addCategory: 'زمرہ شامل کریں',
    editCategory: 'زمرہ ترمیم',
    categoryNameEn: 'زمرے کا نام (انگریزی)',
    categoryNameUr: 'زمرے کا نام (اردو)',
    categoryIcon: 'آئیکن (ایموجی)',
    categoryColor: 'رنگ',
    
    // Empty States
    emptyBookings: 'ابھی کوئی بکنگ نہیں',
    emptyBookingsDesc: 'آپ کی بکنگ کی تاریخ یہاں ظاہر ہوگی',
    
    // Errors
    errorLoadingData: 'ڈیٹا لوڈ کرنے میں خرابی',
    errorSavingData: 'ڈیٹا محفوظ کرنے میں خرابی',
    networkError: 'نیٹ ورک کی خرابی۔ اپنا کنکشن چیک کریں۔',
    unauthorized: 'آپ کو یہ صفحہ دیکھنے کی اجازت نہیں',
    
    // Footer
    allRightsReserved: 'جملہ حقوق محفوظ ہیں',
  },
};

export const getTranslation = (lang: Language, key: TranslationKey): string => {
  return translations[lang][key] || translations.en[key] || key;
};

export const t = (lang: Language, key: TranslationKey): string => {
  return getTranslation(lang, key);
};

export type { TranslationKey };
export { translations };
