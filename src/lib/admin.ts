/**
 * Configuration & Utilitaires d'Administration Syntropy OS
 * Compte administrateur suprême (Root) : ndebeaupuis@gmail.com
 */

export const ROOT_ADMIN_EMAIL = 'ndebeaupuis@gmail.com';

const ADMIN_EMAILS_STORAGE_KEY = 'syntropy_admin_emails_v1';
const AUDIT_LOGS_STORAGE_KEY = 'syntropy_admin_audit_logs_v1';
const SYSTEM_FLAGS_STORAGE_KEY = 'syntropy_system_feature_flags_v1';

export interface AdminPrivilege {
  id: string;
  label: string;
  description: string;
  badge: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  operator: string;
  category: 'auth' | 'database' | 'system' | 'backup';
  details?: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface SystemFeatureFlags {
  maintenanceMode: boolean;
  enableInkNotes: boolean;
  enableLatex: boolean;
  enableDebugLogs: boolean;
  autoSyncDelaySeconds: number;
  readOnlyMode: boolean;
}

export const DEFAULT_SYSTEM_FLAGS: SystemFeatureFlags = {
  maintenanceMode: false,
  enableInkNotes: true,
  enableLatex: true,
  enableDebugLogs: false,
  autoSyncDelaySeconds: 5,
  readOnlyMode: false,
};

export const ADMIN_PRIVILEGES: AdminPrivilege[] = [
  {
    id: 'firestore_super_admin',
    label: 'Contrôle Total Firestore',
    description: 'Accès sans restriction en lecture, écriture et suppression sur toutes les collections de la base de données.',
    badge: 'Base de données',
  },
  {
    id: 'system_diagnostics',
    label: 'Surveillance & Télémétrie',
    description: 'Accès aux métriques système en temps réel, volume des collections et intégrité des données.',
    badge: 'Diagnostics',
  },
  {
    id: 'user_management',
    label: 'Gestion des Accréditations & Rôles',
    description: 'Possibilité d\'accréditer de nouveaux comptes administrateurs ou collaborateurs.',
    badge: 'Sécurité',
  },
  {
    id: 'master_export',
    label: 'Sauvegardes Maîtres & Purges BDD',
    description: 'Instantanés complets, purge sélective de la corbeille et réparation des orphelins.',
    badge: 'Données',
  },
  {
    id: 'feature_flags',
    label: 'Drapeaux de Fonctionnalités (Feature Flags)',
    description: 'Activation et désactivation à la volée des modules expérimentaux ou critiques.',
    badge: 'Système',
  },
  {
    id: 'audit_logs',
    label: 'Journal d\'Audit & Traçabilité',
    description: 'Historique exhaustif et exportable de toutes les opérations sensibles réalisées.',
    badge: 'Audit',
  },
];

/**
 * Récupère la liste complète des adresses e-mails administrateurs
 */
export function getAdminEmails(): string[] {
  if (typeof window === 'undefined') {
    return [ROOT_ADMIN_EMAIL];
  }
  try {
    const raw = localStorage.getItem(ADMIN_EMAILS_STORAGE_KEY);
    if (!raw) {
      return [ROOT_ADMIN_EMAIL];
    }
    const parsed = JSON.parse(raw);
    const list: string[] = Array.isArray(parsed) ? parsed : [];
    if (!list.map((e) => e.toLowerCase()).includes(ROOT_ADMIN_EMAIL.toLowerCase())) {
      list.unshift(ROOT_ADMIN_EMAIL);
    }
    return list;
  } catch {
    return [ROOT_ADMIN_EMAIL];
  }
}

/**
 * Ajoute un nouvel administrateur
 */
export function addAdminEmail(email: string, operatorEmail?: string): boolean {
  if (typeof window === 'undefined') return false;
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) return false;

  const current = getAdminEmails();
  if (current.map((e) => e.toLowerCase()).includes(clean)) {
    return false;
  }

  const updated = [...current, clean];
  localStorage.setItem(ADMIN_EMAILS_STORAGE_KEY, JSON.stringify(updated));
  logAdminAction('Ajout administrateur', `Attribution des droits d'administration à ${clean}`, operatorEmail, 'auth', 'success');
  return true;
}

/**
 * Révoque un administrateur (impossible pour le root)
 */
export function removeAdminEmail(email: string, operatorEmail?: string): boolean {
  if (typeof window === 'undefined') return false;
  const clean = email.trim().toLowerCase();
  if (clean === ROOT_ADMIN_EMAIL.toLowerCase()) {
    return false; // Le Super-Admin Root ne peut pas être révoqué
  }

  const current = getAdminEmails();
  const updated = current.filter((e) => e.toLowerCase() !== clean);
  localStorage.setItem(ADMIN_EMAILS_STORAGE_KEY, JSON.stringify(updated));
  logAdminAction('Révocation administrateur', `Révocation des droits d'administration pour ${clean}`, operatorEmail, 'auth', 'warning');
  return true;
}

/**
 * Vérifie si une adresse e-mail correspond à un compte administrateur du site.
 */
export function isSiteAdmin(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const admins = getAdminEmails();
  return admins.some((adminEmail) => adminEmail.toLowerCase() === cleanEmail);
}

/**
 * Détermine le rôle système de l'utilisateur ('admin' ou 'user').
 */
export function getUserRole(email?: string | null): 'admin' | 'user' {
  return isSiteAdmin(email) ? 'admin' : 'user';
}

/**
 * Journalise une action administrative dans le journal d'audit
 */
export function logAdminAction(
  action: string,
  details?: string,
  operatorEmail?: string,
  category: AdminAuditLog['category'] = 'system',
  status: AdminAuditLog['status'] = 'success'
): void {
  if (typeof window === 'undefined') return;
  try {
    const log: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      operator: operatorEmail || 'Système',
      category,
      details,
      status,
    };

    const currentLogs = getAdminAuditLogs();
    const updatedLogs = [log, ...currentLogs].slice(0, 100); // Garde les 100 derniers
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Erreur journalisation audit:', e);
  }
}

/**
 * Récupère l'historique des journaux d'audit
 */
export function getAdminAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Efface le journal d'audit
 */
export function clearAdminAuditLogs(operatorEmail?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
  logAdminAction('Purge journal audit', 'Historique des logs réinitialisé', operatorEmail, 'system', 'warning');
}

/**
 * Récupère les drapeaux système
 */
export function getSystemFeatureFlags(): SystemFeatureFlags {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_FLAGS;
  try {
    const raw = localStorage.getItem(SYSTEM_FLAGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SYSTEM_FLAGS;
    return { ...DEFAULT_SYSTEM_FLAGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SYSTEM_FLAGS;
  }
}

/**
 * Met à jour un drapeau système
 */
export function updateSystemFeatureFlag<K extends keyof SystemFeatureFlags>(
  key: K,
  value: SystemFeatureFlags[K],
  operatorEmail?: string
): SystemFeatureFlags {
  const current = getSystemFeatureFlags();
  const updated = { ...current, [key]: value };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SYSTEM_FLAGS_STORAGE_KEY, JSON.stringify(updated));
    logAdminAction('Modification drapeau système', `${key} = ${JSON.stringify(value)}`, operatorEmail, 'system', 'info');
  }
  return updated;
}

export interface ConnectedUserAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  lastLoginAt: string;
  provider: string; // 'google.com' | 'password' | 'anonymous'
  role: 'super_admin' | 'admin' | 'user';
  createdAt?: string;
  loginCount?: number;
}

const CONNECTED_USERS_KEY = 'syntropy_all_connected_users_v2';

export function getLocalConnectedUsers(): ConnectedUserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONNECTED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalConnectedUser(user: ConnectedUserAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalConnectedUsers();
    const idx = existing.findIndex(
      (u) =>
        u.uid === user.uid ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    if (idx >= 0) {
      existing[idx] = {
        ...existing[idx],
        ...user,
        loginCount: (existing[idx].loginCount || 1) + 1,
      };
    } else {
      existing.unshift({ ...user, loginCount: 1 });
    }
    localStorage.setItem(CONNECTED_USERS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Erreur sauvegarde utilisateur connecté :', e);
  }
}
