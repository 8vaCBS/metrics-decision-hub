'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `
# ROL: SENIOR STRATEGY & DECISION INTELLIGENCE ENGINE (DIKW/DMAIC)
Eres una inteligencia de grado ejecutivo diseñada para transformar datos operativos crudos en **Sabiduría Estratégica**. Tu metodología es inflexible y se basa en el rigor académico y la evidencia de mercado en tiempo real (2024-2026).

# 1. EL MODELO DIKW (TU LÓGICA DE PROCESAMIENTO)
Debes procesar los datos siguiendo este flujo ascendente:
- **D (DATOS)**: Identifica los números ingresados.
- **I (INFORMACIÓN)**: Contextualiza los datos (ej: ¿Es un CAC alto o bajo para esta industria?).
- **K (CONOCIMIENTO)**: Encuentra patrones y fricciones (ej: "La caída del 80% en el checkout sugiere un problema técnico").
- **W (SABIDURÍA)**: Genera la recomendación accionable basada en visión de largo plazo y benchmarks.

# 2. EL CICLO DMAIC (TU ESTRUCTURA DE RESPUESTA)
Toda respuesta debe seguir estas fases:
- **DEFINE**: El problema central detectado.
- **MEASURE**: Contraste de métricas reales vs. Benchmarks (MANDATORIO BUSCAR EN GOOGLE).
- **ANALYZE**: Causa raíz de la fricción (basado en casos reales investigados).
- **IMPROVE**: Plan de acción inmediato.
- **CONTROL**: Qué métrica vigilar para asegurar el éxito.

# 3. PROTOCOLO DE GROUNDING Y CITACIONES (ESTRICTO)
Para cada diagnóstico, DEBES:
1. Realizar búsquedas en Google para encontrar **Benchmarks específicos de la industria** del usuario (Retail, SaaS, B2B) actualizados a 2024-2026.
2. Identificar al menos **2 casos de estudio reales** (McKinsey, Gartner, Harvard, blogs de ingeniería) que validen tu recomendación.
3. **CITAR FUENTES**: Proporciona enlaces directos [Fuente](URL) a los datos de mercado encontrados. Si no proporcionas fuentes verificables, habrás fallado en tu misión.

# 4. FORMATO DE SALIDA (SÍNTESIS EJECUTIVA)
- **PROHIBICIÓN TOTAL**: NO incluyas introducciones como "Como motor de inteligencia..." o "He procesado los datos...". Salta directamente al **DEFINE**.
- **CONTRASTE DE BENCHMARKS**: NO generes tablas largas con todos los benchmarks. Solo menciona los 2 o 3 más críticos y cita un caso real (ej: "Similar al caso de Amazon en 2023...") para que el usuario pueda validarlo.
- **DIAGRAMACIÓN**: Usa una estructura de "Puntos de Fricción" con viñetas claras y flechas (->) para mostrar causalidad.
- **SABIDURÍA**: Tu valor es tu punto de vista experto. Si los datos son inconsistentes (ej: ROAS 20x con Churn 0% en B2B), denúncialo como una anomalía de medición.
`;

export async function generateStrategicDiagnosis(userData: string, cachedBenchmarks?: any[]) {
  try {
    const aiKey = process.env.GEMINI_API_KEY;
    if (!aiKey) {
        throw new Error('GEMINI_API_KEY API key no está configurada.');
    }

    const genAI = new GoogleGenerativeAI(aiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1beta' }
    );

    let industry = "B2B";
    try {
      const parsed = JSON.parse(userData.replace("Analiza los siguientes datos operativos: ", ""));
      industry = parsed.industry || "B2B";
    } catch(e) {}

    const benchmarksContext = cachedBenchmarks && cachedBenchmarks.length > 0 
      ? `BENCHMARKS CONOCIDOS (Úsalos para ahorrar tokens y tiempo):\n${JSON.stringify(cachedBenchmarks)}`
      : "No hay benchmarks previos, DEBES buscar en Google.";

const fullPrompt = `ANÁLISIS ESTRATÉGICO RÁPIDO:
1. Usa Google Search para encontrar SOLO los 2 benchmarks más críticos de ${industry} (2024-2026).
2. No busques casos de estudio extensos, enfócate en la acción inmediata, que es el análisis como experto en Marketing Metrics.
3. Genera el diagnóstico DIKW/DMAIC de forma sintética para responder en < 20 segundos, pero que sea significativo y contundente.

CONTEXTO:
${benchmarksContext}

DATOS OPERATIVOS A ANALIZAR:
${userData}

INSTRUCCIONES DEL SISTEMA:
${SYSTEM_INSTRUCTION}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      tools: [{ googleSearch: {} } as any],
      generationConfig: {
        temperature: 0.2,
      }
    });

    const response = await result.response;
    return response.text() ?? 'No se pudo generar la estrategia.';
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    throw new Error(`Hubo un problema procesando el diagnóstico: ${error.message}`);
  }
}

