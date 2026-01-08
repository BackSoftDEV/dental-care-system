"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
require("./db");
dotenv_1.default.config();
// Tìm đường dẫn đến frontend/dist
// Giả định cấu trúc: root/backend/dist/server.js và root/frontend/dist/
const findFrontendDist = () => {
    // Khi chạy: cd backend && node dist/server.js
    // process.cwd() sẽ là backend/
    // Cần đi lên 1 cấp để đến root, rồi vào frontend/dist
    // Khi chạy từ batch file ở root: node backend/dist/server.js  
    // process.cwd() sẽ là root/
    // Cần vào frontend/dist trực tiếp
    const cwd = process.cwd();
    const possiblePaths = [
        path_1.default.resolve(cwd, '../frontend/dist'), // Từ backend/ -> root -> frontend/dist
        path_1.default.resolve(cwd, 'frontend/dist'), // Từ root/ -> frontend/dist
        path_1.default.resolve(cwd, '../../frontend/dist'), // Nếu đang ở backend/dist
    ];
    // Loại bỏ duplicates
    const uniquePaths = Array.from(new Set(possiblePaths));
    // Tìm đường dẫn tồn tại
    for (const distPath of uniquePaths) {
        const indexPath = path_1.default.join(distPath, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            console.log(`✅ Tìm thấy frontend tại: ${distPath}`);
            return distPath;
        }
    }
    // Debug: log tất cả thông tin
    console.error(`❌ Không tìm thấy frontend/dist!`);
    console.log(`📂 Working directory: ${cwd}`);
    console.log(`📂 Đã thử các đường dẫn:`);
    uniquePaths.forEach(p => {
        const exists = fs_1.default.existsSync(p);
        const indexPath = path_1.default.join(p, 'index.html');
        const indexExists = fs_1.default.existsSync(indexPath);
        console.log(`   ${exists ? (indexExists ? '✅' : '⚠️') : '❌'} ${p}`);
        if (exists && !indexExists) {
            console.log(`      (Thư mục tồn tại nhưng không có index.html)`);
        }
    });
    // Trả về đường dẫn đầu tiên (có thể thử serve dù không tìm thấy)
    return uniquePaths[0];
};
const app = (0, express_1.default)();
// CORS chỉ cần cho development
if (process.env.NODE_ENV !== 'production') {
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    }));
}
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/customers', customerRoutes_1.default);
// Serve static files từ frontend/dist trong production
if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = findFrontendDist();
    console.log(`📁 Serving static files từ: ${frontendDistPath}`);
    console.log(`📁 NODE_ENV: ${process.env.NODE_ENV}`);
    // Serve static files với options
    // Cache assets (JS, CSS) với hash trong tên - cache lâu
    // Không cache index.html để luôn load version mới
    app.use(express_1.default.static(frontendDistPath, {
        maxAge: '1y',
        etag: true,
        setHeaders: (res, path) => {
            // Không cache index.html để luôn load version mới
            if (path.endsWith('index.html')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        },
    }));
    // Tất cả các routes khác (không phải API) đều serve index.html (cho React Router)
    // Phải đặt sau tất cả các routes API và static files
    // Express 5.x không hỗ trợ '*' pattern, cần dùng middleware thay vì route
    app.use((req, res, next) => {
        // Bỏ qua nếu là API route
        if (req.path.startsWith('/api')) {
            return next();
        }
        // Serve index.html cho tất cả routes khác (React Router sẽ xử lý routing phía client)
        const indexPath = path_1.default.join(frontendDistPath, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            res.sendFile(path_1.default.resolve(indexPath), (err) => {
                if (err) {
                    console.error('❌ Lỗi khi serve index.html:', err);
                    res.status(500).send('Lỗi khi tải trang');
                }
            });
        }
        else {
            console.error(`❌ Không tìm thấy index.html tại: ${indexPath}`);
            res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Lỗi: Không tìm thấy Frontend</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Lỗi: Không tìm thấy Frontend</h1>
          <p>Frontend chưa được build.</p>
          <p>Vui lòng chạy file <strong>build-all.bat</strong> để build ứng dụng.</p>
          <p>Đường dẫn đã thử: <code>${indexPath}</code></p>
          <p>Working directory: <code>${process.cwd()}</code></p>
        </body>
        </html>
      `);
        }
    });
}
else {
    // Trong development, log thông tin
    console.log('⚠️  Running in development mode. Static files not served.');
}
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
    if (process.env.NODE_ENV === 'production') {
        console.log(`✅ Ứng dụng chạy tại http://localhost:${PORT}`);
        console.log(`✅ Mở trình duyệt tại http://localhost:${PORT} để sử dụng`);
    }
    else {
        console.log(`✅ Customer API chạy tại http://localhost:${PORT}`);
    }
});
//# sourceMappingURL=server.js.map