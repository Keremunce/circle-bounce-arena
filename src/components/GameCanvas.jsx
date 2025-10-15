import { useEffect, useRef, useState } from "react";

export default function GameCanvas() {
	const canvasRef = useRef(null);
	const [winner, setWinner] = useState(null);
	const [gameId, setGameId] = useState(0); // restart tetikleyici
	const particlesRef = useRef([]);
	const animationRef = useRef();

	useEffect(() => {
		console.log("Game initialized, gameId:", gameId);
		
		// If there's a winner, don't initialize the game loop
		if (winner) {
			return;
		}
		
		const canvas = canvasRef.current;
		if (!canvas) {
			console.log("Canvas not available");
			return;
		}
		const w = (canvas.width = window.innerWidth);
		const h = (canvas.height = window.innerHeight);

		const arena = { x: w / 2, y: h / 2, radius: 250 };
		const colors = ["#ff5f36", "#4f9cff", "#6eff7a"];

		const createBalls = () =>
			colors.map((color, i) => {
				const angle = (i / colors.length) * Math.PI * 2;
				const x = arena.x + Math.cos(angle) * 100;
				const y = arena.y + Math.sin(angle) * 100;
				const lines = [];
				for (let j = 0; j < 3; j++) {
					const ang = Math.random() * Math.PI * 2;
					const start = {
						x: arena.x + arena.radius * Math.cos(ang),
						y: arena.y + arena.radius * Math.sin(ang),
					};
					lines.push({ start, end: { x, y } });
				}
				return {
					id: i,
					color,
					x,
					y,
					r: 10,
					vx: (Math.random() * 3 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
					vy: (Math.random() * 3 + 1.5) * (Math.random() > 0.5 ? 1 : -1),
					lines,
					alive: true,
				};
			});

		let balls = createBalls();

		const pointToLineDistance = (x, y, start, end) => {
			const A = x - start.x;
			const B = y - start.y;
			const C = end.x - start.x;
			const D = end.y - start.y;
			const dot = A * C + B * D;
			const len_sq = C * C + D * D;
			const param = len_sq !== 0 ? dot / len_sq : -1;
			let xx, yy;
			if (param < 0) {
				xx = start.x;
				yy = start.y;
			} else if (param > 1) {
				xx = end.x;
				yy = end.y;
			} else {
				xx = start.x + param * C;
				yy = start.y + param * D;
			}
			const dx = x - xx;
			const dy = y - yy;
			return Math.sqrt(dx * dx + dy * dy);
		};

		const triggerParticles = (x, y, color) => {
			console.log("Triggering particles at:", x, y, "with color:", color);
			const newParticles = [];
			for (let i = 0; i < 20; i++) { // Reduced particle count for line breaks
				const angle = Math.random() * Math.PI * 2;
				const speed = Math.random() * 3 + 1;
				newParticles.push({
					x: x,
					y: y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					color: color,
					life: 30, // Shorter life for line break particles
				});
			}
			// Add to existing particles instead of replacing them
			particlesRef.current = [...particlesRef.current, ...newParticles];
		};

		const updateParticles = (ctx) => {
			particlesRef.current = particlesRef.current
				.map((p) => ({
					...p,
					x: p.x + p.vx,
					y: p.y + p.vy,
					life: p.life - 1,
				}))
				.filter((p) => p.life > 0);
				
			particlesRef.current.forEach((p) => {
				ctx.beginPath();
				ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); // Smaller particles for line breaks
				ctx.fillStyle = p.color;
				ctx.globalAlpha = p.life / 30; // Adjust for shorter life
				ctx.fill();
				ctx.globalAlpha = 1;
			});
		};

		const distance = (x1, y1, x2, y2) => {
			const dx = x1 - x2;
			const dy = y1 - y2;
			return Math.sqrt(dx * dx + dy * dy);
		};

		const loop = () => {
			// Check if canvas is still available
			if (!canvasRef.current) {
				console.log("Canvas no longer available, stopping loop");
				return;
			}
			
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");
			const w = canvas.width;
			const h = canvas.height;
			
			ctx.clearRect(0, 0, w, h);

			// draw arena
			ctx.beginPath();
			ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 3;
			ctx.stroke();

			// update balls (only move if there's no winner yet)
			const isGameActive = !winner;
			
			balls.forEach((ball) => {
				if (!ball.alive) return;

				// Only update positions if game is still active
				if (isGameActive) {
					ball.x += ball.vx;
					ball.y += ball.vy;

					const dx = ball.x - arena.x;
					const dy = ball.y - arena.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					// Wall collision
					if (dist + ball.r >= arena.radius) {
						const angle = Math.atan2(dy, dx);
						const nx = Math.cos(angle);
						const ny = Math.sin(angle);
						const dot = ball.vx * nx + ball.vy * ny;
						ball.vx -= 2 * dot * nx;
						ball.vy -= 2 * dot * ny;

						const start = {
							x: arena.x + nx * arena.radius,
							y: arena.y + ny * arena.radius,
						};
						ball.lines.push({ start, end: { x: ball.x, y: ball.y } });
					}

					// Ball to ball collision
					balls.forEach(otherBall => {
						if (ball.id !== otherBall.id && otherBall.alive) {
							const dist = distance(ball.x, ball.y, otherBall.x, otherBall.y);
							if (dist < ball.r + otherBall.r) {
								// Simple elastic collision
								const dx = otherBall.x - ball.x;
								const dy = otherBall.y - ball.y;
								const collisionAngle = Math.atan2(dy, dx);
								
								const vx1 = ball.vx;
								const vy1 = ball.vy;
								const vx2 = otherBall.vx;
								const vy2 = otherBall.vy;
								
								// Rotate velocities to collision space
								const rotatedVx1 = vx1 * Math.cos(collisionAngle) + vy1 * Math.sin(collisionAngle);
								const rotatedVy1 = -vx1 * Math.sin(collisionAngle) + vy1 * Math.cos(collisionAngle);
								const rotatedVx2 = vx2 * Math.cos(collisionAngle) + vy2 * Math.sin(collisionAngle);
								const rotatedVy2 = -vx2 * Math.sin(collisionAngle) + vy2 * Math.cos(collisionAngle);
								
								// Elastic collision in 1D
								const finalVx1 = ((ball.r - otherBall.r) * rotatedVx1 + 2 * otherBall.r * rotatedVx2) / (ball.r + otherBall.r);
								const finalVx2 = ((otherBall.r - ball.r) * rotatedVx2 + 2 * ball.r * rotatedVx1) / (ball.r + otherBall.r);
								
								// Rotate velocities back
								ball.vx = finalVx1 * Math.cos(collisionAngle) - rotatedVy1 * Math.sin(collisionAngle);
								ball.vy = finalVx1 * Math.sin(collisionAngle) + rotatedVy1 * Math.cos(collisionAngle);
								otherBall.vx = finalVx2 * Math.cos(collisionAngle) - rotatedVy2 * Math.sin(collisionAngle);
								otherBall.vy = finalVx2 * Math.sin(collisionAngle) + rotatedVy2 * Math.cos(collisionAngle);
								
								// Move balls apart to prevent sticking
								const overlap = ball.r + otherBall.r - dist;
								const moveX = (overlap / 2) * Math.cos(collisionAngle);
								const moveY = (overlap / 2) * Math.sin(collisionAngle);
								
								ball.x -= moveX;
								ball.y -= moveY;
								otherBall.x += moveX;
								otherBall.y += moveY;
							}
						}
					});
				}

				ball.lines.forEach((line) => {
					ctx.beginPath();
					ctx.moveTo(line.start.x, line.start.y);
					ctx.lineTo(line.end.x, line.end.y);
					ctx.strokeStyle = ball.color;
					ctx.lineWidth = 2;
					ctx.stroke();
					line.end.x = ball.x;
					line.end.y = ball.y;
				});

				ctx.beginPath();
				ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
				ctx.fillStyle = ball.color;
				ctx.fill();
			});

			// Check line collisions (only if game is active)
			if (isGameActive) {
				balls.forEach((b1) => {
					if (!b1.alive) return;
					balls.forEach((b2) => {
						if (b1.id === b2.id || !b2.alive) return;
						// Create a copy of lines array to avoid modifying while iterating
						const linesToRemove = [];
						b2.lines.forEach((line, i) => {
							const dist = pointToLineDistance(b1.x, b1.y, line.start, line.end);
							if (dist < b1.r) {
								linesToRemove.push(i);
								// Trigger particles at the collision point
								const midX = (line.start.x + line.end.x) / 2;
								const midY = (line.start.y + line.end.y) / 2;
								triggerParticles(midX, midY, b2.color);
							}
						});
						
						// Remove lines in reverse order to maintain indices
						for (let i = linesToRemove.length - 1; i >= 0; i--) {
							b2.lines.splice(linesToRemove[i], 1);
						}
						
						if (b2.lines.length === 0) {
							b2.alive = false;
							// Trigger particles when a ball dies
							triggerParticles(b2.x, b2.y, b2.color);
						}
					});
				});

				const alive = balls.filter((b) => b.alive);
				if (alive.length <= 1 && !winner) {
					if (alive.length === 1) {
						console.log("Winner determined:", alive[0].color);
						setWinner(alive[0].color);
						// Trigger winner particles
						triggerParticles(alive[0].x, alive[0].y, alive[0].color);
					} else {
						console.log("Draw game");
						setWinner("Draw");
					}
				}
			}

			updateParticles(ctx);

			animationRef.current = requestAnimationFrame(loop);
		};

		loop();

		return () => {
			console.log("Cleaning up animation frame");
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [gameId, winner]);

	const restartGame = () => {
		console.log("Restarting game");
		setWinner(null);
		particlesRef.current = [];
		setGameId((id) => id + 1); // re-trigger useEffect
	};

	// If there's a winner, return a completely different HTML structure
	if (winner) {
		return (
			<div className="winnerOverlay">
				<div className="winnerCard">
					<div className="winnerContent">
						<h1 
							className={`winnerTitle ${winner !== "Draw" ? "winnerAnimation" : ""}`}
							style={{ 
								color: winner !== "Draw" ? winner : "white",
								textShadow: winner !== "Draw" ? `0 0 10px ${winner}, 0 0 20px ${winner}` : "none"
							}}
						>
							{winner !== "Draw" ? "WINNER!" : "DRAW!"}
						</h1>
						<div className="winnerIconContainer">
							{winner !== "Draw" ? (
								<div className="winnerIconWrapper">
									<div 
										className="winnerIcon"
										style={{ backgroundColor: winner }}
									></div>
								</div>
							) : (
								<div className="drawIcons">
									<div className="drawIcon drawIconFirst"></div>
									<div className="drawIcon drawIconSecond"></div>
									<div className="drawIcon drawIconThird"></div>
								</div>
							)}
						</div>
						<button
							onClick={restartGame}
							className="restartButton"
						>
							<span className="restartButtonContent">
								<svg xmlns="http://www.w3.org/2000/svg" className="restartIcon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Restart Game
							</span>
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Normal game rendering
	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="block w-full h-full bg-[#0c0d12]" />
		</div>
	);
}