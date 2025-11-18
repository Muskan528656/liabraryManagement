// import React from 'react';
// import { Bar } from 'react-chartjs-2';

// const VerticalChart = ({ data1 }) => {
//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: false,
//         text: 'Count Report',
//       },
//     },
//     indexAxis: 'y', // Set indexAxis to 'y' for horizontal bar chart
//   };

//   const labels = data1.map((item, index) => item.label || '');
//   const countSum = data1.reduce((sum, item) => sum + (item.count ? parseFloat(item.count) : 0), 0);

//   const datasets = [
//     {
//       label: `Total: ${countSum}`,
//       data: data1.map((item) => item.count),
//       backgroundColor: 'rgba(255, 215, 0, 0.7)',
//     },
//   ];

//   return <div style={{}}><Bar options={options} data={{ labels, datasets }} height={200} width={400} /></div>;

// };
// export default VerticalChart;