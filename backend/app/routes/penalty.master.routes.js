/**
 * @author      iBirds Services
 * @date        JAN, 2026
 * @copyright   www.ibirdsservices.com
 */

const express = require("express");
const router = express.Router();
const penaltyMasterModel = require("../models/penalty.master.model.js");

router.post("/", async (req, res) => {
  try {
    const branchId = req.headers["branch-id"];
    penaltyMasterModel.init(req.db_name, branchId);

    const result = await penaltyMasterModel.create(req.body, req.userId);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating penalty master:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while creating penalty master."
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const branchId = req.headers["branch-id"];
    penaltyMasterModel.init(req.db_name, branchId);

    const result = await penaltyMasterModel.findById(req.params.id);
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({
        message: `Not found penalty master with id ${req.params.id}.`
      });
    }
  } catch (error) {
    console.error("Error retrieving penalty master:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving penalty master."
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const branchId = req.headers["branch-id"];
    penaltyMasterModel.init(req.db_name, branchId);

    const filters = {};
    if (req.query.penalty_type) filters.penalty_type = req.query.penalty_type;
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

    const result = await penaltyMasterModel.getAll(filters);
    res.send(result);
  } catch (error) {
    console.error("Error retrieving penalty masters:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving penalty masters."
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const branchId = req.headers["branch-id"];
    penaltyMasterModel.init(req.db_name, branchId);

    const result = await penaltyMasterModel.update(req.params.id, req.body, req.userId);
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({
        message: `Not found penalty master with id ${req.params.id}.`
      });
    }
  } catch (error) {
    console.error("Error updating penalty master:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while updating penalty master."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const branchId = req.headers["branch-id"];
    penaltyMasterModel.init(req.db_name, branchId);

    const result = await penaltyMasterModel.deleteById(req.params.id, req.userId);
    res.send(result);
  } catch (error) {
    console.error("Error deleting penalty master:", error);
    res.status(500).send({
      message: error.message || "Some error occurred while deleting penalty master."
    });
  }
});

module.exports = router;