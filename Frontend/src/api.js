const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

export function apiUrl(path) {
  if (!configuredBackendUrl) {
    throw new Error(
      "The analysis service is not configured. Set VITE_BACKEND_URL to the public HTTPS backend URL and redeploy the frontend."
    );
  }

  return `${configuredBackendUrl.replace(/\/+$/, "")}${path}`;
}

export async function readApiResponse(response) {
  const body = await response.text();

  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error(
      `The analysis service returned an invalid response (HTTP ${response.status}). Check VITE_BACKEND_URL and the backend deployment.`
    );
  }
}
