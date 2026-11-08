import { apiClient } from '../../shared/api/client.js'
import { resolveHealthUrl } from '../../shared/api/health-url.js'

const healthUrl = resolveHealthUrl(
  import.meta.env.VITE_API_BASE_URL || '/',
  import.meta.env.VITE_HEALTH_URL || '',
)

export async function fetchSystemStatus(signal) {
  const { data } = await apiClient.get(healthUrl, { baseURL: '/', signal })
  if (data.status !== 'ok') throw new Error('Unexpected health response')
  return data
}
