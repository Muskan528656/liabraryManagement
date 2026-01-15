import React, { useState } from 'react';

const PermissionDenied = () => {
    const [userRole, setUserRole] = useState('user');
    const [showDetails, setShowDetails] = useState(false);

    const styles = {
        container: {

            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        },
        card: {
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '800px',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden'
        },
        cardTopBorder: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '5px',
            background: 'linear-gradient(to right, var(--primary-color), var(--secondary-color))'
        },
        header: {
            textAlign: 'center',
            marginBottom: '30px'
        },
        iconContainer: {
            background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 20px rgba(255, 65, 108, 0.3)'
        },
        mainIcon: {
            fontSize: '50px',
            color: 'white'
        },
        title: {
            fontSize: '2.5rem',
            color: '#333',
            marginBottom: '10px',
            fontWeight: '700'
        },
        subtitle: {
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '20px'
        },
        errorSection: {
            background: '#f8f9fa',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '30px',
            borderLeft: '5px solid var(--primary-color)'
        },
        errorCode: {
            fontSize: '3rem',
            fontWeight: '800',
            color: 'var(--primary-color)',
            lineHeight: '1'
        },
        errorMessage: {
            fontSize: '1.5rem',
            color: '#666',
            fontWeight: '600',
            marginTop: '10px'
        },
        sectionTitle: {
            fontSize: '1.3rem',
            color: '#333',
            marginBottom: '15px',
            fontWeight: '600'
        },
        reasonsList: {
            listStyle: 'none',
            paddingLeft: '0'
        },
        reasonItem: {
            padding: '10px 0',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center'
        },
        reasonIcon: {
            color: '#ff416c',
            marginRight: '10px',
            fontSize: '1.2rem'
        },
        actionButtons: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '20px'
        },
        actionButton: {
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '10px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minHeight: '100px'
        },
        actionButtonHover: {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
            borderColor: '#ff416c'
        },
        actionIcon: {
            fontSize: '2rem',
            marginBottom: '10px'
        },
        actionText: {
            fontSize: '1rem',
            fontWeight: '600',
            color: '#333'
        },
        demoSection: {
            background: '#f0f8ff',
            borderRadius: '10px',
            padding: '20px',
            marginTop: '30px',
            border: '1px solid #d1e7ff'
        },
        demoHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
        },
        roleSelector: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '15px'
        },
        roleButton: {
            padding: '10px 20px',
            border: '2px solid #ddd',
            borderRadius: '25px',
            background: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
        },
        activeRoleButton: {
            background: '#ff416c',
            color: 'white',
            borderColor: '#ff416c'
        },
        detailsToggle: {
            background: 'transparent',
            border: 'none',
            color: '#0066cc',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
        },
        roleDetails: {
            background: 'white',
            borderRadius: '10px',
            padding: '15px',
            marginTop: '15px',
            border: '1px solid #e9ecef'
        },
        accessMessage: {
            color: '#666',
            marginTop: '10px',
            fontStyle: 'italic'
        },
        loginSection: {
            textAlign: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '2px dashed #ddd'
        },
        loginButton: {
            background: 'linear-gradient(to right, #36d1dc, #5b86e5)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 30px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '15px',
            transition: 'transform 0.3s ease'
        },
        footer: {
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #eee',
            fontSize: '0.9rem',
            color: '#666',
            textAlign: 'center'
        },
        supportInfo: {
            background: '#f8f9fa',
            borderRadius: '5px',
            padding: '10px',
            marginTop: '10px',
            display: 'inline-block'
        }
    };
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.cardTopBorder}></div>

                {/* Header Section */}
                <div style={styles.header}>
                    <div style={styles.iconContainer}>
                        <i className="fas fa-ban" style={styles.mainIcon}></i>
                    </div>
                    <h1 style={styles.title}>Access Denied</h1>
                    <p style={styles.subtitle}>You don't have permission to access this resource</p>
                </div>

                {/* Error Code Section */}
                <div style={styles.errorSection}>
                    <div style={styles.errorCode}>Error 403</div>
                    <div style={styles.errorMessage}>FORBIDDEN</div>
                </div>

                {/* Possible Reasons */}
                {/* <div>
                    <h3 style={styles.sectionTitle}>Possible reasons:</h3>
                    <ul style={styles.reasonsList}>
                        {possibleReasons.map((reason, index) => (
                            <li key={index} style={styles.reasonItem}>
                                <i className="fas fa-exclamation-circle" style={styles.reasonIcon}></i>
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div> */}

                {/* Action Buttons */}
                {/* <div style={{ marginTop: '30px' }}>
                    <h3 style={styles.sectionTitle}>What would you like to do?</h3>
                    <div style={styles.actionButtons}>
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                style={{
                                    ...styles.actionButton,
                                    ...(hoveredButton === index ? styles.actionButtonHover : {})
                                }}
                                onMouseEnter={() => setHoveredButton(index)}
                                onMouseLeave={() => setHoveredButton(null)}
                                onClick={() => console.log(`Navigating to: ${action.path}`)}
                            >
                                <span style={styles.actionIcon}>{action.icon}</span>
                                <span style={styles.actionText}>{action.text}</span>
                            </button>
                        ))}
                    </div>
                </div> */}

                {/* Demo Section */}
                {/* <div style={styles.demoSection}>
                    <div style={styles.demoHeader}>
                        <h4 style={{ margin: 0, color: '#333' }}>Demo: Try different access levels</h4>
                        <button
                            style={styles.detailsToggle}
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            {showDetails ? 'Hide Details ▲' : 'Show Details ▼'}
                        </button>
                    </div>

                    <div style={styles.roleSelector}>
                        {['guest', 'user', 'admin'].map((role) => (
                            <button
                                key={role}
                                style={{
                                    ...styles.roleButton,
                                    ...(userRole === role ? styles.activeRoleButton : {})
                                }}
                                onClick={() => handleRoleChange(role)}
                            >
                                {role.charAt(0).toUpperCase() + role.slice(1)} User
                            </button>
                        ))}
                    </div>

                    {showDetails && (
                        <div style={styles.roleDetails}>
                            <p>
                                Current role: <strong>{userRole.toUpperCase()}</strong>
                            </p>
                            <p style={styles.accessMessage}>
                                {userRole === 'guest'
                                    ? 'You have minimal access. Most features are restricted.'
                                    : userRole === 'user'
                                        ? 'You have standard access. Some admin features are restricted.'
                                        : 'You have full administrative access to all resources.'}
                            </p>
                        </div>
                    )}
                </div> */}

                {/* Login Section */}
                {/* <div style={styles.loginSection}>
                    <p style={{ color: '#666', marginBottom: '10px' }}>
                        Need different access?
                    </p>
                    <button
                        style={styles.loginButton}
                        onClick={simulateLogin}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        <i className="fas fa-sign-in-alt"></i>
                        Sign in with different account
                    </button>
                </div> */}

                {/* Footer */}
                {/* <div style={styles.footer}>
                    <p>
                        <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#0066cc' }}></i>
                        If you believe this is an error, contact your system administrator.
                    </p>
                    <div style={styles.supportInfo}>
                        <span>Support: support@example.com | Ext: 1234</span>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default PermissionDenied;