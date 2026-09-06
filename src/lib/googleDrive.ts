import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { RepairOrder, InventoryItem, AccountTransaction, ShopProfile, AppUser } from '../types';

// OAuth scopes configured for Google Drive backup
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Initialize Firebase App instance safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Force prompt to ensure consent screen if needed
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token strictly in memory as required by security guidelines
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveBackupItem {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime?: string;
  size?: string;
  description?: string;
}

export interface BackupPayload {
  app: 'Mobile Hospital POS & Workshop Management';
  version: string;
  exportedAt: string;
  shopName: string;
  orders: RepairOrder[];
  inventory: InventoryItem[];
  transactions: AccountTransaction[];
  profile: ShopProfile;
  users: AppUser[];
  stats: {
    totalOrders: number;
    totalInventoryItems: number;
    totalTransactions: number;
    totalUsers: number;
  };
}

/**
 * Initialize Firebase Auth listener to keep track of user and in-memory token
 */
export const initGoogleAuth = (
  onSuccess?: (user: User, token: string | null) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
};

/**
 * Prompt Google Sign-In with Google Drive scope
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('No access token returned from Google authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Upload full backup payload to Google Drive using multipart upload
 */
export const uploadBackupToGoogleDrive = async (
  payload: BackupPayload
): Promise<DriveBackupItem> => {
  let token = cachedAccessToken;
  if (!token) {
    // Attempt sign in if not currently authenticated
    const signResult = await googleSignIn();
    if (!signResult?.accessToken) {
      throw new Error('Google Drive authorization required.');
    }
    token = signResult.accessToken;
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `Mobile_Hospital_Backup_${dateStr}.json`;
  const fileContent = JSON.stringify(payload, null, 2);

  const metadata = {
    name: fileName,
    description: `Mobile Hospital Workshop Backup • ${payload.stats.totalOrders} orders, ${payload.stats.totalInventoryItems} parts • Created ${new Date().toLocaleString()}`,
    mimeType: 'application/json',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Drive session expired. Please sign in again.');
    }
    throw new Error(`Google Drive Upload Failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    createdTime: new Date().toISOString(),
    description: metadata.description,
  };
};

/**
 * List existing backup files in Google Drive created with this app
 */
export const listGoogleDriveBackups = async (): Promise<DriveBackupItem[]> => {
  let token = cachedAccessToken;
  if (!token) {
    return [];
  }

  const q = encodeURIComponent(
    "name contains 'Mobile_Hospital_Backup' and trashed = false"
  );
  const fields = encodeURIComponent('files(id, name, createdTime, modifiedTime, size, description)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=createdTime desc&pageSize=20`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Drive session expired. Please reconnect.');
    }
    const errText = await response.text();
    throw new Error(`Failed to list Google Drive files: ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Download and parse a specific backup file content from Google Drive
 */
export const downloadBackupFromGoogleDrive = async (
  fileId: string
): Promise<BackupPayload> => {
  let token = cachedAccessToken;
  if (!token) {
    const signResult = await googleSignIn();
    if (!signResult?.accessToken) {
      throw new Error('Google Drive authorization required.');
    }
    token = signResult.accessToken;
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Drive session expired. Please reconnect.');
    }
    throw new Error(`Failed to fetch backup file from Drive (${response.status})`);
  }

  const json = await response.json();
  return json as BackupPayload;
};

/**
 * Delete a specific backup file from Google Drive
 * (Must only be called AFTER explicit user confirmation!)
 */
export const deleteBackupFromGoogleDrive = async (fileId: string): Promise<void> => {
  let token = cachedAccessToken;
  if (!token) {
    const signResult = await googleSignIn();
    if (!signResult?.accessToken) {
      throw new Error('Google Drive authorization required.');
    }
    token = signResult.accessToken;
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Drive session expired. Please reconnect.');
    }
    throw new Error(`Failed to delete file from Google Drive (${response.status})`);
  }
};
