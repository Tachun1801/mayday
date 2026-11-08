import { useEffect, useId, useRef, useState } from 'react'
import { useSession } from '../auth/context.js'
import { useResource } from '../../shared/use-resource.js'
import { DataTable, Pagination, ResourceState } from '../../shared/ui/DataView.jsx'
import { fetchImage, uploadImage, IMAGE_TYPES, MAX_IMAGE_BYTES } from '../../shared/api/media.js'

export function PrivateImage({ path }) {
  const { session, signOut } = useSession()
  const [url, setUrl] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const request = useRef(null), objectUrl = useRef('')
  useEffect(() => () => { request.current?.abort(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current) }, [])
  function hide() { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current = ''; setUrl('') }
  async function view() {
    if (request.current) return
    const controller = new AbortController(); request.current = controller; setLoading(true); setError('')
    try {
      const blob = await fetchImage(path, { token: session.token, signal: controller.signal })
      if (controller.signal.aborted) return
      objectUrl.current = URL.createObjectURL(blob); setUrl(objectUrl.current)
    } catch (failure) { if (!controller.signal.aborted) { if (failure.status === 401) signOut(); else setError(failure.message) } }
    finally { if (!controller.signal.aborted) { request.current = null; setLoading(false) } }
  }
  return <div>
    {url ? <><img className="private-image" src={url} alt="Ảnh đính kèm hồ sơ, chỉ hiển thị sau khi kiểm tra quyền" onError={() => { hide(); setError('Ảnh không thể hiển thị. Vui lòng kiểm tra tệp gốc trước khi tải lại.') }} /><button type="button" onClick={hide}>Ẩn ảnh</button></>
      : <button type="button" disabled={loading} onClick={view}>{loading ? 'Đang tải ảnh…' : 'Xem ảnh được cấp quyền'}</button>}
    {error && <p role="alert">{error}</p>}
  </div>
}
function UploadForm({ path, blocked, onFinished }) {
  const { session, signOut } = useSession()
  const id = useId(), request = useRef(null)
  const [pending, setPending] = useState(false), [error, setError] = useState('')
  useEffect(() => () => request.current?.abort(), [])
  async function submit(event) {
    event.preventDefault()
    if (request.current || blocked) return
    const files = Array.from(new FormData(event.currentTarget).getAll('images')).filter((file) => file.size)
    if (!files.length || files.length > 10 || files.some((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES)) { setError('Chọn 1–10 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 5 MB.'); return }
    const controller = new AbortController(); request.current = controller; setPending(true); setError('')
    let uploaded = 0, failureMessage = ''
    try {
      // Each request is atomic. A batch can partially succeed; never resend
      // completed files or retry an uncertain mutation automatically.
      for (const file of files) {
        await uploadImage(path, file, { token: session.token, signal: controller.signal })
        uploaded++
      }
    } catch (failure) { if (!controller.signal.aborted) { if (failure.status === 401) signOut(); else failureMessage = failure.message } }
    finally {
      if (!controller.signal.aborted) {
        request.current = null; setPending(false)
        onFinished({ uploaded, total: files.length, error: failureMessage })
      }
    }
  }
  return <form className="intake-form" onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending || blocked}><legend>Thêm ảnh lâm sàng riêng tư</legend>
      <label htmlFor={id}>Ảnh JPEG/PNG/WebP (tối đa 10 ảnh/lượt, 5 MB/ảnh)<input id={id} name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></label>
      <p>Mỗi ảnh lưu riêng. Nếu một ảnh lỗi, dừng lượt tải và kiểm tra danh sách trước khi gửi tiếp.</p><button type="submit">{pending ? 'Đang tải và lưu ảnh…' : 'Tải ảnh lên hồ sơ'}</button>
    </fieldset>{error && <p role="alert">{error}</p>}
  </form>
}
export function MediaPanel({ recordPath, writable = false }) {
  const [page, setPage] = useState(1), [notice, setNotice] = useState(''), [needsReadback, setNeedsReadback] = useState(false)
  const path = `${recordPath}/attachments`, state = useResource(`${path}?page=${page}&limit=20`)
  function finished(result) {
    setNotice(`${result.uploaded}/${result.total} ảnh đã có xác nhận lưu thành công.${result.error ? ` ${result.error} Kiểm tra danh sách trước khi gửi tiếp.` : ''}`)
    setNeedsReadback(Boolean(result.error)); setPage(1); state.retry()
  }
  return <section aria-label="Ảnh đính kèm riêng tư"><h2>Ảnh đính kèm hồ sơ</h2>
    {notice && <p role="status">{notice}</p>}
    <ResourceState {...state} />
    {!state.loading && !state.error && <>
      {writable && <UploadForm path={path} blocked={needsReadback} onFinished={finished} />}
      {needsReadback && <button type="button" onClick={() => { setNeedsReadback(false); state.retry() }}>Đọc lại danh sách trước khi tiếp tục</button>}
      <DataTable items={state.data?.items} idField="id" title="Ảnh đính kèm" columns={[
        ['id', 'Mã tệp'], ['ten_tep_goc', 'Tên tệp'], ['dinh_dang_tep', 'Định dạng'], ['dung_luong_byte', 'Dung lượng (byte)'], ['thoi_diem_tao', 'Thời điểm lưu'],
      ]} renderDetails={(item) => ['jpg', 'png', 'webp'].includes(item.dinh_dang_tep) ? <PrivateImage path={`${path}/${encodeURIComponent(item.id)}/content`} /> : <p>Chưa hỗ trợ xem trực tiếp định dạng này.</p>} />
      {Array.isArray(state.data?.items) && <Pagination page={page} total={state.data.total} onChange={setPage} title="ảnh đính kèm" />}
    </>}
  </section>
}
