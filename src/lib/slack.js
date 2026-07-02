// Slack DM utility function
const VERCEL_API_URL = 'https://meetflow-6x52m87oz-tmprtx5090-9818s-projects.vercel.app/api/send-dm';

export async function sendSlackDM(email, message) {
  try {
    const response = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      ok: data.ok !== false,
      error: data.error || null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Network error',
    };
  }
}
