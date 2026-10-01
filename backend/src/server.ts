import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import fs from 'fs'
import customerRoutes from './routes/customerRoutes'
import authRoutes from './routes/authRoutes'
import { requireAuth } from './middleware/authMiddleware'
import './db'

dotenv.config()

// Tìm đường dẫn đến frontend/dist
// Giả định cấu trúc: root/backend/dist/server.js và root/frontend/dist/
const findFrontendDist = (): string => {
  // Khi chạy: cd backend && node dist/server.js
  // process.cwd() sẽ là backend/
  // Cần đi lên 1 cấp để đến root, rồi vào frontend/dist
  
  // Khi chạy từ batch file ở root: node backend/dist/server.js  
  // process.cwd() sẽ là root/
  // Cần vào frontend/dist trực tiếp
  
  const cwd = process.cwd()
  const possiblePaths = [
    path.resolve(cwd, '../frontend/dist'), // Từ backend/ -> root -> frontend/dist
    path.resolve(cwd, 'frontend/dist'),    // Từ root/ -> frontend/dist
    path.resolve(cwd, '../../frontend/dist'), // Nếu đang ở backend/dist
  ]
  
  // Loại bỏ duplicates
  const uniquePaths = Array.from(new Set(possiblePaths))
  
  // Tìm đường dẫn tồn tại
  for (const distPath of uniquePaths) {
    const indexPath = path.join(distPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      console.log(`✅ Tìm thấy frontend tại: ${distPath}`)
      return distPath
    }
  }
  
  // Debug: log tất cả thông tin
  console.error(`❌ Không tìm thấy frontend/dist!`)
  console.log(`📂 Working directory: ${cwd}`)
  console.log(`📂 Đã thử các đường dẫn:`)
  uniquePaths.forEach(p => {
    const exists = fs.existsSync(p)
    const indexPath = path.join(p, 'index.html')
    const indexExists = fs.existsSync(indexPath)
    console.log(`   ${exists ? (indexExists ? '✅' : '⚠️') : '❌'} ${p}`)
    if (exists && !indexExists) {
      console.log(`      (Thư mục tồn tại nhưng không có index.html)`)
    }
  })
  
  // Trả về đường dẫn đầu tiên (có thể thử serve dù không tìm thấy)
  return uniquePaths[0]
}

const app = express()

// CORS chỉ cần cho development
if (process.env.NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    }),
  )
}

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/customers', requireAuth, customerRoutes)

// Serve static files từ frontend/dist trong production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = findFrontendDist()
  
  console.log(`📁 Serving static files từ: ${frontendDistPath}`)
  console.log(`📁 NODE_ENV: ${process.env.NODE_ENV}`)
  
  // Serve static files với options
  // Cache assets (JS, CSS) với hash trong tên - cache lâu
  // Không cache index.html để luôn load version mới
  app.use(express.static(frontendDistPath, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, path) => {
      // Không cache index.html để luôn load version mới
      if (path.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }
    },
  }))

  // Tất cả các routes khác (không phải API) đều serve index.html (cho React Router)
  // Phải đặt sau tất cả các routes API và static files
  // Express 5.x không hỗ trợ '*' pattern, cần dùng middleware thay vì route
  app.use((req, res, next) => {
    // Bỏ qua nếu là API route
    if (req.path.startsWith('/api')) {
      return next()
    }
    
    // Serve index.html cho tất cả routes khác (React Router sẽ xử lý routing phía client)
    const indexPath = path.join(frontendDistPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(path.resolve(indexPath), (err) => {
        if (err) {
          console.error('❌ Lỗi khi serve index.html:', err)
          res.status(500).send('Lỗi khi tải trang')
        }
      })
    } else {
      console.error(`❌ Không tìm thấy index.html tại: ${indexPath}`)
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
      `)
    }
  })
} else {
  // Trong development, log thông tin
  console.log('⚠️  Running in development mode. Static files not served.')
}

const PORT = Number(process.env.PORT) || 4000

app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`✅ Ứng dụng chạy tại http://localhost:${PORT}`)
    console.log(`✅ Mở trình duyệt tại http://localhost:${PORT} để sử dụng`)
  } else {
    console.log(`✅ Customer API chạy tại http://localhost:${PORT}`)
  }
})
