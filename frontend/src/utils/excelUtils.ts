import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import type { Customer } from '../types/customer'

export interface ExcelRow {
  'Ngày': string
  'HỌ VÀ TÊN': string
  'TUỔI': {
    'NAM': number | ''
    'NỮ': number | ''
  }
  'ĐỊA CHỈ': string
  'SĐT': string
  'CÁCH XỬ LÍ': string
  'THÀNH TIỀN': number | ''
  'GHI TRÚ': string
}

export function exportToExcel(customers: Customer[]) {
  // 1. Sắp xếp dữ liệu: Theo Số điện thoại (gom nhóm) -> Sau đó theo Ngày tạo (giảm dần)
  const sortedCustomers = [...customers].sort((a, b) => {
    // Ưu tiên gom nhóm theo SĐT
    const phoneA = a.phone || ''
    const phoneB = b.phone || ''
    const phoneDiff = phoneA.localeCompare(phoneB)
    if (phoneDiff !== 0) return phoneDiff

    // Nếu cùng SĐT (hoặc không có SĐT) thì gom theo Tên
    const nameA = a.fullName || ''
    const nameB = b.fullName || ''
    const nameDiff = nameA.localeCompare(nameB)
    if (nameDiff !== 0) return nameDiff

    // Trong cùng 1 người, sắp xếp theo thời gian (Mới nhất lên đầu)
    const dateA = dayjs(a.createdAt || 0).valueOf()
    const dateB = dayjs(b.createdAt || 0).valueOf()
    return dateB - dateA
  })

  // Tính tuổi
  const calcAge = (dateOfBirth: string) => {
    const birth = dayjs(dateOfBirth)
    if (!birth.isValid()) return ''
    return Math.floor(dayjs().diff(birth, 'year', true))
  }

  // Tạo workbook mới
  const wb = XLSX.utils.book_new()
  const ws: XLSX.WorkSheet = {}

  // Header
  const headers = [
    ['Ngày', 'HỌ VÀ TÊN', 'TUỔI', '', 'ĐỊA CHỈ', 'SĐT', 'CÁCH XỬ LÍ', 'THÀNH TIỀN', 'GHI TRÚ'],
    ['', '', 'NAM', 'NỮ', '', '', '', '', '']
  ]

  // Ghi Header
  XLSX.utils.sheet_add_aoa(ws, headers, { origin: 'A1' })

  // Chuẩn bị dữ liệu và thông tin merge
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Ngày
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Họ tên
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Tuổi (Header to)
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // Địa chỉ
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // SĐT
    { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } }, // Cách xử lý
    { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } }, // Thành tiền
    { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } }, // Ghi chú
  ]

  const dataStartRow = 2
  let currentRow = dataStartRow

  // Duyệt qua từng row để xử lý merge
  for (let i = 0; i < sortedCustomers.length; i++) {
    const customer = sortedCustomers[i]
    const age = calcAge(customer.dateOfBirth)
    const isMale = customer.gender

    const rowData = [
      customer.createdAt ? dayjs(customer.createdAt).format('DD/MM/YYYY') : '',
      customer.fullName,
      isMale ? age : '',     // Tuổi Nam
      !isMale ? age : '',    // Tuổi Nữ
      customer.address,
      customer.phone,
      customer.treatment,
      customer.amount || 0,
      customer.notes || '',
    ]

    XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: { r: currentRow, c: 0 } })

    // Kiểm tra merge với dòng TIẾP THEO (nếu có)
    // Logic: Nếu dòng tiếp theo có cùng SĐT + Tên + (có thể check thêm địa chỉ/ngày sinh) thì merge các cột thông tin
    // Tuy nhiên, logic add_aoa ghi từng dòng.
    // Cách dễ hơn: Duyệt từ i+1, đếm bao nhiêu dòng trùng khớp, tạo merge range, rồi skip i.
    
    // Nhưng ta đang trong vòng lặp i. Ta sẽ so sánh với dòng TRƯỚC ĐÓ để quyết định merge?
    // Không, merge trong XLSX định nghĩa start và end.
    // Tốt nhất là tìm nhóm.
    
    let j = i + 1
    while (j < sortedCustomers.length) {
      const nextCust = sortedCustomers[j]
      const isSameGroup = 
        (customer.phone && nextCust.phone && customer.phone === nextCust.phone) ||
        (!customer.phone && !nextCust.phone && customer.fullName === nextCust.fullName)
      
      if (isSameGroup) {
        j++
      } else {
        break
      }
    }
    
    // Nhóm từ i đến j-1
    const groupSize = j - i
    if (groupSize > 1) {
      // Merge các cột thông tin chung
      const startR = currentRow
      const endR = currentRow + groupSize - 1
      
      // Merge Họ tên
      merges.push({ s: { r: startR, c: 1 }, e: { r: endR, c: 1 } })
      // Merge Tuổi Nam
      merges.push({ s: { r: startR, c: 2 }, e: { r: endR, c: 2 } })
      // Merge Tuổi Nữ
      merges.push({ s: { r: startR, c: 3 }, e: { r: endR, c: 3 } })
      // Merge Địa chỉ
      merges.push({ s: { r: startR, c: 4 }, e: { r: endR, c: 4 } })
      // Merge SĐT
      merges.push({ s: { r: startR, c: 5 }, e: { r: endR, c: 5 } })
      // Merge Ghi chú (nếu muốn) - Thường ghi chú có thể khác nhau từng lần, nhưng user example cho thấy ghi chú cũng được merge? 
      // Trong ảnh user, Ghi chú có vẻ riêng biệt. Nhưng nếu thông tin khách hàng chung?
      // Thôi cứ merge Ghi chú nếu nội dung giống nhau? 
      // User yêu cầu "lấy thông tin các lần KH quay lại khám". 
      // Thông tin cá nhân (Tên, tuổi, địa chỉ, sđt) là cố định.
      // Ngày, Cách xử lý, Thành tiền, Ghi chú là biến động.
      // Vậy KO merge Ghi chú, Ngày, Cách xử lý, Thành tiền.
    }
    
    // Nếu đã xử lý nhóm (hoặc nhóm 1 phần tử), cần ghi các dòng dữ liệu của nhóm vào sheet
    // Ở trên ta mới ghi dòng i. Ta cần ghi tiếp dòng i+1 đến j-1
    for (let k = i + 1; k < j; k++) {
      const nextCust = sortedCustomers[k]
      const nextAge = calcAge(nextCust.dateOfBirth)
      const nextIsMale = nextCust.gender
      const nextRowData = [
        nextCust.createdAt ? dayjs(nextCust.createdAt).format('DD/MM/YYYY') : '',
        nextCust.fullName, // Vẫn ghi dữ liệu để phòng hờ, merge sẽ che đi
        nextIsMale ? nextAge : '',
        !nextIsMale ? nextAge : '',
        nextCust.address,
        nextCust.phone,
        nextCust.treatment,
        nextCust.amount || 0,
        nextCust.notes || '',
      ]
      currentRow++
      XLSX.utils.sheet_add_aoa(ws, [nextRowData], { origin: { r: currentRow, c: 0 } })
    }

    // Cập nhật i
    i = j - 1
    currentRow++
  }

  // Apply merges
  ws['!merges'] = merges

  // Format cột
  ws['!cols'] = [
    { wch: 12 }, // Ngày
    { wch: 25 }, // Tên
    { wch: 8 },  // Nam
    { wch: 8 },  // Nữ
    { wch: 30 }, // Địa chỉ
    { wch: 12 }, // SĐT
    { wch: 30 }, // Cách xử lý
    { wch: 15 }, // Thành tiền
    { wch: 20 }, // Ghi chú
  ]

  // Range
  const range = { s: { r: 0, c: 0 }, e: { r: currentRow - 1, c: 8 } }
  ws['!ref'] = XLSX.utils.encode_range(range)

  // Append sheet
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách khách hàng')

  // Xuất file
  const fileName = `Danh_sach_khach_hang_${dayjs().format('DDMMYYYY_HHmmss')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export function importFromExcel(
  file: File
): Promise<Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Chuyển đổi sang JSON (bỏ qua 2 hàng đầu là header, dữ liệu bắt đầu từ hàng 2)
        // Sử dụng defval để xử lý các ô trống
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: ['Ngày', 'HỌ VÀ TÊN', 'TUỔI NAM', 'TUỔI NỮ', 'ĐỊA CHỈ', 'SĐT', 'CÁCH XỬ LÍ', 'THÀNH TIỀN', 'GHI TRÚ'],
          range: 2, // Bỏ qua 2 hàng đầu (hàng 0 và hàng 1), dữ liệu bắt đầu từ hàng 2 (index 2)
          defval: '', // Giá trị mặc định cho ô trống
        })

        // Chuyển đổi dữ liệu
        const customers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>[] = []

        jsonData.forEach((row: any) => {
          try {
            const fullName = String(row['HỌ VÀ TÊN'] || '').trim()
            const phone = String(row['SĐT'] || '').trim()
            const address = String(row['ĐỊA CHỈ'] || '').trim()
            const treatment = String(row['CÁCH XỬ LÍ'] || '').trim()

            if (!fullName || !phone || !address || !treatment) {
              return // Bỏ qua hàng không đủ dữ liệu
            }

            // Xác định giới tính và tuổi
            const ageNamValue = row['TUỔI NAM']
            const ageNuValue = row['TUỔI NỮ']
            const ageNam = ageNamValue !== null && ageNamValue !== undefined && ageNamValue !== '' 
              ? Number(ageNamValue) 
              : null
            const ageNu = ageNuValue !== null && ageNuValue !== undefined && ageNuValue !== '' 
              ? Number(ageNuValue) 
              : null
            
            // Xác định giới tính: nếu có tuổi Nam thì là Nam, ngược lại là Nữ
            const gender = ageNam !== null && !isNaN(ageNam) && ageNam > 0
            const age = gender ? ageNam : ageNu

            // Tính ngày sinh từ tuổi
            let dateOfBirth = dayjs().subtract(25, 'year').format('YYYY-MM-DD')
            if (age && age > 0 && age < 150) {
              dateOfBirth = dayjs().subtract(age, 'year').format('YYYY-MM-DD')
            }

            // Parse thành tiền
            const amount = row['THÀNH TIỀN']
              ? typeof row['THÀNH TIỀN'] === 'number'
                ? row['THÀNH TIỀN']
                : parseFloat(String(row['THÀNH TIỀN']).replace(/[^\d.-]/g, '')) || 0
              : 0

            // Parse ngày từ cột Ngày (nếu có)
            if (row['Ngày']) {
              const dateStr = String(row['Ngày'])
              const parsed = dayjs(dateStr, ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'])
              if (parsed.isValid()) {
                // Nếu có ngày trong Excel, có thể dùng để tính tuổi chính xác hơn
                if (!age || age === 0) {
                  const ageFromDate = Math.floor(dayjs().diff(parsed, 'year', true))
                  if (ageFromDate > 0 && ageFromDate < 150) {
                    dateOfBirth = parsed.format('YYYY-MM-DD')
                  }
                }
              }
            }

            customers.push({
              fullName,
              gender,
              dateOfBirth,
              address,
              phone,
              treatment,
              amount,
              notes: String(row['GHI TRÚ'] || '').trim() || undefined,
            })
          } catch (error) {
            console.error('Lỗi khi parse dòng:', row, error)
          }
        })

        resolve(customers)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'))
    }

    reader.readAsBinaryString(file)
  })
}

