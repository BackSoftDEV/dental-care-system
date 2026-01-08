"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerRepository_1 = __importDefault(require("../repositories/customerRepository"));
const customer_1 = require("../types/customer");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const search = req.query.search ?? undefined;
    const customers = customerRepository_1.default.getAll(search);
    res.json({ customers });
});
// Đặt route /deleted TRƯỚC các route có parameter để tránh bị match nhầm
router.get('/deleted', (req, res) => {
    const search = req.query.search ?? undefined;
    const customers = customerRepository_1.default.getDeleted(search);
    res.json({ customers });
});
router.get('/metrics', (_req, res) => {
    const metrics = customerRepository_1.default.getMetrics();
    res.json(metrics);
});
router.get('/lookup', (req, res) => {
    const phone = req.query.phone?.trim();
    if (!phone) {
        return res.status(400).json({ message: 'Phone is required' });
    }
    const customer = customerRepository_1.default.getByPhone(phone);
    res.json({ customer: customer ?? null });
});
router.get('/:id/history', (req, res) => {
    const result = customerRepository_1.default.getHistory(Number(req.params.id));
    if (!result) {
        return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(result);
});
router.get('/:id', (req, res) => {
    const customer = customerRepository_1.default.getById(Number(req.params.id));
    if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
});
router.post('/', (req, res) => {
    try {
        const payload = customer_1.createCustomerSchema.parse(req.body);
        const created = customerRepository_1.default.create(payload);
        res.status(201).json(created);
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid payload', error });
    }
});
const handleUpdate = (req, res) => {
    try {
        const payload = customer_1.updateCustomerSchema.parse(req.body);
        const updated = customerRepository_1.default.update(Number(req.params.id), payload);
        if (!updated) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid payload', error });
    }
};
router.put('/:id', handleUpdate);
router.post('/:id/update', handleUpdate);
router.post('/:id/delete', (req, res) => {
    const success = customerRepository_1.default.delete(Number(req.params.id));
    if (!success) {
        return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ success: true });
});
router.post('/:id/restore', (req, res) => {
    const success = customerRepository_1.default.restore(Number(req.params.id));
    if (!success) {
        return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ success: true });
});
router.delete('/:id', (req, res) => {
    const deleted = customerRepository_1.default.delete(Number(req.params.id));
    if (!deleted) {
        return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(204).send();
});
exports.default = router;
//# sourceMappingURL=customerRoutes.js.map