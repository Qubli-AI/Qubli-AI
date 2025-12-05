import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

const JWT_SECRET = process.env.JWT_SECRET;

// Use asyncHandler to automatically catch any errors thrown inside the try/catch block
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token (jwt.verify is synchronous, but we'll keep the asyncHandler wrapper for consistency)
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user ID to the request (ID is typically stored as 'id' or '_id' in the payload)
      req.userId = decoded.id;

      next();
    } catch (error) {
      console.error(error);
      // If verification fails or token is malformed, send 401 and RETURN
      res.status(401).json({ message: "Not authorized, token failed." });
      return;
    }
  }

  if (!token) {
    // If no token was provided in the headers, send 401 and RETURN
    res.status(401).json({ message: "Not authorized, no token." });
    return;
  }
});

export default protect;
