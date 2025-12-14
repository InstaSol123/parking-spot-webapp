import { generateToken, verifyToken } from '../../src/utils/auth';

describe('Auth Utilities', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken('user-123', 'test@example.com', 'RETAILER');
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should encode user data in token', () => {
      const token = generateToken('user-123', 'test@example.com', 'RETAILER');
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('RETAILER');
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user-1', 'user1@example.com', 'RETAILER');
      const token2 = generateToken('user-2', 'user2@example.com', 'DISTRIBUTOR');
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken('user-123', 'test@example.com', 'RETAILER');
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('user-123');
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateToken('user-123', 'test@example.com', 'RETAILER');
      const tamperedToken = token.slice(0, -5) + 'xxxxx'; // Tamper with token
      const decoded = verifyToken(tamperedToken);
      
      expect(decoded).toBeNull();
    });
  });
});
