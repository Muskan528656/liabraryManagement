
import React, { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Row, Col, Badge } from "react-bootstrap";
import DataApi from "../../api/dataApi";
import ResizableTable from "../common/ResizableTable";
import PubSub from "pubsub-js";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import moment from "moment";

const ItemsList = ({ bookId, permissions, externalData = {} }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        book_id: bookId,
        barcode: "",
        item_price: "",
        home_branch_id: "",
        holding_branch_id: "",
        rack_mapping_id: "",
        cn_source: "DDC",
        cn_class: "",
        cn_item: ""
    });
    const [creating, setCreating] = useState(false);
    const { timeZone } = useTimeZone();

    const branches = externalData.branches || [];
    const shelves = externalData.shelf || [];

    useEffect(() => {
        if (bookId) {
            fetchItems();
        }
    }, [bookId]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const itemsApi = new DataApi("book-copy");
            const response = await itemsApi.fetchAll(`book/${bookId}`);

            const data = response?.data || response || [];
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching items:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = () => {
        setFormData({
            book_id: bookId,
            barcode: "",
            item_price: "",
            home_branch_id: branches[0]?.id || "",
            holding_branch_id: branches[0]?.id || "",
            rack_mapping_id: "",
            cn_source: "DDC",
            cn_class: "",
            cn_item: ""
        });
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setCreating(true);
            const itemsApi = new DataApi("book-copy");
            await itemsApi.create(formData);
            PubSub.publish("RECORD_SUCCESS_TOAST", {
                title: "Success",
                message: "Item created successfully",
            });
            setShowModal(false);
            fetchItems();
        } catch (error) {
            console.error("Error creating item:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: error.message || "Failed to create item",
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            const itemsApi = new DataApi("book-copy");
            await itemsApi.delete(id);
            PubSub.publish("RECORD_SUCCESS_TOAST", {
                title: "Success",
                message: "Item deleted successfully",
            });
            fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
            PubSub.publish("RECORD_ERROR_TOAST", {
                title: "Error",
                message: "Failed to delete item",
            });
        }
    }

    const columns = [
        {
            field: "barcode",
            label: "Barcode",
            width: 150,
        },
        {
            field: "call_number",
            label: "Call Number",
            width: 150,
            render: (value, row) =>
                `${row.cn_source || ''} ${row.cn_class || ''} ${row.cn_item || ''} ${row.cn_suffix || ''}`.trim()
        },
        {
            field: "status",
            label: "Status",
            render: (value) => (
                <Badge bg={value === 'AVAILABLE' ? 'success' : 'secondary'}>
                    {value}
                </Badge>
            )
        },
        {
            field: "home_branch",
            label: "Home Branch",
            render: (value, row) => {
                const br = branches.find(b => b.id === row.home_branch_id);
                return br ? br.name : '-';
            }
        },
        {
            field: "holding_branch",
            label: "Holding Branch",
            render: (value, row) => {
                const br = branches.find(b => b.id === row.holding_branch_id);
                return br ? br.name : '-';
            }
        },
        {
            field: "location",
            label: "Location",
            render: (value, row) => {
                const shelf = shelves.find(s => s.id === row.rack_mapping_id);
                if (shelf) {
                    return `${shelf.floor} - ${shelf.rack} (${shelf.shelf})`;
                }
                return '-';
            }
        },
        {
            field: "createddate",
            label: "Created Date",
            render: (value) => moment(convertToUserTimezone(value, timeZone)).format('l LT')
        },
        {
            field: "actions",
            label: "Actions",
            render: (value, row) => {
                if (!permissions?.allowDelete) return null;
                return (
                    <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
                        <i className="fa-solid fa-trash"></i>
                    </Button>
                )
            }
        }
    ];

    return (
        <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-primary">
                    <i className="fa-solid fa-list-ol me-2"></i>
                    Book Copies (Items)
                </h5>
                {permissions?.allowCreate && (
                    <Button variant="primary" size="sm" onClick={handleShowModal}>
                        <i className="fa-solid fa-plus me-1"></i> Add Copy
                    </Button>
                )}
            </Card.Header>
            <Card.Body className="p-0">
                <ResizableTable
                    data={items}
                    columns={columns}
                    loading={loading}
                    showCheckbox={false}
                    showSerialNumber={true}
                    emptyMessage="No copies found for this book."
                />
            </Card.Body>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Copy</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Barcode</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter barcode"
                                        required
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={formData.item_price}
                                        onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Home Branch</Form.Label>
                                    <Form.Select
                                        value={formData.home_branch_id}
                                        onChange={(e) => setFormData({ ...formData, home_branch_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Home Branch</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Holding Branch</Form.Label>
                                    <Form.Select
                                        value={formData.holding_branch_id}
                                        onChange={(e) => setFormData({ ...formData, holding_branch_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Holding Branch</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Shelf / Rack Location</Form.Label>
                                    <Form.Select
                                        value={formData.rack_mapping_id}
                                        onChange={(e) => setFormData({ ...formData, rack_mapping_id: e.target.value })}
                                    >
                                        <option value="">Select Shelf Mapping</option>
                                        {shelves.map(s => (
                                            <option key={s.id} value={s.id}>{s.floor} - {s.rack} ({s.shelf}) - {s.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CN Source</Form.Label>
                                    <Form.Select
                                        value={formData.cn_source}
                                        onChange={(e) => setFormData({ ...formData, cn_source: e.target.value })}
                                    >
                                        <option value="DDC">DDC</option>
                                        <option value="LLC">LLC</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CN Class</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.cn_class}
                                        onChange={(e) => setFormData({ ...formData, cn_class: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>CN Item</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.cn_item}
                                        onChange={(e) => setFormData({ ...formData, cn_item: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={creating}>
                            {creating ? "Creating..." : "Create Copy"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Card>
    );
};

export default ItemsList;
