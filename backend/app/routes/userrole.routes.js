/**
 * Handles all incoming request for /api/user-role
 * DB table: demo.user_role
 * 
 * @author      Muskan Khan
 * @date        DEC, 2025
 */

const { fetchUser } = require("../middleware/fetchuser.js");
const UserRole = require("../models/userrole.model.js");

module.exports = (app) => {
    const router = require("express").Router();
    const { body, validationResult } = require("express-validator");

 
    router.get("/", fetchUser, async (req, res) => {
        try {
            UserRole.init(req.userinfo.tenantcode);
            const roles = await UserRole.findAll();
            return res.status(200).json(roles);
        } catch (error) {
            console.error("Error fetching user roles:", error);
            return res.status(500).json({ errors: "Internal server error" });
        }
    });

 
    router.get("/:id", fetchUser, async (req, res) => {
        try {
            UserRole.init(req.userinfo.tenantcode);
            const role = await UserRole.findById(req.params.id);
            if (!role) return res.status(404).json({ msg: "Role not found" });

            res.status(200).json(role);
        } catch (error) {
            console.error("Error fetching role:", error);
            return res.status(500).json({ errors: "Internal server error" });
        }
    });

 
    router.post(
        "/",
        fetchUser,
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                UserRole.init(req.userinfo.tenantcode);
                const data = {
                    ...req.body,
                    createdbyid: req.userinfo.id,
                    lastmodifiedbyid: req.userinfo.id,
                };

                const newRole = await UserRole.create(data);
                return res.status(201).json(newRole);
            } catch (error) {
                console.error("Error creating role:", error);
                return res.status(500).json({ errors: "Internal server error" });
            }
        }
    );

 
    router.put(
        "/:id",
        fetchUser,
        [],
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            try {
                UserRole.init(req.userinfo.tenantcode);

                const data = {
                    ...req.body,
                    lastmodifiedbyid: req.userinfo.userid,
                };

                const updated = await UserRole.update(req.params.id, data);
                if (!updated) return res.status(404).json({ msg: "Role not found" });

                return res.status(200).json(updated);
            } catch (error) {
                console.error("Error updating role:", error);
                return res.status(500).json({ errors: "Internal server error" });
            }
        }
    );

 
    router.delete("/:id", fetchUser, async (req, res) => {
        try {
            UserRole.init(req.userinfo.tenantcode);

            const deleted = await UserRole.remove(req.params.id);
            if (!deleted) return res.status(404).json({ msg: "Role not found" });

            return res.status(200).json({ msg: "Role deleted successfully" });
        } catch (error) {
            console.error("Error deleting role:", error);
            return res.status(500).json({ errors: "Internal server error" });
        }
    });

    app.use(process.env.BASE_API_URL+ "/api/user-role", router);

};
