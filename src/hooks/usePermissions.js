// import { useState, useEffect } from 'react';
// import { getUserPermissions } from '../utils/permissions';

// export const usePermissions = () => {
//   const [permissions, setPermissions] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadPermissions = () => {
//       try {
//         const userPermissions = getUserPermissions();
//         setPermissions(userPermissions);
//       } catch (error) {
//         console.error('Error loading permissions:', error);
//         setPermissions(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadPermissions();

//     // Listen for localStorage changes (if permissions are updated)
//     const handleStorageChange = () => {
//       loadPermissions();
//     };

//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, []);

//   const hasPermission = (module, action = 'view') => {
//     if (!permissions) return false;
//     return permissions[module]?.[action] || false;
//   };

//   const hasAnyPermission = () => {
//     if (!permissions) return false;
    
//     return Object.values(permissions).some(modulePerms => 
//       Object.values(modulePerms).some(perm => perm === true)
//     );
//   };

//   return {
//     permissions,
//     loading,
//     hasPermission,
//     hasAnyPermission
//   };
// };



import { useState, useEffect } from 'react';
import { getUserPermissions, isSuperAdmin } from '../utils/permissions';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    const loadPermissions = () => {
      try {
        const superAdmin = isSuperAdmin();
        const userPermissions = getUserPermissions();
        
        setIsSuper(superAdmin);
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions(null);
        setIsSuper(false);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();

    // Listen for localStorage changes
    const handleStorageChange = () => {
      loadPermissions();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasPermission = (module, action = 'view') => {
    // SuperAdmin has all permissions
    if (isSuper) return true;
    
    if (!permissions) return false;
    
    // If permissions is 'superadmin', allow everything
    if (permissions === 'user') return true;
    
    return permissions[module]?.[action] || false;
  };

  const hasAnyPermission = () => {
    // SuperAdmin always has permissions
    if (isSuper) return true;
    
    if (!permissions) return false;
    
    // If permissions is 'superadmin', return true
    if (permissions === 'user') return true;
    
    return Object.values(permissions).some(modulePerms => 
      Object.values(modulePerms).some(perm => perm === true)
    );
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    isSuperAdmin: isSuper
  };
};