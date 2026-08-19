import Swal from 'sweetalert2';

export function showImpressiveSuccess(title: string, text: string = '') {
  // Use native SweetAlert2 configuration for the glass toast
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: title,
    text: text,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#0f172a',
    iconColor: '#10b981',
    showClass: {
      popup: 'pro-toast-enter'
    },
    hideClass: {
      popup: 'pro-toast-exit'
    },
    customClass: {
      popup: 'native-glass-toast'
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  // Inject styles for the glassmorphism look and custom keyframes
  if (!document.getElementById('native-glass-style')) {
    const style = document.createElement('style');
    style.id = 'native-glass-style';
    style.innerHTML = `
      @keyframes proSlideIn {
        0% { transform: translate3d(120%, 0, 0) scale(0.9); opacity: 0; }
        70% { transform: translate3d(-5%, 0, 0) scale(1.02); opacity: 1; }
        100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
      }
      @keyframes proSlideOut {
        0% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
        100% { transform: translate3d(120%, 0, 0) scale(0.9); opacity: 0; }
      }
      .pro-toast-enter {
        animation: proSlideIn 0.5s cubic-bezier(0.215, 0.61, 0.355, 1) forwards !important;
      }
      .pro-toast-exit {
        animation: proSlideOut 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards !important;
      }
      .native-glass-toast {
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(255, 255, 255, 0.5) !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.15) !important;
      }
      .native-glass-toast .swal2-title {
        font-family: 'Inter', system-ui, sans-serif !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
      }
      .native-glass-toast .swal2-html-container {
        font-family: 'Inter', system-ui, sans-serif !important;
        font-weight: 400 !important;
        font-size: 0.85rem !important;
        color: #475569 !important;
      }
      .native-glass-toast .swal2-timer-progress-bar {
        background: #10b981 !important;
      }
    `;
    document.head.appendChild(style);
  }
}
