import { firestore } from './firebase';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';

export interface UserData {
  id: string;
  firebaseId: string;
  emailId: string;
  slug: string;
  name: string;
  shopName: string;
  mobile: string;
  trialExpiresAt: string | null;
  createdAt: any;
}

// Fetch all registered users
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersCol = collection(firestore, 'users');
    const q = query(usersCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Update a user's trial expiration date
export const updateUserTrial = async (userId: string, newExpiryDate: string | null): Promise<boolean> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      trialExpiresAt: newExpiryDate
    });
    return true;
  } catch (error) {
    console.error('Error updating user trial:', error);
    return false;
  }
};

// Remove a user's trial limitation (grant unlimited access)
export const removeUserTrial = async (userId: string): Promise<boolean> => {
  return await updateUserTrial(userId, null);
};
