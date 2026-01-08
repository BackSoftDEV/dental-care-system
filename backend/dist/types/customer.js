"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
const preprocessNumber = (schema) => zod_1.z.preprocess((val) => {
    if (val === undefined || val === null || val === '') {
        return undefined;
    }
    const parsed = Number(val);
    return Number.isNaN(parsed) ? undefined : parsed;
}, schema);
const amountField = preprocessNumber(zod_1.z.number().nonnegative());
exports.createCustomerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'Vui lòng nhập họ tên'),
    gender: zod_1.z.boolean(),
    dateOfBirth: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    age: zod_1.z.number().int().min(0).max(150).optional(),
    address: zod_1.z.string().min(1, 'Vui lòng nhập địa chỉ'),
    phone: zod_1.z.string().min(6, 'Số điện thoại không hợp lệ'),
    treatment: zod_1.z.string().min(1, 'Vui lòng nhập cách xử lý'),
    amount: amountField.default(0),
    notes: zod_1.z.string().optional(),
});
exports.updateCustomerSchema = exports.createCustomerSchema.partial();
//# sourceMappingURL=customer.js.map