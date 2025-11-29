 
import { useState, useEffect } from 'react';
import DataApi from '../../api/dataApi';

export const useDataManager = (dependencies = {}, propsData = {}) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const dataMap = { ...propsData };


        const apiEndpoints = Object.values(dependencies)
          .filter(endpoint => typeof endpoint === 'string' && !propsData[endpoint]);
          
        const promises = apiEndpoints.map(async (endpoint) => {
       
          const api = new DataApi(endpoint);
          const response = await api.fetchAll();
          return { endpoint, data: response.data || [] };
        });

        const results = await Promise.all(promises);


        results.forEach(({ endpoint, data }) => {
          dataMap[endpoint] = data;
        });

        setData(dataMap);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [JSON.stringify(), JSON.stringify()]);

  return { data, loading, error };
};