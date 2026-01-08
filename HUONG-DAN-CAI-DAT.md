# Hướng Dẫn Cài Đặt và Sử Dụng

## Yêu Cầu Hệ Thống

- Windows 7 trở lên
- Node.js phiên bản 18 trở lên (tải tại: https://nodejs.org/)

## Cài Đặt Lần Đầu

1. **Kiểm tra Node.js:**
   - Mở Command Prompt
   - Gõ lệnh: `node --version`
   - Nếu chưa có Node.js, tải và cài đặt từ: https://nodejs.org/

2. **Cài đặt ứng dụng:**
   - Double-click vào file `CAI-DAT-LAN-DAU.bat`
   - Đợi quá trình cài đặt hoàn tất (có thể mất 5-10 phút)

3. **Khởi động ứng dụng:**
   - Double-click vào file `KHOI-DONG-UNG-DUNG.bat`
   - Ứng dụng sẽ tự động mở trong trình duyệt tại: http://localhost:4000

## Sử Dụng Hàng Ngày

**Chỉ cần:**
- Double-click vào file `KHOI-DONG-UNG-DUNG.bat`
- Đợi 3-5 giây, trình duyệt sẽ tự động mở

**Để dừng ứng dụng:**
- Đóng cửa sổ "Backend Server" (cửa sổ màu đen)
- Hoặc đóng trình duyệt

## Cập Nhật Ứng Dụng

Khi có bản cập nhật mới:

1. Thay thế các file mới vào thư mục dự án
2. Chạy lại file `build-all.bat` để build lại
3. Sau đó chạy `KHOI-DONG-UNG-DUNG.bat` như bình thường

## Lưu Ý

- **Không xóa** thư mục `backend\data\` - đây là nơi lưu dữ liệu
- **Không đóng** cửa sổ Backend Server khi đang sử dụng
- Nếu cổng 4000 đã được sử dụng, thay đổi biến `PORT` trong file `.env` (nếu có)

## Gặp Vấn Đề?

1. **Ứng dụng không khởi động:**
   - Kiểm tra xem đã cài Node.js chưa
   - Chạy lại file `CAI-DAT-LAN-DAU.bat`

2. **Trang web không mở được:**
   - Kiểm tra xem cửa sổ Backend Server đã mở chưa
   - Thử mở trình duyệt thủ công: http://localhost:4000

3. **Lỗi cài đặt:**
   - Đảm bảo kết nối Internet ổn định
   - Kiểm tra quyền Administrator (click chuột phải > Run as administrator)

## Thông Tin Kỹ Thuật

- Backend chạy trên cổng: 4000
- Database: SQLite (lưu trong `backend\data\clinic.db`)
- Frontend: React + Vite

---

**Liên hệ hỗ trợ nếu cần thiết!**

