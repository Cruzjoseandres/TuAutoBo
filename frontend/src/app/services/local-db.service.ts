import { Injectable } from '@angular/core';
import { Usuario } from '../models';

export interface RegistroSesionLocal {
  id: string;
  token: string;
  usuario: Usuario;
  actualizado_en: string;
}

export interface ContextoCatalogoLocal {
  busqueda: string;
  categoriaId: number | null;
  vehiculoId: number | null;
  moneda: 'BOB' | 'USD';
  scrollY: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocalDbService {
  private readonly DB_NAME = 'TuAutoLocalDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_SESION = 'sesion';
  private readonly STORE_PREFERENCIAS = 'preferencias';
  private readonly STORE_CONTEXTO = 'contexto_navegacion';

  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    this.abrirBaseDatos();
  }

  private abrirBaseDatos(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        resolve(null);
        return;
      }

      try {
        const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.STORE_SESION)) {
            db.createObjectStore(this.STORE_SESION, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(this.STORE_PREFERENCIAS)) {
            db.createObjectStore(this.STORE_PREFERENCIAS, { keyPath: 'clave' });
          }
          if (!db.objectStoreNames.contains(this.STORE_CONTEXTO)) {
            db.createObjectStore(this.STORE_CONTEXTO, { keyPath: 'clave' });
          }
        };

        request.onsuccess = (event) => {
          resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  // ==========================================
  // GESTIÓN DE SESIÓN DE USUARIO (PERSISTENTE)
  // ==========================================

  async guardarSesion(token: string, usuario: Usuario): Promise<void> {
    // 1. Espejo síncrono en localStorage para lectura de 0ms
    try {
      localStorage.setItem('tuauto_token', token);
      localStorage.setItem('tuauto_usuario', JSON.stringify(usuario));
    } catch {
      // Ignorar si almacenamiento síncrono falla
    }

    // 2. Persistencia transaccional en Base de Datos Local IndexedDB
    const db = await this.abrirBaseDatos();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_SESION, 'readwrite');
        const store = tx.objectStore(this.STORE_SESION);
        const registro: RegistroSesionLocal = {
          id: 'sesion_activa',
          token,
          usuario,
          actualizado_en: new Date().toISOString(),
        };
        store.put(registro);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async obtenerSesion(): Promise<{ token: string; usuario: Usuario } | null> {
    // 1. Consultar Base de Datos IndexedDB primero (fuente de verdad duradera en APK)
    const db = await this.abrirBaseDatos();
    if (db) {
      const desdeIdb = await new Promise<{ token: string; usuario: Usuario } | null>((resolve) => {
        try {
          const tx = db.transaction(this.STORE_SESION, 'readonly');
          const store = tx.objectStore(this.STORE_SESION);
          const req = store.get('sesion_activa');
          req.onsuccess = () => {
            const res = req.result as RegistroSesionLocal | undefined;
            if (res && res.token && res.usuario) {
              // Sincronizar hacia localStorage por si el WebView lo había limpiado
              try {
                localStorage.setItem('tuauto_token', res.token);
                localStorage.setItem('tuauto_usuario', JSON.stringify(res.usuario));
              } catch {}
              resolve({ token: res.token, usuario: res.usuario });
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (desdeIdb) return desdeIdb;
    }

    // 2. Fallback desde localStorage (y migrar automáticamente a IndexedDB si existe)
    try {
      const token = localStorage.getItem('tuauto_token');
      const usuarioRaw = localStorage.getItem('tuauto_usuario');
      if (token && usuarioRaw) {
        const usuario = JSON.parse(usuarioRaw) as Usuario;
        void this.guardarSesion(token, usuario);
        return { token, usuario };
      }
    } catch {
      // Ignorar errores de parseo
    }

    return null;
  }

  async limpiarSesion(): Promise<void> {
    try {
      localStorage.removeItem('tuauto_token');
      localStorage.removeItem('tuauto_usuario');
    } catch {}

    const db = await this.abrirBaseDatos();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_SESION, 'readwrite');
        const store = tx.objectStore(this.STORE_SESION);
        store.delete('sesion_activa');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // ==========================================
  // PREFERENCIAS Y CONTEXTO DE NAVEGACIÓN
  // ==========================================

  async guardarPreferencia<T>(clave: string, valor: T): Promise<void> {
    const db = await this.abrirBaseDatos();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_PREFERENCIAS, 'readwrite');
        const store = tx.objectStore(this.STORE_PREFERENCIAS);
        store.put({ clave, valor, actualizado_en: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async obtenerPreferencia<T>(clave: string): Promise<T | null> {
    const db = await this.abrirBaseDatos();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_PREFERENCIAS, 'readonly');
        const store = tx.objectStore(this.STORE_PREFERENCIAS);
        const req = store.get(clave);
        req.onsuccess = () => {
          resolve(req.result ? (req.result.valor as T) : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async guardarContexto<T>(clave: string, valor: T): Promise<void> {
    const db = await this.abrirBaseDatos();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_CONTEXTO, 'readwrite');
        const store = tx.objectStore(this.STORE_CONTEXTO);
        store.put({ clave, valor, actualizado_en: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async obtenerContexto<T>(clave: string): Promise<T | null> {
    const db = await this.abrirBaseDatos();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_CONTEXTO, 'readonly');
        const store = tx.objectStore(this.STORE_CONTEXTO);
        const req = store.get(clave);
        req.onsuccess = () => {
          resolve(req.result ? (req.result.valor as T) : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
}

