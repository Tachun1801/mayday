// Health is a technical endpoint at the server root, outside the business prefix.
export function resolveHealthUrl(apiBaseUrl = '/', healthUrl = '') {
  if (healthUrl) return healthUrl
  if (/^https?:\/\//i.test(apiBaseUrl)) {
    return new URL('/health', apiBaseUrl).href
  }
  if (apiBaseUrl.startsWith('//')) {
    return `//${new URL(apiBaseUrl, 'https://placeholder.invalid').host}/health`
  }
  return '/health'
}
