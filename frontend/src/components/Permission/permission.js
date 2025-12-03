import React, { useState, useEffect } from 'react';
import AddPermissionModal from './addPermissionmodule';
import DataApi from '../../api/dataApi';
import Loader from '../common/Loader';

const Permission = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // To trigger refresh

    // Fetch permissions from API
    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const api = new DataApi("permissions");
            const result = await api.fetchAll();
            console.log("RESULT PERMISOON",result)
            setPermissions(result?.data?.permissions || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to fetch permissions");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [refreshKey]);

    const handleSavePermission = async (formData) => {
        try {
            const api = new DataApi("permissions");
            if (editingItem) {
                await api.update(editingItem.id, formData);
                alert("Permission updated successfully!");
            } else {
                await api.create(formData);
                alert("Permission created successfully!");
            }
            setShowAddModal(false);
            setEditingItem(null);
            setRefreshKey(prev => prev + 1); // Refresh table
        } catch (err) {
            console.error(err);
            alert("Error saving permission: " + err.message);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        try {
            const api = new DataApi("permissions");
            await api.delete(id);
            alert("Permission deleted successfully!");
            setRefreshKey(prev => prev + 1); // Refresh table
        } catch (err) {
            console.error(err);
            alert("Error deleting permission: " + err.message);
        }
    };

    const CustomHeader = () => (
        <div className="d-flex justify-content-between align-items-center mb-4 p-2"
            style={{
                color: "var(--primary-color)",
                background: "var(--primary-background-color)",
                borderRadius: "10px",
            }}>
            <h5 className="fw-bold mb-1">
                <i className="fa-solid fa-lock me-2 fs-6"></i> Permissions
            </h5>
            <button className="custom-btn-table-header" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-plus me-1"></i> Add Permission
            </button>
        </div>
    );

    const PermissionTable = () => {
        console.log("permissionspermissions",permissions)
        if (loading) return <Loader message="Loading permissions..." />;
        if (error) return <div className="alert alert-danger">{error}</div>;
        if (!permissions.length) return <div>No permissions available.</div>;

        return (
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Module ID</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {permissions.map((item, index) => (
                        <tr key={index}>
                            <td>{item.module_id || "N/A"}</td>
                            <td>
                                View: {item.allow_view ? "Yes" : "No"},&nbsp;
                                Create: {item.allow_create ? "Yes" : "No"},&nbsp;
                                Edit: {item.allow_edit ? "Yes" : "No"},&nbsp;
                                Delete: {item.allow_delete ? "Yes" : "No"}
                            </td>
                            <td>
                                <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(item)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="permission-page">
            <CustomHeader />
            <PermissionTable />

            <AddPermissionModal
                show={showAddModal}
                handleClose={() => { setShowAddModal(false); setEditingItem(null); }}
                editingItem={editingItem}
                onSave={handleSavePermission}
            />
        </div>
    );
};

export default Permission;
