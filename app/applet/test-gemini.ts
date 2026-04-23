import { generateStrategicDiagnosis } from '../actions/gemini';
async function run() {
  try {
    const res = await generateStrategicDiagnosis("Hola, nuestra conversion B2C es de 1.2%");
    console.log(res);
  } catch (e) {
    console.error('ERROR', e);
  }
}
run();
