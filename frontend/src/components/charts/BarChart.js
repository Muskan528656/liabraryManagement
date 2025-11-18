// import React from 'react'
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
// import { Bar } from 'react-chartjs-2';

// const BarChart = () => {
//   ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: false,
//         text: 'Properties income/expense',
//       },
//     },
//   };

//   const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

//   const data = {
//     labels,
//     datasets: [
//       {
//         label: 'Income',
//         data: [44, 55, 88, 22, 99, 88, 77, 23],
//         backgroundColor: 'rgba(255, 99, 132, 0.5)',
//       },
//       {
//         label: 'Expense',
//         data: [22, 44, 11, 56, 12, 17, 55, 23],
//         backgroundColor: 'rgba(53, 162, 235, 0.5)',
//       },
//     ],
//   };
//   return (
//     <Bar options={options} data={data} width={100}
//       height={50}
//     />
//   )
// }

// export default BarChart