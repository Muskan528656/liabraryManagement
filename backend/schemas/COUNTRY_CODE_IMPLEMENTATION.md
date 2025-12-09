# Country Code API Integration Summary

## Overview
Country codes are now available as API endpoints for both Company and User Role modules. This provides a dynamic, centralized way to manage country code picklists throughout the application.

## Changes Made

### Backend Changes

#### 1. Company Routes (`backend/app/routes/company.routes.js`)

**New Endpoint:**
```
GET /api/company/picklist/country-codes
```

**Response:** Array of country code objects
```json
[
  {
    "id": "+91",
    "name": "India (+91)",
    "country": "India",
    "country_code": "+91"
  },
  ...
]
```

**Enhanced Endpoint:**
```
GET /api/company/:id
```

**New Response Field:** `country_code_display`
```json
{
  "id": 1,
  "name": "Spark India",
  "country_code": "+91",
  "country_code_display": "India (+91)",
  ...
}
```

#### 2. User Role Routes (`backend/app/routes/userrole.routes.js`)

**New Endpoint:**
```
GET /api/user-role/picklist/country-codes
```

**Response:** Same as company picklist

**Enhanced Endpoint:**
```
GET /api/user-role/:id
```

**New Response Field:** `country_code_display`
```json
{
  "id": 1,
  "role_name": "Admin",
  "country_code": "+91",
  "country_code_display": "India (+91)",
  ...
}
```

---

### Frontend Changes

#### 1. Company Component (`frontend/src/components/Company/Company.js`)

**New State Variables:**
```javascript
const [countryCodeList, setCountryCodeList] = useState([]);
const [countryCodeDisplay, setCountryCodeDisplay] = useState("");
```

**New Functions:**
```javascript

const fetchCountryCodesList = async () => {
  try {
    const companyApi = new DataApi("company");
    const response = await companyApi.fetchAll("picklist/country-codes");
    if (response.data) {
      setCountryCodeList(response.data);
    }
  } catch (error) {

    setCountryCodeList(CountryCode.map(...));
  }
};
```

**Enhanced Company Fetch:**
- Sets `country_code_display` from API response
- Formats display as "Country (Code)"

**Updated Country Code Field:**
- Dropdown now populated from `countryCodeList` (API data)
- Falls back to local JSON if API fails
- Displays country code with fallback to `countryCodeDisplay`

#### 2. User Role Config (`frontend/src/components/userrole/userroleConfig.js`)

**Dynamic Options:**
```javascript
const countryCodeOptions = externalData.countryCodeList && 
  externalData.countryCodeList.length > 0 
  ? externalData.countryCodeList.map(item => ({
      value: item.id,
      label: item.name
    }))
  : CountryCode.map(item => ({ ... }));
```

**Features:**
- Accepts country code list from parent component
- Falls back to local JSON if not provided
- Options dynamically rendered in country code select field

#### 3. User Role Detail (`frontend/src/components/userrole/userroleDetail.js`)

**No Changes Required:**
- Already configured to accept country codes from API
- Display field automatically shows formatted country code from `country_code_display`

---

## Data Flow

### Reading Company/User Role with Country Code

```
Frontend Component
    ↓
API Call: GET /api/company/:id or GET /api/user-role/:id
    ↓
Backend Route
    ↓
Load country code from JSON
    ↓
Create `country_code_display` field
    ↓
Return response with display value
    ↓
Frontend displays in read-only mode
```

### Editing Company/User Role with Country Code

```
Frontend Component
    ↓
API Call: GET /api/company/picklist/country-codes or
          GET /api/user-role/picklist/country-codes
    ↓
Backend Route
    ↓
Load all countries from JSON
    ↓
Map to picklist format: { id, name, country, country_code }
    ↓
Return picklist
    ↓
Frontend populates dropdown with options
    ↓
User selects country code
    ↓
Save selection via POST/PUT
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `backend/app/routes/company.routes.js` | Added picklist endpoint, enhanced detail endpoint with `country_code_display` |
| `backend/app/routes/userrole.routes.js` | Added picklist endpoint, enhanced detail endpoint with `country_code_display` |
| `frontend/src/components/Company/Company.js` | Added country code state, fetch picklist, populate dropdown from API, display formatting |
| `frontend/src/components/userrole/userroleConfig.js` | Updated to accept country code list from props, fallback to local JSON |
| `backend/schemas/company.schema.json` | Already created with country_code documentation |
| `backend/schemas/country-code-api.md` | NEW - Comprehensive API endpoint documentation |

---

## API Usage Examples

### Fetch Country Codes for Dropdown
```javascript
const companyApi = new DataApi("company");
const response = await companyApi.fetchAll("picklist/country-codes");
const countryCodeList = response.data;





```

### Fetch Company with Country Code Display
```javascript
const companyApi = new DataApi("company");
const response = await companyApi.fetchById(1);
const company = response.data;


```

### Update Company with Country Code
```javascript
const companyApi = new DataApi("company");
const updatedData = {
  ...existingCompany,
  country_code: "+91"
};
const response = await companyApi.update(updatedData, companyId);
```

---

## Error Handling

### Fallback Strategy
- If API fails to return country codes, frontend falls back to local JSON
- If `country_code_display` is not in response, frontend uses country code value directly
- Graceful degradation ensures feature works even if API has issues

### Error Responses
```json
{
  "errors": "Internal server error"
}
```

---

## Benefits

1. **Centralized Management**: Country codes managed in single JSON file
2. **Dynamic Loading**: Dropdowns populated from API instead of hardcoded
3. **Consistent Display**: All country codes shown in "Country (Code)" format
4. **Scalability**: Easy to add/update country codes without code changes
5. **User Experience**: Formatted display makes it easier to identify countries
6. **API Documentation**: Clear endpoints for integration with external systems

---

## Testing Checklist

- [ ] Start backend server
- [ ] Test Company: Open settings → Edit → Select country code from dropdown
- [ ] Test Company: Save and refresh → Verify country code display shows formatted value
- [ ] Test User Role: Create new → Select country code from dropdown
- [ ] Test User Role: Edit existing → Verify country code populated from API
- [ ] Test User Role: List view → Verify country code column shows "Country (Code)"
- [ ] Verify picklist endpoints return all 149 countries
- [ ] Verify fallback to local JSON if API endpoint is unavailable

---

## Future Enhancements

1. Add search/filter to country code dropdowns (for 149 countries)
2. Add region grouping in country code picklists
3. Add currency association with country codes
4. Add timezone association with country codes
5. Create admin page to manage country codes
6. Add country code validation in backend routes
7. Add country code filtering in list views
