import { apiClient } from './client.js'
import { createMediaClient } from './media-request.js'
export { IMAGE_TYPES, MAX_IMAGE_BYTES } from './media-request.js'
export function uploadImage(path, file, options) { return createMediaClient(apiClient, import.meta.env.VITE_API_BASE_URL || '/').uploadImage(path, file, options) }
export function fetchImage(path, options) { return createMediaClient(apiClient, import.meta.env.VITE_API_BASE_URL || '/').fetchImage(path, options) }
