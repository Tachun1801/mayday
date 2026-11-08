export function inputValue(value, rule) {
  if (value == null) return ''
  if (rule.type === 'boolean') return value ? 'true' : 'false'
  if (rule.type === 'timestamp') return typeof value === 'string' ? value : ''
  if (typeof value === 'object') {
    if (rule.type !== 'interval') return ''
    const { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0 } = value
    if ([years, months, days, hours, minutes, seconds, milliseconds].some((n) => !Number.isFinite(n) || n < 0)) return ''
    return `P${years}Y${months}M${days}DT${hours}H${minutes}M${seconds + milliseconds / 1000}S`
  }
  return String(value)
}
export function changedFields(data, prefix, definitions, initial) {
  const result = {}
  for (const [field, rule] of Object.entries(definitions)) {
    const value = String(data.get(`${prefix}${field}`) ?? '')
    if (value === inputValue(initial?.[field], rule)) continue
    if (value !== '' && rule.type === 'integer' && (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < rule.min || Number(value) > rule.max)) {
      throw new Error('Giá trị đếm phải là số nguyên trong giới hạn cho phép.')
    }
    result[field] = value === '' ? null : rule.type === 'boolean' ? value === 'true' : rule.type === 'integer' ? Number(value) : value
  }
  return result
}

