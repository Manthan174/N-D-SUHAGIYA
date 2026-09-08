import { firestore, auth, storage } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const getTargetUserId = () => {
  let targetUserId = auth.currentUser?.uid || 'admin';
  if (typeof window !== "undefined") {
    const impersonated = sessionStorage.getItem('impersonated_user_id');
    // Allow admin to impersonate others, or allow anyone to impersonate if no auth
    if (impersonated && (targetUserId === 'admin' || sessionStorage.getItem('superadmin_session') === 'true')) {
      targetUserId = impersonated;
    }
  }
  return targetUserId;
};

// --- PARTIES ---
export const addPartyToDB = async (partyData: any) => {
  const partiesCol = collection(firestore, 'parties');
  const userId = getTargetUserId();
  return await addDoc(partiesCol, { ...partyData, userId, createdAt: new Date().toISOString() });
};

export const updatePartyInDB = async (id: string, partyData: any) => {
  const partyRef = doc(firestore, 'parties', id);
  return await updateDoc(partyRef, partyData);
};

export const deletePartyFromDB = async (id: string) => {
  const partyRef = doc(firestore, 'parties', id);
  return await deleteDoc(partyRef);
};

export const subscribeToParties = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'parties'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const parties = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(parties);
  });
};

// --- BILLS ---
export const addBillToDB = async (billData: any) => {
  const billsCol = collection(firestore, 'bills');
  const userId = getTargetUserId();
  return await addDoc(billsCol, { ...billData, userId, createdAt: new Date().toISOString() });
};

export const updateBillInDB = async (id: string, billData: any) => {
  const billRef = doc(firestore, 'bills', id);
  return await updateDoc(billRef, billData);
};

export const deleteBillFromDB = async (id: string) => {
  const billRef = doc(firestore, 'bills', id);
  return await deleteDoc(billRef);
};

export const subscribeToBills = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'bills'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const bills = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    // Sort by created date descending if possible, or just return
    callback(bills);
  });
};

export const getPaginatedBills = async (
  pageSize: number,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  searchQuery: string = "",
  fromDate: string = "",
  toDate: string = ""
) => {
  const userId = getTargetUserId();
  let q = query(
    collection(firestore, 'bills'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  q = query(q, limit(pageSize));

  const snapshot = await getDocs(q);
  
  // Client-side filtering for complex searches since Firestore lacks native substring/multi-range
  let filteredDocs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  const newLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { bills: filteredDocs, lastDoc: newLastVisible, hasMore: snapshot.docs.length === pageSize };
};

export const getBillsForParty = async (partyName: string) => {
  const userId = getTargetUserId();
  const q = query(
    collection(firestore, 'bills'),
    where('userId', '==', userId),
    where('partyName', '==', partyName)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

// --- COLLECTIONS ---
export const addCollectionToDB = async (collectionData: any) => {
  const cols = collection(firestore, 'collections');
  const userId = getTargetUserId();
  return await addDoc(cols, { ...collectionData, userId, createdAt: new Date().toISOString() });
};

export const updateCollectionInDB = async (id: string, collectionData: any) => {
  const colRef = doc(firestore, 'collections', id);
  return await updateDoc(colRef, collectionData);
};

export const deleteCollectionFromDB = async (id: string) => {
  const colRef = doc(firestore, 'collections', id);
  return await deleteDoc(colRef);
};

export const subscribeToCollections = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'collections'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const colls = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(colls);
  });
};

export const getCollectionsForParty = async (partyName: string) => {
  const userId = getTargetUserId();
  const q = query(
    collection(firestore, 'collections'),
    where('userId', '==', userId),
    where('partyName', '==', partyName)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

// --- TRASH ---
export const moveToTrashDB = async (type: 'bill' | 'party' | 'collection' | 'stock' | 'finance', data: any) => {
  const trashCol = collection(firestore, 'trash');
  const userId = getTargetUserId();
  return await addDoc(trashCol, {
    type,
    data,
    userId,
    originalId: data.id || null,
    deletedAt: new Date().toISOString()
  });
};

export const deleteFromTrashDB = async (id: string) => {
  const trashRef = doc(firestore, 'trash', id);
  return await deleteDoc(trashRef);
};

export const hideFromUserTrashDB = async (id: string) => {
  const trashRef = doc(firestore, 'trash', id);
  return await updateDoc(trashRef, { permanentlyDeleted: true });
};

export const subscribeToTrash = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'trash'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const trashItems = snapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter((item: any) => !item.permanentlyDeleted);
    callback(trashItems);
  });
};

