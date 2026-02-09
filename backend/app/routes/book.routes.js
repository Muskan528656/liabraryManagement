/**
 * Handles all incoming request for /api/book endpoint
 * DB table for this public.books
 * Model used here is book.model.js
 * SUPPORTED API ENDPOINTS
 *              GET     /api/book
 *              GET     /api/book/:id
 *              POST    /api/book
 *              PUT     /api/book/:id
 *              DELETE  /api/book/:id
 *
 * @author      Muskan Khan
 * @date        DEC, 2025
 * @copyright   www.ibirdsservices.com
 */

const e = require("express");
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const Book = require("../models/book.model.js");

module.exports = (app) => {
  const { body, validationResult } = require("express-validator");

  var router = require("express").Router();

  router.get(
    "/",
    fetchUser,
    checkPermission("Books", "allow_view"),
    async (req, res) => {
      try {
        Book.init(req.userinfo.tenantcode);
        const books = await Book.findAll();
        res.json(books);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

     router.get(
      "/book-popularity-analytics",
      fetchUser,
      // checkPermission("Reports", "allow_view"),
      async (req, res) => {
        try {
          Book.init(req.userinfo.tenantcode);

          const filters = {
            days: req.query.days,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            category: req.query.category,
            searchTerm: req.query.searchTerm
          };

          const reportData = await Book.generateBookPopularityReport(filters);
          res.json(reportData);
        } catch (err) {
          console.error("Error generating book popularity report:", err);
          res.status(500).json({ error: "Internal server error" });
        }
      }
    );

  router.get("/inventory-report",
     fetchUser, checkPermission("Books", "allow_view"),
     async (req, res) => {
       try {
            Book.init(req.userinfo.tenantcode);
            const report = await Book.generateInventoryReport();
            res.json(report);
          } catch (error) {
            console.error("Error generating inventory report:", error);
            res.status(500).json({ errors: "Internal server error" });
          }
    });

  router.get("/export-excel",
    fetchUser,
    // checkPermission("Reports", "allow_view"),
    async (req, res) => {
      try {
        Book.init(req.userinfo.tenantcode);

        const filters = {
          days: req.query.days,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          category: req.query.category,
          searchTerm: req.query.searchTerm
        };

        const workbook = await Book.exportBookPopularityReportExcel(filters);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=book-popularity-report-${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      } catch (err) {
        console.error("Error exporting to Excel:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  router.get("/export-pdf",
    fetchUser,
    // checkPermission("Reports", "allow_view"),
    async (req, res) => {
      try {
        Book.init(req.userinfo.tenantcode);

        const filters = {
          days: req.query.days,
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          category: req.query.category,
          searchTerm: req.query.searchTerm
        };

        const doc = await Book.exportBookPopularityReportPDF(filters);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=book-popularity-report-${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);
        doc.end();
      } catch (err) {
        console.error("Error exporting to PDF:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  router.get("/:id", fetchUser, 
    // checkPermission("Books", "allow_view"), 
    async (req, res) => {
    try {
      Book.init(req.userinfo.tenantcode);
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ errors: "Book not found" });
      }
      return res.status(200).json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });


  router.get("/isbn/:isbn", fetchUser, checkPermission("Books", "allow_view"), async (req, res) => {
    try {
      Book.init(req.userinfo.tenantcode);
      const isbn = decodeURIComponent(req.params.isbn);
      const book = await Book.findByISBN(isbn);
      if (!book) {
        return res.status(404).json({ errors: "Book not found" });
      }
      return res.status(200).json(book);
    } catch (error) {
      console.error("Error fetching book by ISBN:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });



  router.post(
    "/",
    fetchUser,
    checkPermission("Books", "allow_create"),
    [
      body("title")
        .optional()
        .custom((value) => {
          if (value === null || value === undefined || value === "") {
            return true;
          }
          return value.trim().length > 0;
        })
        .withMessage("Title is required"),
      body("author_id")
        .optional()
        .custom((value) => {
          return true;
        }),
      body("category_id")
        .optional()
        .custom((value) => {
          return true;
        }),
      body("publisher_id")
        .optional()
        .custom((value) => {
          return true;
        }),
      body("min_age")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Min age must be a non-negative integer"),
      body("max_age")
        .optional()
        .custom((value) => {
          if (value !== undefined && value !== null && value !== "") {
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 0) {
              throw new Error("Max age must be a non-negative integer");
            }
          }
          return true;
        })
        .custom((value, { req }) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            req.body.min_age !== undefined &&
            req.body.min_age !== null &&
            req.body.min_age !== ""
          ) {
            if (parseInt(value) < parseInt(req.body.min_age)) {
              throw new Error("Max age cannot be less than min age");
            }
          }
          return true;
        }),
      body("isbn")
        .optional()
        .custom((value) => {
          if (value === null || value === undefined || value === "") {
            return true;
          }
          return value.trim().length > 0;
        })
        .withMessage("ISBN is required"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Book.init(req.userinfo.tenantcode);

        if (req.body.isbn && req.body.isbn.trim()) {
          const existingBook = await Book.findByISBN(req.body.isbn);
          if (existingBook) {
            return res
              .status(400)
              .json({ errors: "Book with this ISBN already exists" });
          }
        }

        const userId = req.userinfo?.id || null;
        const book = await Book.create(req.body, userId);
        if (!book) {
          return res.status(400).json({ errors: "Failed to create book" });
        }
        return res.status(200).json({ success: true, data: book });
      } catch (error) {
        console.error("Error creating book:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );
  router.put(
    "/:id",
    fetchUser,
    checkPermission("Books", "allow_edit"),
    [
      body("title").notEmpty().withMessage("Title is required"),
      body("author_id").notEmpty().withMessage("Author ID is required"),
      body("category_id").notEmpty().withMessage("Category ID is required"),
      body("publisher_id").optional(),
      body("min_age")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Min age must be a non-negative integer"),
      body("max_age")
        .optional()
        .custom((value) => {
          if (value !== undefined && value !== null && value !== "") {
            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 0) {
              throw new Error("Max age must be a non-negative integer");
            }
          }
          return true;
        })
        .custom((value, { req }) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            req.body.min_age !== undefined &&
            req.body.min_age !== null &&
            req.body.min_age !== ""
          ) {
            if (parseInt(value) < parseInt(req.body.min_age)) {
              throw new Error("Max age cannot be less than min age");
            }
          }
          return true;
        }),
      body("isbn").notEmpty().withMessage("ISBN is required"),
      body("shelf_id")
        .optional()
        .custom((value) => {
          return true;
        }),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        Book.init(req.userinfo.tenantcode);

        const existingBook = await Book.findById(req.params.id);
        if (!existingBook) {
          return res.status(404).json({ errors: "Book not found" });
        }

        const duplicateBook = await Book.findByISBN(
          req.body.isbn,
          req.params.id
        );
        if (duplicateBook) {
          return res
            .status(400)
            .json({ errors: "Book with this ISBN already exists" });
        }

        const userId = req.userinfo?.id || null;
        const book = await Book.updateById(req.params.id, req.body, userId);
        if (!book) {
          return res.status(400).json({ errors: "Failed to update book" });
        }
        return res.status(200).json({ success: true, data: book });
      } catch (error) {
        console.error("Error updating book:", error);
        return res.status(500).json({ errors: error.message });
      }
    }
  );

  router.delete("/:id", fetchUser, checkPermission("Books", "allow_delete"), async (req, res) => {
    try {
      Book.init(req.userinfo.tenantcode);
      const result = await Book.deleteById(req.params.id);
      if (!result.success) {
        return res.status(404).json({ errors: result.message });
      }
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error("Error deleting book:", error);
      return res.status(500).json({ errors: "Internal server error" });
    }
  });

  
        
    app.use(process.env.BASE_API_URL + "/api/book", router);
};
