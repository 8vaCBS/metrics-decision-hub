import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: String(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""),
  authDomain: String(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""),
  projectId: String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""),
  storageBucket: String(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""),
  messagingSenderId: String(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""),
  appId: String(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""),
  measurementId: String(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""),
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Analytics & Installations: Solo en cliente y si está soportado
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Analytics initialization failed - likely disabled in console.");
      }
    }
  }).catch(() => {});
}

export interface AnonymousMetricPayload {
  industry: string;
  kpi_name: string;
  kpi_value: number;
}

/**
 * Guarda datos de industria y valores de KPI en la colección anonymous_metrics en Firestore.
 */
export async function uploadAnonymousMetric(payload: AnonymousMetricPayload) {
  try {
    const docRef = await addDoc(collection(db, 'anonymous_metrics'), {
      ...payload,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error uploading anonymous metric to Firestore:', error);
  }
}

/**
 * Recupera benchmarks previos para una industria específica.
 */
export async function getIndustryBenchmarks(industry: string) {
  try {
    // Para simplificar sin filtros complejos de Firestore aún, buscamos en una colección específica
    const { getDocs, query, where } = await import('firebase/firestore');
    const q = query(collection(db, 'market_benchmarks'), where('industry', '==', industry));
    const querySnapshot = await getDocs(q);
    const benchmarks: any[] = [];
    querySnapshot.forEach((doc) => {
      benchmarks.push({ id: doc.id, ...doc.data() });
    });
    return benchmarks;
  } catch (error) {
    console.warn("Error fetching benchmarks:", error);
    return [];
  }
}

/**
 * Persiste un benchmark nuevo encontrado por la IA.
 */
export async function persistBenchmark(industry: string, kpi: string, value: number, source: string) {
  try {
    await addDoc(collection(db, 'market_benchmarks'), {
      industry,
      kpi,
      value,
      source,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error persisting benchmark:", error);
  }
}

export { app, db, analytics };
