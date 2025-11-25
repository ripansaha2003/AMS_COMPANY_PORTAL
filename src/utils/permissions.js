
export const getUserPermissions = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const accountType = user?.accountType;
    
    // Admin/Organization users get all permissions
    if (accountType === 'organization') {
      return 'admin'; // Special identifier for admin
    }
    
    const roleDetailString = localStorage.getItem('roleDetail');
    if (!roleDetailString) return null;
    
    const roleDetail = JSON.parse(roleDetailString);
    
    // If roleDetail is empty object (admin without roleDetails), grant all permissions
    if (Object.keys(roleDetail).length === 0) {
      return 'admin';
    }
    
    if (!roleDetail.permissions) return null;
    
    return roleDetail.permissions;
  } catch (error) {
    console.error('Error parsing permissions:', error);
    return null;
  }
};

export const getUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const accountType = user?.accountType;
    
    return accountType;
  } catch (error) {
    console.error('Error parsing role:', error);
    return null;
  }
};

export const isSuperAdmin = () => {
  const role = getUserRole();
  return role === 'organization';
};

export const checkPermission = (module, action = 'view') => {
  // SuperAdmin has access to everything
  if (isSuperAdmin()) {
    return true;
  }
  
  const permissions = getUserPermissions();
  if (!permissions) return false;
  
  // If permissions is 'admin', allow everything
  if (permissions === 'admin') return true;
  
  return permissions[module]?.[action] || false;
};

export const isAuthenticated = () => {
  const roleDetailString = localStorage.getItem('roleDetail');
  return roleDetailString !== null;
};