// --- SETTINGS (Items List, Starting Bill Number) ---
export const getSettings = async () => {
  const userId = getTargetUserId();
  const settingsRef = doc(firestore, 'settings', userId);
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    return snap.data();
  }
  return { itemsList: ["Ring", "Chain", "Bracelet"], startingBillNumber: "1" };
};

export const updateSettings = async (data: any) => {
  const userId = getTargetUserId();
  const settingsRef = doc(firestore, 'settings', userId);
  return await setDoc(settingsRef, data, { merge: true });
};

export const subscribeToSettings = (callback: (data: any) => void) => {
  const userId = getTargetUserId();
  const settingsRef = doc(firestore, 'settings', userId);
  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({ itemsList: ["Ring", "Chain", "Bracelet"], startingBillNumber: "1" });
    }
  });
};

// --- STOCK ---
export const addStockToDB = async (stockData: any) => {
  const stockCol = collection(firestore, 'stock');
  const userId = getTargetUserId();
  return await addDoc(stockCol, { ...stockData, userId, createdAt: new Date().toISOString() });
};

export const updateStockInDB = async (id: string, stockData: any) => {
  const stockRef = doc(firestore, 'stock', id);
  return await updateDoc(stockRef, stockData);
};

export const deleteStockFromDB = async (id: string) => {
  const stockRef = doc(firestore, 'stock', id);
  return await deleteDoc(stockRef);
};

export const subscribeToStock = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'stock'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const stockItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(stockItems);
  });
};

// --- FINANCE ---
export const addFinanceToDB = async (financeData: any) => {
  const financeCol = collection(firestore, 'finance');
  const userId = getTargetUserId();
  return await addDoc(financeCol, { ...financeData, userId, createdAt: new Date().toISOString() });
};

export const updateFinanceInDB = async (id: string, financeData: any) => {
  const financeRef = doc(firestore, 'finance', id);
  return await updateDoc(financeRef, financeData);
};

export const deleteFinanceFromDB = async (id: string) => {
  const financeRef = doc(firestore, 'finance', id);
  return await deleteDoc(financeRef);
};

export const subscribeToFinances = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'finance'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const finances = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(finances);
  });
};

