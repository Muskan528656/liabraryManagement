// import React, { useEffect, useState } from 'react';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// import { Pie } from 'react-chartjs-2';
   
// const PieChart = ({selectedWhatsAppSetting}) => {
//   ChartJS.register(ArcElement, Tooltip, Legend);
//   const [statusCounts, setStatusCounts] = useState({ Pending: 0, 'In Progress': 0, Completed: 0, Aborted: 0 });

//   useEffect(() => {
//     const fetchStatusCounts = async (selectedWhatsAppSetting) => {
//       try {
//         const campaignStatusCount = await WhatsAppAPI.fetchCampaignStatusCounts(selectedWhatsAppSetting);
//         if(campaignStatusCount.result && campaignStatusCount){
//           setStatusCounts(campaignStatusCount.result);

//         }else{
//           setStatusCounts([]);
//         }
//       } catch (error) {
//         // console.error('Error fetching status counts:', error);
//       }
//     };

//     fetchStatusCounts(selectedWhatsAppSetting);
//   }, [selectedWhatsAppSetting]);
//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: false,
//         text: 'Properties sales monthly',
//       },
//     },
//   };
//   const data = {
//     labels: ['Pending', 'In porgress', 'Completed', 'Aborted'],
//     datasets: [
//       {
//         label: '# of Votes',
//         data: [statusCounts.Pending, statusCounts['In Progress'], statusCounts.Completed, statusCounts.Aborted],
//         backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 211, 255, 0.2)'],
//         borderColor: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 211, 255, 0.2)'],
//         borderWidth: 1,
//       },
//     ],
//   };
//   return (
//     <Pie data={data} options={options} />
//   )
// }

// export default PieChart