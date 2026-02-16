// import jwt_decode from "jwt-decode";
// import * as constants from "../../constants/CONSTANT";

// const helper = {

//   generateDescriptionHTML(tasks) {
//     tasks.forEach((item, index) => {
//       const str = item.description;
//       const parts = str.split(") ");
//       if (item.description.includes("@")) {
//         const nameRegex = /@\[(.*?)\]/;
//         if (parts.length >= 2) {
//           let msgarry = [];
//           for (let st of parts) {
//             let fullmsg = st;
//             const lastmsg = st.charAt(st.length - 1);
//             if (lastmsg !== ")") {
//               fullmsg = st + ")";
//             }
//             const regex = /\((.*?)\)/;
//             const match1 = fullmsg.match(regex);
//             const userId = match1 ? match1[1] : "";
//             const match = fullmsg.match(nameRegex);
//             const name = match ? match[1] : "";
//             const modifiedSentence = fullmsg.replace(
//               nameRegex,
//               `<a href="/users/${userId}" style="color:#0d6efd">${name}</a>`
//             );
//             const cleanedSentence = modifiedSentence.replace(
//               /\(.*?\)|@\[|\]|\[|\]/g,
//               ""
//             );
//             msgarry.push(cleanedSentence);
//           }
//           let finalMsg = msgarry.join(" ").replace(")", "");
//           item.description = finalMsg;
//         } else {
//           const regex = /\((.*?)\)/;
//           const match1 = item.description.match(regex);
//           const userId = match1 ? match1[1] : "";
//           const match = item.description.match(nameRegex);
//           const name = match ? match[1] : "";
//           const modifiedSentence = item.description.replace(
//             nameRegex,
//             `<a href="/users/${userId}" style="color:#0d6efd">${name}</a>`
//           );
//           const cleanedSentence = modifiedSentence.replace(
//             /\(.*?\)|@\[|\]|\[|\]/g,
//             ""
//           );
//           item.description = cleanedSentence;
//         }
//       }
//     });
//   },

//   async fetchWithAuth(url, method, body = undefined, bodyType = undefined) {
//     let modifiedUrl = url;

//     let accessToken = sessionStorage.getItem("token");
//      let branchId = JSON.parse(sessionStorage?.getItem('selectedBranch'))?.id || null;
//     const refreshToken = sessionStorage.getItem("r-t");

//     if (!accessToken || !refreshToken) {
//       sessionStorage.removeItem("token");
//       sessionStorage.removeItem("r-t");
//       window.location.href = "/login";
//       throw new Error("No tokens available");
//     }

//     let exp, refreshExp;
//     try {
//       const decodedAccess = jwt_decode(accessToken);
//       exp = decodedAccess.exp;
//     } catch (error) {
//       console.error("Invalid access token:", error);
//       sessionStorage.removeItem("token");
//       sessionStorage.removeItem("r-t");
//       window.location.href = "/login";
//       throw new Error("Invalid access token");
//     }

//     try {
//       const decodedRefresh = jwt_decode(refreshToken);
//       refreshExp = decodedRefresh.exp;
//     } catch (error) {
//       console.error("Invalid refresh token:", error);
//       sessionStorage.removeItem("token");
//       sessionStorage.removeItem("r-t");
//       window.location.href = "/login";
//       throw new Error("Invalid refresh token");
//     }
//     if (Date.now() < refreshExp * 1000) {
//       if (Date.now() >= exp * 1000) {
//         const response = await fetch(
//           constants.API_BASE_URL + "/api/auth/refresh",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "Cache-Control": "no-cache",
//               Pragma: "no-cache",
//             },
//             body: JSON.stringify({ refreshToken }),
//           }
//         );

//         if (!response.ok) throw new Error("Failed to refresh token");

//         const data = await response.json();
//         if (data.success) {
//           accessToken = data.authToken;
//           sessionStorage.setItem("token", accessToken);
//           let userInfo = jwt_decode(accessToken);
//           branchId = userInfo.branch_id || null;
//         }
//       }

