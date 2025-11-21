// pages/AuthorDetailPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import ModuleDetail from '../components/common/ModuleDetail';

const AuthorDetail = () => {
    const { id } = useParams();

    return (
        <div className="container-fluid py-4">
            <ModuleDetail
                moduleName="authors"
                moduleApi="author"
                moduleLabel="Author"
                recordId={id}
                details={[
                    { key: "name", label: "Name", type: "text" },
                    { key: "email", label: "Email", type: "text" },
                    { key: "bio", label: "Bio", type: "text" }
                ]}
            />
        </div>
    );
};

export default AuthorDetail;