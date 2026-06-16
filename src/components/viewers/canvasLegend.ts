/**
 * Draws a professional elevation legend directly onto the HTML5 canvas.
 * This is embedded in the exported PNG image.
 */
export function drawLegendOnCanvas(
  ctx: CanvasRenderingContext2D,
  minZ: number,
  maxZ: number,
  width: number,
  height: number,
  isDarkTheme: boolean = false
): void {
  const midZ = minZ + (maxZ - minZ) / 2;
  
  // Position legend in the bottom-left corner of the canvas
  // Set padding relative to canvas size
  const legendX = 16;
  const legendY = height - 90;
  const legendWidth = 170;
  const legendHeight = 46;

  // 1. Draw background box with rounded corners (if supported)
  ctx.save();
  ctx.shadowColor = isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = isDarkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = isDarkTheme ? '#334155' : '#E2E8F0';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 4);
  } else {
    ctx.rect(legendX, legendY, legendWidth, legendHeight);
  }
  ctx.fill();
  ctx.shadowColor = 'transparent'; // reset shadow for stroke
  ctx.stroke();

  // 2. Draw Title
  ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('LEYENDA Z (m)', legendX + 8, legendY + 6);

  // 3. Draw Gradient Bar
  const gradX = legendX + 8;
  const gradY = legendY + 18;
  const gradW = legendWidth - 16;
  const gradH = 7;
  
  const grad = ctx.createLinearGradient(gradX, gradY, gradX + gradW, gradY);
  grad.addColorStop(0.0, '#3b82f6'); // Blue
  grad.addColorStop(0.25, '#06b6d4'); // Cyan
  grad.addColorStop(0.5, '#10b981'); // Emerald
  grad.addColorStop(0.75, '#f59e0b'); // Amber
  grad.addColorStop(1.0, '#f43f5e'); // Rose
  
  ctx.fillStyle = grad;
  ctx.fillRect(gradX, gradY, gradW, gradH);

  // 4. Draw labels
  ctx.fillStyle = isDarkTheme ? '#F8FAFC' : '#0F172A';
  ctx.font = 'bold 8px monospace';
  ctx.textBaseline = 'top';
  
  // Min Label
  ctx.textAlign = 'left';
  ctx.fillText(minZ.toFixed(1), gradX, gradY + 11);
  
  // Mid Label
  ctx.textAlign = 'center';
  ctx.fillText(midZ.toFixed(1), gradX + gradW / 2, gradY + 11);
  
  // Max Label
  ctx.textAlign = 'right';
  ctx.fillText(maxZ.toFixed(1), gradX + gradW, gradY + 11);

  ctx.restore();
}
