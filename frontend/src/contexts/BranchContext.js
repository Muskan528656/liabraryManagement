import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/CONSTANT';
import DataApi from "../api/dataApi";
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
    
          let userInfo = jwt_decode(sessionStorage.getItem("token"));
          setLoginUserRole(userInfo.role_name);
        const userRole = userInfo.role_name;
        const userBranchId = userInfo.branch_id;
        console.log("userBranchId", userBranchId);
        
        setIsSuperAdmin(userRole === 'SYSTEM ADMIN');
 const branchesApi = new DataApi("branches");

      const branchData = await branchesApi.fetchAll();
      
        
        if (branchData.data.success) {
          setBranches(branchData.data.data || []);
          // if (userRole === 'SYSTEM ADMIN') {
          //   const savedBranch = localStorage.getItem('selectedBranch');
          //   if (savedBranch) {
          //     try {
          //       const parsedBranch = JSON.parse(savedBranch);
          //       setSelectedBranch(parsedBranch);
          //     } catch (e) {
          //       setSelectedBranch(null);
          //     }
          //   } else {
          //     setSelectedBranch(null); 
          //   }
          // } else {
          if(sessionStorage.getItem('selectedBranch')){
            const savedBranch = sessionStorage.getItem('selectedBranch');
            if (savedBranch) {
              try {
                const parsedBranch = JSON.parse(savedBranch);
                setSelectedBranch(parsedBranch);
              } catch (e) {
                setSelectedBranch(null);
              }
            } else {
              setSelectedBranch(null); 
            }
          }else{
            const userBranch = (branchData?.data?.data || []).find(b => b.id === userBranchId);
            console.log("userBranch", userBranch);
            
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
    console.log("Selected Branch:", branch);
    
    // Save to localStorage for super admins
    // if (isSuperAdmin) {
      if (branch) {
        sessionStorage.setItem('selectedBranch', JSON.stringify(branch));
      } else {
        sessionStorage.removeItem('selectedBranch');
      }
    // }
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