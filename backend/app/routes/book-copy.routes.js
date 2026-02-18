const express = require('express');
const router = express.Router();
const BookCopyModel = require('../models/book_copy.model');
const BookModel = require('../models/book.model');
const BranchModel = require('../models/branch.model');
const { fetchUser, checkPermission } = require('../middleware/fetchuser.js');
const { body, validationResult, query } = require('express-validator');
const sql = require("../models/db.js");

module.exports = (app) => {
    // Init model middleware
    const initModel = (req, res, next) => {
        try {
            BookCopyModel.init(req.userinfo.tenantcode, req.branchId);
            BookModel.init(req.userinfo.tenantcode);
            // BranchModel usage is removed or assumed static if needed, but for safety using sql queries for branch validation
            // If BranchModel.init exists and is needed for other reasons, keep valid call
            // Using try-catch block for safety if BranchModel is not updated
            if (BranchModel.init) {
                BranchModel.init(req.userinfo.tenantcode, req.branchId);
            }
            next();
        } catch (error) {
            res.status(500).json({ message: "Error initializing model", error: error.message });
        }
    };

    // Validation middleware for book copies
    const bookCopyValidationRules = () => {
        return [
            body('book_id')
                .notEmpty()
                .withMessage('Book ID is required')
                .isUUID()
                .withMessage('Book ID must be a valid UUID'),
            body('home_branch_id')
                .notEmpty()
                .withMessage('Home branch ID is required')
                .isUUID()
                .withMessage('Home branch ID must be a valid UUID'),
            body('barcode')
                .notEmpty()
                .withMessage('Barcode is required')
                .isLength({ max: 100 })
                .withMessage('Barcode must not exceed 100 characters'),
            body('cn_class')
                .notEmpty()
                .withMessage('Classification class is required')
                .isLength({ max: 50 })
                .withMessage('Classification class must not exceed 50 characters'),
            body('cn_item')
                .notEmpty()
                .withMessage('Classification item is required')
                .isLength({ max: 50 })
                .withMessage('Classification item must not exceed 50 characters'),
            body('cn_source')
                .optional()
                .isIn(['DDC', 'LLC'])
                .withMessage('CN Source must be either DDC or LLC'),
            body('holding_branch_id')
                .optional()
                .isUUID()
                .withMessage('Holding branch ID must be a valid UUID'),
            body('cn_suffix')
                .optional()
                .isLength({ max: 50 })
                .withMessage('CN Suffix must not exceed 50 characters'),
            body('library_member_type')
                .optional()
                .isLength({ max: 255 })
                .withMessage('Library member type must not exceed 255 characters'),
            body('status')
                .optional()
                .isIn(['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST', 'DAMAGED'])
                .withMessage('Status must be one of: AVAILABLE, BORROWED, MAINTENANCE, LOST, DAMAGED'),
            body('item_price')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Item price must be a positive number'),
            body('date_accessioned')
                .optional()
                .isDate()
                .withMessage('Date accessioned must be a valid date'),
            body('rack_mapping_id')
                .optional()
                .isUUID()
                .withMessage('Rack mapping ID must be a valid UUID')
        ];
    };

    // Get all book copies with pagination
    router.get('/', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isLength({ max: 255 }).withMessage('Search query too long'),
        query('book_id').optional().isUUID().withMessage('Book ID must be a valid UUID'),
        query('home_branch_id').optional().isUUID().withMessage('Home branch ID must be a valid UUID'),
        query('status').optional().isIn(['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST', 'DAMAGED']).withMessage('Status must be valid')
    ], fetchUser, initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { page = 1, limit = 10, search, book_id, home_branch_id, status } = req.query;
            const filters = {};

            if (search) filters.search = search;
            if (book_id) filters.book_id = book_id;
            if (home_branch_id) filters.home_branch_id = home_branch_id;
            if (status) filters.status = status;

            const result = await BookCopyModel.findAll(filters, parseInt(page), parseInt(limit));
            res.json(result);
        } catch (err) {
            console.error('Error getting book copies:', err);
            res.status(500).json({ message: 'Error retrieving book copies', error: err.message });
        }
    });

    // Bulk create book copies
    router.post('/bulk', [
        body('book_id').notEmpty().isUUID().withMessage('Book ID is required'),
        body('quantity').notEmpty().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
        body('item_price').optional().isFloat({ min: 0 }).withMessage('Item price must be a positive number'),
        body('rack_mapping_id').optional().isUUID().withMessage('Rack mapping ID must be valid UUID')
    ], fetchUser, initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const result = await BookCopyModel.bulkCreate(req.body, req.userinfo.id);
            res.status(201).json({ success: true, data: result });
        } catch (err) {
            console.error('Error in bulk create book copies:', err);
            res.status(500).json({ message: 'Error creating bulk book copies', error: err.message });
        }
    });

    // Get book copy by ID
    router.get('/:id', fetchUser, initModel, async (req, res) => {
        try {
            const { id } = req.params;

            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ message: 'Invalid book copy ID format' });
            }

            const bookCopy = await BookCopyModel.findById(id);
            if (!bookCopy) {
                return res.status(404).json({ message: 'Book copy not found' });
            }

            res.json(bookCopy);
        } catch (err) {
            console.error('Error getting book copy:', err);
            res.status(500).json({ message: 'Error retrieving book copy', error: err.message });
        }
    });

    // Create new book copy
    router.post('/', bookCopyValidationRules(), fetchUser, initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Verify book exists
            const book = await BookModel.findById(req.body.book_id);
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

            // Verify home branch exists
            const homeBranch = await sql.query(`SELECT id FROM ${req.userinfo.tenantcode}.branches WHERE id = $1`, [req.body.home_branch_id]);
            if (homeBranch.rows.length === 0) {
                return res.status(404).json({ message: 'Home branch not found' });
            }

            // Verify holding branch exists if provided
            if (req.body.holding_branch_id) {
                const holdingBranch = await sql.query(`SELECT id FROM ${req.userinfo.tenantcode}.branches WHERE id = $1`, [req.body.holding_branch_id]);
                if (holdingBranch.rows.length === 0) {
                    return res.status(404).json({ message: 'Holding branch not found' });
                }
            }

            // Verify rack mapping exists if provided
            if (req.body.rack_mapping_id) {
                const rackMapping = await sql.query(
                    `SELECT id FROM ${req.userinfo.tenantcode}.rack_mapping WHERE id = $1`,
                    [req.body.rack_mapping_id]
                );
                if (rackMapping.rows.length === 0) {
                    return res.status(404).json({ message: 'Rack mapping not found' });
                }
            }

            // Check if barcode already exists
            const existingBookCopy = await sql.query(
                `SELECT id FROM ${req.userinfo.tenantcode}.book_copy WHERE barcode = $1`,
                [req.body.barcode]
            );
            if (existingBookCopy.rows.length > 0) {
                return res.status(409).json({ message: 'Barcode already exists' });
            }

            const newBookCopy = await BookCopyModel.create(req.body);
            res.status(201).json(newBookCopy);
        } catch (err) {
            console.error('Error creating book copy:', err);
            res.status(500).json({ message: 'Error creating book copy', error: err.message });
        }
    });

    // Update book copy
    router.put('/:id', bookCopyValidationRules(), fetchUser, initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;

            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ message: 'Invalid book copy ID format' });
            }

            const existingBookCopy = await BookCopyModel.findById(id);
            if (!existingBookCopy) {
                return res.status(404).json({ message: 'Book copy not found' });
            }

            // Verify book exists if changing
            if (req.body.book_id && req.body.book_id !== existingBookCopy.book_id) {
                const book = await BookModel.findById(req.body.book_id);
                if (!book) {
                    return res.status(404).json({ message: 'Book not found' });
                }
            }

            // Verify home branch exists if changing
            if (req.body.home_branch_id && req.body.home_branch_id !== existingBookCopy.home_branch_id) {
                const homeBranch = await sql.query(`SELECT id FROM ${req.userinfo.tenantcode}.branches WHERE id = $1`, [req.body.home_branch_id]);
                if (homeBranch.rows.length === 0) {
                    return res.status(404).json({ message: 'Home branch not found' });
                }
            }

            // Verify holding branch exists if provided
            if (req.body.holding_branch_id) {
                const holdingBranch = await sql.query(`SELECT id FROM ${req.userinfo.tenantcode}.branches WHERE id = $1`, [req.body.holding_branch_id]);
                if (holdingBranch.rows.length === 0) {
                    return res.status(404).json({ message: 'Holding branch not found' });
                }
            }

            // Verify rack mapping exists if provided
            if (req.body.rack_mapping_id) {
                const rackMapping = await sql.query(
                    `SELECT id FROM ${req.userinfo.tenantcode}.rack_mapping WHERE id = $1`,
                    [req.body.rack_mapping_id]
                );
                if (rackMapping.rows.length === 0) {
                    return res.status(404).json({ message: 'Rack mapping not found' });
                }
            }

            // Check if barcode already exists (excluding current book copy)
            if (req.body.barcode && req.body.barcode !== existingBookCopy.barcode) {
                const existingBarcode = await sql.query(
                    `SELECT id FROM ${req.userinfo.tenantcode}.book_copy WHERE barcode = $1 AND id != $2`,
                    [req.body.barcode, id]
                );
                if (existingBarcode.rows.length > 0) {
                    return res.status(409).json({ message: 'Barcode already exists' });
                }
            }

            const updatedBookCopy = await BookCopyModel.update(id, req.body);
            res.json(updatedBookCopy);
        } catch (err) {
            console.error('Error updating book copy:', err);
            res.status(500).json({ message: 'Error updating book copy', error: err.message });
        }
    });

    // Delete book copy
    router.delete('/:id', fetchUser, initModel, async (req, res) => {
        try {
            const { id } = req.params;

            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ message: 'Invalid book copy ID format' });
            }

            const deletedBookCopy = await BookCopyModel.deleteById(id);
            if (!deletedBookCopy) {
                return res.status(404).json({ message: 'Book copy not found' });
            }

            res.json({ message: 'Book copy deleted successfully', bookCopy: deletedBookCopy });
        } catch (err) {
            console.error('Error deleting book copy:', err);
            res.status(500).json({ message: 'Error deleting book copy', error: err.message });
        }
    });

    // Get book copies by book ID
    router.get('/book/:bookId', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ], fetchUser, initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { bookId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(bookId)) {
                return res.status(400).json({ message: 'Invalid book ID format' });
            }

            // Verify book exists
            const book = await BookModel.findById(bookId);
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

            const bookCopies = await BookCopyModel.findByBookId(bookId);
            res.json(bookCopies);
        } catch (err) {
            console.error('Error getting book copies by book ID:', err);
            res.status(500).json({ message: 'Error retrieving book copies', error: err.message });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/book-copy", router);
};