import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

export function showImpressiveSuccess(title: string, text: string = '') {
  // Trigger impressive confetti animation
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
  }, 250);

  // Show an impressive centered success modal
  Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    background: '#ffffff',
    color: '#1e293b',
    confirmButtonColor: '#4f46e5',
    confirmButtonText: 'Continue',
    backdrop: `
      rgba(15, 23, 42, 0.85)
      radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.2) 0%, rgba(15, 23, 42, 0) 80%)
      center center / cover no-repeat
    `,
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut animate__faster'
    }
  });
}
