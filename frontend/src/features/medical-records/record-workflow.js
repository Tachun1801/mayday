export function nextRecordAction(status) {
  if (status === 'draft') return { status: 'in_progress', label: 'Bắt đầu khám' }
  if (status === 'in_progress') return { status: 'completed', label: 'Hoàn tất hồ sơ' }
  return null
}

export function validateStatusResponse(data, recordId, target) {
  if (!data || data.id !== String(recordId) || data.status !== target) {
    throw new Error('Phản hồi trạng thái chưa hợp lệ. Vui lòng tải lại hồ sơ để kiểm tra trước khi thao tác tiếp.')
  }
  return data
}
