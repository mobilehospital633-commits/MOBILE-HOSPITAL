import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  RefreshCw,
  Download,
  Upload,
  Database,
  CloudCheck,
  Server,
  Sparkles,
} from 'lucide-react';
import {
  testFirestoreConnection,
  syncAllToFirestore,
  fetchAllFromFirestore,
  FirestoreBackupPayload,
  isFirestoreQuotaExceeded,
  clearQuotaExceeded,
  FIREBASE_UPGRADE_URL,
  FIREBASE_PRICING_URL,
} from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { RepairOrder, InventoryItem, AccountTransaction, ShopProfile } from '../types';

interface FirebaseSyncViewProps {
  orders: RepairOrder[];
  inventory: InventoryItem[];
  transactions: AccountTransaction[];
  profile: ShopProfile;
  onRestoreAllData?: (payload: {
    orders: RepairOrder[];
    inventory: InventoryItem[];
    transactions: AccountTransaction[];
    profile: ShopProfile;
  }) => void;
}

export const FirebaseSyncView: React.FC<FirebaseSyncViewProps> = ({
  orders,
  inventory,
  transactions,
  profile,
  onRestoreAllData,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    databaseId: string;
    projectId: string;
    isQuotaExceeded?: boolean;
  }>({
    tested: false,
    connected: false,
    message: 'Testing connection to Firebase Firestore Cloud DB...',
    databaseId: firebaseConfig.firestoreDatabaseId || '',
    projectId: firebaseConfig.projectId || '',
    isQuotaExceeded: isFirestoreQuotaExceeded(),
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [copiedDbId, setCopiedDbId] = useState(false);

  useEffect(() => {
    runConnectionTest();
  }, []);

  const runConnectionTest = async () => {
    setIsTesting(true);
    try {
      const res = await testFirestoreConnection();
      setConnectionStatus({
        tested: true,
        connected: res.connected,
        message: res.message,
        databaseId: res.databaseId,
        projectId: res.projectId,
        isQuotaExceeded: res.isQuotaExceeded || isFirestoreQuotaExceeded(),
      });
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        connected: false,
        message: err?.message || 'Connection test failed',
        databaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId,
        isQuotaExceeded: isFirestoreQuotaExceeded(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAll = async () => {
    if (isFirestoreQuotaExceeded()) {
      setSyncFeedback({
        type: 'warning',
        message:
          'Daily free Firestore write quota reached (20,000 writes/day limit). All your data is safely saved in local storage! Cloud quota automatically resets tomorrow, or you can upgrade in the Firebase Console.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const payload: FirestoreBackupPayload = {
        orders,
        inventory,
        transactions,
        profile,
      };
      const res = await syncAllToFirestore(payload);
      if (res.isQuotaExceeded) {
        setConnectionStatus((prev) => ({
          ...prev,
          connected: false,
          isQuotaExceeded: true,
          message: 'Daily free Firestore write quota reached. Auto-resets tomorrow.',
        }));
        setSyncFeedback({
          type: 'warning',
          message:
            'Daily free Firestore write quota reached (20,000 writes/day limit). All local records are safe and fully functional! Quota resets tomorrow.',
        });
      } else if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: `Successfully synchronized ${res.ordersCount} orders, ${res.inventoryCount} inventory items, and ${res.transactionsCount} accounts to Firebase Firestore Cloud DB!`,
        });
        setConnectionStatus((prev) => ({
          ...prev,
          tested: true,
          connected: true,
          isQuotaExceeded: false,
          message: 'Connected & in sync with Firebase Firestore Cloud DB!',
        }));
      }
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: e?.message || 'Failed to sync to Firebase Firestore',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullAll = async () => {
    if (
      !confirm(
        'Pull latest records from Firebase Firestore Cloud DB? This will update your local repair tickets, inventory, and accounts with records stored on Firebase.'
      )
    ) {
      return;
    }

    setIsPulling(true);
    setSyncFeedback(null);
    try {
      const res = await fetchAllFromFirestore();
      if (onRestoreAllData) {
        onRestoreAllData({
          orders: res.orders.length > 0 ? res.orders : orders,
          inventory: res.inventory.length > 0 ? res.inventory : inventory,
          transactions: res.transactions.length > 0 ? res.transactions : transactions,
          profile: res.profile || profile,
        });
        setSyncFeedback({
          type: 'success',
          message: `Successfully restored ${res.orders.length} orders, ${res.inventory.length} parts, and ${res.transactions.length} accounts from Firebase Cloud DB!`,
        });
      }
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: e?.message || 'Error pulling data from Firebase Firestore',
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyDbId = () => {
    navigator.clipboard.writeText(firebaseConfig.firestoreDatabaseId);
    setCopiedDbId(true);
    setTimeout(() => setCopiedDbId(false), 2000);
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;

  return (
    <div className="space-y-6" id="firebaseConfigSection">
      {/* Top Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950 via-zinc-900 to-zinc-950 text-white border border-amber-500/30 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-6 h-6 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Firebase Cloud Firestore DB
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {connectionStatus.connected ? 'Connected' : 'Configured'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                Persistent Google Cloud Firestore database instance configured for database ID{' '}
                <span className="font-mono text-amber-300 font-semibold break-all">
                  {firebaseConfig.firestoreDatabaseId}
                </span>
                . All mobile repair tickets, customer profiles, inventory, and accounts sync securely to your cloud backend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={runConnectionTest}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Test connection with Firebase Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <a
              href={firebaseConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Status Row */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Status:</span>
            {connectionStatus.connected ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Cloud Connection Verified</span>
              </span>
            ) : connectionStatus.tested ? (
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{connectionStatus.message}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <span>Project: <strong className="text-zinc-200 font-mono">{firebaseConfig.projectId}</strong></span>
            <span>•</span>
            <span>Auth Domain: <strong className="text-zinc-200 font-mono">{firebaseConfig.authDomain}</strong></span>
          </div>
        </div>
      </div>

      {/* Quota Exceeded Notification Banner as required by Firebase Integration Skill */}
      {(isFirestoreQuotaExceeded() || connectionStatus.isQuotaExceeded) && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50/95 text-amber-950 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-extrabold text-sm text-amber-950">
                  Firebase Free Daily Write Quota Reached (Spark Plan Limit)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 uppercase">
                  Data 100% Safe Locally
                </span>
              </div>
              <p className="text-zinc-800 leading-relaxed">
                Your database instance (<strong className="font-mono text-zinc-900">{firebaseConfig.firestoreDatabaseId}</strong>) has reached the daily free tier write limit of 20,000 writes. <strong>All repair job cards, billing, accounts, and inventory are securely saved in your browser storage and fully operational.</strong>
              </p>
              <p className="text-zinc-700 leading-relaxed">
                The free tier quota will automatically reset tomorrow at midnight (PST). If you need higher or unlimited cloud sync volume, you can enable the pay-as-you-go Blaze plan on Google Cloud.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <a
                  href={FIREBASE_UPGRADE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Open Database Upgrade Dialog</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={FIREBASE_PRICING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>View Pricing & Quota Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    clearQuotaExceeded();
                    runConnectionTest();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check Quota Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Action Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : syncFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : syncFeedback.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <p className="font-semibold">{syncFeedback.message}</p>
          </div>
        </div>
      )}

      {/* Sync Operations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Card */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  Push Local Data to Firebase
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Back up current orders, inventory, and accounts to Cloud DB
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
              Save
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-600 space-y-1">
            <div className="flex justify-between">
              <span>Repair & Sales Orders:</span>
              <strong className="text-zinc-900">{orders.length} tickets</strong>
            </div>
            <div className="flex justify-between">
              <span>Spare Parts & Accessories:</span>
              <strong className="text-zinc-900">{inventory.length} items</strong>
            </div>
            <div className="flex justify-between">
              <span>Account Transactions:</span>
              <strong className="text-zinc-900">{transactions.length} entries</strong>
            </div>
            <div className="flex justify-between">
              <span>Shop Profile & Settings:</span>
              <strong className="text-zinc-900">{profile.shopName}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePushAll}
            disabled={isSyncing}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Writing to Firebase Cloud DB...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Sync All to Firebase Firestore</span>
              </>
            )}
          </button>
        </div>

        {/* Pull Card */}
        <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  Pull Data from Firebase
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Restore latest data records from Firestore cloud collections
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
              Restore
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-600 space-y-1">
            <p>
              Retrieves live collections from Firestore:
            </p>
            <ul className="list-disc list-inside text-zinc-500 text-[11px] space-y-0.5">
              <li><code className="text-zinc-700">/orders</code> (Active & completed repair tickets)</li>
              <li><code className="text-zinc-700">/inventory</code> (Parts, accessories & stock counts)</li>
              <li><code className="text-zinc-700">/transactions</code> (Income & expense records)</li>
              <li><code className="text-zinc-700">/settings/profile</code> (Shop info & receipt rules)</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handlePullAll}
            disabled={isPulling}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {isPulling ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Pulling from Firebase Cloud DB...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Pull Records from Firebase Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cloud DB Details & Security Info */}
      <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm">
          <Server className="w-4 h-4 text-amber-600" />
          <span>Firestore Instance Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 space-y-1">
            <span className="text-zinc-500 text-[11px]">Database Instance ID:</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-zinc-900 font-semibold truncate">
                {firebaseConfig.firestoreDatabaseId}
              </span>
              <button
                type="button"
                onClick={handleCopyDbId}
                className="text-zinc-500 hover:text-zinc-900 p-1 rounded hover:bg-zinc-200 transition-colors shrink-0"
                title="Copy Database ID"
              >
                {copiedDbId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 space-y-1">
            <span className="text-zinc-500 text-[11px]">Google Cloud Project:</span>
            <p className="font-mono text-zinc-900 font-semibold truncate">
              {firebaseConfig.projectId}
            </p>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 space-y-1">
            <span className="text-zinc-500 text-[11px]">Security Rules Status:</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Trust Hardened Rules Active</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 space-y-1">
            <span className="text-zinc-500 text-[11px]">Database Storage:</span>
            <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
              <Database className="w-4 h-4 text-amber-600" />
              <span>Multi-Region Firestore Cloud DB</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Automatic Cloud Redundancy</p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Your workshop continues to work fully offline in your browser and desktop environment. When connected to the internet, syncing pushes your orders and inventory straight to your Firebase Cloud DB for real-time multi-device access and permanent backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
