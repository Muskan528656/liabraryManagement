import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/CONSTANT';
import helper from '../components/common/helper';
import jwt_decode from "jwt-decode";
const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loginUserRole, setLoginUserRole] = useState(null);
  useEffect(() => {
    loadBranchData();
  }, []);

  const loadBranchData = async () => {
    try {
      setLoading(true);
        // const token = sessionStorage.getItem("token");
        // console.log("loadBranchData token:", token);
          let userInfo = jwt_decode(sessionStorage.getItem("token"));
    setLoginUserRole(userInfo.role_name);
      // Check if user is super admin by getting user info
     
        const userRole = userInfo.role_name;
        const userBranchId = userInfo.branch_id;
        
        setIsSuperAdmin(userRole === 'SYSTEM ADMIN');
        
        // Fetch all branches
        const branchResponse = await helper.fetchWithAuth(`${API_BASE_URL}/api/branch`, 'GET');
        console.log("Branch data:", branchResponse);

        const branchData = await branchResponse.json();
        
        if (branchData.success) {
          setBranches(branchData.data || []);
          
          // Set initial selected branch based on user role
          if (userRole === 'SYSTEM ADMIN') {
            // Super admin can select "All Branches" initially
            const savedBranch = localStorage.getItem('selectedBranch');
            if (savedBranch) {
              try {
                const parsedBranch = JSON.parse(savedBranch);
                setSelectedBranch(parsedBranch);
              } catch (e) {
                // If parsing fails, set to null (All Branches)
                setSelectedBranch(null);
              }
            } else {
              setSelectedBranch(null); // Default to All Branches for super admin
            }
          } else {
            // Regular user gets their assigned branch
            const userBranch = (branchData.data || []).find(b => b.id === userBranchId);
            if (userBranch) {
              setSelectedBranch(userBranch);
            }
          }
        }
      
    } catch (error) {
      console.error('Error loading branch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBranch = (branch) => {
    setSelectedBranch(branch);
    
    // Save to localStorage for super admins
    if (isSuperAdmin) {
      if (branch) {
        localStorage.setItem('selectedBranch', JSON.stringify(branch));
      } else {
        localStorage.removeItem('selectedBranch');
      }
    }
  };

  const getSelectedBranchId = () => {
    if (!selectedBranch) return null;
    return selectedBranch.id;
  };

  const getAllBranches = () => {
    return branches;
  };

  const isBranchSelected = () => {
    return selectedBranch !== null;
  };

  const getBranchAwareUrl = (url) => {
    const branchId = getSelectedBranchId();
    if (branchId && !isSuperAdmin) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}branch_id=${branchId}`;
    }
    return url;
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        selectBranch,
        loading,
        isSuperAdmin,
        getSelectedBranchId,
        getAllBranches,
        isBranchSelected,
        getBranchAwareUrl,
        loadBranchData
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  console.log("useBranch context:", context);
  
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};