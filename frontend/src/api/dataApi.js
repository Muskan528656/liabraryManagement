import * as constants from '../constants/CONSTANT';
import axios from 'axios';
export default class DataApi {
    constructor(path) {
        this.token = sessionStorage.getItem('token');

        this.baseUrl = `${constants.API_BASE_URL}/api/${path}`;
        console.log('baseUrl: ', this.baseUrl);
    }

    fetchAll(queryString = '') {
        const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
        console.log('fetchAll url: ', url);
        return axios.get(url, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

 
    fetchById(id) {
        const url = id ? `${this.baseUrl}/${id}` : this.baseUrl;
        return axios.get(url, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

 
    create(data) {
        console.log('data', data);
        return axios.post(this.baseUrl, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

    post(url, data) {
        return axios.post(this.baseUrl + url, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

    put(url, data) {
        return axios.put(this.baseUrl + url, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

    get(url, config = {}) {
        return axios.get(this.baseUrl + url, {
            headers: {
                Authorization: `${this.token}`,
            },
            ...config, // Allow passing additional config like responseType
        });
    }

 
    update(data, id) {
        console.log(`Update Method: ${this.baseUrl}/${id}`);
        return axios.put(`${this.baseUrl}/${id}`, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        }); // Update
    }
 
    delete(id) {
        return axios.delete(`${this.baseUrl}/${id}`, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

 
    deleteWithBody(url, data) {
        return axios.delete(this.baseUrl + url, {
            data: data,
            headers: {
                Authorization: `${this.token}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async search(params = {}) {
        const { display_fields, ...otherParams } = params;

        const queryParams = {
            ...otherParams,
            ...(display_fields && { display_fields }),
        };

        const res = await axios.get(this.baseUrl, {
            params: queryParams,
            headers: {
                Authorization: `${this.token}`,
            },
        });

        return res.data;
    }

 
    upsert(data) {
        console.log('upsert payload data: ', data);
        return axios.post(this.baseUrl, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }
}
