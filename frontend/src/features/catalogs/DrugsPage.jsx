import { RemoteTable } from '../../shared/ui/DataView.jsx'
import { useState } from 'react'
import { CatalogForm } from './CatalogForm.jsx'

export function DrugsPage() {
  const [version, setVersion] = useState(0)
  return <CatalogContent key={version} reload={() => setVersion((value) => value + 1)} />
}
function CatalogContent({ reload }) {
  return <section><h1>Danh mục thuốc và đặc điểm sẩn phù</h1><CatalogForm kind="drugs" reload={reload} /><RemoteTable path="/catalogs/drugs" title="Thuốc" idField="ma_thuoc" search columns={[
    ['ma_thuoc', 'Mã thuốc'], ['ten_thuoc', 'Tên thuốc'], ['hoat_chat', 'Hoạt chất'], ['nhom_dieu_tri', 'Nhóm điều trị'],
  ]} renderDetails={(initial) => <CatalogForm kind="drugs" id={initial.ma_thuoc} initial={initial} reload={reload} />} />
    <CatalogForm kind="wheal-characteristics" reload={reload} /><RemoteTable path="/catalogs/wheal-characteristics" title="Đặc điểm sẩn phù" idField="ma_dac_diem_san_phu" columns={[
      ['ma_dac_diem_san_phu', 'Mã'], ['ten_dac_diem', 'Đặc điểm'], ['mo_ta', 'Mô tả'],
    ]} renderDetails={(initial) => <CatalogForm kind="wheal-characteristics" id={initial.ma_dac_diem_san_phu} initial={initial} reload={reload} />} />
  </section>
}
