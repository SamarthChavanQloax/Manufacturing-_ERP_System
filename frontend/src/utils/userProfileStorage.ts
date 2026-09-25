export const ROLE_DEFAULT_COLORS: Record<string, string> = {
  admin: '#0284c7',   // Admin Cyan / Slate Blue
  packing: '#16a34a', // Emerald Green
  box: '#d97706',     // Amber Orange
  invoice: '#dc2626', // Crimson Red
  gate: '#7c3aed',    // Royal Purple
};

export const getRoleDefaultColor = (role?: string): string => {
  if (!role) return '#0284c7';
  return ROLE_DEFAULT_COLORS[role.toLowerCase()] || '#0284c7';
};

export const getUserStorageKey = (u?: { id?: number; type?: string; user_name?: string } | null): string => {
  if (!u) return 'guest';
  const role = (u.type || 'admin').toLowerCase();
  const id = u.id || 0;
  return `${id}_${role}`;
};

export const getUserAvatarColor = (u?: { id?: number; type?: string; user_name?: string } | null): string => {
  if (!u) return '#0284c7';
  const key = getUserStorageKey(u);
  const saved = localStorage.getItem(`user_avatar_color_${key}`);
  if (saved) return saved;
  return getRoleDefaultColor(u.type);
};

export const setUserAvatarColor = (u: { id?: number; type?: string; user_name?: string } | null, color: string): void => {
  if (!u) return;
  const key = getUserStorageKey(u);
  localStorage.setItem(`user_avatar_color_${key}`, color);
  window.dispatchEvent(new Event('avatar_color_changed'));
};

export const getUserProfilePhoto = (u?: { id?: number; type?: string; user_name?: string } | null): string => {
  if (!u) return '';
  const key = getUserStorageKey(u);
  return localStorage.getItem(`user_profile_photo_${key}`) || '';
};

export const setUserProfilePhoto = (u: { id?: number; type?: string; user_name?: string } | null, photoBase64: string): void => {
  if (!u) return;
  const key = getUserStorageKey(u);
  if (photoBase64) {
    localStorage.setItem(`user_profile_photo_${key}`, photoBase64);
  } else {
    localStorage.removeItem(`user_profile_photo_${key}`);
  }
  window.dispatchEvent(new Event('avatar_color_changed'));
};
