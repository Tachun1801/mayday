# 02 — Mô hình nghiệp vụ

Tên bảng/quan hệ chính đã xác minh dưới đây theo DDL local; inventory đầy đủ và constraint notes ở [schema map](../project-schema-map.md), chi tiết cột/FK ở [mayday.sql](../mayday.sql).

| Khái niệm | Mô hình hiện có |
|---|---|
| Người và tài khoản | nguoi là danh tính; taikhoan giữ thông tin đăng nhập; benhnhan/nhanvien là subtype. Không đồng nhất account/person/patient/staff IDs |
| Quyền | taikhoan → vaitro, role–permission qua vaitroquyenhan/quyenhan; không role cha/endpoint persistence |
| Tổ chức | nhanvien, khoaphong và phongkham gắn chinhanh; không có quan hệ FK phòng→khoa |
| Bệnh án | hosobenhan + benhanmaydaycap/benhanmaydayman; một hồ sơ có nhiều phienkham + subtype CAP/MAN |
| Phụ trách khám | phienkham.ma_bac_si trỏ nhanvien; quyền phân công phải kiểm tra trên đúng record/visit |
| Chi tiết lâm sàng | Các bảng tiền sử/hoàn cảnh/nhiễm trùng và sinh hiệu/tổn thương chuyên biệt; không dynamic template/answers |
| Đơn/kết quả | donthuoc + chitietdonthuoc/chidanngungthuoc; ketquacanlamsang + subtype, không lab-request header/items |
| Theo dõi | nhatkyuashangngay, chukytheodoiuas7 và đánh giá; AAS/PROMs/nghiệm pháp/screening có bảng nhưng chưa mở scope đầy đủ |
| Ảnh | dottonthuongda → vitritonthuong/anhchuptonthuong; tepdinhkem gắn record, object store riêng tư |

Hồ sơ và phiên khám là hai thực thể khác nhau. Tạo cha/subtype trong cùng transaction; assignment ở phiên không phải một cột assigned_doctor_id ở hồ sơ. Patient sở hữu record vẫn không có quyền chỉnh nội dung bác sĩ.

Luồng writable đã duyệt: **draft → in_progress → completed**, do assigned doctor; completed không reopen. Pending/cancelled legacy có thể đọc, không có accept/cancel API trong phạm vi hiện tại. [Flows](10_BUSINESS_FLOWS.md) và [contract](../current-api.md) ghi thao tác cụ thể.

HSS là sẩn phù, ISS là ngứa; AUAS/AI là dữ liệu hỗ trợ từ service ngoài nếu được tích hợp, không kết luận chẩn đoán. Weekly UAS và các thang mở rộng chưa được suy công thức từ DDL. Missing persistence và policy tại [decisions](11_DECISIONS_AND_GAPS.md).
