const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
    // Extract token from cookie or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    // Early termination if token is missing
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing for login",
        });
    }

    try {
        // Verification of token with JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "JWT_SECRET");

        // Find user using ID from decoded payload
        const user = await userModel.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found",
            });
        }

        // Attach user to request object and proceed
        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access during authentication process",
        });
    }
}

async function authSystemUserMiddlware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "JWT_SECRET");
        const user = await userModel.findById(decoded.id).select("+systemUser");

        if (!user || !user.systemUser) {

            return res.status(403).json({
                message: "Forbidden access, system user privileges required",
            });
        }

        req.user = user;
        return next();
    }
    catch (err) {// if token is expired
        return res.status(401).json({
            message: "Unauthorized user from authSystemUserMiddleware"
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddlware,
};