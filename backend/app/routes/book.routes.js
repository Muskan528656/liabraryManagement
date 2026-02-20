const express = require('express');
const BookModel = require('../models/book.model');
const BookCopyModel = require('../models/book_copy.model');
const AuthorModel = require('../models/author.model');
const PublisherModel = require('../models/publisher.model');
const ClassificationModel = require('../models/classification.model');
const { fetchUser, checkPermission } = require('../middleware/fetchuser.js');
const { body, validationResult, query } = require('express-validator');
const sql = require("../models/db.js");



module.exports = (app) => {
    var router = express.Router();
    // Init model middleware
    const initModel = (req, res, next) => {
        try {
            // BookModel now only takes schema, branchId is not used but passing for consistency if arg ignored provided only 1 arg
            BookModel.init(req.userinfo.tenantcode);
            BookCopyModel.init(req.userinfo.tenantcode, req.branchId);
            AuthorModel.init(req.userinfo.tenantcode, req.branchId);
            PublisherModel.init(req.userinfo.tenantcode, req.branchId);
            ClassificationModel.init(req.userinfo.tenantcode, req.branchId);
            next();
        } catch (error) {
            res.status(500).json({ message: "Error initializing model", error: error.message });
        }
    };

    // Validation middleware for books
    const bookValidationRules = () => {
        return [
            body('title')
                .notEmpty()
                .withMessage('Title is required')
                .isLength({ max: 255 })
                .withMessage('Title must not exceed 255 characters'),
            body('author_id')
                .optional({ checkFalsy: true })
                .isUUID()
                .withMessage('Author ID must be a valid UUID'),
            body('publisher_id')
                .optional({ checkFalsy: true })
                .isUUID()
                .withMessage('Publisher ID must be a valid UUID'),
            body('classification_id')
                .optional({ checkFalsy: true })
                .isUUID()
                .withMessage('Classification ID must be a valid UUID'),
            body('isbn')
                .optional({ checkFalsy: true })
                .isLength({ max: 50 })
                .withMessage('ISBN must not exceed 50 characters'),
            body('edition')
                .optional({ checkFalsy: true })
                .isLength({ max: 50 })
                .withMessage('Edition must not exceed 50 characters'),
            body('publication_year')
                .optional({ checkFalsy: true })
                .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
                .withMessage('Publication year must be a valid year'),
            body('language')
                .optional({ checkFalsy: true })
                .isLength({ max: 50 })
                .withMessage('Language must not exceed 50 characters'),
            body('inventory_binding')
                .optional({ checkFalsy: true })
                .isLength({ max: 50 })
                .withMessage('Inventory binding must not exceed 50 characters'),
            body('pages')
                .optional({ checkFalsy: true })
                .isInt({ min: 1 })
                .withMessage('Pages must be a positive integer'),
            body('price')
                .optional({ checkFalsy: true })
                .isFloat({ min: 0 })
                .withMessage('Price must be a positive number'),
            body('max_age')
                .optional({ checkFalsy: true })
                .isLength({ max: 50 })
                .withMessage('Max age must not exceed 50 characters'),
            body('min_age')
                .optional({ checkFalsy: true })
                .isLength({ max: 50 })
                .withMessage('Min age must not exceed 50 characters'),
            body('status')
                .optional()
                .isIn(['ACTIVE', 'INACTIVE', 'DISCONTINUED'])
                .withMessage('Status must be one of: ACTIVE, INACTIVE, DISCONTINUED'),
            body('company_id')
                .optional({ checkFalsy: true })
                .isUUID()
                .withMessage('Company ID must be a valid UUID')
        ];
    };

    // Get all active books
    router.get('/active', fetchUser, checkPermission('Books', 'allow_view'), initModel, async (req, res) => {
        try {
            const result = await BookModel.findAll({ status: 'ACTIVE' }, 1, 1000);
            res.json({
                success: true,
                data: result,
                count: result.length
            });
        } catch (err) {
            console.error('Error getting active books:', err);
            res.status(500).json({ message: 'Error retrieving active books', error: err.message });
        }
    });

    // Get all books with pagination
    router.get('/', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 5000 }).withMessage('Limit must be between 1 and 5000'),
        query('search').optional().isLength({ max: 255 }).withMessage('Search query too long'),
        query('author_id').optional().isUUID().withMessage('Author ID must be a valid UUID'),
        query('publisher_id').optional().isUUID().withMessage('Publisher ID must be a valid UUID'),
        query('classification_id').optional().isUUID().withMessage('Classification ID must be a valid UUID'),
        query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).withMessage('Status must be valid'),
        query('isbn').optional().isLength({ max: 50 }).withMessage('ISBN must not exceed 50 characters')
    ], fetchUser, checkPermission('Books', 'allow_view'), initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { page = 1, limit = 10, search, author_id, publisher_id, classification_id, status, isbn } = req.query;
            const filters = {};

            if (search) filters.search = search;
            if (author_id) filters.author_id = author_id;
            if (publisher_id) filters.publisher_id = publisher_id;
            if (classification_id) filters.classification_id = classification_id;
            if (status) filters.status = status;
            if (isbn) filters.isbn = isbn;

            const result = await BookModel.findAll(filters, parseInt(page), parseInt(limit));
            // const branches = await Branch.findAll();
            res.json({
                success: true,
                data: result,
                count: result.length
            });
            // res.json(result);
        } catch (err) {
            console.error('Error getting books:', err);
            res.status(500).json({ message: 'Error retrieving books', error: err.message });
        }
    });

    // Get book by ID
    router.get('/:id', fetchUser, checkPermission('Books', 'allow_view'), initModel, async (req, res) => {
        try {
            const { id } = req.params;

            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ message: 'Invalid book ID format' });
            }

            const book = await BookModel.findById(id);
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

            // Fetch all copies for this book related to this branch (up to 1000)
            const copiesResult = await BookCopyModel.findAll({ book_id: id }, 1, 1000);
            book.copies = copiesResult.book_copies || [];

            res.json(book);
        } catch (err) {
            console.error('Error getting book:', err);
            res.status(500).json({ message: 'Error retrieving book', error: err.message });
        }
    });

    // Create new book
    router.post('/', bookValidationRules(), fetchUser, checkPermission('Books', 'allow_create'), initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if ISBN already exists if provided
            if (req.body.isbn) {
                const existingBook = await sql.query(
                    `SELECT id FROM ${req.userinfo.tenantcode}.books WHERE isbn = $1`,
                    [req.body.isbn]
                );
                if (existingBook.rows.length > 0) {
                    return res.status(409).json({ message: 'ISBN already exists' });
                }
            }

            // Inject createdbyid and branch info if needed
            req.body.createdbyid = req.userinfo.id;
            // If copies are provided, ensure they have the home_branch_id if missing
            if (req.body.copies && Array.isArray(req.body.copies)) {
                req.body.copies = req.body.copies.map(copy => ({
                    ...copy,
                    home_branch_id: copy.home_branch_id || req.branchId,
                    createdbyid: req.userinfo.id
                }));
            }

            const newBook = await BookModel.create(req.body);
            return res.status(201).json({ success: true, data: newBook });
        } catch (err) {
            console.error('Error creating book:', err);
            return res.status(500).json({ message: 'Error creating book', error: err.message });
        }
    });

    // Update book
    router.put('/:id', bookValidationRules(), fetchUser, checkPermission('Books', 'allow_edit'), initModel, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;

            const existingBook = await BookModel.findById(id);
            if (!existingBook) {
                return res.status(404).json({ message: 'Book not found' });
            }

            // Check if ISBN already exists (excluding current book)
            if (req.body.isbn && req.body.isbn !== existingBook.isbn) {
                const existingWithIsbn = await sql.query(
                    `SELECT id FROM ${req.userinfo.tenantcode}.books WHERE isbn = $1 AND id != $2`,
                    [req.body.isbn, id]
                );
                if (existingWithIsbn.rows.length > 0) {
                    return res.status(409).json({ message: 'ISBN already exists' });
                }
            }

            req.body.lastmodifiedbyid = req.userinfo.id;
            const updatedBook = await BookModel.update(id, req.body);
            res.json(updatedBook);
        } catch (err) {
            console.error('Error updating book:', err);
            res.status(500).json({ message: 'Error updating book', error: err.message });
        }
    });

    // Delete book
    router.delete('/:id', fetchUser, checkPermission('Books', 'allow_delete'), initModel, async (req, res) => {
        try {
            const { id } = req.params;
            const deletedBook = await BookModel.deleteById(id);
            if (!deletedBook) {
                return res.status(404).json({ message: 'Book not found' });
            }

            res.json({ message: 'Book deleted successfully', book: deletedBook });
        } catch (err) {
            console.error('Error deleting book:', err);
            res.status(500).json({ message: 'Error deleting book', error: err.message });
        }
    });

    // Get books by author
    router.get('/author/:authorId', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ], fetchUser, checkPermission('Books', 'allow_view'), initModel, async (req, res) => {
        try {
            const { authorId } = req.params;
            const books = await BookModel.findByAuthor(authorId);
            res.json(books);
        } catch (err) {
            console.error('Error getting books by author:', err);
            res.status(500).json({ message: 'Error retrieving books', error: err.message });
        }
    });

    // Get books by publisher
    router.get('/publisher/:publisherId', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ], fetchUser, checkPermission('Books', 'allow_view'), initModel, async (req, res) => {
        try {
            const { publisherId } = req.params;
            const books = await BookModel.findByPublisher(publisherId);
            res.json(books);
        } catch (err) {
            console.error('Error getting books by publisher:', err);
            res.status(500).json({ message: 'Error retrieving books', error: err.message });
        }
    });

    // Get books by classification
    router.get('/classification/:classificationId', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ], fetchUser, checkPermission('Books', 'allow_view'), initModel, async (req, res) => {
        try {
            const { classificationId } = req.params;
            const books = await BookModel.findByClassification(classificationId);
            res.json(books);
        } catch (err) {
            console.error('Error getting books by classification:', err);
            res.status(500).json({ message: 'Error retrieving books', error: err.message });
        }
    });

    app.use(process.env.BASE_API_URL + "/api/book", router);
};