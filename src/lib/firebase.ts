import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  disableNetwork,
  enableNetwork,
  setLogLevel,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RepairOrder, InventoryItem, AccountTransaction, ShopProfile, ConnectedDevice, AppUser, UserStatus, AuthUser } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Bind explicitly to firestoreDatabaseId as required by Firebase skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Silence internal Firestore SDK backoff logging to prevent spamming
try {
  setLogLevel('silent');
} catch {}

export function getFirebaseConfig() {
  return firebaseConfig;
}

export const FIREBASE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
export const FIREBASE_PRICING_URL = 'https://firebase.google.com/pricing#cloud-firestore';

let _isQuotaExceeded = false;

// Global runtime listener for Firestore SDK resource-exhausted warnings
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    const str = args.map((a) => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
    if (
      str.includes('resource-exhausted') ||
      str.includes('Quota limit exceeded') ||
      str.includes('maximum backoff delay')
    ) {
      markQuotaExceeded();
      return;
    }
    origConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    const code = reason?.code || '';
    if (code === 'resource-exhausted' || msg.includes('Quota limit exceeded') || msg.includes('resource-exhausted')) {
      markQuotaExceeded();
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('Quota limit exceeded') || msg.includes('resource-exhausted')) {
      markQuotaExceeded();
      event.preventDefault();
    }
  });
}

/**
 * Checks if the daily free tier Firestore quota has been exceeded.
 * Automatically clears after 18+ hours when the next day quota resets.
 */
export function isFirestoreQuotaExceeded(): boolean {
  if (_isQuotaExceeded) return true;
  try {
    const flag = localStorage.getItem('mh_firestore_quota_exceeded');
    if (flag === 'true') {
      _isQuotaExceeded = true;
      const timeStr = localStorage.getItem('mh_firestore_quota_time');
      if (timeStr) {
        const breachTime = new Date(timeStr).getTime();
        const now = Date.now();
        // If 18+ hours have passed, allow retry as free quota resets daily at midnight PST
        if (now - breachTime > 18 * 60 * 60 * 1000) {
          clearQuotaExceeded();
          return false;
        }
      }
      return true;
    }
  } catch {}
  return _isQuotaExceeded;
}

export function markQuotaExceeded(): void {
  _isQuotaExceeded = true;
  try {
    localStorage.setItem('mh_firestore_quota_exceeded', 'true');
    localStorage.setItem('mh_firestore_quota_time', new Date().toISOString());
  } catch {}
  try {
    // Disable network on the Firestore instance to pause retries and stop backoff logs
    disableNetwork(db).catch(() => {});
  } catch {}
}

export function clearQuotaExceeded(): void {
  _isQuotaExceeded = false;
  try {
    localStorage.removeItem('mh_firestore_quota_exceeded');
    localStorage.removeItem('mh_firestore_quota_time');
  } catch {}
  try {
    enableNetwork(db).catch(() => {});
  } catch {}
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';

  // Intercept Quota Limit Exceeded gracefully as per Firebase Skill instructions
  if (errCode === 'resource-exhausted' || errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted')) {
    markQuotaExceeded();
    console.warn(
      `Firestore Quota Limit Exceeded for metric 'Free daily write units per project (free tier database)'. Writes paused until next day reset. Upgrade URL: ${FIREBASE_UPGRADE_URL}`
    );
    // Return early to avoid unhandled promise crashes in application UI
    return undefined as never;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Diagnostic connection test required by skill - READ ONLY from server (no write!)
export async function testFirestoreConnection(): Promise<{
  connected: boolean;
  message: string;
  databaseId: string;
  projectId: string;
  isQuotaExceeded?: boolean;
}> {
  try {
    // If already marked as quota exceeded recently, notify cleanly without triggering Firestore backoff
    if (isFirestoreQuotaExceeded()) {
      return {
        connected: false,
        isQuotaExceeded: true,
        message: 'Daily free Firestore write quota reached. Auto-resets tomorrow (data safe locally).',
        databaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId,
      };
    }

    // Verify connection by reading from server directly as per Firebase Skill instructions
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      connected: true,
      message: 'Successfully connected to Firebase Firestore Cloud DB.',
      databaseId: firebaseConfig.firestoreDatabaseId,
      projectId: firebaseConfig.projectId,
    };
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded') || error?.message?.includes('resource-exhausted')) {
      markQuotaExceeded();
      return {
        connected: false,
        isQuotaExceeded: true,
        message: 'Daily free Firestore write quota reached. Auto-resets tomorrow (data safe locally).',
        databaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId,
      };
    }

    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline or network is disconnected.');
    }

    return {
      connected: false,
      message: error?.message || 'Failed to connect to Firebase Firestore Cloud DB.',
      databaseId: firebaseConfig.firestoreDatabaseId,
      projectId: firebaseConfig.projectId,
    };
  }
}

