import confetti from "canvas-confetti";

export const triggerConfetti = () => {
  confetti({
    particleCount: 75,
    spread: 60,
    origin: { y: 0.65 }
  });
};

export const triggerSuperConfetti = () => {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};
