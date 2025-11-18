// import React from "react";

// const Suggestion = (props) => {

//   const selectSuggestion = (username) => {
//     const regexp = /@[a-zA-Z0-9]*$/;
//     const newValue = props.inputValue.replace(regexp, username + ' ');
//     props.applyMention({ target: { value: newValue } }); // THIS MIMICS AN ONCHANGE EVENT
//     props.focusInput();
//   }

//   const suggestionItems = props.suggestionList.map((item) => {
//     return <div className="item">{item.name}</div>
//   });


//   return (
//     <div style={{ border: "1px solid silver", width: "150px" }}>
//       {suggestionItems}
//     </div>
//   )
// }
// export default Suggestion;
