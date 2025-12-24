
 
 
 
 
 
 
 
 
 
 


 
 
 

 
 
 

 

 

 
 
 
 

 

 
 
 
 
 
 

 
 
 
 
 
 
 

 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 

 
 
 

 
 
 
 
 
 
 
 
 
 
 
 

 
 
 

 
 
 
 
 
 

 
 
 
 


 

const baseLayout = ({ title, subtitle, bodyHtml }) => {
  return `
    <div style="
      font-family: Arial, sans-serif;
      border:1px solid #ccc;
      padding:30px;
      max-width:650px;
      margin:0 auto;
      text-align:center;
    ">
      <h2 style="font-size:28px; margin-bottom:10px; color:#11439b;">
        Library Notice
      </h2>

      <h3 style="font-size:22px; margin-top:0;">
        ${subtitle}
      </h3>

      ${bodyHtml}

      <br/>

      <p style="font-size:15px;">
        Sincerely,<br/>
        <b>Library Management</b><br/>
        📧 library@example.com | ☎️ 123-456-7890
      </p>

      <hr/>

      <small style="font-size:12px; color:#666;">
        This is a system generated email. Please do not reply.
      </small>
    </div>
  `;
};
const dueTemplate = ({ studentName, books }) => {

  const booksHtml = books.map(book => `
    <tr>
      <td style="padding:8px; border:1px solid #ccc;">${book.name}</td>
      <td style="padding:8px; border:1px solid #ccc;">${book.dueDate}</td>
    </tr>
  `).join("");

  return baseLayout({
    subtitle: `<span style="color:#11439b;">Book Submission Reminder</span>`,
    bodyHtml: `
      <p style="font-size:16px;">
        Dear  <b>${studentName}</b>,
      </p>

      <p style="font-size:16px;">
        The following library books are due for return tomorrow:
      </p>

      <table style="border-collapse:collapse; width:100%; margin:15px 0;">
        <tr>
          <th style="padding:8px; border:1px solid #ccc;">Book Name</th>
          <th style="padding:8px; border:1px solid #ccc;">Due Date</th>
        </tr>
        ${booksHtml}
      </table>

      <p style="font-size:16px;">
        Please submit your books on time to avoid late fees.
      </p>

      <p style="font-size:15px;">
        <b>Reminder:</b> Our library rules are important.
      </p>
    `,
  });
};

 
const overdueTemplate = ({ studentName, books }) => {
 
  const booksHtml = books.map(book => `
    <tr>
      <td style="padding:8px; border:1px solid #ccc;">${book.name}</td>
      <td style="padding:8px; border:1px solid #ccc;">${book.dueDate}</td>
      <td style="padding:8px; border:1px solid #ccc;">${book.overdueDays}</td>
      <td style="padding:8px; border:1px solid #ccc; color:red;">₹${book.penaltyAmount}</td>
    </tr>
  `).join("");

  return baseLayout({
    subtitle: `<span style="color:red;">Overdue Book Notice</span>`,
    bodyHtml: `
      <p style="font-size:16px;">
        Dear <b>${studentName}</b>,
      </p>

      <p style="font-size:16px;">
        The following library books are overdue and need to be returned immediately:
      </p>

      <table style="border-collapse:collapse; width:100%; margin:15px 0;">
        <tr>
          <th style="padding:8px; border:1px solid #ccc;">Book Name</th>
          <th style="padding:8px; border:1px solid #ccc;">Due Date</th>
          <th style="padding:8px; border:1px solid #ccc;">Overdue Days</th>
          <th style="padding:8px; border:1px solid #ccc;">Penalty</th>
        </tr>
        ${booksHtml}
      </table>

      <p style="font-size:16px; color:#b30000;">
        Please return the overdue books immediately to avoid further penalties.
      </p>

      <p style="font-size:15px;">
        <b>Reminder:</b> Our library rules are important.
      </p>
    `,
  });
};

module.exports = {
  dueTemplate,
  overdueTemplate,
};
