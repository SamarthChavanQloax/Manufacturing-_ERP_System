import { ERPNotification } from '../context/NotificationContext';

/**
 * Resolves the destination URL for a notification or incident review.
 * Ensures the admin is taken to the exact relevant page instead of falling back to dashboard.
 */
export const getNotificationUrl = (n?: Partial<ERPNotification> | null): string => {
  if (!n) return '/notifications';

  let url = (n.action_url || '').trim();

  // If action_url exists, normalize legacy or erroneous URLs
  if (url) {
    if (url === '/index' || url === '/dashboard' || url === '/') {
      // Don't route to dashboard if there is a specific incident entity
      url = '';
    } else if (url.startsWith('/verification')) {
      if (n.entity_id) {
        return `/ai_gate_risk?search=${encodeURIComponent(n.entity_id)}`;
      }
      return '/verify_invoice';
    } else if (url.startsWith('/gate_risk')) {
      return url.replace('/gate_risk', '/ai_gate_risk');
    } else if (url.startsWith('/security_briefing')) {
      return url.replace('/security_briefing', '/ai_security_briefing');
    } else if (url.startsWith('/security')) {
      return url.replace('/security', '/ai_security');
    } else {
      return url;
    }
  }

  // Deduce target page from notification type and entity_type
  const type = (n.type || '').toUpperCase();
  const title = (n.title || '').toLowerCase();
  const entityType = (n.entity_type || '').toLowerCase();
  const entityId = (n.entity_id || '').trim();

  // 1. Critical AI Security & Anomaly alerts MUST route directly to AI Security Hub
  if (
    type.includes('SECURITY') ||
    type.includes('ANOMALY') ||
    entityType === 'security' ||
    entityType === 'anomaly' ||
    title.includes('anomaly') ||
    title.includes('security alert') ||
    n.metadata?.anomaly_type
  ) {
    return entityId ? `/ai_security?search=${encodeURIComponent(entityId)}` : '/ai_security';
  }

  // 2. Invoice notifications (normal flow)
  if (type.includes('INVOICE') || entityType === 'invoice') {
    if (n.action_url && n.action_url.startsWith('/add_box_to_invoice/')) {
      return n.action_url;
    }
    if (n.metadata?.invoice?.id) {
      return `/add_box_to_invoice/${n.metadata.invoice.id}`;
    }
    return '/view_invoice';
  }

  if (
    type.includes('GATE') ||
    type.includes('BARCODE') ||
    type.includes('SCAN') ||
    type.includes('DUPLICATE') ||
    entityType === 'gate_risk' ||
    entityType === 'gate' ||
    (type.includes('RISK') && !type.includes('INVOICE'))
  ) {
    return entityId ? `/ai_gate_risk?search=${encodeURIComponent(entityId)}` : '/ai_gate_risk';
  }

  if (type.includes('BRIEFING') || entityType === 'security_briefing') {
    return '/ai_security_briefing';
  }

  if (type.includes('BOX') || entityType === 'box') {
    return '/view_box';
  }

  if (type.includes('PACKING') || entityType === 'packing') {
    return '/view_packing';
  }

  if (type.includes('STOCK') || entityType === 'stock') {
    return '/part_stock';
  }

  if (type.includes('USER') || entityType === 'user') {
    return '/erp_users';
  }

  return '/notifications';
};
