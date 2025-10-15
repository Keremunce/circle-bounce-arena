import { useEffect, useRef, useState } from "react";

// Main App Component
export default function BounceArenaGame() {
	const [gameActive, setGameActive] = useState(false);
	const [gameKey, setGameKey] = useState(0);

	// Game configuration state
	const [config, setConfig] = useState({
		ballCount: 3,
		minSpeed: 1.5,
		maxSpeed: 3,
		ballRadius: 10,
		arenaRadius: 250,
		ballImages: [null, null, null, null, null, null],
	});

	const handleConfigChange = (key, value) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	const handleImageUpload = (index, file) => {
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const newImages = [...config.ballImages];
					newImages[index] = img;
					setConfig((prev) => ({ ...prev, ballImages: newImages }));
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = (index) => {
		const newImages = [...config.ballImages];
		newImages[index] = null;
		setConfig((prev) => ({ ...prev, ballImages: newImages }));
	};

	const startGame = () => {
		setGameActive(true);
		setGameKey((prev) => prev + 1);
	};

	const resetGame = () => {
		setGameActive(false);
		setGameKey((prev) => prev + 1);
	};

	return (
		<div className="appContainer">
			{/* Control Panel */}
			<ControlPanel
				config={config}
				onConfigChange={handleConfigChange}
				onImageUpload={handleImageUpload}
				onRemoveImage={handleRemoveImage}
				onStartGame={startGame}
				onResetGame={resetGame}
				gameActive={gameActive}
			/>

			{/* Game Canvas */}
			<div className="gameArea">
				{gameActive ? (
					<GameCanvas
						key={gameKey}
						config={config}
						onGameEnd={() => setGameActive(false)}
					/>
				) : (
					<div className="startMessage">
						Configure settings and press "Start Game"
					</div>
				)}
			</div>
		</div>
	);
}

// Control Panel Component
function ControlPanel({
	config,
	onConfigChange,
	onImageUpload,
	onRemoveImage,
	onStartGame,
	onResetGame,
	gameActive,
}) {
	const fileInputRefs = useRef([]);

	return (
		<div className="controlPanel">
			<h2 className="panelTitle">Game Settings</h2>

			{/* Ball Count */}
			<div className="controlGroup">
				<label className="controlLabel">Ball Count: {config.ballCount}</label>
				<input
					type="range"
					min="2"
					max="6"
					value={config.ballCount}
					onChange={(e) =>
						onConfigChange("ballCount", parseInt(e.target.value))
					}
					className="controlSlider"
					disabled={gameActive}
				/>
			</div>

			{/* Min Speed */}
			<div className="controlGroup">
				<label className="controlLabel">
					Min Speed: {config.minSpeed.toFixed(1)}
				</label>
				<input
					type="range"
					min="0.5"
					max="5"
					step="0.1"
					value={config.minSpeed}
					onChange={(e) =>
						onConfigChange("minSpeed", parseFloat(e.target.value))
					}
					className="controlSlider"
					disabled={gameActive}
				/>
			</div>

			{/* Max Speed */}
			<div className="controlGroup">
				<label className="controlLabel">
					Max Speed: {config.maxSpeed.toFixed(1)}
				</label>
				<input
					type="range"
					min="1"
					max="8"
					step="0.1"
					value={config.maxSpeed}
					onChange={(e) =>
						onConfigChange("maxSpeed", parseFloat(e.target.value))
					}
					className="controlSlider"
					disabled={gameActive}
				/>
			</div>

			{/* Ball Radius */}
			<div className="controlGroup">
				<label className="controlLabel">
					Ball Radius: {config.ballRadius}
				</label>
				<input
					type="range"
					min="5"
					max="30"
					value={config.ballRadius}
					onChange={(e) =>
						onConfigChange("ballRadius", parseInt(e.target.value))
					}
					className="controlSlider"
					disabled={gameActive}
				/>
			</div>

			{/* Arena Radius */}
			<div className="controlGroup">
				<label className="controlLabel">
					Arena Radius: {config.arenaRadius}
				</label>
				<input
					type="range"
					min="150"
					max="400"
					value={config.arenaRadius}
					onChange={(e) =>
						onConfigChange("arenaRadius", parseInt(e.target.value))
					}
					className="controlSlider"
					disabled={gameActive}
				/>
			</div>

			{/* Ball Images */}
			<div className="controlGroup">
				<h3 className="controlSubtitle">Ball Images</h3>
				{Array.from({ length: config.ballCount }).map((_, i) => (
					<div key={i} className="imageUploadContainer">
						<label className="imageUploadLabel">Ball {i + 1}</label>
						<div className="imageUploadRow">
							<input
								type="file"
								accept="image/*"
								onChange={(e) => onImageUpload(i, e.target.files[0])}
								ref={(el) => (fileInputRefs.current[i] = el)}
								className="imageUploadInput"
								disabled={gameActive}
							/>
							{config.ballImages[i] && (
								<button
									onClick={() => {
										onRemoveImage(i);
										if (fileInputRefs.current[i]) {
											fileInputRefs.current[i].value = "";
										}
									}}
									className="removeButton"
									disabled={gameActive}
								>
									Remove
								</button>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Action Buttons */}
			<div className="actionButtons">
				<button
					onClick={onStartGame}
					disabled={gameActive}
					className="startButton"
				>
					Start Game
				</button>
				<button onClick={onResetGame} className="resetButton">
					Reset
				</button>
			</div>
		</div>
	);
}

// Game Canvas Component
function GameCanvas({ config, onGameEnd }) {
	const canvasRef = useRef(null);
	const [winner, setWinner] = useState(null);
	const particlesRef = useRef([]);
	const animationRef = useRef();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const w = (canvas.width = canvas.offsetWidth);
		const h = (canvas.height = canvas.offsetHeight);

		const arena = { x: w / 2, y: h / 2, radius: config.arenaRadius };
		const colors = [
			"#ff5f36",
			"#4f9cff",
			"#6eff7a",
			"#ffcc00",
			"#ff66ff",
			"#00ffff",
		];

		const createBalls = () =>
			colors.slice(0, config.ballCount).map((color, i) => {
				const angle = (i / config.ballCount) * Math.PI * 2;
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
					r: config.ballRadius,
					vx:
						(Math.random() * (config.maxSpeed - config.minSpeed) +
							config.minSpeed) *
						(Math.random() > 0.5 ? 1 : -1),
					vy:
						(Math.random() * (config.maxSpeed - config.minSpeed) +
							config.minSpeed) *
						(Math.random() > 0.5 ? 1 : -1),
					lines,
					alive: true,
					image: config.ballImages[i],
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
			const newParticles = [];
			for (let i = 0; i < 20; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = Math.random() * 3 + 1;
				newParticles.push({
					x: x,
					y: y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					color: color,
					life: 30,
				});
			}
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
				ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
				ctx.fillStyle = p.color;
				ctx.globalAlpha = p.life / 30;
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
			if (!canvasRef.current) return;

			const ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, w, h);

			ctx.beginPath();
			ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 3;
			ctx.stroke();

			const isGameActive = !winner;

			balls.forEach((ball) => {
				if (!ball.alive) return;

				if (isGameActive) {
					ball.x += ball.vx;
					ball.y += ball.vy;

					const dx = ball.x - arena.x;
					const dy = ball.y - arena.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

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

					balls.forEach((otherBall) => {
						if (ball.id !== otherBall.id && otherBall.alive) {
							const dist = distance(ball.x, ball.y, otherBall.x, otherBall.y);
							if (dist < ball.r + otherBall.r) {
								const dx = otherBall.x - ball.x;
								const dy = otherBall.y - ball.y;
								const collisionAngle = Math.atan2(dy, dx);

								const vx1 = ball.vx;
								const vy1 = ball.vy;
								const vx2 = otherBall.vx;
								const vy2 = otherBall.vy;

								const rotatedVx1 =
									vx1 * Math.cos(collisionAngle) +
									vy1 * Math.sin(collisionAngle);
								const rotatedVy1 =
									-vx1 * Math.sin(collisionAngle) +
									vy1 * Math.cos(collisionAngle);
								const rotatedVx2 =
									vx2 * Math.cos(collisionAngle) +
									vy2 * Math.sin(collisionAngle);
								const rotatedVy2 =
									-vx2 * Math.sin(collisionAngle) +
									vy2 * Math.cos(collisionAngle);

								const finalVx1 =
									((ball.r - otherBall.r) * rotatedVx1 +
										2 * otherBall.r * rotatedVx2) /
									(ball.r + otherBall.r);
								const finalVx2 =
									((otherBall.r - ball.r) * rotatedVx2 +
										2 * ball.r * rotatedVx1) /
									(ball.r + otherBall.r);

								ball.vx =
									finalVx1 * Math.cos(collisionAngle) -
									rotatedVy1 * Math.sin(collisionAngle);
								ball.vy =
									finalVx1 * Math.sin(collisionAngle) +
									rotatedVy1 * Math.cos(collisionAngle);
								otherBall.vx =
									finalVx2 * Math.cos(collisionAngle) -
									rotatedVy2 * Math.sin(collisionAngle);
								otherBall.vy =
									finalVx2 * Math.sin(collisionAngle) +
									rotatedVy2 * Math.cos(collisionAngle);

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

				if (ball.image) {
					ctx.save();
					ctx.beginPath();
					ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(
						ball.image,
						ball.x - ball.r,
						ball.y - ball.r,
						ball.r * 2,
						ball.r * 2
					);
					ctx.restore();
				} else {
					ctx.beginPath();
					ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
					ctx.fillStyle = ball.color;
					ctx.fill();
				}
			});

			if (isGameActive) {
				balls.forEach((b1) => {
					if (!b1.alive) return;
					balls.forEach((b2) => {
						if (b1.id === b2.id || !b2.alive) return;
						const linesToRemove = [];
						b2.lines.forEach((line, i) => {
							const dist = pointToLineDistance(
								b1.x,
								b1.y,
								line.start,
								line.end
							);
							if (dist < b1.r) {
								linesToRemove.push(i);
								const midX = (line.start.x + line.end.x) / 2;
								const midY = (line.start.y + line.end.y) / 2;
								triggerParticles(midX, midY, b2.color);
							}
						});

						for (let i = linesToRemove.length - 1; i >= 0; i--) {
							b2.lines.splice(linesToRemove[i], 1);
						}

						if (b2.lines.length === 0) {
							b2.alive = false;
							triggerParticles(b2.x, b2.y, b2.color);
						}
					});
				});

				const alive = balls.filter((b) => b.alive);
				if (alive.length <= 1 && !winner) {
					if (alive.length === 1) {
						setWinner(alive[0].color);
						triggerParticles(alive[0].x, alive[0].y, alive[0].color);
					} else {
						setWinner("Draw");
					}
				}
			}

			updateParticles(ctx);
			animationRef.current = requestAnimationFrame(loop);
		};

		loop();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [config, winner]);

	const handleRestart = () => {
		setWinner(null);
		particlesRef.current = [];
		onGameEnd();
	};

	if (winner) {
		return (
			<div className="winnerOverlay">
				<div className="winnerCard">
					<h1
						className="winnerTitle"
						style={{
							color: winner !== "Draw" ? winner : "white",
							textShadow:
								winner !== "Draw"
									? `0 0 10px ${winner}, 0 0 20px ${winner}`
									: "none",
							animation: winner !== "Draw" ? "bounce 1s infinite" : "none",
						}}
					>
						{winner !== "Draw" ? "WINNER!" : "DRAW!"}
					</h1>
					<div className="winnerIconContainer">
						{winner !== "Draw" ? (
							<div className="winnerIconWrapper">
								<div
									className="winnerIcon"
									style={{
										backgroundColor: winner,
										animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
									}}
								></div>
							</div>
						) : (
							<div className="drawIcons">
								<div
									className="drawIcon drawIconFirst"
								></div>
								<div
									className="drawIcon drawIconSecond"
								></div>
								<div
									className="drawIcon drawIconThird"
								></div>
							</div>
						)}
					</div>
					<button onClick={handleRestart} className="restartButton">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="restartIcon"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Back to Settings
					</button>
				</div>
			</div>
		);
	}

	return <canvas ref={canvasRef} className="gameCanvas" />;
}