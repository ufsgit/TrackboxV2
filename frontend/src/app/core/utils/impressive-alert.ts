import Swal from 'sweetalert2';

function ensureAlertStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('premium-alert-suite-styles')) return;

  const style = document.createElement('style');
  style.id = 'premium-alert-suite-styles';
  style.innerHTML = `
    /* ══════════════════════════════════════════════════════════════════
       PREMIUM TOAST NOTIFICATIONS (Top-Right Floating Card)
       ══════════════════════════════════════════════════════════════════ */
    .pro-glass-toast {
      background: #ffffff !important;
      border: 1px solid rgba(226, 232, 240, 0.95) !important;
      border-radius: 14px !important;
      box-shadow: 0 16px 36px -10px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
      padding: 12px 16px !important;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }

    .pro-glass-toast .swal2-icon {
      margin: 0 12px 0 0 !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      border-radius: 9px !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .pro-glass-toast .swal2-icon.swal2-success {
      background: #ecfdf5 !important;
      color: #059669 !important;
      border: 1px solid #a7f3d0 !important;
    }

    .pro-glass-toast .swal2-icon.swal2-info {
      background: #eef2ff !important;
      color: #4f46e5 !important;
      border: 1px solid #c7d2fe !important;
    }

    .pro-glass-toast .swal2-icon.swal2-warning {
      background: #fffbeb !important;
      color: #d97706 !important;
      border: 1px solid #fde68a !important;
    }

    .pro-glass-toast .swal2-icon.swal2-error {
      background: #fef2f2 !important;
      color: #dc2626 !important;
      border: 1px solid #fecaca !important;
    }

    .pro-glass-toast .swal2-title {
      font-size: 13.5px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0 !important;
      line-height: 1.3 !important;
      text-align: left !important;
    }

    .pro-glass-toast .swal2-html-container {
      font-size: 12px !important;
      font-weight: 500 !important;
      color: #64748b !important;
      margin: 2px 0 0 !important;
      line-height: 1.35 !important;
      text-align: left !important;
    }

    .pro-glass-toast .swal2-timer-progress-bar {
      background: linear-gradient(90deg, #4f46e5, #10b981) !important;
      height: 2.5px !important;
      border-radius: 2px !important;
    }

    .pro-toast-enter {
      animation: proSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }

    .pro-toast-exit {
      animation: proSlideOut 0.25s ease-in forwards !important;
    }

    @keyframes proSlideIn {
      0% { transform: translate3d(110%, 0, 0) scale(0.96); opacity: 0; }
      100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
    }

    @keyframes proSlideOut {
      0% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
      100% { transform: translate3d(110%, 0, 0) scale(0.96); opacity: 0; }
    }

    /* ══════════════════════════════════════════════════════════════════
       PREMIUM CONFIRMATION & ALERT MODAL (Centered Clean Dialog)
       ══════════════════════════════════════════════════════════════════ */
    .pro-confirm-popup {
      background: #ffffff !important;
      border-radius: 20px !important;
      padding: 28px 24px 22px !important;
      width: 100% !important;
      max-width: 420px !important;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.9) !important;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      border: none !important;
    }

    .pro-confirm-backdrop {
      background: rgba(15, 23, 42, 0.55) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
    }

    .pro-confirm-icon-wrap {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .pro-confirm-icon-wrap.danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #ef4444;
      box-shadow: 0 8px 18px -4px rgba(239, 68, 68, 0.22);
    }

    .pro-confirm-icon-wrap.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #059669;
      box-shadow: 0 8px 18px -4px rgba(16, 185, 129, 0.22);
    }

    .pro-confirm-icon-wrap.primary {
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: #4f46e5;
      box-shadow: 0 8px 18px -4px rgba(79, 70, 229, 0.22);
    }

    .pro-confirm-icon-wrap svg {
      width: 26px;
      height: 26px;
      stroke-width: 2.2;
    }

    .pro-confirm-title {
      font-size: 1.25rem !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin: 0 0 8px !important;
      letter-spacing: -0.025em !important;
      text-align: center !important;
    }

    .pro-confirm-text {
      font-size: 0.92rem !important;
      color: #64748b !important;
      line-height: 1.5 !important;
      margin: 0 0 20px !important;
      text-align: center !important;
    }

    .pro-confirm-actions {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 10px !important;
      width: 100% !important;
      margin: 0 !important;
    }

    .pro-btn-cancel {
      height: 40px !important;
      padding: 0 20px !important;
      border-radius: 10px !important;
      font-weight: 600 !important;
      font-size: 0.88rem !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      color: #475569 !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      margin: 0 !important;
    }

    .pro-btn-cancel:hover {
      background: #f1f5f9 !important;
      border-color: #cbd5e1 !important;
      color: #1e293b !important;
    }

    .pro-btn-confirm-danger {
      height: 40px !important;
      padding: 0 22px !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      font-size: 0.88rem !important;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      margin: 0 !important;
    }

    .pro-btn-confirm-danger:hover {
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45) !important;
      transform: translateY(-1px) !important;
    }

    .pro-btn-confirm-primary {
      height: 40px !important;
      padding: 0 22px !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      font-size: 0.88rem !important;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      margin: 0 !important;
    }

    .pro-btn-confirm-primary:hover {
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45) !important;
      transform: translateY(-1px) !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Display a floating premium toast in the top-right corner.
 */
export function showPremiumToast(options: {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  timer?: number;
}) {
  ensureAlertStyles();
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: options.type,
    title: options.title,
    text: options.message || '',
    showConfirmButton: false,
    timer: options.timer ?? 3500,
    timerProgressBar: true,
    showClass: {
      popup: 'pro-toast-enter'
    },
    hideClass: {
      popup: 'pro-toast-exit'
    },
    customClass: {
      popup: 'pro-glass-toast'
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });
}

/**
 * Premium toast for newly created lead.
 */
export function showLeadCreatedSuccess(leadName?: string) {
  const name = leadName ? `"${leadName}"` : 'New lead';
  return showPremiumToast({
    type: 'success',
    title: 'Lead Created Successfully',
    message: `${name} has been added to your CRM pipeline.`
  });
}

/**
 * Premium toast for updated/edited lead.
 */
export function showLeadUpdatedSuccess(leadName?: string) {
  const name = leadName ? `"${leadName}"` : 'Lead';
  return showPremiumToast({
    type: 'info',
    title: 'Lead Updated Successfully',
    message: `Changes to ${name} have been saved.`
  });
}

/**
 * Premium toast for deleted lead.
 */
export function showLeadDeletedSuccess(leadName?: string) {
  const name = leadName ? `"${leadName}"` : 'Lead';
  return showPremiumToast({
    type: 'success',
    title: 'Lead Deleted',
    message: `${name} has been removed from your pipeline.`
  });
}

/**
 * Premium toast for status change.
 */
export function showStatusUpdatedSuccess(statusName: string, leadName?: string) {
  const target = leadName ? `for ${leadName}` : '';
  return showPremiumToast({
    type: 'success',
    title: 'Status Updated',
    message: `Lead status updated to "${statusName}" ${target}.`
  });
}

/**
 * Premium confirmation dialog for deleting a lead or item.
 */
export function showConfirmDelete(
  title: string = 'Delete Lead?',
  textHtml: string = 'Are you sure you want to delete this lead? This action cannot be undone.',
  confirmBtnText: string = 'Delete Lead'
): Promise<boolean> {
  ensureAlertStyles();

  return Swal.fire({
    html: `
      <div class="pro-confirm-icon-wrap danger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </div>
      <h3 class="pro-confirm-title">${title}</h3>
      <div class="pro-confirm-text">${textHtml}</div>
    `,
    showCancelButton: true,
    confirmButtonText: confirmBtnText,
    cancelButtonText: 'Cancel',
    buttonsStyling: false,
    customClass: {
      container: 'pro-confirm-backdrop',
      popup: 'pro-confirm-popup',
      actions: 'pro-confirm-actions',
      confirmButton: 'pro-btn-confirm-danger',
      cancelButton: 'pro-btn-cancel'
    }
  }).then((res) => !!res.isConfirmed);
}

/**
 * Premium error alert dialog.
 */
export function showPremiumError(title: string = 'Action Failed', message?: string) {
  return showPremiumToast({
    type: 'error',
    title: title,
    message: message || 'An unexpected error occurred. Please try again.',
    timer: 4500
  });
}

/**
 * Premium warning alert dialog.
 */
export function showPremiumWarning(title: string, message?: string) {
  return showPremiumToast({
    type: 'warning',
    title: title,
    message: message || '',
    timer: 4000
  });
}

/**
 * Legacy support for showImpressiveSuccess.
 */
export function showImpressiveSuccess(title: string, text: string = '') {
  return showPremiumToast({
    type: 'success',
    title: title,
    message: text
  });
}