// If quota is already marked as exceeded from previous session, ensure network retries are paused
if (isFirestoreQuotaExceeded()) {
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
}

// Clean payload helper to ensure undefined properties are converted to null or stripped
function sanitizeDocument<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      clean[key] = value.map((item) => (typeof item === 'object' && item !== null ? sanitizeDocument(item) : item));
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeDocument(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// --- ORDERS ---
export async function fetchOrdersFromFirestore(): Promise<RepairOrder[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, path));
    const list: RepairOrder[] = [];
    snap.forEach((d) => {
      list.push(d.data() as RepairOrder);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveOrderToFirestore(order: RepairOrder): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `orders/${order.id}`;
  try {
    const clean = sanitizeDocument(order);
    await setDoc(doc(db, 'orders', order.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- INVENTORY ---
export async function fetchInventoryFromFirestore(): Promise<InventoryItem[]> {
  const path = 'inventory';
  try {
    const snap = await getDocs(collection(db, path));
    const list: InventoryItem[] = [];
    snap.forEach((d) => {
      list.push(d.data() as InventoryItem);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveInventoryItemToFirestore(item: InventoryItem): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `inventory/${item.id}`;
  try {
    const clean = sanitizeDocument(item);
    await setDoc(doc(db, 'inventory', item.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInventoryItemFromFirestore(itemId: string): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `inventory/${itemId}`;
  try {
    await deleteDoc(doc(db, 'inventory', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- TRANSACTIONS ---
export async function fetchTransactionsFromFirestore(): Promise<AccountTransaction[]> {
  const path = 'transactions';
  try {
    const snap = await getDocs(collection(db, path));
    const list: AccountTransaction[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AccountTransaction);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveTransactionToFirestore(transaction: AccountTransaction): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `transactions/${transaction.id}`;
  try {
    const clean = sanitizeDocument(transaction);
    await setDoc(doc(db, 'transactions', transaction.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTransactionFromFirestore(transactionId: string): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- SHOP PROFILE & CONFIG ---
export async function fetchProfileFromFirestore(): Promise<ShopProfile | null> {
  const path = 'settings/profile';
  try {
    const snap = await getDoc(doc(db, 'settings', 'profile'));
    if (snap.exists()) {
      return snap.data() as ShopProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveProfileToFirestore(profile: ShopProfile): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = 'settings/profile';
  try {
    const clean = sanitizeDocument(profile);
    await setDoc(doc(db, 'settings', 'profile'), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- CONNECTED DEVICES & OWNER PERMISSIONS ---
export async function fetchDevicesFromFirestore(): Promise<ConnectedDevice[]> {
  const path = 'devices';
  try {
    const snap = await getDocs(collection(db, path));
    const list: ConnectedDevice[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ConnectedDevice);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveDeviceToFirestore(device: ConnectedDevice): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `devices/${device.id}`;
  try {
    const clean = sanitizeDocument(device);
    await setDoc(doc(db, 'devices', device.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDeviceFromFirestore(deviceId: string): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `devices/${deviceId}`;
  try {
    await deleteDoc(doc(db, 'devices', deviceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToDevice(
  deviceId: string,
  onUpdate: (device: ConnectedDevice | null) => void
): () => void {
  const path = `devices/${deviceId}`;
  try {
    const unsub = onSnapshot(
      doc(db, 'devices', deviceId),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as ConnectedDevice);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return unsub;
  } catch {
    return () => {};
  }
}

export function subscribeToAllDevices(
  onUpdate: (devices: ConnectedDevice[]) => void
): () => void {
  const path = 'devices';
  try {
    const unsub = onSnapshot(
      collection(db, path),
      (snap) => {
        const list: ConnectedDevice[] = [];
        snap.forEach((d) => {
          list.push(d.data() as ConnectedDevice);
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return unsub;
  } catch {
    return () => {};
  }
}

// --- REGISTERED USERS & AUTHENTICATION STATUS ---
export async function fetchUsersFromFirestore(): Promise<AppUser[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const list: AppUser[] = [];
    snap.forEach((d) => {
      const data = d.data() as AppUser;
      list.push({
        ...data,
        id: data.id || d.id,
        status: data.status || 'active',
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getUserFromFirestore(userId: string): Promise<AppUser | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data() as AppUser;
      return {
        ...data,
        id: data.id || snap.id,
        status: data.status || 'active',
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserToFirestore(user: AppUser): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const cleanId = user.id || `USR-${Date.now()}`;
  const path = `users/${cleanId}`;
  try {
    const clean = sanitizeDocument({
      ...user,
      id: cleanId,
      status: user.status || 'active',
    });
    await setDoc(doc(db, 'users', cleanId), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Admin function to toggle a user's status between 'active' and 'blocked'.
 */
export async function toggleUserStatus(
  userId: string,
  currentStatus: UserStatus
): Promise<UserStatus> {
  const nextStatus: UserStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
  await updateUserStatusInFirestore(userId, nextStatus);
  return nextStatus;
}

export async function updateUserStatusInFirestore(
  userId: string,
  status: UserStatus
): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), { status }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUsers(
  onUpdate: (users: AppUser[]) => void
): () => void {
  const path = 'users';
  try {
    const unsub = onSnapshot(
      collection(db, path),
      (snap) => {
        const list: AppUser[] = [];
        snap.forEach((d) => {
          const data = d.data() as AppUser;
          list.push({
            ...data,
            id: data.id || d.id,
            status: data.status || 'active',
          });
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return unsub;
  } catch {
    return () => {};
  }
}

export function subscribeToUser(
  userId: string,
  onUpdate: (user: AppUser | null) => void
): () => void {
  const path = `users/${userId}`;
  try {
    const unsub = onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppUser;
          onUpdate({
            ...data,
            id: data.id || snap.id,
            status: data.status || 'active',
          });
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return unsub;
  } catch {
    return () => {};
  }
}

/**
 * Checks Firestore 'users' collection for the user's status upon login.
 * Resolves to the user if active, or returns { blocked: true, user } if blocked.
 */
export async function checkUserLoginStatusInFirestore(
  identifier: string
): Promise<{ user: AppUser | null; isBlocked: boolean; found: boolean }> {
  try {
    const users = await fetchUsersFromFirestore();
    const cleanId = identifier.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        u.id.toLowerCase() === cleanId ||
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );
    if (!matched) {
      return { user: null, isBlocked: false, found: false };
    }
    const isBlocked = matched.status === 'blocked';
    return { user: matched, isBlocked, found: true };
  } catch {
    return { user: null, isBlocked: false, found: false };
  }
}

/**
 * Seeds initial users into Firestore if collection is empty.
 */
export async function seedInitialUsersIfEmpty(initialUsers: AppUser[]): Promise<AppUser[]> {
  try {
    const existing = await fetchUsersFromFirestore();
    if (existing.length === 0) {
      for (const u of initialUsers) {
        await saveUserToFirestore(u);
      }
      return initialUsers;
    }
    return existing;
  } catch {
    return initialUsers;
  }
}

// --- BATCH SYNC ALL TO FIRESTORE ---
export interface FirestoreBackupPayload {
  orders: RepairOrder[];
  inventory: InventoryItem[];
  transactions: AccountTransaction[];
  profile: ShopProfile;
}

export async function syncAllToFirestore(payload: FirestoreBackupPayload): Promise<{
  success: boolean;
  ordersCount: number;
  inventoryCount: number;
  transactionsCount: number;
  profileSaved: boolean;
  isQuotaExceeded?: boolean;
}> {
  if (isFirestoreQuotaExceeded()) {
    return {
      success: false,
      ordersCount: 0,
      inventoryCount: 0,
      transactionsCount: 0,
      profileSaved: false,
      isQuotaExceeded: true,
    };
  }

  try {
    // Save profile
    await saveProfileToFirestore(payload.profile);
    if (isFirestoreQuotaExceeded()) {
      return {
        success: false,
        ordersCount: 0,
        inventoryCount: 0,
        transactionsCount: 0,
        profileSaved: false,
        isQuotaExceeded: true,
      };
    }

    // Batch write orders (Firestore batches allow up to 500 ops)
    const batchSize = 400;
    for (let i = 0; i < payload.orders.length; i += batchSize) {
      if (isFirestoreQuotaExceeded()) break;
      const batch = writeBatch(db);
      const chunk = payload.orders.slice(i, i + batchSize);
      for (const order of chunk) {
        batch.set(doc(db, 'orders', order.id), sanitizeDocument(order), { merge: true });
      }
      await batch.commit();
    }
    if (isFirestoreQuotaExceeded()) {
      return {
        success: false,
        ordersCount: 0,
        inventoryCount: 0,
        transactionsCount: 0,
        profileSaved: false,
        isQuotaExceeded: true,
      };
    }

    // Batch write inventory
    for (let i = 0; i < payload.inventory.length; i += batchSize) {
      if (isFirestoreQuotaExceeded()) break;
      const batch = writeBatch(db);
      const chunk = payload.inventory.slice(i, i + batchSize);
      for (const item of chunk) {
        batch.set(doc(db, 'inventory', item.id), sanitizeDocument(item), { merge: true });
      }
      await batch.commit();
    }
    if (isFirestoreQuotaExceeded()) {
      return {
        success: false,
        ordersCount: 0,
        inventoryCount: 0,
        transactionsCount: 0,
        profileSaved: false,
        isQuotaExceeded: true,
      };
    }

    // Batch write transactions
    for (let i = 0; i < payload.transactions.length; i += batchSize) {
      if (isFirestoreQuotaExceeded()) break;
      const batch = writeBatch(db);
      const chunk = payload.transactions.slice(i, i + batchSize);
      for (const txn of chunk) {
        batch.set(doc(db, 'transactions', txn.id), sanitizeDocument(txn), { merge: true });
      }
      await batch.commit();
    }

    return {
      success: true,
      ordersCount: payload.orders.length,
      inventoryCount: payload.inventory.length,
      transactionsCount: payload.transactions.length,
      profileSaved: true,
    };
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
      markQuotaExceeded();
      return {
        success: false,
        ordersCount: 0,
        inventoryCount: 0,
        transactionsCount: 0,
        profileSaved: false,
        isQuotaExceeded: true,
      };
    }
    handleFirestoreError(error, OperationType.WRITE, 'batch_sync_all');
    return {
      success: false,
      ordersCount: 0,
      inventoryCount: 0,
      transactionsCount: 0,
      profileSaved: false,
    };
  }
}

// --- FETCH ALL FROM FIRESTORE ---
export async function fetchAllFromFirestore(): Promise<{
  orders: RepairOrder[];
  inventory: InventoryItem[];
  transactions: AccountTransaction[];
  profile: ShopProfile | null;
}> {
  try {
    const [orders, inventory, transactions, profile] = await Promise.all([
      fetchOrdersFromFirestore().catch((err) => {
        console.warn('Orders fetch note:', err);
        return [];
      }),
      fetchInventoryFromFirestore().catch((err) => {
        console.warn('Inventory fetch note:', err);
        return [];
      }),
      fetchTransactionsFromFirestore().catch((err) => {
        console.warn('Transactions fetch note:', err);
        return [];
      }),
      fetchProfileFromFirestore().catch((err) => {
        console.warn('Profile fetch note:', err);
        return null;
      }),
    ]);

    return {
      orders: orders || [],
      inventory: inventory || [],
      transactions: transactions || [],
      profile: profile || null,
    };
  } catch {
    return {
      orders: [],
      inventory: [],
      transactions: [],
      profile: null,
    };
  }
}

// --- REAL-TIME ORDERS LISTENER ---
export function subscribeToOrders(onUpdate: (orders: RepairOrder[]) => void): () => void {
  const path = 'orders';
  try {
    const unsub = onSnapshot(
      collection(db, path),
      (snap) => {
        const list: RepairOrder[] = [];
        snap.forEach((d) => {
          list.push(d.data() as RepairOrder);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return unsub;
  } catch {
    return () => {};
  }
}

// --- GOOGLE OAUTH / GMAIL AUTHENTICATION ---
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function loginWithGoogle(): Promise<{ firebaseUser: FirebaseUser; authUser: AuthUser }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const email = firebaseUser.email || '';
    const displayName = firebaseUser.displayName || email.split('@')[0] || 'Store Owner';

    const authUser: AuthUser = {
      role: 'owner',
      name: displayName,
      email: email,
      uid: firebaseUser.uid,
      photoURL: firebaseUser.photoURL || undefined,
      loginTime: new Date().toISOString(),
      loginMethod: 'google',
    };

    try {
      localStorage.setItem('mh_auth_user', JSON.stringify(authUser));
    } catch {}

    // Record user profile in Firestore 'users' collection
    try {
      await saveUserToFirestore({
        id: firebaseUser.uid,
        name: displayName,
        username: email.split('@')[0],
        email: email,
        passwordHash: '',
        role: 'owner',
        status: 'active',
        phone: firebaseUser.phoneNumber || '',
        avatarColor: '#10b981',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not register Google user to Firestore:', e);
    }

    return { firebaseUser, authUser };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// --- USER ID & PASSWORD AUTHENTICATION ---
export async function loginWithIdAndPassword(identifier: string, passwordInput: string): Promise<AuthUser> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanId) {
    throw new Error('Please enter your User ID, Username, or Email.');
  }
  if (!cleanPass) {
    throw new Error('Please enter your Password.');
  }

  // 1. Check users in Firestore cloud collection
  try {
    const cloudUsers = await fetchUsersFromFirestore();
    const matched = cloudUsers.find(
      (u) =>
        (u.username?.toLowerCase() === cleanId ||
          u.email?.toLowerCase() === cleanId ||
          u.id?.toLowerCase() === cleanId) &&
        u.passwordHash === cleanPass
    );
    if (matched) {
      if (matched.status === 'blocked') {
        throw new Error('This account has been deactivated or blocked by the store owner.');
      }
      const authUser: AuthUser = {
        role: matched.role || 'owner',
        name: matched.name || matched.username,
        email: matched.email,
        uid: matched.id,
        loginTime: new Date().toISOString(),
        loginMethod: 'id_password',
      };
      try {
        localStorage.setItem('mh_auth_user', JSON.stringify(authUser));
      } catch {}
      return authUser;
    }
  } catch (err: any) {
    if (err.message?.includes('deactivated or blocked')) throw err;
  }

  // 2. Check local configured admin / owner credentials
  if (
    (cleanId === 'admin' || cleanId === 'owner' || cleanId === 'mobilehospital633@gmail.com') &&
    (cleanPass === 'admin123' || cleanPass === '1234')
  ) {
    const authUser: AuthUser = {
      role: 'owner',
      name: 'Store Owner',
      email: cleanId.includes('@') ? cleanId : 'mobilehospital633@gmail.com',
      uid: 'USR-OWNER',
      loginTime: new Date().toISOString(),
      loginMethod: 'id_password',
    };
    try {
      localStorage.setItem('mh_auth_user', JSON.stringify(authUser));
    } catch {}
    return authUser;
  }

  // 3. Check staff credentials
  if (
    (cleanId === 'staff' || cleanId === 'alex.tech' || cleanId === 'alex') &&
    (cleanPass === 'tech123' || cleanPass === '0000')
  ) {
    const authUser: AuthUser = {
      role: 'staff',
      name: 'Alex Rivera',
      email: 'alex@mobilehospital.com',
      uid: 'USR-002',
      loginTime: new Date().toISOString(),
      loginMethod: 'id_password',
    };
    try {
      localStorage.setItem('mh_auth_user', JSON.stringify(authUser));
    } catch {}
    return authUser;
  }

  // 4. Check current configured PIN as password for 'owner' or 'staff'
  try {
    const savedProf = localStorage.getItem('mh_profile');
    const p: ShopProfile | null = savedProf ? JSON.parse(savedProf) : null;
    const currentOwnerPin = p?.securityPin || '1234';
    const currentStaffPin = p?.staffPin || '0000';

    if ((cleanId === 'owner' || cleanId === 'admin') && cleanPass === currentOwnerPin) {
      const authUser: AuthUser = {
        role: 'owner',
        name: 'Store Owner',
        uid: 'USR-OWNER',
        loginTime: new Date().toISOString(),
        loginMethod: 'id_password',
      };
      localStorage.setItem('mh_auth_user', JSON.stringify(authUser));
      return authUser;
    }

    if ((cleanId === 'staff' || cleanId === 'counter') && cleanPass === currentStaffPin) {
      const authUser: AuthUser = {
        role: 'staff',
        name: p?.staffName || 'Counter Staff',
        uid: 'USR-STAFF',
        loginTime: new Date().toISOString(),
        loginMethod: 'id_password',
      };
      localStorage.setItem('mh_auth_user', JSON.stringify(authUser));
      return authUser;
    }
  } catch {}

  throw new Error('Invalid User ID, Username, or Password. Demo: ID: admin / Pass: admin123');
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}
  try {
    localStorage.removeItem('mh_auth_user');
  } catch {}
}

// --- SEAMLESS MULTI-DEVICE DATA RECONCILIATION & SYNC ---
export async function syncPreviousDataToCloudAndPull({
  localOrders,
  localInventory,
  localTransactions,
  localProfile,
}: {
  localOrders: RepairOrder[];
  localInventory: InventoryItem[];
  localTransactions: AccountTransaction[];
  localProfile: ShopProfile;
}): Promise<{
  mergedOrders: RepairOrder[];
  mergedInventory: InventoryItem[];
  mergedTransactions: AccountTransaction[];
  mergedProfile: ShopProfile;
  syncedUpCount: number;
  pulledDownCount: number;
}> {
  // 1. Fetch current cloud state from Firestore
  const cloudData = await fetchAllFromFirestore();

  // 2. Reconcile Orders
  const ordersMap = new Map<string, RepairOrder>();
  // First load all cloud orders
  for (const o of cloudData.orders) {
    if (o.id) ordersMap.set(o.id, o);
  }

  let syncedUpCount = 0;
  const ordersToUpload: RepairOrder[] = [];

  // Then check local orders
  for (const lo of localOrders) {
    if (!lo.id) continue;
    if (!ordersMap.has(lo.id)) {
      // Local order does not exist in cloud yet: add to map and upload!
      ordersMap.set(lo.id, lo);
      ordersToUpload.push(lo);
      syncedUpCount++;
    } else {
      // Order exists in both: merge fields (favoring more complete fields)
      const existing = ordersMap.get(lo.id)!;
      const merged: RepairOrder = {
        ...existing,
        ...lo,
        status: existing.status || lo.status,
      };
      ordersMap.set(lo.id, merged);
    }
  }

  // Upload any local orders that weren't in the cloud yet
  if (ordersToUpload.length > 0 && !isFirestoreQuotaExceeded()) {
    try {
      const batchSize = 300;
      for (let i = 0; i < ordersToUpload.length; i += batchSize) {
        const batch = writeBatch(db);
        const slice = ordersToUpload.slice(i, i + batchSize);
        for (const ord of slice) {
          batch.set(doc(db, 'orders', ord.id), sanitizeDocument(ord), { merge: true });
        }
        await batch.commit();
      }
    } catch (e) {
      console.warn('Batch upload of previous orders failed:', e);
    }
  }

  const mergedOrders = Array.from(ordersMap.values());

  // 3. Reconcile Inventory
  const invMap = new Map<string, InventoryItem>();
  for (const item of cloudData.inventory) {
    if (item.id) invMap.set(item.id, item);
  }

  const invToUpload: InventoryItem[] = [];
  for (const li of localInventory) {
    if (!li.id) continue;
    if (!invMap.has(li.id)) {
      invMap.set(li.id, li);
      invToUpload.push(li);
    }
  }

  if (invToUpload.length > 0 && !isFirestoreQuotaExceeded()) {
    try {
      const batchSize = 300;
      for (let i = 0; i < invToUpload.length; i += batchSize) {
        const batch = writeBatch(db);
        const slice = invToUpload.slice(i, i + batchSize);
        for (const item of slice) {
          batch.set(doc(db, 'inventory', item.id), sanitizeDocument(item), { merge: true });
        }
        await batch.commit();
      }
    } catch (e) {
      console.warn('Batch upload of inventory failed:', e);
    }
  }

  const mergedInventory = Array.from(invMap.values());

  // 4. Reconcile Transactions
  const txnMap = new Map<string, AccountTransaction>();
  for (const t of cloudData.transactions) {
    if (t.id) txnMap.set(t.id, t);
  }

  const txnToUpload: AccountTransaction[] = [];
  for (const lt of localTransactions) {
    if (!lt.id) continue;
    if (!txnMap.has(lt.id)) {
      txnMap.set(lt.id, lt);
      txnToUpload.push(lt);
    }
  }

  if (txnToUpload.length > 0 && !isFirestoreQuotaExceeded()) {
    try {
      const batchSize = 300;
      for (let i = 0; i < txnToUpload.length; i += batchSize) {
        const batch = writeBatch(db);
        const slice = txnToUpload.slice(i, i + batchSize);
        for (const t of slice) {
          batch.set(doc(db, 'transactions', t.id), sanitizeDocument(t), { merge: true });
        }
        await batch.commit();
      }
    } catch (e) {
      console.warn('Batch upload of transactions failed:', e);
    }
  }

  const mergedTransactions = Array.from(txnMap.values());

  // 5. Reconcile Profile
  let mergedProfile = localProfile;
  if (cloudData.profile && cloudData.profile.shopName) {
    mergedProfile = {
      ...localProfile,
      ...cloudData.profile,
    };
  } else if (!isFirestoreQuotaExceeded()) {
    try {
      await saveProfileToFirestore(localProfile);
    } catch {}
  }

  const pulledDownCount = cloudData.orders.length;

  return {
    mergedOrders,
    mergedInventory,
    mergedTransactions,
    mergedProfile,
    syncedUpCount,
    pulledDownCount,
  };
}
