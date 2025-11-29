const jwt = require("jsonwebtoken");
const Auth = require("../models/auth.model.js");

const fetchUser = async (req, res, next) => {
  var token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate" });
  }
  try {
    token = token.includes("Bearer ") ? token.replace("Bearer ", "") : token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user) {
      Auth.init(user.tenantcode);
      const userRec = await Auth.findById(user.id);
      // console.log("Fetched user record:", userRec);
      if (!userRec) {

        return res.status(400).json({ errors: "Invalid User" });
      }
      req["userinfo"] = user;
      next();
    } else {
      return res.status(400).json({ errors: "Invalid User" });
    }
  } catch (error) {
    return res.status(401).send({ errors: "Please authenticate" });
  }
};
module.exports = { fetchUser };
