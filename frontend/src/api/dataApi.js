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
        const headers = {};
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.get(url, { headers });
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
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.post(this.baseUrl, data, { headers });
    }

    post(url, data) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.post(this.baseUrl + url, data, { headers });
    }

    put(url, data) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.put(this.baseUrl + url, data, { headers });
    }

    get(url, config = {}) {
        const headers = {};
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.get(this.baseUrl + url, { headers, ...config });
    }

 
    update(data, id) {
        console.log(`Update Method: ${this.baseUrl}/${id}`);
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.put(`${this.baseUrl}/${id}`, data, { headers }); // Update
    }
 
    delete(id) {
        const headers = {};
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.delete(`${this.baseUrl}/${id}`, { headers });
    }

 
    deleteWithBody(url, data) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.delete(this.baseUrl + url, { data: data, headers });
    }

    async search(params = {}) {
        const { display_fields, ...otherParams } = params;

        const queryParams = {
            ...otherParams,
            ...(display_fields && { display_fields }),
        };

        const headers = {};
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        const res = await axios.get(this.baseUrl, { params: queryParams, headers });

        return res.data;
    }

 
    upsert(data) {
        console.log('upsert payload data: ', data);
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers.Authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
        return axios.post(this.baseUrl, data, { headers });
    }
}
