import { RemoteTable } from '../../shared/ui/DataView.jsx'
import { useState } from 'react'
import { CatalogForm } from '../catalogs/CatalogForm.jsx'

export function FacilitiesPage() {
  const [version, setVersion] = useState(0)
  return <FacilitiesContent key={version} reload={() => setVersion((value) => value + 1)} />
}
function FacilitiesContent({ reload }) {
  return <section><h1>Cơ sở y tế</h1>
    <RemoteTable title="Chi nhánh" path="/facilities/branches" idField="ma_chi_nhanh" columns={[
      ['ma_chi_nhanh', 'Mã'], ['ten_chi_nhanh', 'Chi nhánh'], ['dia_chi', 'Địa chỉ'], ['so_dien_thoai', 'Điện thoại'],
    ]} renderDetails={(initial) => <CatalogForm kind="branches" id={initial.ma_chi_nhanh} initial={initial} reload={reload} />} />
    <CatalogForm kind="departments" reload={reload} />
    <RemoteTable title="Khoa/phòng" path="/facilities/departments" idField="ma_khoa_phong" columns={[
      ['ma_khoa_phong', 'Mã'], ['ten_khoa_phong', 'Khoa/phòng'], ['loai_khoa', 'Loại'], ['ma_chi_nhanh', 'Mã chi nhánh'],
    ]} renderDetails={(initial) => <CatalogForm kind="departments" id={initial.ma_khoa_phong} initial={initial} reload={reload} />} />
    <CatalogForm kind="rooms" reload={reload} />
    <RemoteTable title="Phòng khám" path="/facilities/rooms" idField="ma_phong_kham" columns={[
      ['ma_phong_kham', 'Mã'], ['ten_phong_kham', 'Phòng khám'], ['ma_chi_nhanh', 'Mã chi nhánh'],
    ]} renderDetails={(initial) => <CatalogForm kind="rooms" id={initial.ma_phong_kham} initial={initial} reload={reload} />} />
  </section>
}
