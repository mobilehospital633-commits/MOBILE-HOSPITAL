import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  ShieldCheck,
  HardDrive,
  FileJson,
  Calendar,
  Layers,
  Database,
  Users,
  Wrench,
  DollarSign,
  Package,
  ArrowRight,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import {
  googleSignIn,
  googleSignOut,
  initGoogleAuth,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadBackupFromGoogleDrive,
  deleteBackupFromGoogleDrive,
  DriveBackupItem,
  BackupPayload,
} from '../lib/googleDrive';
import { RepairOrder, InventoryItem, AccountTransaction, ShopProfile, AppUser } from '../types';

interface GoogleDriveBackupViewProps {
  orders: RepairOrder[];
  inventory: InventoryItem[];
  transactions: AccountTransaction[];
  profile: ShopProfile;
  users: AppUser[];
  onRestoreAllData: (payload: BackupPayload) => void;
}

export const GoogleDriveBackupView: React.FC<GoogleDriveBackupViewProps> = ({
  orders,
  inventory,
  transactions,
  profile,
  users,
  onRestoreAllData,
}) => {
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [backups, setBackups] = useState<DriveBackupItem[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Destructive Action Confirmation Dialogs
  const [restoreConfirmItem, setRestoreConfirmItem] = useState<DriveBackupItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorePayloadPreview, setRestorePayloadPreview] = useState<BackupPayload | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<DriveBackupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsLoadingAuth(false);
        if (token) {
          fetchBackups();
        }
      },
      () => {
        setGoogleUser(null);
        setIsLoadingAuth(false);
        setBackups([]);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchBackups = async () => {
    setIsLoadingBackups(true);
    setErrorMessage(null);
    try {
      const list = await listGoogleDriveBackups();
      setBackups(list);
    } catch (err: any) {
      console.error('Failed to list backups:', err);
      setErrorMessage(err.message || 'Failed to fetch backups from Google Drive.');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        await fetchBackups();
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMessage(
        err.message ||
          'Google authentication was cancelled or could not be completed.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setBackups([]);
      setBackupSuccessMessage(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handlePerformBackup = async () => {
    setIsBackingUp(true);
    setErrorMessage(null);
    setBackupSuccessMessage(null);

    const payload: BackupPayload = {
      app: 'Mobile Hospital POS & Workshop Management',
      version: '2.4',
      exportedAt: new Date().toISOString(),
      shopName: profile.shopName || profile.name || 'Mobile Hospital',
      orders,
      inventory,
      transactions,
      profile,
      users,
      stats: {
        totalOrders: orders.length,
        totalInventoryItems: inventory.length,
        totalTransactions: transactions.length,
        totalUsers: users.length,
      },
    };

    try {
      const created = await uploadBackupToGoogleDrive(payload);
      setBackupSuccessMessage(
        `Successfully backed up all workshop data to Google Drive (${created.name})!`
      );
      await fetchBackups();
    } catch (err: any) {
      console.error('Backup upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload backup to Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Step 1 of Restore: Download preview and show explicit confirmation modal
  const handleInitiateRestore = async (item: DriveBackupItem) => {
    setRestoreConfirmItem(item);
    setIsLoadingPreview(true);
    setErrorMessage(null);
    try {
      const data = await downloadBackupFromGoogleDrive(item.id);
      setRestorePayloadPreview(data);
    } catch (err: any) {
      console.error('Failed to load backup preview:', err);
      setErrorMessage(err.message || 'Could not download backup file for restore.');
      setRestoreConfirmItem(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Step 2 of Restore: Execute upon user confirmation
  const handleConfirmRestore = () => {
    if (!restorePayloadPreview) return;
    setIsRestoring(true);
    try {
      onRestoreAllData(restorePayloadPreview);
      setBackupSuccessMessage(
        `Data successfully restored from backup (${restoreConfirmItem?.name})!`
      );
      setRestoreConfirmItem(null);
      setRestorePayloadPreview(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to restore application data.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Step 1 of Delete: Prompt explicit confirmation
  const handleInitiateDelete = (item: DriveBackupItem) => {
    setDeleteConfirmItem(item);
  };

  // Step 2 of Delete: Execute upon user confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      await deleteBackupFromGoogleDrive(deleteConfirmItem.id);
      setBackups((prev) => prev.filter((b) => b.id !== deleteConfirmItem.id));
      setDeleteConfirmItem(null);
    } catch (err: any) {
      console.error('Failed to delete backup:', err);
      setErrorMessage(err.message || 'Failed to remove backup from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Offline local download
  const handleDownloadOfflineJSON = () => {
    const payload: BackupPayload = {
      app: 'Mobile Hospital POS & Workshop Management',
      version: '2.4',
      exportedAt: new Date().toISOString(),
      shopName: profile.shopName || profile.name || 'Mobile Hospital',
      orders,
      inventory,
      transactions,
      profile,
      users,
      stats: {
        totalOrders: orders.length,
        totalInventoryItems: inventory.length,
        totalTransactions: transactions.length,
        totalUsers: users.length,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mobile_Hospital_Offline_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="googleDriveBackupSection">
      {/* Feature Intro Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border border-zinc-700 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Cloud className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Free Google Drive Cloud Backup
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Free • Direct to your Drive
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 max-w-xl">
                Safely backup all repair jobs, spare parts inventory, income & expense accounts,
                and shop configuration directly to your personal Google Drive account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadOfflineJSON}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Download an offline JSON file copy to your local computer"
          >
            <FileJson className="w-3.5 h-3.5 text-zinc-400" />
            <span>Save Offline JSON</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Action Required</div>
            <div className="text-rose-700 mt-0.5">{errorMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {backupSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Backup Confirmed</div>
            <div className="text-emerald-800 mt-0.5">{backupSuccessMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setBackupSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Authentication Card */}
      {!googleUser ? (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restricted Google Drive Access</span>
            </div>
            <h4 className="text-base font-bold text-zinc-900">
              Connect your Google Account
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Sign in with your Google account to automatically store and sync your repair shop
              database snapshots. Uses the secure <code>drive.file</code> scope which only permits
              reading and writing backup files created specifically by this application.
            </p>
          </div>

          <div>
            {/* Standard GSI Material Button specification */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg border border-zinc-300 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-4 h-4"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google Drive'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt={googleUser.displayName || 'Google User'}
                className="w-11 h-11 rounded-full border border-zinc-200 shadow-2xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {googleUser.displayName?.[0] || 'G'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">
                  {googleUser.displayName || 'Google Drive User'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Drive Connected
                </span>
              </div>
              <div className="text-xs text-zinc-500 font-mono">{googleUser.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={fetchBackups}
              disabled={isLoadingBackups}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh files in Google Drive"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}

      {/* Backup Payload Action Card */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-700" />
              <span>Current Database Snapshot</span>
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Review what entry records will be packaged into your Google Drive backup.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePerformBackup}
            disabled={isBackingUp || !googleUser}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
              googleUser
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
            }`}
          >
            {isBackingUp ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Uploading to Google Drive...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-emerald-400" />
                <span>Backup All Data to Google Drive</span>
              </>
            )}
          </button>
        </div>

        {/* Live Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Repair Jobs</span>
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-zinc-900">{orders.length}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Active & Finished Orders</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Inventory</span>
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-zinc-900">{inventory.length}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Spare Parts & Components</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Transactions</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-zinc-900">{transactions.length}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Income & Expense Entries</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Staff Accounts</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-zinc-900">{users.length}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Owner & Technicians</div>
          </div>
        </div>
      </div>

      {/* Cloud Backups List in Google Drive */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-700" />
              <span>Backups in your Google Drive</span>
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available snapshots stored in your Google Drive cloud account.
            </p>
          </div>

          {googleUser && (
            <span className="text-xs font-medium text-zinc-500">
              {backups.length} {backups.length === 1 ? 'backup' : 'backups'} found
            </span>
          )}
        </div>

        {!googleUser ? (
          <div className="py-10 text-center text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <Cloud className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-zinc-600">
              Sign in with Google to view existing backups
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Your files remain private in your personal Google Drive storage.
            </p>
          </div>
        ) : isLoadingBackups ? (
          <div className="py-10 text-center text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200">
            <RotateCw className="w-6 h-6 text-zinc-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Scanning your Google Drive for backup files...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-10 text-center text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
            <HardDrive className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-600">No cloud backups found yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Click "Backup All Data to Google Drive" above to create your first cloud snapshot.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
            {backups.map((item) => {
              const formattedDate = item.createdTime
                ? new Date(item.createdTime).toLocaleString()
                : 'Recently';

              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {item.description || 'Mobile Hospital full system backup'}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formattedDate}</span>
                        </span>
                        <span>•</span>
                        <a
                          href={`https://drive.google.com/file/d/${item.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-500 hover:text-zinc-800 flex items-center gap-0.5 underline"
                        >
                          <span>Open in Drive</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInitiateRestore(item)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
                    >
                      <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Restore This</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(item)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete this backup from Google Drive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXPLICIT CONFIRMATION MODAL: RESTORE FROM GOOGLE DRIVE (MANDATORY PER WORKSPACE GUIDELINES) */}
      {restoreConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                Confirm Database Restore from Google Drive
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                You are about to restore all entry data from the selected Google Drive backup file.
                This operation will replace current active repair orders, parts inventory, accounts,
                and shop settings with the snapshot data below.
              </p>
            </div>

            <div className="p-6 bg-zinc-50/70 border-b border-zinc-100 text-xs space-y-3">
              <div className="font-semibold text-zinc-800">
                Backup File: <span className="font-mono text-zinc-900">{restoreConfirmItem.name}</span>
              </div>

              {isLoadingPreview ? (
                <div className="py-4 text-center text-zinc-400 flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-zinc-500" />
                  <span>Loading backup contents preview...</span>
                </div>
              ) : restorePayloadPreview ? (
                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-zinc-200">
                  <div>
                    <span className="text-zinc-500">Shop Name:</span>
                    <div className="font-semibold text-zinc-900">
                      {restorePayloadPreview.shopName || restorePayloadPreview.profile?.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Backup Created:</span>
                    <div className="font-semibold text-zinc-900">
                      {new Date(restorePayloadPreview.exportedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Repair Orders:</span>
                    <div className="font-semibold text-emerald-700">
                      {restorePayloadPreview.orders?.length || 0} jobs
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Inventory Items:</span>
                    <div className="font-semibold text-emerald-700">
                      {restorePayloadPreview.inventory?.length || 0} parts
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Ledger Records:</span>
                    <div className="font-semibold text-emerald-700">
                      {restorePayloadPreview.transactions?.length || 0} entries
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Registered Staff:</span>
                    <div className="font-semibold text-emerald-700">
                      {restorePayloadPreview.users?.length || 0} users
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-rose-600">Failed to inspect backup file.</div>
              )}
            </div>

            <div className="p-4 bg-white flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRestoreConfirmItem(null);
                  setRestorePayloadPreview(null);
                }}
                disabled={isRestoring}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring || !restorePayloadPreview}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-3.5 h-3.5" />
                    <span>Confirm & Restore All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT CONFIRMATION MODAL: DELETE FROM GOOGLE DRIVE (MANDATORY PER WORKSPACE GUIDELINES) */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-6">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                Delete Backup from Google Drive?
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-zinc-800 font-mono">{deleteConfirmItem.name}</strong> from
                your Google Drive storage? This action cannot be undone.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 flex items-center justify-end gap-2.5 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
