import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { PesticideApplication, SearchFilters } from '../types';

const COLLECTION_NAME = 'pesticide_applications';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const pesticideService = {
  async getAll(filters?: SearchFilters): Promise<PesticideApplication[]> {
    try {
      let q = query(collection(db, COLLECTION_NAME), orderBy('applicationDate', 'desc'), limit(100));

      if (filters) {
        if (filters.pesticideName) {
          q = query(q, where('pesticideName', '==', filters.pesticideName));
        }
        if (filters.cropName) {
          q = query(q, where('cropName', '==', filters.cropName));
        }
        if (filters.county) {
          q = query(q, where('county', '==', filters.county));
        }
        if (filters.startDate) {
          q = query(q, where('applicationDate', '>=', Timestamp.fromDate(filters.startDate)));
        }
        if (filters.endDate) {
          q = query(q, where('applicationDate', '<=', Timestamp.fromDate(filters.endDate)));
        }
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PesticideApplication));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  },

  subscribeToApplications(callback: (apps: PesticideApplication[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('applicationDate', 'desc'), limit(200));
    return onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PesticideApplication));
      callback(apps);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    });
  }
};
