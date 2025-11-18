import * as constants from '../constants/CONSTANT';
import axios from 'axios';
export default class DataApi {
    constructor(path) {
        this.token = sessionStorage.getItem('token');
        //console.log("Token: ", this.token);
        //this.objectName = objectName; // e.g., "contact", "property", "task"
        this.baseUrl = `${constants.API_BASE_URL}/api/${path}`; // REST endpoints like /api/contact
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

    // Fetch a single record
    fetchById(id) {
        const url = id ? `${this.baseUrl}/${id}` : this.baseUrl;
        return axios.get(url, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

    // Create a record
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

    // Update a record
    update(data, id) {
        console.log(`Update Method: ${this.baseUrl}/${id}`);
        return axios.put(`${this.baseUrl}/${id}`, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        }); // Update
    }
    // Delete a record
    delete(id) {
        return axios.delete(`${this.baseUrl}/${id}`, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

    // Delete with data in body (for bulk operations)
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

    // Bulk upsert records
    upsert(data) {
        console.log('upsert payload data: ', data);
        return axios.post(this.baseUrl, data, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }
}
