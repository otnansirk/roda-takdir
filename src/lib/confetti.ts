interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
}

const FESTIVE_COLORS = [
  '#FFB838', // Honey Gold
  '#F5931E', // Amber Orange
  '#7B52FF', // Royal Purple
  '#FF5E92', // Coral Pink
  '#56BFF8', // Sky Blue
  '#FFE066', // Bright Star Yellow
];

let animFrameId: number | null = null;

function drawMiniStar(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    if (i === 0) {
      ctx.moveTo(Math.cos(outerAngle) * r, Math.sin(outerAngle) * r);
    } else {
      ctx.lineTo(Math.cos(outerAngle) * r, Math.sin(outerAngle) * r);
    }
    ctx.lineTo(Math.cos(innerAngle) * (r * 0.45), Math.sin(innerAngle) * (r * 0.45));
  }
  ctx.closePath();
  ctx.fill();
}

export function launchConfetti(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
  }

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(rect.width || 620, 320);
  const height = Math.max(rect.height || 480, 320);
  canvas.width = width;
  canvas.height = height;

  const particles: ConfettiParticle[] = [];
  const totalParticles = 95;

  for (let i = 0; i < totalParticles; i++) {
    const fromLeft = i % 2 === 0;
    const startX = fromLeft ? width * 0.12 : width * 0.88;
    const startY = height * 0.28;

    const angle = fromLeft
      ? -Math.PI * (0.15 + Math.random() * 0.45)
      : -Math.PI * (0.4 + Math.random() * 0.45);
    const speed = 5 + Math.random() * 9;

    const shapes: ConfettiParticle['shape'][] = ['rect', 'circle', 'star'];

    particles.push({
      x: startX + (Math.random() - 0.5) * 30,
      y: startY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2.5,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      size: 5.5 + Math.random() * 6,
      color: FESTIVE_COLORS[i % FESTIVE_COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.22,
      shape: shapes[i % shapes.length],
      opacity: 1,
    });
  }

  const startTime = performance.now();
  const maxDuration = 2800;

  function render(now: number) {
    const elapsed = now - startTime;
    ctx!.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.24;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;

      if (elapsed > maxDuration * 0.6) {
        p.opacity = Math.max(0, 1 - (elapsed - maxDuration * 0.6) / (maxDuration * 0.4));
      }

      if (p.y < height + 30 && p.opacity > 0.02) {
        activeCount++;
        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx!.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        } else if (p.shape === 'circle') {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          drawMiniStar(ctx!, p.size * 0.75);
        }

        ctx!.restore();
      }
    }

    if (activeCount > 0 && elapsed < maxDuration) {
      animFrameId = requestAnimationFrame(render);
    } else {
      ctx!.clearRect(0, 0, width, height);
      animFrameId = null;
    }
  }

  animFrameId = requestAnimationFrame(render);
}
