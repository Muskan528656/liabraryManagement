export default {
    control: {
      backgroundColor: '#fff',
    
    },
    '&multiLine': {
      control: {
        minHeight: 63,
      },
      highlighter: {
        padding: 9,
       
      },
      input: {
        padding: 9,
        outline : 0,
        border: "1px solid #e6e6e6",
        borderRadius : "5px"
       
      },
    },
    '&singleLine': {
      display: 'inline-block',
      width: 180,
      highlighter: {
        padding: 1,
       
      },
      input: {
        padding: 1,
      },
    },
    suggestions: {
      list: {
        backgroundColor: 'white',
       
       
      },
      item: {
        padding: '5px 15px',
        textAlign : "left",
        borderBottom: "1px solid #e6e6e6",
      
        '&focused': {
          backgroundColor: '#cee4e5',
        },
      },
    },
  }