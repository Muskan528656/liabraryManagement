// import * as constants from "../constants/CONSTANT";
// import axios from "axios";

// export default class DataApi {
//   constructor(path) {
//     this.token = sessionStorage.getItem("token");
//     this.baseUrl = `${constants.API_BASE_URL}/api/${path}`;
//   }

//   getHeaders(contentType = false) {
//     const headers = {};

//     if (contentType) headers["Content-Type"] = "application/json";

//     if (this.token) {
//       headers.Authorization = this.token.startsWith("Bearer ")
//         ? this.token
//         : `Bearer ${this.token}`;
//     }

//     return headers;
//   }

//   fetchAll(queryString = "") {
//     const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
//     return axios.get(url, { headers: this.getHeaders() });
//   }

//   fetchById(id) {
//     const url = id ? `${this.baseUrl}/${id}` : this.baseUrl;
//     return axios.get(url, { headers: this.getHeaders() });
//   }

//   create(data) {
//     const isFormData = data instanceof FormData;
//     return axios.post(this.baseUrl, data, {
//       headers: isFormData ? this.getHeaders() : this.getHeaders(true),
//     });
//   }

//   post(url, data) {
//     return axios.post(this.baseUrl + url, data, {
//       headers: this.getHeaders(true),
//     });
//   }

//   put(url, data) {
//     return axios.put(this.baseUrl + url, data, {
//       headers: this.getHeaders(true),
//     });
//   }

//   get(url, config = {}) {
//     return axios.get(this.baseUrl + url, {
//       headers: this.getHeaders(),
//       ...config,
//     });
//   }

//   update(data, id) {
//     return axios.put(`${this.baseUrl}/${id}`, data, {
//       headers: this.getHeaders(true),
//     });
//   }

//   delete(id) {
//     return axios.delete(`${this.baseUrl}/${id}`, {
//       headers: this.getHeaders(),
//     });
//   }

//   deleteWithBody(url, data) {
//     return axios.delete(this.baseUrl + url, {
//       data,
//       headers: this.getHeaders(true),
//     });
//   }

//   async search(params = {}) {
//     const { display_fields, ...otherParams } = params;

//     const queryParams = {
//       ...otherParams,
//       ...(display_fields && { display_fields }),
//     };

//     const res = await axios.get(this.baseUrl, {
//       params: queryParams,
//       headers: this.getHeaders(),
//     });

//     return res.data;
//   }
//   updateFormData(formData, id) {
//     return axios.put(`${this.baseUrl}/${id}`, formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//         Authorization: `${this.token}`,
//       },
//     });
//   }

//   fetchIssuedCountByBookId(bookId) {
//     console.log("AAAA", bookId);
//     if (!bookId) throw new Error("Book ID required");

//     const url = `${this.baseUrl}/${bookId}/issued-count`;
//     return axios.get(url, { headers: this.getHeaders() });
//   }

//   fetchSubmitCountByBookId(bookId) {
//     console.log("bookId in api is", bookId);
//     const url = bookId
//       ? `${this.baseUrl}/${bookId}/submit-count`
//       : this.baseUrl;
//     return axios.get(url, {
//       headers: {
//         Authorization: `${this.token}`,
//       },
//     });
//   }

//   upsert(data) {
//     return axios.post(this.baseUrl, data, { headers: this.getHeaders(true) });
//   }

//   createLibraryCard(formData) {
//     const data = new FormData();
//     Object.keys(formData).forEach((key) => {
//       if (
//         key !== "image" &&
//         formData[key] !== null &&
//         formData[key] !== undefined
//       ) {
//         data.append(key, formData[key]);
//       }
//     });
//     if (formData.image && formData.image instanceof File) {
//       data.append("image", formData.image);
//     }

//     return axios.post(this.baseUrl, data, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//         ...this.getHeaders(),
//       },
//     });
//   }

//   updateLibraryCard(formData, id) {
//     console.log("🔄 [FRONTEND] Starting updateLibraryCard for ID:", id);
//     console.log("🔄 [FRONTEND] Input formData type:", formData instanceof FormData ? "FormData" : "Object");
//     console.log("🔄 [FRONTEND] Input formData keys:", formData instanceof FormData ? Array.from(formData.keys()) : Object.keys(formData));

//     if (!(formData instanceof FormData)) {
//       console.log("🔄 [FRONTEND] Converting object to FormData");
//       console.log("🔄 [FRONTEND] Original formData:", formData);
//     }

//     const data = formData instanceof FormData ? formData : new FormData();

