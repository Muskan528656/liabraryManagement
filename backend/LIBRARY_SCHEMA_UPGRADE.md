# Library Management System - Schema Upgrade

## Overview
This upgrade adds comprehensive classification and rack mapping functionality to your library management system, enabling better organization and automated item placement.

## New Features Added

### 1. Classification System
- **DDC (Dewey Decimal Classification)** support
- **LLC (Library of Congress Classification)** support (future)
- Automatic classification code management
- Branch-specific classifications

### 2. Rack Mapping System
- Floor-level organization
- Rack and shelf management
- Automatic item assignment based on classification
- Capacity tracking
- Location code generation

### 3. Enhanced Items Management
- Automatic call number generation
- Barcode management
- Status tracking (AVAILABLE, ISSUED, LOST, DAMAGED)
- Price tracking
- Automated rack assignment

## Database Changes

### New Tables
1. **classification** - Stores classification schemes and codes
2. **rack_mapping** - Manages physical library locations
3. Enhanced **items** table with rack mapping references

### Modified Tables
1. **books** - Added classification_id foreign key
2. **items** - Added rack_mapping_id foreign key

## API Endpoints

### Classification API
```
GET    /api/classification          - Get all classifications
GET    /api/classification/:id      - Get classification by ID
GET    /api/classification/type/:type - Get classifications by type (DDC/LLC)
POST   /api/classification          - Create new classification
PUT    /api/classification/:id      - Update classification
DELETE /api/classification/:id      - Delete classification
```

### Items API (Enhanced)
```
GET    /api/items                   - Get all items with rack info
GET    /api/items/:id               - Get item by ID
POST   /api/items                   - Create new item (auto-assigns rack)
PUT    /api/items/:id               - Update item
DELETE /api/items/:id               - Delete item
```

### Shelf/Rack API
```
GET    /api/shelf                   - Get all rack mappings
GET    /api/shelf/:id               - Get rack by ID
GET    /api/shelf/grouped           - Get racks grouped by floor/rack
GET    /api/shelf/suggestions       - Get suggestions for floor/rack/name
POST   /api/shelf                   - Create new rack mapping
PUT    /api/shelf/:id               - Update rack mapping
DELETE /api/shelf/:id               - Delete rack mapping
```

## Installation Instructions

### 1. Run Database Migration
```bash
cd backend
node run_migration.js
```

This will:
- Create the classification table
- Create the rack_mapping table
- Add necessary foreign key relationships
- Insert sample data for DDC classifications
- Insert sample rack mappings

### 2. Start the Server
```bash
npm start
```

## Usage Examples

### 1. Create a New Classification
```javascript
POST /api/classification
{
  "classification_type": "DDC",
  "code": "510",
  "name": "Mathematics",
  "category": "Pure Science",
  "classification_from": "510",
  "classification_to": "519",
  "is_active": true
}
```

### 2. Create a New Book with Classification
```javascript
POST /api/books
{
  "title": "Introduction to Mathematics",
  "author_id": "author-uuid",
  "classification_id": "classification-uuid",
  "isbn": "978-1234567890",
  "price": 29.99
}
```

### 3. Create an Item (Auto-assigns Rack)
```javascript
POST /api/items
{
  "book_id": "book-uuid",
  "barcode": "ITEM001",
  "item_price": 29.99
}
```

The system will automatically:
- Generate call number (e.g., "510 MAT Copy 1")
- Assign appropriate rack based on classification
- Set status to "AVAILABLE"

### 4. Get Items with Location Info
```javascript
GET /api/items?search=mathematics
```

Response includes:
```json
{
  "id": "item-uuid",
  "barcode": "ITEM001",
  "itemcallnumber": "510 MAT Copy 1",
  "status": "AVAILABLE",
  "book_title": "Introduction to Mathematics",
  "rack_name": "Science",
  "floor": "Second Floor",
  "rack": "Rack D",
  "shelf": "Shelf 1"
}
```

## Sample Data Structure

### Classification Codes (DDC)
- 000-099: General Works
- 100-199: Philosophy & Psychology
- 200-299: Religion
- 300-399: Social Sciences
- 400-499: Language
- 500-599: Science
- 600-699: Technology
- 700-799: Arts & Recreation
- 800-899: Literature
- 900-999: History & Geography

### Rack Mapping Example
```
Floor: Second Floor
Rack: Rack D
Shelf: Shelf 1
Classification: 500-599 (Science)
Capacity: 100 books
Location Code: Second Floor-Rack D-Shelf 1
```

## Error Handling

Common error responses:
- `409 Conflict`: Duplicate classification code or rack mapping
- `400 Bad Request`: Invalid data or validation errors
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Database or server errors

## Future Enhancements

1. **LLC (Library of Congress Classification)** support
2. **Barcode generation** with QR codes
3. **Advanced search** capabilities
4. **Inventory management** features
5. **Reporting dashboard** with analytics
6. **Mobile app** integration
7. **RFID tracking** support

## Troubleshooting

### If migration fails:
1. Check database connection in `.env` file
2. Ensure PostgreSQL is running
3. Verify user has CREATE privileges
4. Check if tables already exist

### If API calls fail:
1. Verify server is running on correct port
2. Check authentication tokens
3. Validate request data format
4. Review server logs for detailed errors

## Support
For issues or questions, please check the server logs or contact the development team.