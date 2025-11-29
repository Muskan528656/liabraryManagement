 
 
 
 
 
 

 
 

 
 

 
 
 

 
 
 
 
 
 
 
 

 

 
 


 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 
 
 

 


 
    import React, { useState } from 'react';
    import AddPermissionModal from './addPermissionmodule';
    import DataApi from '../../api/dataApi';
    import DynamicCRUD from "../common/DynaminCrud";
    import { getPermissionConfig } from '../Permission/permissionConfig'
    import { useDataManager } from '../common/userdatamanager';
    import Loader from '../common/Loader';
    const Permission = ({ props }) => {
        const [showModal, setShowModal] = useState(false);
        const [editingItem, setEditingItem] = useState(null);
        const [showAddModal, setShowAddModal] = useState(false);

        const baseConfig = getPermissionConfig();
        const { data, loading, error } = useDataManager(baseConfig.dataDependencies, props);

        if (loading) {
            return <Loader message="Loading permissions..." />;
        }

        if (error) {
            return (
                <div className="alert alert-danger">
                    <h4>Failed to load permissions</h4>
                    <p>{error}</p>
                </div>
            );
        }

        const finalConfig = getPermissionConfig(data, props);
 
        const handleSavePermission = async (formData) => {
            try {
                console.log("Saving permission data:", formData);

                const api = new DataApi("permissions");
                let result;

                if (editingItem) {
 
                    result = await api.update(editingItem.id, formData);
                    console.log("Update result:", result);
                } else {
 
                    result = await api.create(formData);
                    console.log("Create result:", result);
                }

 
                alert(editingItem ? "Permission updated successfully!" : "Permission created successfully!");

 
 

            } catch (error) {
                console.error("Error saving permission:", error);
                alert("Error saving permission: " + error.message);
            }
        };

        const handleAddNew = () => {
            setEditingItem(null);
            setShowModal(true);
        };

        const handleEdit = (item) => {
            setEditingItem(item);
            setShowModal(true);
        };

        return (
            <div className="permission-page">


                <div className="d-flex justify-content-start mb-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="fa fa-plus me-2"></i>
                        Add Permission
                    </button>
                </div>     <div
                    style={{
                        overflowX: "auto",
                        resize: "horizontal",
                        border: "1px solid #ddd",
                        padding: "5px",
                        minWidth: "400px"
                    }}
                >
                    <DynamicCRUD
                        {...finalConfig}
                        icon="fa-solid fa-lock"
                        enableResizableColumns={true}
                        stickyHeader={true}
                    />
                </div>


                <AddPermissionModal
                    show={showAddModal}
                    handleClose={() => setShowAddModal(false)}
                    onSave={(permissionData) => {
                        console.log("Saving permission:", permissionData);
                        setShowAddModal(false);
                    }}
                />
            </div>
        );
    };

    export default Permission;