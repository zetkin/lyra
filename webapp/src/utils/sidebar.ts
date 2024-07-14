export function openSidebar() {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty('--SideNavigation-slideIn', '1');
  }
}

export function closeSidebar() {
  if (typeof window !== 'undefined') {
    document.documentElement.style.removeProperty('--SideNavigation-slideIn');
  }
}

export function isSidebarOpen() {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const slideIn = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--SideNavigation-slideIn');
    return slideIn === '1';
  }
  return false;
}

export function toggleSidebar() {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (isSidebarOpen()) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
}
