const authorizeRoles = (...allowedRoles) => {
  // Flatten in case an array was passed as the first argument, and normalize to uppercase
  const roles = allowedRoles.flat().map((r) => String(r).toUpperCase());
  
  return (req, res, next) => {
    const userRole = String(req.user?.role || '').toUpperCase();
    if (!req.user || !roles.includes(userRole)) {
      console.log(`[AUTH] Access denied for role: ${req.user?.role}. Allowed: ${roles}`);
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = authorizeRoles;
