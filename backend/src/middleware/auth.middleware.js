const authService = require('../services/auth.service');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const session = await authService.verifyToken(token);
    req.user = {
      id: session.user_id,
      email: session.email,
      company_name: session.company_name,
      subscription_status: session.subscription_status
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };