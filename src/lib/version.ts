import pkg from '../../package.json';

/**
 * Version actuelle du logiciel Syntropy OS, extraite automatiquement depuis package.json.
 * Sert de source unique de vérité pour l'UI, les notifications et le suivi des mises à jour.
 */
export const APP_VERSION: string = pkg.version || '2.6.25';
export const CURRENT_VERSION: string = APP_VERSION;
