# Hệ Thống Quản Lý Khách Hàng - SmileCare Dental CRM

Dự án quản lý thông tin khách hàng và dịch vụ nha khoa, vận hành toàn diện bằng **PM2 Process Manager**.

---

## 🚀 Cài Đặt và Khởi Động

### 1. Cài Đặt Ban Đầu (Chỉ làm 1 lần)

1. Cài đặt các gói phụ thuộc (dependencies):
   ```bash
   # Cài đặt cho Backend
   cd backend
   npm install

   # Cài đặt cho Frontend
   cd ../frontend
   npm install

   cd ..
   ```

2. Cài đặt PM2 toàn cục (nếu máy chưa có):
   ```bash
   npm install -g pm2
   ```

---

## ⚡ Vận Hành Với PM2

Hệ thống được quản lý thông qua file cấu hình `ecosystem.config.cjs`.

### Khởi động hệ thống
```bash
pm2 start ecosystem.config.cjs
```

### Xem danh sách tiến trình đang chạy
```bash
pm2 ls
```

### Xem log hệ thống thời gian thực
```bash
pm2 logs
# hoặc xem riêng backend:
pm2 logs dental-backend
# xem riêng frontend:
pm2 logs dental-frontend
```

### Dừng hệ thống
```bash
pm2 stop ecosystem.config.cjs
```

### Khởi động lại hệ thống
```bash
pm2 restart ecosystem.config.cjs
```

---

## 🔐 Tài Khoản Đăng Nhập Mặc Định

| Mục | Thông tin |
| :--- | :--- |
| **URL Web** | http://localhost:5173 (Frontend) |
| **Backend API** | http://localhost:4000/api |
| **Tên đăng nhập** | `admin` |
| **Mật khẩu** | `123` |

---

## ⚙️ Cấu Hình Tự Động Khởi Động Cùng Windows (Laptop Reboot)

Để PM2 tự động bật toàn bộ hệ thống mỗi khi bạn bật máy tính:

### Cách 1: Dùng thư mục Startup Windows (Không cần quyền Admin - Khuyên dùng)
1. Đảm bảo các app đang chạy:
   ```powershell
   pm2 start ecosystem.config.cjs
   ```
2. Lưu lại danh sách app:
   ```powershell
   pm2 save
   ```
3. Tạo file tự khởi động ngầm vào thư mục Windows Startup:
   ```powershell
   $startupPath = [Environment]::GetFolderPath('Startup')
   Set-Content -Path "$startupPath\pm2-autostart.vbs" -Value 'CreateObject("Wscript.Shell").Run "pm2 resurrect", 0, False'
   ```

### Cách 2: Dùng module `pm2-windows-startup` (Cần quyền Administrator)
1. Mở PowerShell với quyền **Run as Administrator**:
   ```powershell
   npm install -g pm2-windows-startup
   pm2-startup install
   ```
2. Lưu trạng thái PM2:
   ```powershell
   cd D:\Coder\dental-care-system
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

---

## 📁 Cấu Trúc Thư Mục

```
dental-care-system/
├── ecosystem.config.cjs     ← File cấu hình khởi chạy PM2
├── README.md                ← Hướng dẫn sử dụng chính
├── HUONG-DAN-CAI-DAT.md     ← Tài liệu kỹ thuật
├── backend/                 ← Backend API (Node.js/Express + SQLite)
│   ├── data/               ← Database SQLite clinic.db (KHÔNG ĐƯỢC XÓA!)
│   └── src/
└── frontend/               ← Frontend (React + Vite + Ant Design)
    └── src/
```

---

## 📝 Lưu Ý Quan Trọng

✅ **Nên làm:**
- Luôn định kỳ sao lưu file `backend/data/clinic.db` (chứa toàn bộ dữ liệu khách hàng).
- Chạy `pm2 save` sau mỗi lần thay đổi danh sách app để PM2 nhớ cấu hình.

❌ **Không nên:**
- Xóa thư mục `backend/data/` (sẽ mất toàn bộ dữ liệu).
- Sửa trực tiếp cơ sở dữ liệu khi PM2 đang ghi dữ liệu mà không thông qua API.

---

**Phiên bản:** 2.0.0 (PM2 Managed)  
