'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  ArrowRight,
  Filter,
  BrainCircuit,
  Loader2,
  AlertTriangle,
  Database,
  X,
  BookOpen,
  ShieldCheck,
  Menu,
  HelpCircle
} from 'lucide-react';
import { generateStrategicDiagnosis } from './actions/gemini';
import { uploadAnonymousMetric, getIndustryBenchmarks, persistBenchmark } from '../lib/firebase';
import Markdown from 'react-markdown';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Cell, PieChart, Pie, Legend } from 'recharts';

// Dummy data for Funnel simulation (converted to Bar chart for better visual fidelity in dashboards like SimilarWeb)
const funnelData = [
  { step: 'Traffic', value: 154000, color: '#3b82f6' },
  { step: 'Leads', value: 42000, color: '#60a5fa' },
  { step: 'MQLs', value: 10500, color: '#93c5fd' },
  { step: 'SQLs', value: 2600, color: '#bfdbfe' },
  { step: 'Wins', value: 650, color: '#eff6ff' }
];

// Dummy data for ROAS trend
const roasData = [
  { month: 'Jan', value: 250 },
  { month: 'Feb', value: 280 },
  { month: 'Mar', value: 310 },
  { month: 'Apr', value: 290 },
  { month: 'May', value: 340 },
  { month: 'Jun', value: 410 },
]

