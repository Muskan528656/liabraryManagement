import { Badge, Card, Row, Col } from "react-bootstrap";
import { API_BASE_URL } from "../../constants/CONSTANT";
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import DataApi from "../../api/dataApi";
import { max } from "moment";

const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const generateCardNumber = (card) => {
    const uuidPart =
        card.id?.replace(/-/g, "").substring(0, 8).toUpperCase() || "LIB00000";
    return `LIB${uuidPart}`;
};

const todayStr = new Date().toISOString().split("T")[0];


const calculateAge = (dob) => {
    if (!dob) return "-";

    const birthDate = new Date(dob);
    if (isNaN(birthDate)) return "-";

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export const getLibraryCardConfig = async (externalData = {}, timeZone, permissions = {}) => {
    const customHandlers = externalData.customHandlers || {};
    const handleBarcodePreview =
        customHandlers.handleBarcodePreview ||
        ((card) => console.warn("Barcode preview handler not provided", card));


    const {
        canCreate = true,
        canEdit = true,
        canDelete = false
    } = permissions || {};

    let defaultCountryCode = "";
    let plansList = [];

    let objectTypesList = [];
    let grades = [];
    let sections = [];
    let gradeSectionsMap = {}; // Map to store sections per grade
    let jobTitles = [
        { value: "Principal", label: "Principal" },
        { value: "Vice Principal", label: "Vice Principal" },
        { value: "Teacher", label: "Teacher" },
        { value: "Assistant Teacher", label: "Assistant Teacher" },
        { value: "Librarian", label: "Librarian" },
        { value: "Counselor", label: "Counselor" },
        { value: "Administrator", label: "Administrator" }
    ];

    try {

        const companyApi = new DataApi("company");
        const companyResponse = await companyApi.fetchAll();

        if (companyResponse.data && Array.isArray(companyResponse.data) && companyResponse.data.length > 0) {
            const companyWithCountryCode = companyResponse.data.find(
                (c) => c && c.country_code
            );

            if (companyWithCountryCode && companyWithCountryCode.country_code) {
                const countryCodeStr = String(companyWithCountryCode.country_code).trim();
                const codePart = countryCodeStr.split(/[—\-]/)[0].trim();

                if (codePart && !codePart.startsWith("+")) {
                    defaultCountryCode = "+" + codePart;
                } else if (codePart) {
                    defaultCountryCode = codePart;
                }


            }
        }


        const plansApi = new DataApi("plans");
        const plansResponse = await plansApi.fetchAll();



        let plansData = [];


        if (plansResponse.success && plansResponse.data && Array.isArray(plansResponse.data)) {
            plansData = plansResponse.data;
        } else if (plansResponse.data && plansResponse.data.data && Array.isArray(plansResponse.data.data)) {
            plansData = plansResponse.data.data;
        } else if (plansResponse.data && Array.isArray(plansResponse.data)) {
            plansData = plansResponse.data;
        } else if (Array.isArray(plansResponse)) {
            plansData = plansResponse;
        }



        if (plansData.length > 0) {
            plansList = plansData
                .filter(plan => {
                    const isActive =
                        plan.is_active === true ||
                        plan.is_active === "true" ||
                        plan.is_active === 1 ||
                        plan.is_active === "1";


                    return isActive;
                })
                .map(plan => ({
                    value: plan.id,
                    label: `${plan.plan_name} (${plan.duration_days} days, ${plan.allowed_books || 0} books)`,
                    data: plan // Store full plan data for details
                }));


        } else {
            console.warn("No plans data found");
        }


        const objectTypeApi = new DataApi("objecttype");
        const objectTypeResponse = await objectTypeApi.fetchAll();

        let objectTypeData = [];

        if (objectTypeResponse.success && objectTypeResponse.data && Array.isArray(objectTypeResponse.data)) {
            objectTypeData = objectTypeResponse.data;
        } else if (objectTypeResponse.data && objectTypeResponse.data.data && Array.isArray(objectTypeResponse.data.data)) {
            objectTypeData = objectTypeResponse.data.data;
        } else if (objectTypeResponse.data && Array.isArray(objectTypeResponse.data)) {
            objectTypeData = objectTypeResponse.data;
        } else if (Array.isArray(objectTypeResponse)) {
            objectTypeData = objectTypeResponse;
        }


        console.log("objectTypeData=>",objectTypeData)
        if (objectTypeData.length > 0) {
           objectTypesList = objectTypeData
            .filter(type => type.status === 'Active' || type.status === true)
            .map(type => ({
                value: type.id,
                label: type.label,
                type: type.type.toLowerCase(),
                data: type
            }));


        } else {
            console.warn("No object type data found");
        }

          const gradeApi = new DataApi("grade-sections/grouped");
            const gradeResponse = await gradeApi.fetchAll();

            console.log("gradeResponse=>", gradeResponse.data);

            const gradesList = Array.isArray(gradeResponse.data)
                ? gradeResponse.data
                : [];

            if (gradesList.length > 0) {

                // ✅ Use grade_name as value
                grades = gradesList.map(g => ({
                    value: g.grade_name,
                    label: g.grade_name
                }));

                // ✅ Create section map using grade_name as key
                gradeSectionsMap = {};

                gradesList.forEach(g => {
                    gradeSectionsMap[g.grade_name] = Array.isArray(g.sections)
                        ? g.sections.map(s => ({
                            value: s.id,
                            label: s.name
                        }))
                        : [];
                });

                // Optional flat section list
                sections = [
                    ...new Set(
                        gradesList.flatMap(g =>
                            (g.sections || []).map(s => s.name)
                        )
                    )
                ].map(s => ({ value: s, label: s }));
            }
            
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        
        console.log("Grades:", grades);
        console.log("GradeSectionsMap:", gradeSectionsMap);
        console.log("Sections:", sections);

    const library_member_type = ["Boys", "Girls", "Other"];

    const defaultColumns = [
        {
            field: "image",
            label: "Image",
            type: "image",
            width: "80px",
            render: (value, row) => {
                const cleanApiBaseUrl = API_BASE_URL?.replace(/\/ibs$/, "");
                const defaultImage = "/default-user.png";

                const imgSrc = value
                    ? value.startsWith("http")
                        ? value
                        : `${cleanApiBaseUrl}${value}`
                    : defaultImage;

                return (
                    <img
                        src={imgSrc}
                        alt={row.first_name || "User"}
                        className="table-user-image"
                        style={{
                            width: "39px",
                            height: "39px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #e2e8f0"
                        }}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = defaultImage;
                        }}
                    />
                );
            }
        }
        ,

        { field: "card_number", label: "Card Number", sortable: true },
        { field: "first_name", label: "First Name", sortable: true },
        { field: "last_name", label: "Last Name", sortable: true },
        { field: "email", label: "Email", sortable: true },
        {
            field: "phone_number",
            label: "Phone",
            sortable: true,
            render: (value, row) => {
                if (!value) return "-";

                let code = row.country_code || "";

                // Remove + if present
                code = code.replace("+", "").trim();

                return `${code}-${value}`;
            },
        },

        // {
        //     field: "type_id",
        //     label: "Type",
        //     sortable: true,
        //     render: (value) => {
        //         const typeObj = objectTypesList.find(
        //             (t) => t.value === value
        //         );
        //         return typeObj ? typeObj.label : "-";
        //     }
        // }
        ,
        {
            field: "dob",
            label: "Age",
            sortable: true,
            render: (value) => {
                const age = calculateAge(value);
                return (
                    <div>

                        {age !== "-" && (
                            <small className="text-muted"> {age}</small>
                        )}
                    </div>
                );
            },
        },

        {
            field: "status",
            label: "Status",
            sortable: true,
            render: (value, row) => {
                const isActive =
                    value === true ||
                    value === "true" ||
                    value === "active" ||
                    value === 1 ||
                    row.is_active === true ||
                    row.active === true ||
                    row.status === "active";

                return (
                    <Badge bg={isActive ? "primary" : "danger"}>
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                );
            }
        }
    ];

    return {
        moduleName: "librarycards",
        moduleLabel: " Members",
        apiEndpoint: "librarycard",
        columns: defaultColumns,
        initialFormData: {
            card_number: "",
            first_name: "",
            last_name: "",
            name: "",
            email: "",
            country_code: defaultCountryCode,
            phone_number: "",
            age: "",
            registration_date: new Date().toISOString().split("T")[0],
            type_id: "",
            issue_date: new Date().toISOString().split("T")[0],
            plan_id: "",
            selectedPlan: null,
            status: true,
            image: null,
            father_gurdian_name: "",
            parent_contact: "",
            dob: "",
            job_title: "",
            grade_id: "",
            section_id: "",
        },

        formFields:[
            {
                name: "father_gurdian_name",
                label: "Father / Guardian Name",
                type: "text",
                required: false,
                placeholder: "Enter father or guardian name",
                colSize: 6,
            },
            {
                name: "parent_contact",
                label: "Parent Contact",
                type: "tel",
                required: false,
                placeholder: "Enter parent contact number",
                colSize: 6,
            },
            {
                name: "first_name",
                label: "First Name",
                type: "text",
                required: true,
                placeholder: "Enter first name",
                colSize: 6,
            },
            {
                name: "last_name",
                label: "Last Name",
                type: "text",
                required: true,
                placeholder: "Enter last name",
                colSize: 6,
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                required: true,
                placeholder: "Enter email address",
                colSize: 6,
            },
            {
                name: "country_code",
                label: "Country Code",
                type: "select",
                options: COUNTRY_CODES.map((country) => ({
                    value: country.country_code,
                    label: `${country.country_code} - ${country.country}`,
                })),
                required: true,
                defaultValue: defaultCountryCode,
                colSize: 3,
            },
            {
                name: "phone_number",
                label: "Phone Number",
                type: "tel",
                required: false,
                placeholder: "Enter phone number",
                colSize: 3,
            },
            {
                name: "dob",
                label: "Date of Birth",
                type: "date",
                max:todayStr,
                required: true,
                colSize: 6,
            },
            {
                name: "registration_date",
                label: "Registration Date",
                type: "date",
                max: todayStr,
                required: false,
                colSize: 6,
            },
            {
                name: "type_id",
                label: "Type",
                type: "select",
                options: objectTypesList,
                colSize: 6,
               onChange: (value, formData, setFormData) => {
                setFormData(prev => ({
                    ...prev,
                    type_id: value,
                    grade_id: "",
                    section_id: "",
                    job_title: ""
                }));
            }
            },
           {
            name: "job_title",
            label: "Job Title",
            type: "text",
            // options: jobTitles,
            colSize: 6,
            // condition: (formData) => formData.type_code === "teacher"
            condition: (formData) => {
                const selectedType = objectTypesList.find(
                    t => String(t.value) === String(formData.type_id)
                );
                return selectedType?.type === "teacher";
            }
            },

           {
            name: "grade_id",
            label: "Grade",
            type: "select",
            colSize: 6,
            options: [
                { value: "", label: "Select Grade" },
                ...grades
            ],
            // condition: (formData) => formData.type_code === "student"
            condition: (formData) => {

                const selectedType = objectTypesList.find(
                    t => String(t.value) === String(formData.type_id)
                );
                return selectedType?.type === "student";
            }
            },
            {
                name: "section_id",
                label: "Section",
                type: "select",
                colSize: 6,
                options: (formData) => {

                    console.log("Selected Grade:", formData.grade_id);
                    console.log("Section Map:", gradeSectionsMap);


                    if (!formData.grade_id) {
                        return [{ value: "", label: "Select Section" }];
                    }

                    return [
                        { value: "", label: "Select Section" },
                        // ...(gradeSectionsMap[String(formData.grade_id)] || [])
                        ...(gradeSectionsMap[formData.grade_id] || [])

                    ];
                },
                condition: (formData) => {
                    const selectedType = objectTypesList.find(
                        t => String(t.value) === String(formData.type_id)
                    );
                    return selectedType?.type === "student";
                }
            },
            {
                name: "plan_id",
                label: "Plan",
                type: "select",
                required: false,
                options: plansList,
                colSize: 6,
            },
            {
                name: "library_member_type",
                label: "Gender",
                type: "select",
                required: false,
                options: library_member_type.map((item) => ({ label: item, value: item })),
                colSize: 6,
            },

            {
                name: "image",
                label: "User Photo",
                type: "file",
                accept: "image/*",
                required: false,
                colSize: 6,
                preview: true,
                maxSize: 2 * 1024 * 1024,
                helperText: "Upload user photo (JPG, PNG, max 2MB)",
                onChange: (file, formData, setFormData) => {
                    setFormData({
                        ...formData,
                        image: file,
                    });
                },
            },
            {
                name: "status",
                label: "Status",
                type: "toggle",
                options: [
                    { value: true, label: "Active" },
                    { value: false, label: "Inactive" },
                ],
                colSize: 6,
            },
        ],

        // validationRules: (formData, allCards, editingCard) => {
        //     const errors = [];

        //      const today = new Date();
        //      today.setHours(0, 0, 0, 0);


        //     if (!formData.first_name?.trim()) {
        //         errors.push("First name is required")
        //         console.log("Validation error: First name is required");
        //     }

        //     if (!formData.email?.trim()) {
        //         errors.push("Email is required");
        //     } else {
        //         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        //         if (!emailRegex.test(formData.email)) {
        //             errors.push("Please enter a valid email address");
        //         }
        //     }
        //     const duplicateEmail = allCards.find(
        //         card => card.email?.toLowerCase() === formData.email?.toLowerCase() &&
        //             card.id !== editingCard?.id
        //     );
        //     if (duplicateEmail) {
        //         errors.push("Card with this email already exists");
        //     }


        //     return errors;
        // },
        validationRules: (formData, allCards, editingCard) => {
            const errors = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!formData.first_name?.trim()) {
                errors.push("First name is required");
            }

            if (!formData.email?.trim()) {
                errors.push("Email is required");
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    errors.push("Please enter a valid email address");
                }
            }

            
            //  DOB validation (Required + Min Age 4)
            if (!formData.dob) {
                errors.push("Date of Birth is required");
            } else {
                const dobDate = new Date(formData.dob);
                dobDate.setHours(0, 0, 0, 0);

                if (dobDate >= today) {
                    errors.push("Date of Birth cannot be today or in the future");
                }

                const age = calculateAge(formData.dob);

                if (age < 4) {
                    errors.push("Member must be at least 4 years old");
                }
            }

            //  Registration date validation
            if (formData.registration_date) {
                const regDate = new Date(formData.registration_date);
                regDate.setHours(0, 0, 0, 0);

                if (regDate > today) {
                    errors.push("Registration date cannot be in the future");
                }

                if (formData.dob) {
                    const dobDate = new Date(formData.dob);
                    dobDate.setHours(0, 0, 0, 0);

                    if (regDate < dobDate) {
                        errors.push("Registration date cannot be before Date of Birth");
                    }
                }
            }

            if (formData.parent_contact) {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(formData.parent_contact)) {
                    errors.push("Parent contact must be 10 digits");
                }
            }

            const duplicateEmail = allCards.find(
                card =>
                    card.email?.toLowerCase() === formData.email?.toLowerCase() &&
                    card.id !== editingCard?.id
            );

            if (duplicateEmail) {
                errors.push("Card with this email already exists");
            }

            return errors;
        },

        dataDependencies: {
            users: "user",
            company: "company",
            plans: "plan",
            objecttypes: "objecttype",
        },

        lookupNavigation: {
            user_id: {
                path: "user",
                idField: "id",
                labelField: "name",
            },

        },

        features: {
            showImportExport: true,
            showDetailView: true,
            showSearch: true,
            showColumnVisibility: true,
            showCheckbox: true,
            showActions: true,

            showAddButton: canCreate,
            allowEdit: canEdit,
            allowDelete: canDelete,
            // showImportButton: canCreate,
            showAdvancedFilter: true,
        },

        filterFields: [
            {
                name: "plan_id",
                field: "plan_id",
                label: "Plan",
                type: "select",
                options: plansList.length > 0 ? [{ value: "" }, ...plansList] : [{ value: "", }],
            },

            {
                name: "first_name",
                field: "first_name",
                label: "First Name",
                type: "text",
            },


            {
                name: "phone_number",
                field: "phone_number",
                label: "Phone Number",
                type: "text",
            },

            {
                name: "registration_date",
                field: "registration_date",
                label: "Registration Date",
                max:todayStr,
                type: "date",
            },
        ],

        details: [
            { key: "card_number", label: "Card Number", type: "text" },
            { key: "name", label: "Full Name", type: "text" },
            { key: "first_name", label: "First Name", type: "text" },
            { key: "last_name", label: "Last Name", type: "text" },
            { key: "user_name", label: "Linked User", type: "text" },
            { key: "email", label: "Email", type: "text" },
            {
                key: "country_code",
                label: "Country Code",
                render: (value) => {
                    const cleanValue = value
                        ? String(value).split(/[—\-]/)[0].trim()
                        : value;
                    const country = COUNTRY_CODES?.find(
                        (c) => c.country_code === cleanValue
                    );
                    return country
                        ? `${country.country_code} (${country.country})`
                        : cleanValue || defaultCountryCode;
                },
            },
            { key: "phone_number", label: "Phone Number", type: "text" },
            { key: "father_gurdian_name", label: "Father / Guardian Name", type: "text" },
            { key: "parent_contact", label: "Parent Contact", type: "number", maxLength: 10 },
            {
                field: "dob",
                label: "Date of Birth",
                sortable: true,
                render: (value) => {
                    const age = calculateAge(value);
                    return (
                        <div>

                            {age !== "-" && (
                                <small className="text-muted"> {age}</small>
                            )}
                        </div>
                    );
                },
            },

            { key: "registration_date", label: "Registration Date", max: todayStr, type: "date" },
            // { key: "type", label: "Type", type: "text" },
            {
            name: "type",
            label: "Type",
            type: "select",
            options: objectTypesList,
            colSize: 6,
            },
            {
                name: "job_title",
                label: "Job Title",
                type: "select",
                options: jobTitles,
                colSize: 6,
                condition: (formData) => {
                    const selectedType = objectTypesList.find(
                    t => t.value === formData.type_id
                    );
                    return selectedType?.label?.toLowerCase() === "teacher";
                }
            },

            {
                name: "grade",
                label: "Grade",
                type: "select",
                options: grades,
                colSize: 6,
                condition: (formData) => {
                const selectedType = objectTypesList.find(
                    t => t.value === formData.type_id
                );
                return selectedType?.type === "student";

                }
            },


            {
                name: "section",
                label: "Section",
                type: "select",
                options: sections,
                colSize: 6,
                condition: (formData) => {
                    const selectedType = objectTypesList.find(
                    t => t.value === formData.type_id
                    );
                    return selectedType?.type === "student";
                }
            },

            { key: "issue_date", label: "Issue Date", type: "date" },
            { key: "expiry_date", label: "Submission Date", type: "date" },
            {
                key: "status",
                label: "Status",
                type: "badge",
                badgeConfig: {
                    active: "success",
                    inactive: "secondary",
                    true: "success",
                    false: "secondary",
                    true_label: "Active",
                    false_label: "Inactive",
                },
            },
        ],

        customHandlers: {
            generateCardNumber,
            formatDateToDDMMYYYY,
            handleBarcodePreview,

            onDataLoad: (data) => {


                if (Array.isArray(data)) {
                    return data.map((item) => {
                        const updatedItem = { ...item };

                        if (updatedItem.hasOwnProperty("is_active")) {
                            updatedItem.status = updatedItem.is_active ? "active" : "inactive";
                        } else if (!updatedItem.status) {
                            updatedItem.status = "active";
                        }

                        if (!updatedItem.first_name) updatedItem.first_name = "-";
                        if (!updatedItem.last_name) updatedItem.last_name = "-";

                        if (!updatedItem.name) {
                            updatedItem.name = `${updatedItem.first_name || ""} ${updatedItem.last_name || ""}`.trim();
                        }

                        return updatedItem;
                    });
                }
                return data;
            },
            beforeEdit: (item) => {


                const preparedData = { ...item };
                if (preparedData.hasOwnProperty("is_active")) {
                    preparedData.status = preparedData.is_active;
                }
                if (preparedData.plan_id) {
                    const selectedPlan = plansList.find(p => p.value == preparedData.plan_id)?.data;
                    if (selectedPlan) {
                        preparedData.selectedPlan = selectedPlan;

                    } else if (preparedData.plan && typeof preparedData.plan === 'object') {
                        preparedData.selectedPlan = preparedData.plan;

                    }
                }


                return preparedData;
            },
            beforeSubmit: (formData, isEditing, originalData) => {

                const errors = [];
                const submitData = { ...formData };
                if (submitData.selectedPlan) {
                    delete submitData.selectedPlan;
                }
                if (submitData.status !== undefined) {
                    submitData.is_active = Boolean(submitData.status);
                    delete submitData.status;
                }
                if (submitData.type_id) {
                    submitData.type = submitData.type_id;
                    delete submitData.type_id;
                }
                if (!submitData.user_id) {
                    errors.push("Please select a member");
                }
                if (!submitData.issue_date) {
                    errors.push("Issue date is required");
                }
                if (submitData.plan_id) {
                    const selectedPlan = plansList.find(p => p.value == submitData.plan_id)?.data;
                    if (selectedPlan && !selectedPlan.is_active) {
                        errors.push("Selected plan is inactive. Please select an active plan.");
                    }
                }


                if (submitData.image && submitData.image.size > 2 * 1024 * 1024) {
                    errors.push("Image size must be less than 2MB");
                }

                return {
                    errors,
                    processedData: submitData
                };
            },

            afterSubmit: (response, formData, isEditing) => {
                return response;
            }
        },

        transformResponse: (response) => {


            if (response && response.data) {
                let data = response.data;

                if (data.data && Array.isArray(data.data)) {
                    data = data.data;
                } else if (data.success && data.data) {
                    data = data.data;
                }

                if (Array.isArray(data)) {
                    data = data.map(item => {
                        const updatedItem = { ...item };

                        if (!updatedItem.status && updatedItem.hasOwnProperty("is_active")) {
                            updatedItem.status = updatedItem.is_active ? "active" : "inactive";
                        }

                        if (!updatedItem.name) {
                            updatedItem.name = `${updatedItem.first_name || ""} ${updatedItem.last_name || ""}`.trim();
                        }

                        return updatedItem;
                    });
                }

                return data;
            }
            return response;
        },

        exportConfig: {
            includeFields: [
                'card_number', 'name', 'email', 'phone_number', 'plan_name', 'status'
            ],
            fieldLabels: {
                name: 'Full Name',
                plan_name: 'Plan'
            }
        }
    };
};