import { Link } from 'react-router-dom'
import { Fragment, useId, useState } from 'react'
import { useResource } from '../use-resource.js'

function showValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (typeof value === 'object') return '—'
  return String(value)
}

export function ResourceState({ loading, error, retry }) {
  if (loading) return <p role="status">Đang tải dữ liệu…</p>
  if (error) return <div role="alert" className="error"><p>{error}</p><button type="button" onClick={retry}>Thử lại</button></div>
  return null
}

export function FieldDetails({ record, fields }) {
  return <dl className="details">{fields.map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{showValue(field.split('.').reduce((value, part) => value?.[part], record))}</dd></div>)}</dl>
}

export function DetailView({ path, fields, children, dataKey }) {
  const state = useResource(path)
  if (state.loading || state.error) return <ResourceState {...state} />
  const record = dataKey ? state.data?.[dataKey] : state.data
  if (!record) return <p>Chưa có dữ liệu.</p>
  return <><FieldDetails record={record} fields={fields} />{typeof children === 'function' ? children(record, state.retry) : children}</>
}

export function DataTable({ items, columns, idField, detailBase, title = 'Danh sách dữ liệu', renderDetails }) {
  if (!Array.isArray(items)) return <p role="alert">Phản hồi danh sách không hợp lệ.</p>
  if (items.length === 0) return <p>Chưa có dữ liệu phù hợp.</p>
  return <div className="table-scroll"><table><caption className="sr-only">{title}</caption><thead><tr>{columns.map(([field, label]) => <th key={field} scope="col">{label}</th>)}{detailBase && <th scope="col">Chi tiết</th>}</tr></thead>
    <tbody>{items.map((item) => <Fragment key={String(item[idField])}><tr>{columns.map(([field]) => <td key={field}>{showValue(item[field])}</td>)}{detailBase && <td><Link to={`${detailBase}/${encodeURIComponent(item[idField])}`}>Xem <span className="sr-only">{showValue(item[idField])}</span></Link></td>}</tr>
      {renderDetails && <tr><td colSpan={columns.length + (detailBase ? 1 : 0)}><details><summary>Xem chi tiết {showValue(item[idField])}</summary>{renderDetails(item)}</details></td></tr>}
    </Fragment>)}</tbody>
  </table></div>
}

export function RemoteTable(props) {
  // Changing resources must also reset pagination and search, including when a
  // route reuses the same component for another patient or medical record.
  return <ResourceTable key={props.path} {...props} />
}

export function Pagination({ page, total, limit = 20, title = 'danh sách', onChange }) {
  return <nav aria-label={`Phân trang ${title}`} className="pagination">
    <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Trước</button>
    <span>Trang {page} · {showValue(total)} bản ghi</span>
    <button type="button" disabled={page * limit >= Number(total)} onClick={() => onChange(page + 1)}>Sau</button>
  </nav>
}

function ResourceTable({ path, columns, idField, detailBase, search = false, title, renderDetails }) {
  const searchId = useId()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (keyword) query.set('keyword', keyword)
  const state = useResource(`${path}?${query}`)
  const items = state.data?.items
  function submit(event) {
    event.preventDefault()
    setKeyword(String(new FormData(event.currentTarget).get('keyword')).trim())
    setPage(1)
  }
  return <div className="data-block">
    {title && <h2>{title}</h2>}
    {search && <form className="search" onSubmit={submit}><label htmlFor={searchId}>Tìm kiếm<input id={searchId} name="keyword" placeholder="Nhập từ khóa" maxLength={100} /></label><button type="submit" disabled={state.loading}>Tìm</button></form>}
    <ResourceState {...state} />
    {!state.loading && !state.error && <>
      <DataTable items={items} columns={columns} idField={idField} detailBase={detailBase} title={title} renderDetails={renderDetails} />
      {Array.isArray(items) && <Pagination page={page} total={state.data.total} onChange={setPage} title={title} />}
    </>}
  </div>
}
