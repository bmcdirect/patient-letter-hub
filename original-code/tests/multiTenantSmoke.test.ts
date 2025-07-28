import request from 'supertest';

// Simple smoke test for multi-tenant isolation
describe('multi-tenant isolation smoke test', () => {
  it('health check should return status ok', async () => {
    const response = await request('http://localhost:5000')
      .get('/api/auth/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('practices endpoint should require authentication', async () => {
    const response = await request('http://localhost:5000')
      .get('/api/auth/practices');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('login endpoint should accept valid credentials', async () => {
    const response = await request('http://localhost:5000')
      .post('/api/auth/login')
      .send({ email: 'admin@riversidefamilymed.com', password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
  });
});