//       if (method === "GET" || method === "DELETE") {
//         return await fetch(modifiedUrl, {
//           method,
//           mode: "cors",
//           headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "no-cache",
//             Pragma: "no-cache",
//             Authorization: `Bearer ${accessToken}`,
//             "Branch-Id": `${branchId || ""}`,
//           },
//         });
//       } else if (method === "POST" || method === "PUT" || method === "PATCH") {
//         return await fetch(modifiedUrl, {
//           method,
//           mode: "cors",
//           headers: {
//             "Cache-Control": "no-cache",
//             Pragma: "no-cache",
//             Authorization: `Bearer ${accessToken}`,
//             "Branch-Id": `${branchId || ""}`,
//             ...(bodyType !== "form" && { "Content-Type": "application/json" }),
//           },
//           body,
//         });
//       }
//     } else {
//       sessionStorage.removeItem("token");
//       sessionStorage.removeItem("r-t");
//       window.location.href = "/login";
//     }
//   },
// };

// export default helper;


import jwt_decode from "jwt-decode";
import * as constants from "../../constants/CONSTANT";

const helper = {

  generateDescriptionHTML(tasks) {
    tasks.forEach((item, index) => {
      const str = item.description;
      const parts = str.split(") ");
      if (item.description.includes("@")) {
        const nameRegex = /@\[(.*?)\]/;
        if (parts.length >= 2) {
          let msgarry = [];
          for (let st of parts) {
            let fullmsg = st;
            const lastmsg = st.charAt(st.length - 1);
            if (lastmsg !== ")") {
              fullmsg = st + ")";
            }
            const regex = /\((.*?)\)/;
            const match1 = fullmsg.match(regex);
            const userId = match1 ? match1[1] : "";
            const match = fullmsg.match(nameRegex);
            const name = match ? match[1] : "";
            const modifiedSentence = fullmsg.replace(
              nameRegex,
              `<a href="/users/${userId}" style="color:#0d6efd">${name}</a>`
            );
            const cleanedSentence = modifiedSentence.replace(
              /\(.*?\)|@\[|\]|\[|\]/g,
              ""
            );
            msgarry.push(cleanedSentence);
          }
          let finalMsg = msgarry.join(" ").replace(")", "");
          item.description = finalMsg;
        } else {
          const regex = /\((.*?)\)/;
          const match1 = item.description.match(regex);
          const userId = match1 ? match1[1] : "";
          const match = item.description.match(nameRegex);
          const name = match ? match[1] : "";
          const modifiedSentence = item.description.replace(
            nameRegex,
            `<a href="/users/${userId}" style="color:#0d6efd">${name}</a>`
          );
          const cleanedSentence = modifiedSentence.replace(
            /\(.*?\)|@\[|\]|\[|\]/g,
            ""
          );
          item.description = cleanedSentence;
        }
      }
    });
  },

  async fetchWithAuth(url, method, body = undefined, bodyType = undefined) {
    let modifiedUrl = url;

    let accessToken = sessionStorage.getItem("token");
    let branchId = JSON.parse(sessionStorage?.getItem('selectedBranch'))?.id || null;
    const refreshToken = sessionStorage.getItem("r-t");

    if (!accessToken || !refreshToken) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("r-t");
      window.location.href = "/login";
      throw new Error("No tokens available");
    }

    let exp, refreshExp;
    try {
      const decodedAccess = jwt_decode(accessToken);
      exp = decodedAccess.exp;
    } catch (error) {
      console.error("Invalid access token:", error);
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("r-t");
      window.location.href = "/login";
      throw new Error("Invalid access token");
    }

    try {
      const decodedRefresh = jwt_decode(refreshToken);
      refreshExp = decodedRefresh.exp;
    } catch (error) {
      console.error("Invalid refresh token:", error);
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("r-t");
      window.location.href = "/login";
      throw new Error("Invalid refresh token");
    }
    if (Date.now() < refreshExp * 1000) {
      if (Date.now() >= exp * 1000) {
        const response = await fetch(
          constants.API_BASE_URL + "/api/auth/refresh",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (!response.ok) throw new Error("Failed to refresh token");

        const data = await response.json();
        if (data.success) {
          accessToken = data.authToken;
          sessionStorage.setItem("token", accessToken);
          let userInfo = jwt_decode(accessToken);
          branchId = userInfo.branch_id || null;
        }
      }

      if (method === "GET" || method === "DELETE") {
        return await fetch(modifiedUrl, {
          method,
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Authorization: `Bearer ${accessToken}`,
            "Branch-Id": `${branchId || ""}`,
          },
        });
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        return await fetch(modifiedUrl, {
          method,
          mode: "cors",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Authorization: `Bearer ${accessToken}`,
            "Branch-Id": `${branchId || ""}`,
            ...(bodyType !== "form" && { "Content-Type": "application/json" }),
          },
          body,
        });
      }
    } else {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("r-t");
      window.location.href = "/login";
    }
  },
};

export default helper;
