import { useRef, useEffect } from "react";

export default function GameCanvas() {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const arena = {
			x: canvas.width / 2,
			y: canvas.height / 2,
			radius: 230,
		};

		const colors = ["#FF5F36", "#00E0FF", "#9DFF00"];

		// 🔹 Rastgele daire içi pozisyon
		function randomPositionInCircle(radius) {
			const angle = Math.random() * Math.PI * 2;
			const r = Math.sqrt(Math.random()) * (radius - 50);
			return {
				x: arena.x + r * Math.cos(angle),
				y: arena.y + r * Math.sin(angle),
			};
		}

		// 🔹 Topları oluştur (3 çizgiyle başlasın)
		const balls = colors.map((color, i) => {
			const pos = randomPositionInCircle(arena.radius);
			const lines = [];

			for (let j = 0; j < 3; j++) {
				const angle = Math.random() * Math.PI * 2;
				const start = {
					x: arena.x + arena.radius * Math.cos(angle),
					y: arena.y + arena.radius * Math.sin(angle),
				};
				lines.push({ start, end: { x: pos.x, y: pos.y } });
			}

			return {
				id: i,
				color,
				x: pos.x,
				y: pos.y,
				r: 10,
				vx: (Math.random() * 2 + 2) * (Math.random() > 0.5 ? 1 : -1),
				vy: (Math.random() * 2 + 2) * (Math.random() > 0.5 ? 1 : -1),
				lines,
				maxLines: 3,
				alive: true,
			};
		});

		// 🔹 Çizim fonksiyonları
		function drawArena() {
			ctx.beginPath();
			ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
			ctx.strokeStyle = "#ffffff22";
			ctx.lineWidth = 2;
			ctx.stroke();
		}

		function drawBalls() {
			balls.forEach((ball) => {
				if (!ball.alive) return;
				ctx.beginPath();
				ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
				ctx.fillStyle = ball.color;
				ctx.fill();
			});
		}

		function drawLines() {
			balls.forEach((ball) => {
				if (!ball.alive) return;
				ball.lines.forEach((line) => {
					ctx.beginPath();
					ctx.moveTo(line.start.x, line.start.y);
					ctx.lineTo(line.end.x, line.end.y);
					ctx.strokeStyle = `${ball.color}66`;
					ctx.lineWidth = 1.3;
					ctx.stroke();
				});
			});
		}

		// 🔹 Top hareketi
		function updatePositions() {
			balls.forEach((ball) => {
				if (!ball.alive) return;

				ball.x += ball.vx;
				ball.y += ball.vy;

				const dx = ball.x - arena.x;
				const dy = ball.y - arena.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				// Arena'ya çarparsa sek
				if (dist + ball.r >= arena.radius) {
					const normalX = dx / dist;
					const normalY = dy / dist;
					const dot = ball.vx * normalX + ball.vy * normalY;
					ball.vx -= 2 * dot * normalX;
					ball.vy -= 2 * dot * normalY;

					const hitPoint = {
						x: arena.x + normalX * arena.radius,
						y: arena.y + normalY * arena.radius,
					};

					// Yeni çizgi oluştur (max 3)
					if (ball.lines.length < ball.maxLines) {
						ball.lines.push({
							start: hitPoint,
							end: { x: ball.x, y: ball.y },
						});
					}
				}

				// Çizgileri güncelle (uç noktası ball ile)
				ball.lines.forEach((line) => {
					line.end = { x: ball.x, y: ball.y };
				});
			});
		}

		// 🔹 Çizgi çarpışma tespiti
		function detectLineHits(frameCount) {
			balls.forEach((ball) => {
				if (!ball.alive) return;

				balls.forEach((other) => {
					if (!other.alive || ball.id === other.id) return;

					other.lines.forEach((line, idx) => {
						const dist = pointLineDistance(
							ball.x,
							ball.y,
							line.start.x,
							line.start.y,
							line.end.x,
							line.end.y
						);
						if (dist < ball.r) {
							other.lines.splice(idx, 1);
						}
					});

					// Sadece oyunun başından 100 frame sonra elenme aktif
					if (other.lines.length === 0 && other.alive && frameCount > 100) {
						other.alive = false;
					}
				});
			});
		}

		// 🔹 Nokta-çizgi mesafesi
		function pointLineDistance(px, py, x1, y1, x2, y2) {
			const A = px - x1;
			const B = py - y1;
			const C = x2 - x1;
			const D = y2 - y1;
			const dot = A * C + B * D;
			const lenSq = C * C + D * D;
			let param = -1;
			if (lenSq !== 0) param = dot / lenSq;

			let xx, yy;
			if (param < 0) {
				xx = x1;
				yy = y1;
			} else if (param > 1) {
				xx = x2;
				yy = y2;
			} else {
				xx = x1 + param * C;
				yy = y1 + param * D;
			}

			const dx = px - xx;
			const dy = py - yy;
			return Math.sqrt(dx * dx + dy * dy);
		}

		// 🔹 Game loop
		let frameCount = 0;
		function loop() {
			frameCount++;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawArena();
			updatePositions();
			detectLineHits(frameCount);
			drawLines();
			drawBalls();
			requestAnimationFrame(loop);
		}

		loop();
	}, []);

	return <canvas ref={canvasRef} />;
}
