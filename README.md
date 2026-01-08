# Hệ Thống Quản Lý Khách Hàng - SmileCare Dental CRM

## 🚀 Hướng Dẫn Cài Đặt Nhanh

### Cài Đặt Lần Đầu (Chỉ làm 1 lần)

1. **Cài đặt Node.js** (nếu chưa có)
   - Tải từ: https://nodejs.org/ (khuyến nghị phiên bản LTS)
   - Cài đặt và khởi động lại máy tính

2. **Cài đặt ứng dụng**
   - Double-click vào file `CAI-DAT-LAN-DAU.bat`
   - Đợi 5-10 phút để hoàn tất

### Sử Dụng Hàng Ngày

**Chỉ cần double-click vào file:** `KHOI-DONG-UNG-DUNG.bat`

- Ứng dụng sẽ tự động mở trình duyệt tại: http://localhost:4000
- Để dừng: Đóng cửa sổ "Backend Server" (cửa sổ màu đen)

## 📁 Cấu Trúc Thư Mục

```
QLKH/
├── CAI-DAT-LAN-DAU.bat      ← Chạy lần đầu tiên
├── KHOI-DONG-UNG-DUNG.bat   ← Chạy mỗi khi mở laptop
├── build-all.bat            ← Build lại khi có cập nhật
├── HUONG-DAN-CAI-DAT.md     ← Hướng dẫn chi tiết
├── backend/                 ← Backend API
│   ├── data/               ← Database (KHÔNG XÓA!)
│   └── dist/               ← Build output
└── frontend/               ← Frontend React
    └── dist/               ← Build output
```

## 🔧 Các File Script

### 1. `CAI-DAT-LAN-DAU.bat`
- Chạy lần đầu tiên sau khi nhận dự án
- Tự động cài đặt dependencies và build ứng dụng

### 2. `KHOI-DONG-UNG-DUNG.bat`
- **File chính** - Chạy mỗi khi muốn sử dụng ứng dụng
- Khởi động backend và mở trình duyệt tự động

### 3. `build-all.bat`
- Chạy khi có bản cập nhật mới
- Build lại backend và frontend

## 📝 Lưu Ý Quan Trọng

✅ **Nên làm:**
- Lưu file `backend/data/clinic.db` (chứa toàn bộ dữ liệu)
- Backup thư mục `backend/data/` định kỳ

❌ **Không nên:**
- Xóa thư mục `backend/data/`
- Xóa thư mục `node_modules/`
- Sửa code trong thư mục `dist/`

## 🌐 Truy Cập Ứng Dụng

- URL: http://localhost:4000
- Port mặc định: 4000 (có thể thay đổi trong file `.env`)

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Node.js chưa được cài đặt"
**Giải pháp:** Cài đặt Node.js từ https://nodejs.org/

### Lỗi: "Port 4000 đã được sử dụng"
**Giải pháp:** 
- Đóng các ứng dụng khác đang dùng cổng 4000
- Hoặc thay đổi PORT trong file `.env`

### Trang web không mở được
**Giải pháp:**
- Kiểm tra cửa sổ "Backend Server" đã mở chưa
- Thử mở thủ công: http://localhost:4000

### Mất dữ liệu
**Giải pháp:** 
- Luôn backup file `backend/data/clinic.db`
- Khôi phục từ backup nếu cần

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Đọc file `HUONG-DAN-CAI-DAT.md` để xem hướng dẫn chi tiết
2. Kiểm tra lại các bước cài đặt
3. Liên hệ người phát triển để được hỗ trợ

---

**Phiên bản:** 1.0.0  
**Ngày tạo:** 2024



