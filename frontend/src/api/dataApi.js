import * as constants from '../constants/CONSTANT';
import axios from 'axios';

export default class DataApi {
    constructor(path) {
        this.token = sessionStorage.getItem('token');
        this.baseUrl = `${constants.API_BASE_URL}/api/${path}`;
    }


    getHeaders(contentType = false) {
        const headers = {};

        if (contentType) headers['Content-Type'] = 'application/json';

        if (this.token) {
            headers.Authorization = this.token.startsWith("Bearer ")
                ? this.token
                : `Bearer ${this.token}`;
        }

        return headers;
    }



    fetchAll(queryString = '') {
        const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
        return axios.get(url, { headers: this.getHeaders() });
    }

    fetchById(id) {
        const url = id ? `${this.baseUrl}/${id}` : this.baseUrl;
        return axios.get(url, { headers: this.getHeaders() });
    }

    create(data) {
        const isFormData = data instanceof FormData;
        return axios.post(this.baseUrl, data, {
            headers: isFormData ? this.getHeaders() : this.getHeaders(true)
        });
    }

    post(url, data) {
        return axios.post(this.baseUrl + url, data, { headers: this.getHeaders(true) });
    }

    put(url, data) {
        return axios.put(this.baseUrl + url, data, { headers: this.getHeaders(true) });
    }

    get(url, config = {}) {
        return axios.get(this.baseUrl + url, {
            headers: this.getHeaders(),
            ...config
        });
    }

    update(data, id) {
        return axios.put(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders(true) });
    }

    delete(id) {
        return axios.delete(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
    }

    deleteWithBody(url, data) {
        return axios.delete(this.baseUrl + url, {
            data,
            headers: this.getHeaders(true)
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
            headers: this.getHeaders()
        });

        return res.data;
    }
    updateFormData(formData, id) {
        return axios.put(`${this.baseUrl}/${this.endpoint}/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }


    fetchIssuedCountByBookId(bookId) {
        console.log("AAAA", bookId)
        if (!bookId) throw new Error("Book ID required");

        const url = `${this.baseUrl}/${bookId}/issued-count`;
        return axios.get(url, { headers: this.getHeaders() });
    }

    fetchSubmitCountByBookId(bookId) {
        console.log("bookId in api is", bookId);
        const url = bookId ? `${this.baseUrl}/${bookId}/submit-count` : this.baseUrl;
        return axios.get(url, {
            headers: {
                Authorization: `${this.token}`,
            },
        });
    }

    upsert(data) {
        return axios.post(this.baseUrl, data, { headers: this.getHeaders(true) });
    }

    createLibraryCard(formData) {
        const data = new FormData();

        // Append all form fields except image
        Object.keys(formData).forEach(key => {
            if (key !== 'image' && formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });

        // Handle image separately
        if (formData.image && formData.image instanceof File) {
            data.append('image', formData.image);
        }

        return axios.post(this.baseUrl, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...this.getHeaders()
            }
        });
    }
}
