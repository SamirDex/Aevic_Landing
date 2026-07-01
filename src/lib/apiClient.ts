export const parseApiResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') || '';
  let payload: { error?: string } = {};

  if (contentType.includes('application/json')) {
    payload = (await response.json().catch(() => ({}))) as { error?: string };
  } else {
    const text = await response.text().catch(() => '');

    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(
        'API server işləmir (404). Netlify Functions deploy olunubmu yoxlayın — SUPABASE_SERVICE_ROLE_KEY və yenidən deploy lazımdır.',
      );
    }

    try {
      payload = JSON.parse(text) as { error?: string };
    } catch {
      throw new Error(text.trim() || 'Sorğu tamamlanmadı.');
    }
  }

  if (!response.ok) {
    if (response.status === 404 && !payload.error) {
      throw new Error('API tapılmadı (404). Zəhmət olmasa bir neçə dəqiqə sonra yenidən cəhd edin.');
    }

    throw new Error(payload.error || `Sorğu uğursuz oldu (${response.status}).`);
  }

  return payload as T;
};

export const getAdminHeaders = (): Record<string, string> => {
  // Cookie-based authentication is handled by the browser automatically
  // This function is kept for compatibility but returns empty headers
  // since cookies are sent automatically by the browser
  return {};
};
