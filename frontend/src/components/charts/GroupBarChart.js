// import React, { useEffect, useState } from 'react';

// import {
//   Chart,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';
// import { Bar } from 'react-chartjs-2';
//    import { Colors } from 'chart.js';

// Chart.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   Colors
// );



// const GroupBarChart = () => {
//   const [ownerNames, setOwnerNames] = useState([]);
//   const [dataSetsArr, setDataSetsArr] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const leadCountByAgent = await WhatsAppAPI.fetchLeadReports('lead_count_by_agent');

//       let groupedData = [];
//       leadCountByAgent.map(obj => {
//         let arr = groupedData[obj.ownername];
//         if (!arr)
//           arr = [];
//         arr.push({ status: obj.leadstatus, count: obj.count })

//         groupedData[obj.ownername] = arr;
//       });

//       let finalSeries = [];
//       Object.keys(groupedData).map(key => {
//         let data = [...groupedData[key]];
//         let series = [];
//         data.forEach(function (obj) {
//           let arr = series[obj.status];
//           if (!arr)
//             arr = [];
//           arr.push(obj.count);
//           series[obj.status] = arr;
//         })

//         finalSeries[key] = series;
//       })


//       let uniqueStatus = [];
//       Object.keys(finalSeries).map(key => {
//         Object.keys(finalSeries[key]).map(stkey => {
//           uniqueStatus.push(stkey);
//         });
//       });
//       uniqueStatus = uniqueStatus.filter((item,
//         index) => uniqueStatus.indexOf(item) === index);

//       let keys = [];
//       Object.keys(finalSeries).map(key => {

//         uniqueStatus.forEach((stkey) => {
//           let arr = keys[stkey];
//           if (!arr)
//             arr = [];
//           let data = finalSeries[key][stkey];
//           if (!data)
//             data = 0;
//           arr.push(data)
//           keys[stkey] = arr;
//         });
//       });
//       setOwnerNames(Object.keys(groupedData));

//       let colors = [{ backgroundColor: 'rgb(81,171,93, 0.5)' },
//       { backgroundColor: 'rgb(236,139,56, 0.5)' },
//       { backgroundColor: 'rgb(107,174,214,0.5)' },
//       { backgroundColor: 'rgb(158,154,200, 0.5)' }, { backgroundColor: 'rgb(115,115,115, 0.5)' }];
//       let index = 0;
//       let datasets = [];

//       Object.keys(keys).forEach(function (key) {
//         if (index >= 4)
//           index = 0;
//         let dataset = { label: key, data: [...keys[key]], borderColor: colors[index].backgroundColor, backgroundColor: colors[index].backgroundColor };
//         index++;

//         datasets.push(dataset);
//       })

//       setDataSetsArr(datasets);

//     }
//     fetchData();
//   }, []);

//   const options = {
//     indexAxis: 'y',
//     elements: {
//       bar: {
//         borderWidth: 2,
//       },
//     },

//     responsive: true,
//     plugins: {

//       legend: {
//         position: 'bottom',
//       },
//       title: {
//         display: false,
//         text: 'Chart.js Horizontal Bar Chart',
//       },
//     },
//   };
//   const labels = ownerNames;

//   const data = {
//     labels,
//     datasets: dataSetsArr,

//   };

//   return (
//     <Bar options={options} data={data} width={150}
//       height={100} />
//   )
// }


// export default GroupBarChart;