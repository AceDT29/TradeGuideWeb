/**
 * Utilidad para identificar el dispositivo/navegador cliente en las sesiones.
 */
export function getBrowserDeviceInfo() {
  try {
    const ua = navigator.userAgent || '';
    let browser = 'Web Browser';
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/')) browser = 'Safari';

    let os = 'Dispositivo';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `TradeWeb (${browser} - ${os})`;
  } catch {
    return 'TradeWeb (Web Client)';
  }
}
