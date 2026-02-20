/**
 * Logo utility functions for displaying company logo in various contexts
 */

/**
 * Get the logo URL for use in HTML (print templates, etc.)
 * Returns the public path to the logo
 */
export function getLogoUrl(): string {
  // In Vite, files in public folder are served from root
  return '/assets/company-logo.png';
}

/**
 * Get logo as base64 data URL for use in PDFs
 * This will be loaded dynamically when needed
 */
export async function getLogoBase64(): Promise<string> {
  try {
    // Fetch the logo from public assets
    const response = await fetch(getLogoUrl());
    if (!response.ok) {
      throw new Error('Failed to load logo');
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert logo to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    // Return empty string if logo can't be loaded
    return '';
  }
}

/**
 * Get logo HTML img tag for use in HTML templates
 */
export function getLogoHtml(className = '', style = 'max-height: 80px; width: auto;'): string {
  const logoUrl = getLogoUrl();
  return `<img src="${logoUrl}" alt="Teamwork Physio International" class="${className}" style="${style}" />`;
}
