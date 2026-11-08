import { useState } from 'react'
import { RemoteTable } from '../../shared/ui/DataView.jsx'
import { PrivateImage } from '../media/MediaPanel.jsx'
import { LesionCreateForm, LesionPhotoForm } from './LesionForms.jsx'
function EpisodeDetails({ path, recordPath, writable }) {
  const [version, setVersion] = useState(0), reload = () => setVersion((value) => value + 1)
  return <div key={version}>
    {writable && <LesionCreateForm path={`${path}/locations`} location reload={reload} />}
    <RemoteTable path={`${path}/locations`} title="Vị trí tổn thương" idField="ma_vi_tri_ton_thuong" columns={[
      ['ma_vi_tri_ton_thuong', 'Mã vị trí'], ['vi_tri_co_the', 'Vị trí cơ thể'], ['thoi_diem_xuat_hien', 'Xuất hiện'], ['ten_thuoc_lien_quan', 'Thuốc liên quan đã ghi nhận'],
    ]} />
    {writable && <LesionPhotoForm path={`${path}/photos`} reload={reload} />}
    <RemoteTable path={`${path}/photos`} title="Ảnh và thông tin tiến triển" idField="ma_anh" columns={[
      ['ma_anh', 'Mã ảnh'], ['ma_vi_tri_ton_thuong', 'Mã vị trí'], ['thoi_diem_chup', 'Thời điểm chụp'], ['moc_tien_trien', 'Mốc tiến triển đã lưu'],
      ['diem_ngua_nrs', 'Ngứa NRS'], ['diem_dau_nrs', 'Đau NRS'], ['diem_bong_rat_nrs', 'Bỏng rát NRS'], ['so_luong_not_san', 'Số nốt sẩn đã ghi nhận'],
    ]} renderDetails={(item) => <><PrivateImage path={`${recordPath}/attachments/${encodeURIComponent(item.ma_tep_dinh_kem)}/content`} />
      {writable && <LesionPhotoForm path={`${path}/photos/${encodeURIComponent(item.ma_anh)}`} initial={item} reload={reload} />}
    </>} />
  </div>
}
export function LesionHistory({ recordPath, writable = false }) {
  const [version, setVersion] = useState(0), reload = () => setVersion((value) => value + 1)
  return <div key={version}>
    {writable && <LesionCreateForm path={`${recordPath}/lesions`} reload={reload} />}
    <RemoteTable path={`${recordPath}/lesions`} title="Các đợt tổn thương da" idField="ma_dot_ton_thuong_da" columns={[
      ['ma_dot_ton_thuong_da', 'Mã đợt'], ['ten_dot_ton_thuong_da', 'Tên đợt'], ['thoi_diem_xuat_hien', 'Thời điểm xuất hiện'], ['hoan_canh_xuat_hien', 'Hoàn cảnh đã ghi nhận'],
    ]} renderDetails={(item) => <EpisodeDetails recordPath={recordPath} writable={writable} path={`${recordPath}/lesions/${encodeURIComponent(item.ma_dot_ton_thuong_da)}`} />} />
  </div>
}
