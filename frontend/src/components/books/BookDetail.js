import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Col, Row } from "react-bootstrap";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const BookDetail = ({ permissions}) => {

  console.log("BookDetail permission prop:", permissions);
  const { id } = useParams();
  const [externalData, setExternalData] = useState({ authors: [], categories: [] });
  const [groupedShelves, setGroupedShelves] = useState([]);
  const [subShelfOptions, setSubShelfOptions] = useState([]);
  
  const [book, setBook] = useState(null);
  const [availableBooks, setAvailableBooks] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [issuedBooksCount, setIssuedBooksCount] = useState(0);
  const [submitBooksCount, setSubmitBooksCount] = useState(0);
  const [showImporter, setShowImporter] = useState(false);

  const inventoryBindings = [
    { value: "hardcover", label: "Hardcover" },
    { value: "paperback", label: "Paperback" },
    { value: "spiral", label: "Spiral" },
  ];

 
  const { timeZone } = useTimeZone();
  const fetchBookData = async (bookId) => {
    try {

      const bookApi = new DataApi("book");
      const count = new DataApi("bookissue");
      const submit = new DataApi("book_submissions");


      const bookResponse = await bookApi.fetchById(bookId);
      const bookData = bookResponse?.data || {};
      setBook(bookData);
      const total = bookData.total_copies || 0;
      const available = bookData.available_copies || 0;
 
      setTotalBooks(total);
      setAvailableBooks(available);

      const issuedCountResponse = await count.fetchIssuedCountByBookId(bookId);
      const issuedCountData = issuedCountResponse?.data || {};
      const issuedCount = issuedCountData.issued_count || 0;
      setIssuedBooksCount(issuedCount);
      const issuedSubmitResponse = await submit.fetchSubmitCountByBookId(bookId);
      const issuedSubmitData = issuedSubmitResponse?.data || {};
      const issuedSubmitCount = issuedSubmitData.submit_count || 0;
      setSubmitBooksCount(issuedSubmitCount);
    } catch (error) {
      console.error("Error fetching book or book issues:", error);
    }
  };

  const fetchExternalData = async () => {
    console.log("Fetching external data for BookDetail");
    try {
      const authorApi = new DataApi("author");
      const authorsResponse = await authorApi.fetchAll();
      const authors = authorsResponse?.data?.data || authorsResponse?.data || [];

      const categoryApi = new DataApi("category");
      const categoriesResponse = await categoryApi.fetchAll();
      const categories = categoriesResponse?.data?.data || categoriesResponse?.data || [];

      const shelfApi = new DataApi("shelf/grouped");
      const groupedShelvesResponse = await shelfApi.fetchAll();
      const groupedShelves = groupedShelvesResponse?.data?.data || groupedShelvesResponse?.data || [];

      console.log("Fetched authors:", authors);
      console.log("Fetched categories:", categories);
      console.log("Fetched groupedShelves:", groupedShelves);

      setExternalData({
        authors: Array.isArray(authors) ? authors : [],
        categories: Array.isArray(categories) ? categories : [],
      });
      setGroupedShelves(Array.isArray(groupedShelves) ? groupedShelves : []);
    } catch (error) {
      console.error("Error fetching external data:", error);
    }
  };

  useEffect(() => {
    console.log("BookDetail useEffect triggered");
    fetchExternalData();
    if (id) {
      fetchBookData(id);
    }
  }, [id]);

useEffect(() => {
  if (book?.shelf_name && groupedShelves.length) {
    const shelf = groupedShelves.find(
      s => s.shelf_name === book.shelf_name
    );

    if (shelf?.sub_shelves) {
      setSubShelfOptions(
        shelf.sub_shelves.map(sub => ({
          value: sub.id,
          label: sub.name
        }))
      );
    }
  }
}, [book?.shelf_name, groupedShelves]);


  const shelfOptions = useMemo(() => groupedShelves.map(s => ({
    value: s.shelf_name,
    label: s.shelf_name
  })), [groupedShelves]);

  const fields = useMemo(() => ({
    title: "title",
    subtitle: "isbn",
    details: [
      { key: "title", label: "Title", type: "text" },
      { key: "price", label: "Price", type: "text" },
      { key: "isbn", label: "ISBN", type: "text" },
      {
        key: "author_id",
        label: "Author",
        type: "select",
        options: "authors",
        displayKey: "author_name"
      },
      {
        key: "publisher_id",
        label: "Publisher",
        type: "select",
        options: "publisher",
        displayKey: "publisher_name"
      },
      {
        key: "category_id",
        label: "Category",
        type: "select",
        options: "categories",
        displayKey: "category_name"
      },

         {
          key: "shelf_name",
          label: "Shelf",
          type: "select",
          options: shelfOptions,
          onChange: (value, formData, setFormData) => {
            const selectedShelf = groupedShelves.find(
              s => s.shelf_name === value
            );

            const newSubOptions = selectedShelf?.sub_shelves?.map(sub => ({
              value: sub.id,
              label: sub.name
            })) || [];

            setSubShelfOptions(newSubOptions);

            setFormData(prev => ({
              ...prev,
              shelf_name: value,
              shelf_id: ""
            }));
          },
        },
    
     {
        key: "shelf_id",
        label: "Sub Shelf",
        type: "select",
        options: subShelfOptions,
        onChange: (value, formData, setFormData) => {
          const selectedSub = subShelfOptions.find(s => s.value === value);
          setFormData(prev => ({
            ...prev,
            shelf_id: value,
            sub_shelf: selectedSub ? selectedSub.label : ""
          }));
        }
      },

      { key: "total_copies", label: "Total Copies", type: "number" },
      { key: "available_copies", label: "Available Copies", type: "number" },
      { key: 'min_age', label: 'Min Age', type: 'number' },
      { key: 'max_age', label: 'Max Age', type: 'number' },
      { key: "inventory_binding", label: "Inventory Binding", type: "select", options: inventoryBindings },

    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },

      {
        key: "createddate", label: "Created Date", type: "date", render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
      {
        key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => {
          return convertToUserTimezone(value, timeZone)
        },
      },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
    ],
  }), [groupedShelves, shelfOptions, inventoryBindings, timeZone, subShelfOptions]);

  const lookupNavigation = {
    author_name: {
      path: "author",
      idField: "author_id",
      labelField: "author_name"
    },
    category_name: {
      path: "category",
      idField: "category_id",
      labelField: "category_name"
    }
  };
  const cardData = [
    {
      title: "Total Copies",
      value: totalBooks,
      icon: "fa-solid fa-layer-group",
      border: "border-start",
    },
    {
      title: "Issued Copies",
      value: issuedBooksCount,
      icon: "fa-solid fa-book-open",
      border: "border-start",
    },
    {
      title: "Available Copies",
      value: availableBooks,
      icon: "fa-solid fa-cart-shopping",
      border: "border-start",
    },
    {
      title: "Book Submission",
      value: submitBooksCount,
      icon: "fa-solid fa-cart-shopping",
      border: "border-start",
    }
  ];

  console.log("BookDetail permissions:", permissions);

  return (
    <>
      <Row>

        <Col lg={9} className="mb-3">
          {book && (
            <ModuleDetail
              moduleName="book"
              moduleApi="book"
              moduleLabel="Book"
              icon="fa-solid fa-book"
              fields={fields}
              lookupNavigation={lookupNavigation}
              externalData={externalData}
              data={book}
              fetchBookData={fetchBookData}
              permissions={permissions || {}}
            />
          )}
        </Col>


        <Col lg={3} className="mb-3 mt-4">
          <Row>
            <Card className="p-4">
              {cardData.map((item, index) => (
                <Col lg={12} xs={12} key={index}>
                  <Card
                    className={`shadow - sm border-0 ${item.border} border-5 border-info mt-3`}

                  >
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div
                            className="p-2 rounded-circle me-2"
                            style={{ background: 'var(--primary-background-color)' }}
                          >
                            <i
                              className={`${item.icon} fa-sm`}
                              style={{ color: "var(--primary-color)" }}
                            ></i>
                          </div>
                          <p className="mb-0 small text-muted fs-6">{item.title}</p>
                        </div>
                        <h5 className="mb-0 fw-bold">{item.value}</h5>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Card>
          </Row >
        </Col >
      </Row >
    </>
  );
};

export default BookDetail;