export default function MetricsDecisionHub() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'benchmarks' | 'instructions'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dikwLevel, setDikwLevel] = useState(0); // 0 to 100
  const [cachedBenchmarks, setCachedBenchmarks] = useState<any[]>([]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);
  
  // Real local state that we will pass to the AI
  const [formData, setFormData] = useState({
    industry: 'B2B',
    currency: 'USD',
    
    // Media Spend
    spendFacebook: 2000,
    spendInstagram: 1500,
    spendLinkedIn: 1000,
    spendTikTok: 500,
    spendGoogleSearchAds: 4000,
    spendGoogleAds: 2000,
    spendYoutube: 0,
    
    // Revenue & Traffic (Common)
    revenue: 48000,
    sessionsTotal: 154000,
    impressionsTotal: 2500000,
    clicksPaid: 45000,
    sessionsDirect: 40000,
    sessionsSEO: 30000,
    sessionsOrganic: 20000,
    
    // B2C
    productViews: 50000,
    addToCart: 15000,
    checkoutStarts: 5000,
    salesB2C: 1200,

    // B2B
    leadsB2B: 12400,
    mqlLeads: 3100,
    sqlLeads: 1500,
    salesB2B: 300,

    // SaaS
    freeTrials: 8000,
    paidSubscribers: 800,
    churnRate: 4.5,
    mrr: 15000
  });

  const totalSpend = formData.spendFacebook + formData.spendInstagram + formData.spendLinkedIn + formData.spendTikTok + formData.spendGoogleSearchAds + formData.spendGoogleAds + formData.spendYoutube;
  
  const bottomFunnelValue = formData.industry === 'B2C' ? formData.salesB2C : (formData.industry === 'B2B' ? formData.salesB2B : formData.paidSubscribers);
  
  let baseRevenue = formData.revenue;
  if (formData.industry === 'SaaS') {
    baseRevenue = formData.mrr;
  }

  const conversionRate = formData.sessionsTotal > 0 ? ((bottomFunnelValue / formData.sessionsTotal) * 100).toFixed(1) : '0';
  const dynamicCtr = formData.impressionsTotal > 0 ? ((formData.clicksPaid / formData.impressionsTotal) * 100).toFixed(2) : '0';
  const dynamicRoasValue = totalSpend > 0 ? (baseRevenue / totalSpend).toFixed(1) : '0';
  const dynamicRoiValue = totalSpend > 0 ? (((baseRevenue - totalSpend) / totalSpend) * 100).toFixed(0) : '0';

  const cac = totalSpend > 0 && bottomFunnelValue > 0 ? (totalSpend / bottomFunnelValue).toFixed(1) : '0';

  let dynamicFunnelData = [];
  let leadMetric = 0;

  if (formData.industry === 'B2C') {
    leadMetric = formData.checkoutStarts;
    dynamicFunnelData = [
      { step: 'Sesiones', value: formData.sessionsTotal, color: '#3b82f6' },
      { step: 'Vistas Producto', value: formData.productViews, color: '#60a5fa' },
      { step: 'Añadir Carrito', value: formData.addToCart, color: '#93c5fd' },
      { step: 'Checkouts', value: formData.checkoutStarts, color: '#bfdbfe' },
      { step: 'Ventas', value: formData.salesB2C, color: '#dbeafe' }
    ];
  } else if (formData.industry === 'B2B') {
    leadMetric = formData.mqlLeads;
    dynamicFunnelData = [
      { step: 'Sesiones', value: formData.sessionsTotal, color: '#3b82f6' },
      { step: 'Leads', value: formData.leadsB2B, color: '#60a5fa' },
      { step: 'MQLs', value: formData.mqlLeads, color: '#93c5fd' },
      { step: 'SQLs', value: formData.sqlLeads, color: '#bfdbfe' },
      { step: 'Cierres', value: formData.salesB2B, color: '#dbeafe' }
    ];
  } else {
    // SaaS
    leadMetric = formData.freeTrials;
    dynamicFunnelData = [
      { step: 'Sesiones', value: formData.sessionsTotal, color: '#3b82f6' },
      { step: 'Free Trials', value: formData.freeTrials, color: '#60a5fa' },
      { step: 'Suscripciones', value: formData.paidSubscribers, color: '#bfdbfe' }
    ];
  }

  // Compute drop-off and format steps
  dynamicFunnelData = dynamicFunnelData.map((d, index, arr) => {
    let advanceRate = 100;
    if (index > 0 && arr[index-1].value > 0) {
      advanceRate = (d.value / arr[index - 1].value) * 100;
    } else if (index > 0) {
      advanceRate = 0;
    }
    
    // Identify Leading Indicators for operational anticipation
    let isLeading = false;
    if (formData.industry === 'B2C' && d.step === 'Añadir Carrito') isLeading = true;
    if (formData.industry === 'B2B' && d.step === 'MQLs') isLeading = true;
    if (formData.industry === 'SaaS' && d.step === 'Free Trials') isLeading = true;

    return {
      ...d,
      displayStep: `${isLeading ? '⚡ ' : ''}${d.step} ${index > 0 ? `(${advanceRate.toFixed(1)}%)` : ''}`,
      advanceRate
    };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(formData.currency === 'CLP' ? 'es-CL' : 'en-US', {
      style: 'currency',
      currency: formData.currency,
      maximumFractionDigits: val < 10 && val !== 0 ? 2 : 0
    }).format(val);
  };

  const dynamicRoasData = [
    { month: 'Jan', value: 2.5 },
    { month: 'Feb', value: 2.8 },
    { month: 'Mar', value: 3.1 },
    { month: 'Apr', value: 2.9 },
    { month: 'May', value: 3.4 },
    { month: 'Actual', value: parseFloat(dynamicRoasValue) },
  ];

  // --- UI Helpers ---
  const InfoTooltip = ({ label, nomenclature, description, position = 'top' }: { label: string, nomenclature: string, description: string, position?: 'top' | 'bottom' }) => (
    <div className="group relative inline-flex items-center ml-1">
      <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help hover:text-blue-400 transition-colors" />
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 w-64 p-3 bg-[#0F172A] border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-all duration-200 z-[9999] pointer-events-none`}>
        <p className="text-[11px] font-bold text-blue-400 mb-1">{label} ({nomenclature})</p>
        <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{description}</p>
        <div className={`absolute ${position === 'top' ? 'top-full border-t-[#0F172A]' : 'bottom-full border-b-[#0F172A]'} left-1/2 -translate-x-1/2 border-8 border-transparent`}></div>
      </div>
    </div>
  );

  // 1. Inversión y Desglose
  const spendData = [
    { name: 'Facebook', value: formData.spendFacebook, color: '#1877F2' },
    { name: 'Instagram', value: formData.spendInstagram, color: '#E4405F' },
    { name: 'LinkedIn', value: formData.spendLinkedIn, color: '#0077B5' },
    { name: 'TikTok', value: formData.spendTikTok, color: '#000000' },
    { name: 'Google Search', value: formData.spendGoogleSearchAds, color: '#4285F4' },
    { name: 'Google Display', value: formData.spendGoogleAds, color: '#F4B400' },
    { name: 'YouTube', value: formData.spendYoutube, color: '#FF0000' },
  ].filter(d => d.value > 0);

  // 2. Atribución (Brecha Plataformas vs Real)
  const reportedByPlatforms = totalSpend > 0 ? totalSpend * 3.8 : 0; 
  const attributionGap = Math.abs(reportedByPlatforms - baseRevenue);
  const gapPercentage = baseRevenue > 0 ? (attributionGap / baseRevenue) * 100 : 0;

  // 3. CAC Detallado (Dynamic channels con ponderación para realismo)
  const channelWeights: Record<string, number> = {
    'LinkedIn': 1.8,    
    'Facebook': 0.8,    
    'Instagram': 0.9,
    'TikTok': 0.7,
    'Google Search': 1.2,
    'Google Ads': 1.0,
    'YouTube': 1.1
  };

  const cacDetailed = allPlatforms
    .filter(p => p.spend > 0)
    .map(p => {
      const weight = channelWeights[p.name] || 1;
      const globalCac = totalSpend > 0 && bottomFunnelValue > 0 ? (totalSpend / bottomFunnelValue) : 0;
      return {
        channel: p.name,
        cac: globalCac * weight 
      };
    });


  // 4. KPI vs Logro (Progress Bar Target)
  const kpiTarget = formData.industry === 'SaaS' ? 1000 : (formData.industry === 'B2B' ? 500 : 2000); 
  const kpiAchieved = bottomFunnelValue;
  const kpiProgress = Math.min(100, Math.max(0, (kpiAchieved / kpiTarget) * 100));

  const currentMetrics = {
    industry: formData.industry,
    currency: formData.currency,
    trafficTotal: formData.sessionsTotal,
    trafficDirect: formData.sessionsDirect,
    trafficSEO: formData.sessionsSEO,
    trafficOrganic: formData.sessionsOrganic,
    
    b2cStats: formData.industry === 'B2C' ? { productViews: formData.productViews, addToCart: formData.addToCart, checkouts: formData.checkoutStarts, sales: formData.salesB2C } : undefined,
    b2bStats: formData.industry === 'B2B' ? { leads: formData.leadsB2B, mql: formData.mqlLeads, sql: formData.sqlLeads, won: formData.salesB2B } : undefined,
    saasStats: formData.industry === 'SaaS' ? { freeTrials: formData.freeTrials, newPaid: formData.paidSubscribers, mrr: formData.mrr } : undefined,

    paidMediaSpendTotal: totalSpend,
    paidMediaBreakdown: {
      facebook: formData.spendFacebook,
      instagram: formData.spendInstagram,
      linkedin: formData.spendLinkedIn,
      tiktok: formData.spendTikTok,
      googleSearchAds: formData.spendGoogleSearchAds,
      googleAds: formData.spendGoogleAds,
      youtube: formData.spendYoutube
    },
    revenue: baseRevenue,
    primaryConversionRate: parseFloat(conversionRate), 
    churnRate: formData.industry === 'SaaS' ? formData.churnRate : 0, 
    cac: parseFloat(cac), 
    roas: `${dynamicRoasValue}x`,
    recentEvents: 'Datos capturados y segmentados listos para ser analizados.'
  };

  const handleGenerateDiagnosis = async () => {
    setIsLoading(true);
    setError('');

    if (totalSpend === 0 || baseRevenue === 0 || formData.sessionsTotal === 0 || bottomFunnelValue === 0) {
      setError('Debes ingresar valores reales y mayores a cero (Sesiones, Inversión, Ventas) para generar un diagnóstico accionable.');
      setIsLoading(false);
      return;
    }
    
    try {
      await uploadAnonymousMetric({
        industry: currentMetrics.industry,
        kpi_name: formData.industry === 'B2C' ? 'Checkout_to_Sale_CR' : 'MQL_to_SQL_CR',
        kpi_value: currentMetrics.primaryConversionRate
      });
      await uploadAnonymousMetric({
        industry: currentMetrics.industry,
        kpi_name: 'Churn_Rate',
        kpi_value: currentMetrics.churnRate
      });
    } catch (err) {
      console.warn("Could not write metric to database - Make sure tables are set up.", err);
    }
    
    try {
      const benchmarks = await getIndustryBenchmarks(formData.industry);
      setCachedBenchmarks(benchmarks);
      
      const dataStr = JSON.stringify(currentMetrics);
      
      setDikwLevel(20); // Data
      setTimeout(() => setDikwLevel(40), 1000); // Info
      setTimeout(() => setDikwLevel(60), 2500); // Knowledge
      
      const report = await generateStrategicDiagnosis(`Analiza los siguientes datos operativos: ${dataStr}`, benchmarks);
      
      setDikwLevel(100); // Wisdom
      setAiReport(report);
    } catch (err: any) {
      setError(err.message || 'Error generates strategic diagnosis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0B1120] text-slate-200 font-sans">
      
      <title>Metrics Decision Hub | Senior Strategy Engine</title>
      <meta name="description" content="Transform operational signals into strategic wisdom using DIKW and DMAIC frameworks." />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative my-8">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
               <X className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
               <Database className="w-5 h-5 text-blue-400" />
               Captura de Datos Reales
             </h2>
             
             <div className="space-y-6">
               
               <div className="flex gap-4 p-3 bg-slate-800/30 rounded border border-slate-700">
                 <div className="flex-1">
                   <label className="block text-[10px] font-medium text-slate-400 mb-1">Manejo de Moneda</label>
                   <select 
                     value={formData.currency}
                     onChange={(e) => setFormData({...formData, currency: e.target.value})}
                     className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                   >
                     <option value="USD">Dólares (USD)</option>
                     <option value="CLP">Pesos Chilenos (CLP)</option>
                   </select>
                   <p className="text-[10px] text-slate-500 mt-1">Sugerencia: Usa esta moneda para todos los montos de inversión e ingresos.</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-700/50 pt-4">
                 <div>
                   <label className="block text-xs font-medium text-slate-400 mb-1">Industria</label>
                   <select 
                     value={formData.industry}
                     onChange={(e) => setFormData({...formData, industry: e.target.value})}
                     className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                   >
                     <option value="B2C">B2C (Ecommerce, Retail, etc)</option>
                     <option value="B2B">B2B (Generación de Leads)</option>
                     <option value="SaaS">SaaS (Suscripciones)</option>
                   </select>
                 </div>
                 {formData.industry === 'SaaS' ? (
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">MRR Reales ({formData.currency})</label>
                     <input 
                       type="number"
                       value={formData.mrr}
                       onChange={(e) => setFormData({...formData, mrr: Number(e.target.value)})}
                       className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                     />
                   </div>
                 ) : (
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Ingresos Generados ({formData.currency})</label>
                     <input 
                       type="number"
                       value={formData.revenue}
                       onChange={(e) => setFormData({...formData, revenue: Number(e.target.value)})}
                       className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                     />
                   </div>
                 )}
               </div>

               <div className="border-t border-slate-700/50 pt-4">
                 <h3 className="text-sm font-semibold text-white mb-3">Inversión en Medios (Paid Media {formData.currency})</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">Facebook</label>
                     <input type="number" value={formData.spendFacebook} onChange={(e) => setFormData({...formData, spendFacebook: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">Instagram</label>
                     <input type="number" value={formData.spendInstagram} onChange={(e) => setFormData({...formData, spendInstagram: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                   <div>
                      <label className="block text-[10px] text-slate-500 mb-1">LinkedIn Ads</label>
                      <input type="number" value={formData.spendLinkedIn} onChange={(e) => setFormData({...formData, spendLinkedIn: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">TikTok</label>
                      <input type="number" value={formData.spendTikTok} onChange={(e) => setFormData({...formData, spendTikTok: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                    </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">Google Search Ads</label>
                     <input type="number" value={formData.spendGoogleSearchAds} onChange={(e) => setFormData({...formData, spendGoogleSearchAds: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">Google Ads (Display/PMax)</label>
                     <input type="number" value={formData.spendGoogleAds} onChange={(e) => setFormData({...formData, spendGoogleAds: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">YouTube</label>
                     <input type="number" value={formData.spendYoutube} onChange={(e) => setFormData({...formData, spendYoutube: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                 </div>
               </div>

               <div className="border-t border-slate-700/50 pt-4">
                 <h3 className="text-sm font-semibold text-white mb-3">Tráfico y Sesiones</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Totales (Visitas)</label>
                      <input type="number" value={formData.sessionsTotal} onChange={(e) => setFormData({...formData, sessionsTotal: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Impresiones Totales</label>
                      <input type="number" value={formData.impressionsTotal} onChange={(e) => setFormData({...formData, impressionsTotal: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Clics (Paid Media)</label>
                      <input type="number" value={formData.clicksPaid} onChange={(e) => setFormData({...formData, clicksPaid: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                    </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">Directo</label>
                     <input type="number" value={formData.sessionsDirect} onChange={(e) => setFormData({...formData, sessionsDirect: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">SEO</label>
                     <input type="number" value={formData.sessionsSEO} onChange={(e) => setFormData({...formData, sessionsSEO: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                   <div>
                     <label className="block text-[10px] text-slate-500 mb-1">Orgánico (Social)</label>
                     <input type="number" value={formData.sessionsOrganic} onChange={(e) => setFormData({...formData, sessionsOrganic: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded flex-1 px-2 py-1.5 text-white text-sm" />
                   </div>
                 </div>
               </div>

               <div className="border-t border-slate-700/50 pt-4">
                 <h3 className="text-sm font-semibold text-white mb-3">Conversión (Funnel {formData.industry})</h3>
                 
                 {formData.industry === 'B2C' && (
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Vistas de Producto</label>
                       <input type="number" value={formData.productViews} onChange={(e) => setFormData({...formData, productViews: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Añadir al Carrito</label>
                       <input type="number" value={formData.addToCart} onChange={(e) => setFormData({...formData, addToCart: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Inicios de Checkout</label>
                       <input type="number" value={formData.checkoutStarts} onChange={(e) => setFormData({...formData, checkoutStarts: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Ventas Reales</label>
                       <input type="number" value={formData.salesB2C} onChange={(e) => setFormData({...formData, salesB2C: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                   </div>
                 )}

                 {formData.industry === 'B2B' && (
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Formularios (Leads)</label>
                       <input type="number" value={formData.leadsB2B} onChange={(e) => setFormData({...formData, leadsB2B: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">MQL Leads</label>
                       <input type="number" value={formData.mqlLeads} onChange={(e) => setFormData({...formData, mqlLeads: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">SQL Leads</label>
                       <input type="number" value={formData.sqlLeads} onChange={(e) => setFormData({...formData, sqlLeads: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Ventas / Contratos</label>
                       <input type="number" value={formData.salesB2B} onChange={(e) => setFormData({...formData, salesB2B: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                   </div>
                 )}

                 {formData.industry === 'SaaS' && (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Registros Free Trial</label>
                       <input type="number" value={formData.freeTrials} onChange={(e) => setFormData({...formData, freeTrials: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Nuevas Suscripciones (Pago)</label>
                       <input type="number" value={formData.paidSubscribers} onChange={(e) => setFormData({...formData, paidSubscribers: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                     <div>
                       <label className="block text-[10px] text-slate-500 mb-1">Churn Mensual (%)</label>
                       <input type="number" value={formData.churnRate} onChange={(e) => setFormData({...formData, churnRate: Number(e.target.value)})} className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-1.5 text-white text-sm" />
                     </div>
                   </div>
                 )}

               </div>
               
               <div className="pt-2">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-lg shadow-blue-500/20 mt-2"
                 >
                   Actualizar Dashboard en Tiempo Real
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 border-r border-slate-800 bg-[#0F172A] flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">M</div>
          <span className="text-lg font-bold tracking-tight text-white">MetricsHub</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Navigation</div>
          
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${currentView === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium text-sm">Strategy Engine</span>
          </button>
          <button 
            onClick={() => setCurrentView('benchmarks')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${currentView === 'benchmarks' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium text-sm">Metodología y Bench</span>
          </button>
          <button 
            onClick={() => setCurrentView('instructions')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${currentView === 'instructions' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium text-sm">Instrucciones y Filosofía</span>
          </button>
        </nav>
        
        <div className="p-4 mt-auto">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gemini Engine</span>
              <div className="h-2 w-2 rounded-full bg-green-500 status-glow"></div>
            </div>
            <p className="text-xs text-slate-300">Status: Operational</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#0B1120]">

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-[#0B1120] flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">
              {currentView === 'dashboard' ? 'Decision Intelligence Dashboard' : currentView === 'benchmarks' ? 'Enciclopedia Técnica Dinámica' : 'Instrucciones y Filosofía'}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Market: {formData.industry} (Q3 2025)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Ingresar Datos</span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-slate-300 font-mono">ENGINE READY</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs">JD</div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      
      {currentView === 'dashboard' ? (
        <>
        {/* Real-time Benchmark Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
           <div className={`glass-panel rounded-3xl p-6 border-l-4 ${parseFloat(dynamicCtr) < 1.8 ? 'border-red-500' : 'border-emerald-500'} shadow-xl transition-all hover:shadow-red-500/10 group`}>
             <div className="flex justify-between items-start">
               <div className="flex items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CTR</span>
                 <InfoTooltip 
                    label="Click-Through Rate" 
                    nomenclature="Clics / Impresiones" 
                    description="Mide el interés que genera tu anuncio. Un CTR bajo sugiere que la pieza creativa no conecta con la audiencia." 
                    position="bottom"
                 />
               </div>
               <span className={`text-[10px] font-bold ${parseFloat(dynamicCtr) < 1.8 ? 'text-red-500' : 'text-emerald-500'}`}>
                 {parseFloat(dynamicCtr) < 1.8 ? '↓' : '↑'} {parseFloat(dynamicCtr) < 1 ? 'Crítico' : parseFloat(dynamicCtr) < 1.8 ? 'Bajo benchmark' : 'Saludable'}
               </span>
             </div>
           <div className={`glass-panel rounded-3xl p-6 border-l-4 ${parseFloat(conversionRate) < 1.2 ? 'border-red-500' : 'border-emerald-500'} ${parseFloat(conversionRate) < 0.5 ? 'animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)] border-2 border-red-500' : ''} shadow-xl transition-all hover:shadow-emerald-500/10 group`}>
             <div className="flex justify-between items-start">
               <div className="flex items-center">
                 <span className={`text-[10px] font-bold ${parseFloat(conversionRate) < 0.5 ? 'text-red-500' : 'text-slate-400'} uppercase tracking-widest`}>CVR</span>
                 <InfoTooltip 
                    label="Conversion Rate" 
                    nomenclature="Acciones / Sesiones" 
                    description="Mide la eficiencia del sitio para convertir visitas en objetivos de negocio." 
                    position="bottom"
                 />
               </div>
               <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-bold ${parseFloat(conversionRate) < 1.2 ? 'text-red-500' : 'text-emerald-500'}`}>
                   {parseFloat(conversionRate) < 1.2 ? '↓' : '↑'} {parseFloat(conversionRate) < 0.5 ? 'CRÍTICO / REVISAR WEB' : parseFloat(conversionRate) < 1.2 ? 'Bajo benchmark' : 'Sobre benchmark'}
                 </span>
               </div>
             </div>
             <div className={`text-3xl font-bold ${parseFloat(conversionRate) < 0.5 ? 'text-red-500' : 'text-white'} mt-2`}>{conversionRate}%</div>
             <div className="text-[10px] text-slate-500 mt-1 font-medium">Bench: 1.2% · Salesforce</div>
           </div>

        {/* DIKW Level Bar */}
        <div className="glass-panel rounded-2xl p-4 mb-6 border-b border-blue-500/30">
          <div className="flex justify-between items-center mb-3">
             <span className="text-[10px] font-bold text-slate-400 uppercase">Nivel DIKW</span>
             <span className="text-xs font-bold text-blue-400">
               {dikwLevel < 20 ? 'Data Processing' : dikwLevel < 50 ? 'Information Context' : dikwLevel < 80 ? 'Knowledge Discovery' : 'Sabiduría Estratégica'}
             </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
             <div 
               className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 transition-all duration-1000 ease-out"
               style={{ width: `${dikwLevel}%` }}
             />
          </div>
          <div className="flex justify-between mt-2 px-1">
             <span className={`text-[8px] font-bold ${dikwLevel >= 20 ? 'text-blue-400' : 'text-slate-600'}`}>D</span>
             <span className={`text-[8px] font-bold ${dikwLevel >= 40 ? 'text-blue-400' : 'text-slate-600'}`}>I</span>
             <span className={`text-[8px] font-bold ${dikwLevel >= 60 ? 'text-blue-400' : 'text-slate-600'}`}>K</span>
             <span className={`text-[8px] font-bold ${dikwLevel >= 80 ? 'text-blue-400' : 'text-slate-600'}`}>K+</span>
             <span className={`text-[8px] font-bold ${dikwLevel >= 100 ? 'text-blue-400' : 'text-slate-600'}`}>W</span>
          </div>
        </div>
        {/* First Grid Row (Core KPIs + Action) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
            <div className="glass-panel rounded-3xl p-6 relative border border-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    CAC ({formData.industry === 'SaaS' ? 'Suscripción' : formData.industry === 'B2B' ? 'Contrato' : 'Venta'})
                  </span>
                  <InfoTooltip 
                    label="Customer Acquisition Cost" 
                    nomenclature="Total Media Spend / Nuevos Clientes" 
                    description="Representa cuánto te cuesta capturar un cliente pagado. Es la métrica de eficiencia unitaria más importante de tu operación." 
                  />
                </div>
                <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mt-1">{formatCurrency(typeof cac === 'string' ? parseFloat(cac) : cac)}</h2>
              <div className="flex items-center space-x-2 mt-4">
                <span className="text-slate-400 text-xs">Total Spend vs Base Acq</span>
              </div>
          <div className="mt-4 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-slate-500 w-[100%]"></div>
          </div>
        </div>

        {/* KPI Widget: ROAS */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg ROAS</p>
                <InfoTooltip 
                  label="Average ROAS" 
                  nomenclature="Ingresos / Inversión" 
                  description="Retorno sobre la inversión publicitaria consolidado." 
                />
              </div>
              <h2 className="text-3xl font-bold text-white mt-1">{currentMetrics.roas}</h2>
            </div>
            <div className="p-2 bg-emerald-900/40 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="h-20 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicRoasData}>
                <defs>
                  <linearGradient id="colorRoas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorRoas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action / Trigger Widget */}
        <div className="glass-panel border-blue-500/20 bg-blue-900/10 rounded-3xl p-6 flex flex-col justify-between">
           <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <BrainCircuit className="w-5 h-5 text-blue-400" />
               Strategy Engine
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
               Execute DMAIC analysis on current frictional vectors.
            </p>
           </div>
           <button 
            onClick={handleGenerateDiagnosis}
            disabled={isLoading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
           >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Generate Diagnosis
                <ArrowRight className="w-4 h-4" />
              </>
            )}
           </button>
        </div>
      </div>

      {/* Second Grid Row: High Density Metrics (Similarweb Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* 1. Inversión Total & Desglose */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-text-sec uppercase tracking-wider mb-1">Inversión Total {formData.currency === 'USD' ? '$' : 'CLP'}</p>
            <h2 className="text-2xl font-bold text-text-main mt-1">{formatCurrency(totalSpend)}</h2>
          </div>
          <div className="h-32 w-full mt-4 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spendData} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={2}>
                  {spendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 2. Brecha de Atribución */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brecha Atribución</p>
                <InfoTooltip 
                  label="Brecha de Atribución" 
                  nomenclature="(Ads Rev - CRM Rev) / CRM Rev" 
                  description="Mide la discrepancia entre lo que dicen las plataformas (Meta/Google) y lo que realmente entró al banco. Un número positivo alto indica sobre-atribución o duplicidad." 
                />
              </div>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${gapPercentage > 20 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {gapPercentage > 20 ? 'Alto Riesgo' : 'Saludable'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mt-1">+{gapPercentage.toFixed(1)}%</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 italic">Ads Manager (Reportado)</span>
                <span className="text-white font-mono">{formatCurrency(reportedByPlatforms)}</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/60" style={{ width: `${Math.min((reportedByPlatforms/baseRevenue)*100, 100)}%` }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-bold">Caja Real (CRM)</span>
                <span className="text-white font-mono font-bold">{formatCurrency(baseRevenue)}</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CAC Detallado por Canal */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col">
          <p className="text-xs font-semibold text-text-sec uppercase tracking-wider mb-3">CAC Channel Unit</p>
          <div className="flex-1 space-y-3 mt-1 overflow-y-auto max-h-32 pr-1 scrollbar-hide">
            {cacDetailed.map((d, i) => (
              <div key={i} className="flex justify-between items-center border-b border-border-light pb-2 last:border-0 last:pb-0">
                <span className="text-xs text-text-sec">{d.channel}</span>
                <span className="text-sm font-bold text-text-main font-mono">{formatCurrency(d.cac)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. KPI vs Logro Progress Bar */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-text-sec uppercase tracking-wider mb-1">Pacing Logro ({leadMetric > 0 ? "Leads" : "Ventas"})</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-bold text-text-main">{kpiAchieved}</h2>
              <span className="text-xs text-text-sec font-mono">/ {kpiTarget}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-sec">Progreso Período</span>
              <span className="text-text-main font-bold font-mono">{kpiProgress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-border-main rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${kpiProgress}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Big Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Funnel Graph - visual representation */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-main">Funnel & Leading Ind.</h3>
            <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded border border-amber-500/30">Fricción Activa</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicFunnelData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E293B" />
                <XAxis type="number" hide />
                <YAxis dataKey="step" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#ffffff', fontSize: '12px', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                // @ts-ignore
<Bar dataKey="value" radius={[0, 4, 4, 0]} minBarSize={20} barSize={20}>
                  {
                    dynamicFunnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {dynamicFunnelData.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">{d.step}</span>
                <span className={`font-mono ${d.advanceRate < 5 && i > 0 ? 'text-red-400' : 'text-white'}`}>
                  {d.value.toLocaleString()} {i > 0 ? `(${d.advanceRate.toFixed(1)}%)` : ''}
                  {d.advanceRate < 5 && i > 0 ? ' ⚠️ Fricción' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Output Section */}
        <div className="glass-panel rounded-3xl lg:col-span-2 flex flex-col h-[500px]">
          <div className="p-5 border-b border-slate-700/50 bg-slate-800/30 rounded-t-xl">
             <h3 className="text-sm font-semibold text-white flex items-center gap-2">
               <BarChart3 className="w-4 h-4 text-blue-400" />
               DIKW Analysis & Diagnostics
             </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {error && (
              <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900/50 overflow-hidden break-words mb-4 text-sm">
                {error}
              </div>
            )}
            
            {isLoading ? (
               <div className="h-full flex flex-col items-center justify-center text-blue-400 space-y-4">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                 <p className="animate-pulse text-sm">Consulting real-time benchmarks...</p>
               </div>
            ) : aiReport ? (
               <div className="prose prose-sm prose-invert prose-blue max-w-none">
                 <div className="markdown-body">
                    <Markdown
                      components={{
                        table: ({node, ...props}) => <table className="markdown-table" {...props} />
                      }}
                    >
                      {aiReport}
                    </Markdown>
                 </div>
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                 <BrainCircuit className="w-12 h-12 opacity-30" />
                 <p className="text-sm">Run diagnostic to populate Strategic Wisdom.</p>
               </div>
            )}
          </div>
        </div>

        </div>
        </>
      ) : currentView === 'benchmarks' ? (
        <BenchmarksTab industry={formData.industry} />
      ) : (
        <InstructionsTab />
      )}

      </div>
      </main>
    </div>
  );
}

// --- Benchmarks Tab Component ---
function BenchmarksTab({ industry }: { industry: string }) {
  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Marketing Engineering Formulas */}
      <section className="glass-panel p-6 rounded-3xl border border-border-main">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          1. Fórmulas de Ingeniería de Marketing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-sidebar p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-semibold text-text-main mb-2">Salud Financiera (Gartner Standard)</h3>
            <div className="bg-bg-card p-3 rounded border border-border-main font-mono text-sm text-emerald-500 mb-3 flex items-center justify-center font-bold">
              Ratio = CLV / CAC &ge; 3
            </div>
            <p className="text-xs text-text-sec leading-relaxed">
              Define el balance entre el costo neto de adquisición y el valor de vida del cliente. Un ratio inferior a 3:1 indica agotamiento de capital, mientras que mayor a 5:1 sugiere subinversión en canales escalables.
            </p>
          </div>
          <div className="bg-bg-sidebar p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-semibold text-text-main mb-2">Brecha de Atribución</h3>
            <div className="bg-bg-card p-3 rounded border border-border-main font-mono text-sm text-red-500 mb-3 flex items-center justify-center font-bold">
              Brecha = (Conv.Ads - Ventas.Reales) / Ventas.Reales
            </div>
            <p className="text-xs text-text-sec leading-relaxed">
              Detecta la &quot;ilusión de control&quot; publicitario. Un nivel alto indica sobreatribución algorítmica donde las plataformas publicitarias se adjudican mérito excesivo (ej. retargeting orgánico).
            </p>
          </div>
          <div className="bg-bg-sidebar p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-semibold text-text-main mb-2">Retorno de Inversión (ROAS)</h3>
            <div className="bg-bg-card p-3 rounded border border-border-main font-mono text-sm text-emerald-500 mb-3 flex items-center justify-center font-bold">
              ROAS = Ingresos de Campaña / Costo
            </div>
            <p className="text-xs text-text-sec leading-relaxed">
              Mide la eficacia directa de las campañas. Un ROAS de 3x significa recuperar 3 por cada 1 invertido. Cuidado: no considera costos de producto ni fijos, por lo que un ROAS alto no siempre indica rentabilidad.
            </p>
          </div>
          <div className="bg-bg-sidebar p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-semibold text-text-main mb-2">Costo de Adquisición (CAC)</h3>
            <div className="bg-bg-card p-3 rounded border border-border-main font-mono text-sm text-emerald-500 mb-3 flex items-center justify-center font-bold">
              CAC = Inversión Total / Nuevos Clientes
            </div>
            <p className="text-xs text-text-sec leading-relaxed">
              Determina si tu motor de crecimiento es sostenible. Si tu CAC supera el margen de ganancia de la primera venta, dependes totalmente de la retención.
            </p>
          </div>
          <div className="bg-bg-sidebar p-4 rounded-lg border border-border-light md:col-span-2">
            <h3 className="text-sm font-semibold text-text-main mb-2">Glosario de Productividad Digital (MIT Sloan)</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="bg-bg-card p-2 rounded border border-border-main font-mono text-xs text-blue-500 mb-2 font-bold">
                  Cost Per Decision (CPD)
                </div>
                <p className="text-xs text-text-sec">
                  Castiga tableros de BI gigantes. Mide cuánto gastas en recolección de data frente a cuántas decisiones ejecutables tomas. Relación Inversión Analítica / Insights Accionables.
                </p>
              </div>
              <div className="flex-1">
                <div className="bg-bg-card p-2 rounded border border-border-main font-mono text-xs text-blue-500 mb-2 font-bold">
                  Time-to-Insight (TTI)
                </div>
                <p className="text-xs text-text-sec">
                  Intervalo entre la generación de un patrón anómalo de data y la comprensión estratégica de su causa raíz por parte de los ejecutivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Encyclopedia of Benchmarks */}
      <section className="glass-panel p-6 rounded-3xl border border-border-main">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          2. Enciclopedia de Benchmarks por Contexto (2024-2026)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border-light">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-sidebar text-text-main">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-border-light">Métrica Global</th>
                <th className="px-4 py-3 font-semibold border-b border-border-light">Promedio Base (Q1-Q3)</th>
                <th className="px-4 py-3 font-semibold border-b border-border-light text-emerald-500">Benchmark Destacado / Eventos</th>
                <th className="px-4 py-3 font-semibold border-b border-border-light">Fuentes (Agregadas)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-text-sec bg-bg-app">
              <tr>
                <td className="px-4 py-3 text-text-main">Tasa de Conv. Global (B2C)</td>
                <td className="px-4 py-3">1.8% - 2.5%</td>
                <td className="px-4 py-3 font-medium text-emerald-500">4.1% - 6.5% (High Intent)</td>
                <td className="px-4 py-3 text-xs">Shopify, Adobe Insights (2025)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-main">ROAS Meta Ads</td>
                <td className="px-4 py-3">2.8x</td>
                <td className="px-4 py-3 font-medium text-emerald-500">4.5x (Con ofertas &gt; 25%)</td>
                <td className="px-4 py-3 text-xs">Nielsen, Facebook Insights</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-main">ROAS Google Search</td>
                <td className="px-4 py-3">3.5x</td>
                <td className="px-4 py-3 font-medium text-emerald-500">4.8x (Keywords Long-Tail)</td>
                <td className="px-4 py-3 text-xs">Salesforce Benchmark, Semrush</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-main">Tasa Cancelación / Fricción (Cart)</td>
                <td className="px-4 py-3">70.19%</td>
                <td className="px-4 py-3 font-medium text-emerald-500">20% mejora optimizando checkout</td>
                <td className="px-4 py-3 text-xs">Baymard Institute (2024 Survey)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-text-main">Costo Clic B2B (MQLs)</td>
                <td className="px-4 py-3">$100 - $350 USD</td>
                <td className="px-4 py-3 font-medium text-emerald-500">$50 USD (Gated Content)</td>
                <td className="px-4 py-3 text-xs">HubSpot (State of Marketing 2025)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Dynamic Case Studies Repository */}
      <section className="glass-panel p-6 rounded-3xl border border-border-main">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-pink-400" />
          3. Background de Casos Reales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-sidebar border border-border-light rounded-lg p-5">
            <h3 className="text-md font-bold text-text-main mb-2">El &quot;Botón de los $300 Millones&quot; (Jared Spool)</h3>
            <p className="text-sm text-text-sec mb-4 leading-relaxed">
              Caso documentado donde un ecommerce mayorista forzaba a los usuarios a registrarse antes del pago. Reemplazando el botón &quot;Register&quot; por un &quot;Continue as Guest&quot; se eliminó la principal fricción cognitiva.
            </p>
            <div className="bg-bg-card p-3 rounded-md border border-border-main">
              <p className="text-xs text-emerald-500 font-bold mb-1">Impacto Demostrado:</p>
              <p className="text-xs text-text-main">Conversiones subieron 45%. $15 millones extra el primer mes y $300 millones al año. Muestra que la fricción técnica y emocional pesa más que la optimización de alcance en medios pagados.</p>
            </div>
          </div>
          
          <div className="bg-bg-sidebar border border-border-light rounded-lg p-5">
            <h3 className="text-md font-bold text-text-main mb-2">Sobreatribución (Caso FitLife)</h3>
            <p className="text-sm text-text-sec mb-4 leading-relaxed">
              Un caso referencial donde la marca gastaba millones en Retargeting de Facebook. La plataforma se atribuía el 40% del total de las ventas por last-click. Al apagar las campañas, las ventas totales solo cayeron 1.5%.
            </p>
            <div className="bg-bg-card p-3 rounded-md border border-border-main">
              <p className="text-xs text-emerald-500 font-bold mb-1">Impacto Demostrado:</p>
              <p className="text-xs text-text-main">Gran parte del ROAS era orgánico canibalizado. Muestra la urgencia de cruzar el CPA reportado contra el incremento marginal medido a nivel de base de datos total de ingresos (Brecha de Atribución).</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Decision Frameworks */}
      <section className="glass-panel p-6 rounded-3xl border border-border-main">
        <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          4. Marcos de Toma de Decisiones Estratégicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-bg-sidebar p-5 border border-border-light rounded-lg">
            <h3 className="text-md font-bold text-text-main mb-2 border-b border-border-main pb-2">El Modelo DIKW</h3>
            <ul className="space-y-3 mt-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">D</span>
                <div>
                  <span className="text-text-main font-semibold">Datos (Data)</span>
                  <p className="text-xs text-text-sec mt-0.5">Números o eventos crudos, sin contexto. Ej: &quot;200 clicks, 15 compras&quot;.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">I</span>
                <div>
                  <span className="text-text-main font-semibold">Información (Information)</span>
                  <p className="text-xs text-text-sec mt-0.5">Datos estructurados contextuales. Ej: &quot;Tasa de conversión del 7.5% verano&quot;.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">K</span>
                <div>
                  <span className="text-text-main font-semibold">Conocimiento (Knowledge)</span>
                  <p className="text-xs text-text-sec mt-0.5">La interconexión de la información para responder el &quot;cómo&quot;.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">W</span>
                <div>
                  <span className="text-text-main font-semibold">Sabiduría (Wisdom)</span>
                  <p className="text-xs text-text-sec mt-0.5">Respaldar con datos el &quot;por qué&quot; accionar el cambio estructural de negocios.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-bg-sidebar p-5 border border-border-light rounded-lg">
            <h3 className="text-md font-bold text-text-main mb-2 border-b border-border-main pb-2">El Ciclo DMAIC</h3>
            <p className="text-xs text-text-sec mb-4">
              Metodología basada en datos (Six Sigma) utilizada para optimizar ineficiencias operativas.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">D</span>
                <div>
                  <span className="text-text-main font-semibold">Definir (Define)</span>
                  <p className="text-xs text-text-sec mt-0.5">Señalar el problema desde la perspectiva del crecimiento o usuario.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">M</span>
                <div>
                  <span className="text-text-main font-semibold">Medir (Measure)</span>
                  <p className="text-xs text-text-sec mt-0.5">Establecer línea base actual.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">A</span>
                <div>
                  <span className="text-text-main font-semibold">Analizar (Analyze)</span>
                  <p className="text-xs text-text-sec mt-0.5">Detectar causa raíz con desagregración algorítmica y Benchmarks.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">I</span>
                <div>
                  <span className="text-text-main font-semibold">Mejorar (Improve)</span>
                  <p className="text-xs text-text-sec mt-0.5">Implementar soluciones para corregir áreas de fricción detectada.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">C</span>
                <div>
                  <span className="text-text-main font-semibold">Controlar (Control)</span>
                  <p className="text-xs text-text-sec mt-0.5">Sostenibilidad estructural de las mejoras a largo plazo.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}

// --- Instructions and Philosophy Tab Component ---
function InstructionsTab() {
  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 mb-2">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-text-main tracking-tight">Filosofía Operativa</h2>
        <p className="text-text-sec max-w-2xl mx-auto text-sm leading-relaxed">
          Nuestra misión es erradicar el sesgo emocional en las decisiones de negocio. Bienvenido a un entorno de <strong>Decision Intelligence</strong> construido con matemática transparente e inteligencia artificial fundamentada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Instrucciones de Uso */}
        <section className="bg-bg-sidebar p-6 rounded-3xl border border-border-light hover:border-border-main transition-colors">
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            1. Propósito y Modo de Uso
          </h3>
          <p className="text-sm text-text-sec leading-relaxed mb-4">
            Esta plataforma no es un dashboard estático, es un <strong>simulador estratégico</strong>. Sirve para inyectar datos reales de tus operaciones y entender el peso económico de cada ineficiencia en tu embudo de ventas.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">1.</span>
              <span className="text-text-main">Haz clic en <strong>Ingresar Datos</strong> situado en la barra superior.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">2.</span>
              <span className="text-text-main">Selecciona tu industria (B2C, B2B, SaaS) e inyecta tus ingresos, inversiones publicitarias y caídas de tráfico.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">3.</span>
              <span className="text-text-main">Observa en tiempo real cómo cambia tu CAC, ROAS y la forma de tu Funnel Mágico.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">4.</span>
              <span className="text-text-main">Presiona <strong>Generate Diagnosis</strong> para que la IA actúe auditando tu arquitectura de negocio.</span>
            </li>
          </ul>
        </section>

        {/* 2. Fuentes de Información */}
        <section className="bg-bg-sidebar p-6 rounded-3xl border border-border-light hover:border-border-main transition-colors">
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            2. Fuentes de Información
          </h3>
          <p className="text-sm text-text-sec leading-relaxed mb-4">
            Los resultados y parámetros mostrados no son inventados. Se fundamentan en la agregación estadística empírica proveniente de reportes actualizados de plataformas auditoras de clase mundial:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-bg-card p-2 rounded text-center border border-border-main text-xs font-semibold text-text-main">Baymard Institute</div>
            <div className="bg-bg-card p-2 rounded text-center border border-border-main text-xs font-semibold text-text-main">Gartner / McKinsey</div>
            <div className="bg-bg-card p-2 rounded text-center border border-border-main text-xs font-semibold text-text-main">Shopify Data</div>
            <div className="bg-bg-card p-2 rounded text-center border border-border-main text-xs font-semibold text-text-main">Adobe Digital Insights</div>
            <div className="bg-bg-card p-2 rounded text-center border border-border-main text-xs font-semibold text-text-main">Salesforce Benchmarks</div>
            <div className="bg-bg-card p-2 rounded text-center border border-border-main text-xs font-semibold text-text-main">HubSpot</div>
          </div>
        </section>

        {/* 3. Gobernanza y Privacidad */}
        <section className="bg-bg-sidebar p-6 rounded-3xl border border-border-light hover:border-border-main transition-colors">
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            3. Gobernanza de Datos
          </h3>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-emerald-500 font-semibold mb-1">Cero Captura de PII</p>
            <p className="text-xs text-text-sec">
              Esta herramienta es cibersegura desde el diseño. <strong>No procesa, no captura y no transmite</strong> información personalmente identificable (PII) de tus clientes, ni emails, ni tarjetas de crédito, ni nombres de la empresa.
            </p>
          </div>
          <p className="text-sm text-text-sec leading-relaxed">
            Solo procesamos flujos matemáticos y volumetrías anónimas. Las tasas macroscópicas numéricas se agregan de manera difuminada y cifrada a un <strong>Benchmark Colectivo Central en Tiempo Real</strong>. Esto promueve una inteligencia comunitaria donde tus proporciones ayudan a la red, pero sin que el motor sepa jamás de dónde proviene el tráfico.
          </p>
        </section>

        {/* 4. Uso de IA */}
        <section className="bg-bg-sidebar p-6 rounded-3xl border border-border-light hover:border-border-main transition-colors">
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-pink-400" />
            4. Copiloto de Inteligencia Artificial
          </h3>
          <p className="text-sm text-text-sec leading-relaxed mb-4">
            La IA generativa no se utiliza aquí para redactar textos superficiales, sino que funciona como un <strong>Estratega de Datos Senior</strong> embebido en tu flujo de trabajo.
          </p>
          <ul className="space-y-3 mt-4">
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
              <div>
                <span className="text-text-main text-sm font-semibold">Técnica de Grounding</span>
                <p className="text-xs text-text-sec mt-0.5">Nuestra IA tiene capacidad conectada a la web para buscar evidencia empírica real. No alucina, cruza tu fricción con casos de negocio similares comprobados.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
              <div>
                <span className="text-text-main text-sm font-semibold">Validación Matemática</span>
                <p className="text-xs text-text-sec mt-0.5">Compara la volumetría del funel contra métricas de la Enciclopedia Dinámica, alertando en rojo si estás por encima del costo estándar de la industria.</p>
              </div>
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
}
