/**
 * Collaboration Cursor Utilities
 * Helper functions for rendering collaboration cursors
 */

/**
 * Generate consistent color for a user based on their ID
 * @param userId - User ID
 * @returns Hex color string
 */
export function getUserColor(userId: string): string {
  // Predefined nice colors for collaboration
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52D273', // Green
    '#FF8ED4', // Pink
    '#5DADE2', // Light Blue
  ];

  // Generate a consistent index from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Create custom cursor DOM element for collaboration
 * @param user - User information
 * @param options - Cursor styling options
 * @returns DOM element for cursor
 */
export function createCustomCursor(
  user: {
    id?: string;
    name: string;
    color: string;
    avatar?: string;
    email?: string;
  },
  options: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    showAvatar?: boolean;
  } = {}
): HTMLElement {
  const cursor = document.createElement('div');
  cursor.className = 'collaboration-cursor';
  
  // Cursor styling
  cursor.style.position = 'absolute';
  cursor.style.pointerEvents = 'none';
  cursor.style.userSelect = 'none';
  cursor.style.zIndex = '1000';
  cursor.style.transition = 'transform 0.2s ease-out';
  
  // Cursor pointer/caret
  const caret = document.createElement('div');
  caret.className = 'collaboration-cursor-caret';
  caret.style.position = 'absolute';
  caret.style.width = '2px';
  caret.style.height = '1.2em';
  caret.style.backgroundColor = user.color;
  caret.style.borderRadius = '1px';
  caret.style.transform = 'translateX(-50%)';
  
  // Cursor label
  const label = document.createElement('div');
  label.className = 'collaboration-cursor-label';
  label.style.position = 'absolute';
  label.style.top = '-1.5em';
  label.style.left = '0';
  label.style.padding = '2px 6px';
  label.style.borderRadius = '4px';
  label.style.backgroundColor = user.color;
  label.style.color = '#ffffff';
  label.style.fontSize = options.fontSize || '11px';
  label.style.fontFamily = options.fontFamily || "'Inter', 'Segoe UI', 'Roboto', sans-serif";
  label.style.fontWeight = options.fontWeight || '500';
  label.style.whiteSpace = 'nowrap';
  label.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
  
  // Add avatar if enabled and available
  if (options.showAvatar && user.avatar) {
    const avatar = document.createElement('img');
    avatar.src = user.avatar;
    avatar.alt = user.name;
    avatar.style.width = '14px';
    avatar.style.height = '14px';
    avatar.style.borderRadius = '50%';
    avatar.style.marginRight = '4px';
    avatar.style.verticalAlign = 'middle';
    avatar.style.display = 'inline-block';
    label.appendChild(avatar);
  }
  
  // Add user name
  const nameSpan = document.createElement('span');
  nameSpan.textContent = user.name;
  nameSpan.style.verticalAlign = 'middle';
  label.appendChild(nameSpan);
  
  // Assemble cursor
  cursor.appendChild(caret);
  cursor.appendChild(label);
  
  return cursor;
}

/**
 * Get contrasting text color (white or black) based on background color
 * @param hexColor - Background color in hex format
 * @returns '#ffffff' or '#000000'
 */
export function getContrastingTextColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Lighten or darken a color
 * @param hexColor - Color in hex format
 * @param percent - Percentage to lighten (positive) or darken (negative)
 * @returns Modified hex color
 */
export function adjustColorBrightness(hexColor: string, percent: number): string {
  const color = hexColor.replace('#', '');
  const num = parseInt(color, 16);
  
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
