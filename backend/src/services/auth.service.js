const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class AuthService {
  async register(userData) {
    const { email, password, companyName, fullName } = userData;
    
    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, company_name, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, company_name, full_name, created_at, trial_ends_at`,
      [email, passwordHash, companyName, fullName]
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = this.generateToken(user.id);
    
    // Store session
    await this.createSession(user.id, token);
    
    return { user, token };
  }
  
  async login(email, password) {
    // Get user
    const result = await db.query(
      `SELECT id, email, password_hash, company_name, full_name, 
              subscription_status, trial_ends_at, is_active
       FROM users WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      throw new Error('Account is disabled');
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = this.generateToken(user.id);
    
    // Store session
    await this.createSession(user.id, token);
    
    delete user.password_hash;
    return { user, token };
  }
  
  generateToken(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now() },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );
  }
  
  async createSession(userId, token) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await db.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
  }
  
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
      
      // Check if session exists
      const result = await db.query(
        `SELECT s.*, u.email, u.company_name, u.subscription_status
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid session');
      }
      
      return result.rows[0];
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();