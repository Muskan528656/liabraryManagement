// import React from "react";

// const Loader = ({ size = "md" }) => {
//     const sizeMap = {
//         sm: "30px",
//         md: "50px",
//         lg: "70px",
//     };

//     return (
//         <div
//             style={{
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 padding: "2rem",
//             }}
//         >
//             <div
//                 className="spinner-border"
//                 role="status"
//                 style={{
//                     width: sizeMap[size],
//                     height: sizeMap[size],
//                     borderWidth: "4px",
//                     borderColor: "var(--primary-color)",
//                     borderRightColor: "transparent",
//                 }}
//             >
//                 <span className="visually-hidden">Loading...</span>
//             </div>
//         </div>
//     );
// };

// export default Loader;



import React from "react";

const Loader = ({ 
  size = "md", 
  color = "#3b82f6", 
  thickness = 4, 
  speed = "0.8s" 
}) => {
  const sizeMap = {
    sm: "24px",
    md: "40px",
    lg: "64px",
    xl: "96px"
  };

  const finalSize = sizeMap[size] || size;

  return (
    <div className="loader-container">
      <div className="modern-spinner"></div>

      <style>{`
        .loader-container {
          display: flex;
          justify-content: center;
          alignItems: center;
          padding: 2rem;
        }

        .modern-spinner {
          width: ${finalSize};
          height: ${finalSize};
          border-radius: 50%;
          
          /* The Magic: A conic gradient with a mask creates the tapered look */
          background: radial-gradient(farthest-side, ${color} 94%, #0000) top/8px 8px no-repeat,
                      conic-gradient(#0000 30%, ${color});
          
          /* Masking the center to create a hollow ring */
          -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - ${thickness}px), #000 0);
          mask: radial-gradient(farthest-side, #0000 calc(100% - ${thickness}px), #000 0);
          
          animation: spin ${speed} infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes spin {
          100% {
            transform: rotate(1turn);
          }
        }
      `}</style>
      
      {/* Accessibility */}
      <span className="visually-hidden" style={{
        position: 'absolute', width: '1px', height: '1px', padding: '0',
        margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: '0'
      }}>
        Loading...
      </span>
    </div>
  );
};

export default Loader;