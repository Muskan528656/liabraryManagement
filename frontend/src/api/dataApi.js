
import * as constants from "../constants/CONSTANT";
import axios from "axios";

export default class DataApi {
  constructor(path) {
    this.token = sessionStorage.getItem("token");
    this.baseUrl = `${constants.API_BASE_URL}/api/${path}`;
  }

  getHeaders(contentType = false) {
    const headers = {};

    if (contentType) {
      headers["Content-Type"] = "application/json";
    }

    if (this.token) {
      headers.Authorization = this.token.startsWith("Bearer ")
        ? this.token
        : `Bearer ${this.token}`;
    }

    return headers;
  }
  fetchAll(queryString = "") {
    const url = queryString
      ? `${this.baseUrl}?${queryString}`
      : this.baseUrl;
    return axios.get(url, { headers: this.getHeaders() });
  }

  fetchById(id) {
    const url = id ? `${this.baseUrl}/${id}` : this.baseUrl;
    return axios.get(url, { headers: this.getHeaders() });
  }

  create(data) {
    const isFormData = data instanceof FormData;
    return axios.post(this.baseUrl, data, {
      headers: isFormData ? this.getHeaders() : this.getHeaders(true),
    });
  }

  update(data,id ) {
    return axios.put(`${this.baseUrl}/${id}`, data, {
      headers: this.getHeaders(true),
    });
  }

  post(url, data) {
    return axios.post(this.baseUrl + url, data, {
      headers: this.getHeaders(true),
    });
  }

  put(url, data) {
    return axios.put(this.baseUrl + url, data, {
      headers: this.getHeaders(true),
    });
  }

  get(url, config = {}) {
    return axios.get(this.baseUrl + url, {
      headers: this.getHeaders(),
      ...config,
    });
  }

  delete(id) {
    return axios.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  deleteWithBody(url, data) {
    return axios.delete(this.baseUrl + url, {
      data,
      headers: this.getHeaders(true),
    });
  }
  async search(params = {}) {
    const { display_fields, ...otherParams } = params;

    const res = await axios.get(this.baseUrl, {
      params: {
        ...otherParams,
        ...(display_fields && { display_fields }),
      },
      headers: this.getHeaders(),
    });

    return res.data;
  }

  updateFormData(formData, id) {
    console.log( "Updating form data for ID:", id );
    console.log("formData", formData);
    return axios.put(`${this.baseUrl}/${id}`, formData, {
      headers: {
        ...this.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
  }

    upsert(data) {
    return axios.post(this.baseUrl, data, {
      headers: this.getHeaders(true),
    });
  }

  fetchIssuedCountByBookId(bookId) {
    if (!bookId) throw new Error("Book ID required");

    return axios.get(
      `${this.baseUrl}/${bookId}/issued-count`,
      { headers: this.getHeaders() }
    );
  }

  fetchSubmitCountByBookId(bookId) {
    if (!bookId) throw new Error("Book ID required");

    return axios.get(
      `${this.baseUrl}/${bookId}/submit-count`,
      { headers: this.getHeaders() }
    );
  }


  createLibraryCard(formData) {
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (
        key !== "image" &&
        formData[key] !== null &&
        formData[key] !== undefined
      ) {
        data.append(key, formData[key]);
      }
    });

    if (formData.image instanceof File) {
      data.append("image", formData.image);
    }

    return axios.post(this.baseUrl, data, {
      headers: {
        ...this.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
  }

  updateLibraryCard(formData, id) {
    return axios.put(`${this.baseUrl}/${id}`, formData, {
      headers: {
        ...this.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
  }
}
