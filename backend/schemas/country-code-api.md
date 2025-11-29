# Country Code API Endpoints

## Overview
Country code picklist endpoints provide access to standardized country codes in "+XXX" format for use in forms and dropdowns across the application.

## Endpoints

### 1. Company Country Codes Picklist
**Endpoint:** `GET /api/company/picklist/country-codes`

**Authentication:** Required (Bearer Token)

**Response:**
```json
[
  {
    "id": "+91",
    "name": "India (+91)",
    "country": "India",
    "country_code": "+91"
  },
  {
    "id": "+1",
    "name": "Canada (+1)",
    "country": "Canada",
    "country_code": "+1"
  },
  ...
]
```

**Usage:**
- Populate dropdown/select lists for country code selection in company settings
- Display country code options when editing company details
- Filter data by country code

---

### 2. User Role Country Codes Picklist
**Endpoint:** `GET /api/user-role/picklist/country-codes`

**Authentication:** Required (Bearer Token)

**Response:**
```json
[
  {
    "id": "+91",
    "name": "India (+91)",
    "country": "India",
    "country_code": "+91"
  },
  {
    "id": "+971",
    "name": "United Arab Emirates (+971)",
    "country": "United Arab Emirates",
    "country_code": "+971"
  },
  ...
]
```

**Usage:**
- Populate dropdown/select lists for country code selection in user role form
- Display country code options when editing user role
- Filter user roles by country code

---

### 3. Company Detail with Country Code Display
**Endpoint:** `GET /api/company/:id`

**Authentication:** Required (Bearer Token)

**Response (Enhanced):**
```json
{
  "id": 1,
  "name": "Spark India",
  "country": "India",
  "country_code": "+91",
  "country_code_display": "India (+91)",
  ...other fields...
}
```

**Features:**
- Returns company data with `country_code_display` field
- Displays formatted country code with country name
- Used for reading and displaying company information

---

### 4. User Role Detail with Country Code Display
**Endpoint:** `GET /api/user-role/:id`

**Authentication:** Required (Bearer Token)

**Response (Enhanced):**
```json
{
  "id": 1,
  "role_name": "Admin",
  "country_code": "+91",
  "country_code_display": "India (+91)",
  "is_active": true,
  ...other fields...
}
```

**Features:**
- Returns user role data with `country_code_display` field
- Displays formatted country code with country name
- Used for reading and displaying user role information

---

## Frontend Integration

### Company Component
```javascript
// Fetch country codes
const response = await companyApi.fetchAll("picklist/country-codes");
const countryCodeList = response.data;

// Use in dropdown
<Form.Select value={country_code} onChange={handleChange}>
  {countryCodeList.map((item) => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</Form.Select>
```

### User Role Config
```javascript
// Country code options passed to config
const config = getUserRoleConfig({
  countryCodeList: countryCodeList
});
```

---

## Data Format

All country codes follow the format: `+[1-3 digits]`

Examples:
- `+1` - Canada, USA
- `+91` - India
- `+971` - United Arab Emirates
- `+44` - United Kingdom

---

## Error Responses

**404 Not Found:**
```json
{
  "errors": "Company/User Role not found"
}
```

**500 Internal Server Error:**
```json
{
  "errors": "Internal server error"
}
```

---

## Total Countries Supported

**149 countries** with their respective country codes are available in the picklist endpoints.

---

## Notes

- All country codes are standardized and stored with the `+` prefix
- Country code display includes both the country name and code (e.g., "India (+91)")
- Country codes are optional fields - they can be null if not specified
- When fetching individual records (company/:id or user-role/:id), the API returns an additional `country_code_display` field for UI convenience
- Picklist endpoints always return all available countries regardless of current selection
