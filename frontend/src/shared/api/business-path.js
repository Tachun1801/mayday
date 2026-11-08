export function businessPath(path, baseUrl = '/') {
  const cleanPath = path.replace(/^\/+/, '')
  const basePath = /^https?:\/\//i.test(baseUrl)
    ? new URL(baseUrl).pathname
    : baseUrl
  return /\/api\/v1\/?$/.test(basePath) ? cleanPath : `api/v1/${cleanPath}`
}
