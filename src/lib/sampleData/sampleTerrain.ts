import { TerrainPoint } from '../../domain/terrain/types';

// Generate 500 points representing a realistic topography
// 25x20 grid from 0 to 240 and 0 to 190.
function createHillDataset(): TerrainPoint[] {
  const points: TerrainPoint[] = [];
  let idCounter = 1;
  for (let x = 0; x <= 240; x += 10) {
    for (let y = 0; y <= 190; y += 10) {
      // Distance from center (120, 95)
      const distSq = Math.pow(x - 120, 2) + Math.pow(y - 95, 2);
      
      // Base elevation of 1500 meters to avoid the [0, 255] hillshade trap
      // Add a hill of up to 45 meters, plus some perlin-like trig noise
      const hillHeight = Math.max(0, 45 - Math.sqrt(distSq) * 0.4);
      const undulatingNoise = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 5;
      
      // Add a small random floating point noise (between -0.5 and 0.5) to avoid integers
      // This prevents the QA engine from thinking it's a quantized raster image
      const randomNoise = (Math.random() - 0.5); 
      
      const z = 1500 + hillHeight + undulatingNoise + randomNoise;
      
      // Introduce a slight positional noise to X and Y to make it feel like a real survey
      const xNoise = (Math.random() - 0.5) * 2;
      const yNoise = (Math.random() - 0.5) * 2;
      
      points.push({
        id: `p${idCounter++}`,
        x: parseFloat((x + xNoise).toFixed(3)),
        y: parseFloat((y + yNoise).toFixed(3)),
        z: parseFloat(z.toFixed(3))
      });
    }
  }
  return points;
}

export const SAMPLE_POINTS: TerrainPoint[] = createHillDataset();

/**
 * Serializes points to a standard CSV string format.
 */
export function generateSampleCSVText(): string {
  let text = 'Este,Norte,Cota\n';
  for (const p of SAMPLE_POINTS) {
    text += `${p.x},${p.y},${p.z}\n`;
  }
  return text;
}
