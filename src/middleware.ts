require("dotenv").config();

import jwt, { JwtPayload } from "jsonwebtoken";

export const userMiddleware = (req: any, res: any, next: any) => {
  const header = req.headers["authorization"];
  const decoded = jwt.verify(
    header as string,
    process.env.JWT_PASSWORD || "Secret"
  );
  if (decoded) {
    if (typeof decoded === "string") {
      res.status(403).json({
        message: "You are not logged in",
      });
      return;
    }
    req.userId = (decoded as JwtPayload).id;
    next();
  } else {
    res.status(403).json({
      message: "You are not logged in",
    });
  }
};