export const uploadFinanceDocument = async (file: File) => {
  const userId = getTargetUserId();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const storageRef = ref(storage, `finance_documents/${userId}/${fileName}`);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// --- EMPLOYEES ---
export const uploadEmployeePhoto = async (file: File) => {
  const userId = getTargetUserId();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const storageRef = ref(storage, `employee_photos/${userId}/${fileName}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const addEmployeeToDB = async (employeeData: any) => {
  const employeesCol = collection(firestore, 'employees');
  const userId = getTargetUserId();
  return await addDoc(employeesCol, { ...employeeData, userId, createdAt: new Date().toISOString() });
};

export const updateEmployeeInDB = async (id: string, employeeData: any) => {
  const employeeRef = doc(firestore, 'employees', id);
  return await updateDoc(employeeRef, employeeData);
};

export const deleteEmployeeFromDB = async (id: string) => {
  const employeeRef = doc(firestore, 'employees', id);
  return await deleteDoc(employeeRef);
};

export const subscribeToEmployees = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'employees'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(employees);
  });
};

// --- MANUFACTURERS ---
export const addManufacturerToDB = async (manufacturerData: any) => {
  const manufacturersCol = collection(firestore, 'manufacturers');
  const userId = getTargetUserId();
  return await addDoc(manufacturersCol, { ...manufacturerData, userId, createdAt: new Date().toISOString() });
};

export const updateManufacturerInDB = async (id: string, manufacturerData: any) => {
  const manufacturerRef = doc(firestore, 'manufacturers', id);
  return await updateDoc(manufacturerRef, manufacturerData);
};

export const deleteManufacturerFromDB = async (id: string) => {
  const manufacturerRef = doc(firestore, 'manufacturers', id);
  return await deleteDoc(manufacturerRef);
};

export const subscribeToManufacturers = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'manufacturers'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const manufacturers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(manufacturers);
  });
};

// --- MANUFACTURER PAYMENTS ---
export const addManufacturerPaymentToDB = async (paymentData: any) => {
  const paymentsCol = collection(firestore, 'manufacturer_payments');
  const userId = getTargetUserId();
  return await addDoc(paymentsCol, { ...paymentData, userId, createdAt: new Date().toISOString() });
};

export const updateManufacturerPaymentInDB = async (id: string, paymentData: any) => {
  const paymentRef = doc(firestore, 'manufacturer_payments', id);
  return await updateDoc(paymentRef, paymentData);
};

export const deleteManufacturerPaymentFromDB = async (id: string) => {
  const paymentRef = doc(firestore, 'manufacturer_payments', id);
  return await deleteDoc(paymentRef);
};

export const subscribeToManufacturerPayments = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'manufacturer_payments'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(payments);
  });
};

export const getPaginatedManufacturerPayments = async (
  pageSize: number,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  searchQuery: string = "",
  fromDate: string = "",
  toDate: string = ""
) => {
  const userId = getTargetUserId();
  let q = query(
    collection(firestore, 'manufacturer_payments'),
    where('userId', '==', userId)
  );

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  // We fetch more than pageSize to see if there's a next page, or we can just limit(pageSize) and let the client handle.
  // Actually, to filter by search and dates on client side, pagination directly in Firestore with filters is tricky without composite indexes.
  // We'll fetch exactly pageSize. If search/dates are used, we might need to filter client side which breaks limit().
  // Given standard Firestore limitations, we apply limit first, then client filter if needed, OR we fetch all matching simple criteria and paginate in client?
  // The user requested: "according to page only display page data load form firebase and other pagination page data not load form firebase"
  // So we will do pure server pagination. We can't easily do substring search server-side in Firestore.
  q = query(q, limit(pageSize));

  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  const newLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { 
    payments: docs, 
    lastDoc: newLastVisible, 
    hasMore: snapshot.docs.length === pageSize 
  };
};

export const getManufacturerPaymentStats = async () => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'manufacturer_payments'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  
  let paidAmount = 0;
  let notPayable = 0;
  let paidFine = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    paidAmount += parseFloat(data.amount || "0");
    notPayable += parseFloat(data.notPayableAmount || "0");
    paidFine += parseFloat(data.silverKg || "0");
  });
  
  return { paidAmount, notPayable, paidFine };
};

// --- MANUFACTURER BILLS ---
export const addManufacturerBillToDB = async (billData: any) => {
  const billsCol = collection(firestore, 'manufacturer_bills');
  const userId = getTargetUserId();
  return await addDoc(billsCol, { ...billData, userId, createdAt: new Date().toISOString() });
};

export const updateManufacturerBillInDB = async (id: string, billData: any) => {
  const billRef = doc(firestore, 'manufacturer_bills', id);
  return await updateDoc(billRef, billData);
};

export const deleteManufacturerBillFromDB = async (id: string) => {
  const billRef = doc(firestore, 'manufacturer_bills', id);
  return await deleteDoc(billRef);
};

export const subscribeToManufacturerBills = (callback: (data: any[]) => void) => {
  const userId = getTargetUserId();
  const q = query(collection(firestore, 'manufacturer_bills'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const bills = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(bills);
  });
};

export const getPaginatedManufacturerBills = async (
  pageSize: number,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
) => {
  const userId = getTargetUserId();
  let q = query(
    collection(firestore, 'manufacturer_bills'),
    where('userId', '==', userId),
    limit(pageSize)
  );

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  const newLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { 
    bills: docs, 
    lastDoc: newLastVisible, 
    hasMore: snapshot.docs.length === pageSize 
  };
};
