import companyLogoUrl from '../assets/company-logo.png?url';

export function getLogoUrl(): string {
  return companyLogoUrl;
}

export async function getLogoBase64(): Promise<string> {
  try {
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
    return '';
  }
}

export function getLogoHtml(className = '', style = 'max-height: 80px; width: auto;'): string {
  const logoUrl = getLogoUrl();
  return `<img src="${logoUrl}" alt="Teamwork physiotherapy centre International" class="${className}" style="${style}" />`;
}
