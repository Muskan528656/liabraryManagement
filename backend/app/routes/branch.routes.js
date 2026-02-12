/**
 * @author      Library Management System
 * @date        Feb, 2026
 * @copyright   www.ibirdsservices.com
 */

const express = require('express');
const { fetchUser, checkPermission } = require("../middleware/fetchuser.js");
const branchModel = require('../models/branch.model');

module.exports = (app) => {
  var router = express.Router();

  // Initialize schema
  router.use((req, res, next) => {
    branchModel.init(req.headers.schema || req.query.schema || 'al_hedaya');
    next();
  });

  // GET all branches
  router.get('/', fetchUser, async (req, res) => {
    try {
      const filters = {};
      
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active;
      }
      
      if (req.query.search) {
        filters.search = req.query.search;
      }

      const branches = await branchModel.findAll(filters);
      res.status(200).json({
        success: true,
        data: branches,
        message: 'Branches retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching branches'
      });
    }
  });

  // GET branch by ID
  router.get('/:id', fetchUser, async (req, res) => {
    try {
      const branch = await branchModel.findById(req.params.id);
      
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      res.status(200).json({
        success: true,
        data: branch,
        message: 'Branch retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching branch:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching branch'
      });
    }
  });

  // POST create branch
  router.post('/', fetchUser, async (req, res) => {
    try {
      // Check if user has permission to create branch (admin only)
      if (!req.user || !['ADMIN', 'SYSTEM ADMIN'].includes(req.user.userrole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const branch = await branchModel.create(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        data: branch,
        message: 'Branch created successfully'
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating branch'
      });
    }
  });

  // PUT update branch
  router.put('/:id', fetchUser, async (req, res) => {
    try {
      // Check if user has permission to update branch (admin only)
      if (!req.user || !['ADMIN', 'SYSTEM ADMIN'].includes(req.user.userrole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const branch = await branchModel.updateById(req.params.id, {
        ...req.body,
        lastmodifiedbyid: req.user.id
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      res.status(200).json({
        success: true,
        data: branch,
        message: 'Branch updated successfully'
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating branch'
      });
    }
  });

  // DELETE branch
  router.delete('/:id', fetchUser, async (req, res) => {
    try {
      // Check if user has permission to delete branch (admin only)
      if (!req.user || !['ADMIN', 'SYSTEM ADMIN'].includes(req.user.userrole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const result = await branchModel.deleteById(req.params.id);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message
        });
      }

      res.status(200).json({
        success: true,
        data: result.deletedBranch,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting branch'
      });
    }
  });

  app.use(process.env.BASE_API_URL + "/api/branch", router);
};