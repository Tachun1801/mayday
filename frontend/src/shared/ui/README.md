# Shared UI

DataView.jsx cung cấp ResourceState, FieldDetails, DetailView, DataTable, Pagination và RemoteTable. Feature chọn fields/cột; không render raw JSON. Giữ false/zero/decimal, React escape text; details/summary hỗ trợ bàn phím. RemoteTable phân trang 20 rows, search submit ≤100 ký tự; trang rỗng vẫn có nút Trước.

MutationStatus.jsx hiển thị controlled error/readback từ use-mutation; không quyết định quyền hoặc tự retry. Tests rendering.test.js bundle JSX/React server render, không thay browser interaction.
