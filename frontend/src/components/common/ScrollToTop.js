import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {isVisible && (
                <Button
                    onClick={scrollToTop}
                    className="scroll-to-top-btn"
                    style={{
                        position: "fixed",
                        bottom: "100px",
                        right: "30px",
                        zIndex: 1001,
                        borderRadius: "50%",
                        width: "50px",
                        height: "50px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(111, 66, 193, 0.3)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(111, 66, 193, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(111, 66, 193, 0.3)";
                    }}
                >
                    <i className="fa-solid fa-arrow-up" style={{ color: "white", fontSize: "18px" }}></i>
                </Button>
            )}
        </>
    );
};

export default ScrollToTop;

