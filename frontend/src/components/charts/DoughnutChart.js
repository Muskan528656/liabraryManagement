// import React, { useEffect, useState } from 'react';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// import { Doughnut } from 'react-chartjs-2';
   
// const DoughnutChart = ({selectedWhatsAppSetting}) => {
//     ChartJS.register(ArcElement, Tooltip, Legend);
//     const [categoryCounts, setCategoryCounts] = useState({ MARKETING: 0, UTILITY: 0, AUTHENTICATION: 0 });

//     useEffect(() => {
//         const fetchTemplateCategoryCount = async () => {
//             try {
//                 const templates = await WhatsAppAPI.getApprovedTemplates(selectedWhatsAppSetting);
//                 const categoryCount = { MARKETING: 0, UTILITY: 0, AUTHENTICATION: 0 };
//                 if (templates.error) {
//                     // console.error(templates)
//                 }
//                 if(templates && templates?.data){
//                     templates?.data.forEach(template => {
//                         const category = template.category;
//                         if (categoryCount[category] !== undefined) {
//                             categoryCount[category]++;
//                         }
//                     });
    
//                     setCategoryCounts(categoryCount);
//                 }else{
//                     setCategoryCounts([]);
//                 }
                

              
//             } catch (error) {
//                 // console.error('Error fetching status counts:', error);
//             }
//         };

//         fetchTemplateCategoryCount();
//     }, [selectedWhatsAppSetting]);
//     const options = {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//             legend: {
//                 position: 'top',
//             },
//             title: {
//                 display: false,
//             },
//         },
//     };
//     const data = {
//         labels: ['Authentication', 'Marketing', 'Utility'],
//         datasets: [
//             {
//                 label: '# of Votes',
//                 data: [categoryCounts.AUTHENTICATION, categoryCounts.MARKETING, categoryCounts.UTILITY],
//                 backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)',],
//                 borderColor: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(153, 102, 255, 0.2)',],
//                 borderWidth: 1,
//             },
//         ],
//     };
//     return (
//         <Doughnut data={data} options={options} />
//     )
// }

// export default DoughnutChart