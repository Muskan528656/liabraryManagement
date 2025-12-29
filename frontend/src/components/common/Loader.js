import React from "react";

const Loader = ({ size = "md" }) => {
    const sizeMap = {
        sm: "30px",
        md: "50px",
        lg: "70px",
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "2rem",
            }}
        >
            <div
                className="spinner-border"
                role="status"
                style={{
                    width: sizeMap[size],
                    height: sizeMap[size],
                    borderWidth: "4px",
                    borderColor: "var(--primary-color)",
                    borderRightColor: "transparent",
                }}
            >
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

export default Loader;

