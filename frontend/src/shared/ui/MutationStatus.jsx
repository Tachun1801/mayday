export function MutationStatus({ mutation, reload }) {
  return <>
    {mutation.error && <p role="alert" className="error">{mutation.error}</p>}
    {mutation.requiresReadback && <p role="status">Cần đọc lại dữ liệu server trước thao tác tiếp theo. Không gửi lại tự động.</p>}
    {mutation.requiresReadback && reload && <button type="button" className="secondary" onClick={reload}>Đọc lại dữ liệu</button>}
  </>
}