//     if (!(formData instanceof FormData)) {
//       Object.keys(formData).forEach((key) => {
//         const value = formData[key];
//         if (key === "image") {
//           // Only append image field if there's an actual file or we want to clear it
//           if (value instanceof File) {
//             console.log("🖼️ [FRONTEND] Appending image file:", value.name, "size:", value.size);
//             data.append("image", value);
//           } else if (value === null || value === "") {
//             // Send empty string to indicate image should be cleared
//             console.log("🗑️ [FRONTEND] Appending empty string to clear image");
//             data.append("image", "");
//           } else {
//             console.log("📎 [FRONTEND] Skipping image field (value:", value, ")");
//           }
//           // Don't append anything for undefined/other values to avoid multipart issues
//         } else if (value !== null && value !== undefined && value !== "") {
//           console.log("📝 [FRONTEND] Appending field:", key, "=", String(value));
//           data.append(key, String(value));
//         } else {
//           console.log("📝 [FRONTEND] Skipping field:", key, "(value:", value, ")");
//         }
//       });
//     }

//     // Check if we actually have multipart data
//     const hasMultipartData = data instanceof FormData && Array.from(data.entries()).some(([key, value]) => key === 'image' && value instanceof File);
//     console.log("🔍 [FRONTEND] Has multipart data (file upload):", hasMultipartData);


//     fetchAll(queryString = '') {
//         const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
//         return axios.get(url, { headers: this.getHeaders() });
//     }

//     fetchById(id) {
//         const url = id ? `${this.baseUrl}/${id}` : this.baseUrl;
//         return axios.get(url, { headers: this.getHeaders() });
//     }

//     create(data) {
//         const isFormData = data instanceof FormData;
//         return axios.post(this.baseUrl, data, {
//             headers: isFormData ? this.getHeaders() : this.getHeaders(true)
//         });
//     }

//     post(url, data) {
//         return axios.post(this.baseUrl + url, data, { headers: this.getHeaders(true) });
//     }

//     put(url, data) {
//         return axios.put(this.baseUrl + url, data, { headers: this.getHeaders(true) });
//     }

//     get(url, config = {}) {
//         return axios.get(this.baseUrl + url, {
//             headers: this.getHeaders(),
//             ...config
//         });
//     }

//     update(data, id) {
//         return axios.put(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders(true) });
//     }

//     delete(id) {
//         return axios.delete(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
//     }

//     deleteWithBody(url, data) {
//         return axios.delete(this.baseUrl + url, {
//             data,
//             headers: this.getHeaders(true)
//         });
//     }


//     async search(params = {}) {
//         const { display_fields, ...otherParams } = params;

//         const queryParams = {
//             ...otherParams,
//             ...(display_fields && { display_fields }),
//         };

//         const res = await axios.get(this.baseUrl, {
//             params: queryParams,
//             headers: this.getHeaders()
//         });

//         return res.data;
//     }
//     updateFormData(formData, id) {
//         return axios.put(`${this.baseUrl}/${id}`, formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//                 Authorization: `${this.token}`,
//             },
//         });
//     }


//     fetchIssuedCountByBookId(bookId) {
 
//         if (!bookId) throw new Error("Book ID required");

//         const url = `${this.baseUrl}/${bookId}/issued-count`;
//         return axios.get(url, { headers: this.getHeaders() });
//     }

//     fetchSubmitCountByBookId(bookId) {
 
//         const url = bookId ? `${this.baseUrl}/${bookId}/submit-count` : this.baseUrl;
//         return axios.get(url, {
//             headers: {
//                 Authorization: `${this.token}`,
//             },
//         });
//     }

//     upsert(data) {
//         return axios.post(this.baseUrl, data, { headers: this.getHeaders(true) });
//     }

//     createLibraryCard(formData) {
//         const data = new FormData();
//         Object.keys(formData).forEach(key => {
//             if (key !== 'image' && formData[key] !== null && formData[key] !== undefined) {
//                 data.append(key, formData[key]);
//             }
//         });
//         if (formData.image && formData.image instanceof File) {
//             data.append('image', formData.image);
//         }
//       }
//     }

//     updateLibraryCard(formData, id) {
 
//         return axios.put(`${this.baseUrl}/${id}`, formData, {
//             headers: {
//                 ...this.getHeaders()
//             }
//         });
//     }
//   }
// }


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


  update(data, id) {
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
    return axios.put(`${this.baseUrl}/${id}`, formData, {
      headers: {
        ...this.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
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
  upsert(data) {
    return axios.post(this.baseUrl, data, {
      headers: this.getHeaders(true),
    });
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
