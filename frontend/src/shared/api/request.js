export class ApiError extends Error {
  constructor(status) {
    super(status === 400 ? 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.'
      : status === 409 ? 'Thông tin bị trùng hoặc trạng thái đã thay đổi. Vui lòng kiểm tra lại.'
        : status === 401 ? 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
      : status === 403 ? 'Bạn không có quyền truy cập nội dung này.'
        : status === 404 ? 'Không tìm thấy dữ liệu yêu cầu.'
          : 'Chưa thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu trước khi thử lại.')
    this.status = status
  }
}

export async function performRequest(client, path, { token, signal, method = 'GET', data } = {}) {
  try {
    const response = await client.request({
      url: path, method, signal, data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (response.data?.code !== '1000') throw new ApiError(response.status || 500)
    return response.data.data
  } catch (error) {
    if (signal?.aborted) throw error
    if (error instanceof ApiError) throw error
    throw new ApiError(error.response?.status || 0)
  }
}
