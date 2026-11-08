import { apiClient } from './client.js'
import { businessPath } from './business-path.js'
import { performRequest } from './request.js'

export function requestApi(path, options) {
  return performRequest(apiClient, businessPath(path, import.meta.env.VITE_API_BASE_URL || '/'), options)
}
