import { businessPath } from './business-path.js'
import { ApiError } from './request.js'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export function createMediaClient(client, baseUrl = '/') {
  function failure(error) {
    if (error instanceof ApiError) return error
    const result = new ApiError(error.response?.status || 0)
    if (result.status === 413) result.message = 'Mỗi ảnh phải có kích thước tối đa 5 MB.'
    if (result.status === 415) result.message = 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.'
    return result
  }
  return {
    async uploadImage(path, file, { token, signal } = {}) {
      try {
        if (!IMAGE_TYPES.includes(file.type) || file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new ApiError(400)
        const response = await client.request({ url: businessPath(path, baseUrl), method: 'POST', data: file, signal, timeout: 45000,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) } })
        const data = response.data?.data
        if (response.data?.code !== '1000' || typeof data?.id !== 'string' || !/^[1-9]\d*$/.test(data.id)) throw new ApiError(500)
        return data
      } catch (error) { if (signal?.aborted) throw error; throw failure(error) }
    },
    async fetchImage(path, { token, signal } = {}) {
      try {
        const response = await client.request({ url: businessPath(path, baseUrl), responseType: 'blob', signal, timeout: 20000, headers: { Authorization: `Bearer ${token}`, Accept: 'image/jpeg,image/png,image/webp' } })
        const mime = response.headers['content-type']?.split(';')[0].trim()
        if (!IMAGE_TYPES.includes(mime) || !(response.data instanceof Blob) || response.data.type !== mime || !response.data.size || response.data.size > MAX_IMAGE_BYTES) throw new ApiError(500)
        return response.data
      } catch (error) { if (signal?.aborted) throw error; throw failure(error) }
    },
  }
}
