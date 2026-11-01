// Gaya Roda persis mengikuti "Spin the Wheel" pada new-1.png:
// - Segmen bergantian: Ungu Royal (#673BF7), Oranye-Emas (#FFA931), dan Biru Langit (#4CB6F5)
// - Garis pemisah putih bersih antar segmen
// - Bintang kecil di dekat pusat tiap segmen
// - Pin bulat merah muda (#FF5E92) berbingkai putih di titik temu luar segmen
// - Bingkai luar ungu lembut 3D (#8D70FF)

interface BeeluckySliceStyle {
  gradStart: string;
  gradEnd: string;
  starColor: string;
}

const SLICE_STYLES: BeeluckySliceStyle[] = [
  {
    // Oranye-Madu ("100" highlight slice di new-1.png)
    gradStart: '#FFC145',
    gradEnd: '#F5931E',
    starColor: '#FFFFFF',
  },
  {
    // Ungu Royal ("20" / "50" slice di new-1.png)
    gradStart: '#7B52FF',
    gradEnd: '#5B2FE8',
    starColor: '#8B68FF',
  },
  {
    // Biru Langit ("15" / "20" slice di new-1.png)
    gradStart: '#5BC2FA',
    gradEnd: '#3B9AE0',
    starColor: '#8CD6FF',
  },
  {
    // Ungu Royal
    gradStart: '#7B52FF',
    gradEnd: '#5B2FE8',
    starColor: '#8B68FF',
  },
];

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
): void {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawWheelCanvas(
  canvas: HTMLCanvasElement,
  names: string[],
  currentAngle: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;

  const outerRimRadius = Math.min(centerX, centerY) - 8;
  const wheelRadius = outerRimRadius - 14;
  const centerCapRadius = wheelRadius * 0.23;

  ctx.clearRect(0, 0, width, height);

  // 1. Bingkai Luar Ungu Lavender Halus (Soft 3D Lavender Outer Rim seperti new-1.png)
  const rimGrad = ctx.createLinearGradient(0, 0, 0, height);
  rimGrad.addColorStop(0, '#9B82FF');
  rimGrad.addColorStop(0.5, '#7C5BFF');
  rimGrad.addColorStop(1, '#623CE6');

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRimRadius, 0, Math.PI * 2);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // Garis putih halus di tepi dalam rim
  ctx.beginPath();
  ctx.arc(centerX, centerY, wheelRadius + 2, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.stroke();

  if (names.length === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, wheelRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#683FF0';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Masukkan daftar nama siswa', centerX, centerY - 68);
    return;
  }

  const total = names.length;
  const arcSize = (Math.PI * 2) / total;

  // 2. Gambar Segmen Roda
  for (let i = 0; i < total; i++) {
    const startAngle = currentAngle + i * arcSize;
    const endAngle = startAngle + arcSize;
    const midAngle = startAngle + arcSize / 2;

    // Pilih skema warna agar tidak ada warna kembar bersebelahan di penutup
    let styleIdx = i % SLICE_STYLES.length;
    if (i === total - 1 && total > 1 && styleIdx === 0) {
      styleIdx = 2;
    }
    const style = SLICE_STYLES[styleIdx];

    const grad = ctx.createRadialGradient(
      centerX,
      centerY,
      centerCapRadius,
      centerX,
      centerY,
      wheelRadius
    );
    grad.addColorStop(0, style.gradEnd);
    grad.addColorStop(1, style.gradStart);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, wheelRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Garis pemisah putih bersih antar segmen
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Bintang kecil di dekat pusat roda (persis seperti di new-1.png)
    const starDist = centerCapRadius + 24;
    const starX = centerX + Math.cos(midAngle) * starDist;
    const starY = centerY + Math.sin(midAngle) * starDist;
    drawStar(ctx, starX, starY, 5, total > 16 ? 5 : 7, total > 16 ? 2.5 : 3.5, style.starColor);

    // Teks Nama di tengah segmen (centered di dalam juring roda)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(midAngle);

    const fontSize = total > 22 ? 10.5 : total > 14 ? 12.5 : 14;
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(42, 20, 110, 0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    const rawName = names[i];
    const maxChars = total > 18 ? 12 : 15;
    const displayName =
      rawName.length > maxChars ? rawName.slice(0, maxChars - 1) + '…' : rawName;

    const textRadius = (wheelRadius + centerCapRadius + 24) / 2;
    ctx.fillText(displayName, textRadius, 0);
    ctx.restore();
  }

  // 3. Pin Bulat Merah Muda Berbingkai Putih di Titik Garis Luar Segmen (seperti di new-1.png)
  for (let i = 0; i < total; i++) {
    const pinAngle = currentAngle + i * arcSize;
    const px = centerX + Math.cos(pinAngle) * (wheelRadius - 2);
    const py = centerY + Math.sin(pinAngle) * (wheelRadius - 2);

    ctx.beginPath();
    ctx.arc(px, py, total > 20 ? 3.5 : 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5E92';
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  }
}
