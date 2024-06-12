jest.setTimeout(30000); 

const request = require('supertest');
const server = require('./server');
const db = require('../data/dbConfig');

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

beforeEach(async () => {
  await db('users').truncate(); 
});

afterAll(async () => {
  await db.migrate.rollback();
  await db.destroy();
});

describe('Auth endpoints', () => {
  describe('[POST] /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('password');
    });

    it('should return 400 if username or password is missing', async () => {
      const res1 = await request(server).post('/api/auth/register').send({
        password: 'password',
      });

      expect(res1.status).toBe(400);
      expect(res1.body).toHaveProperty('message', 'username and password required');

      const res2 = await request(server).post('/api/auth/register').send({
        username: 'testuser',
      });

      expect(res2.status).toBe(400);
      expect(res2.body).toHaveProperty('message', 'username and password required');
    });

    it('should return 400 if username is taken', async () => {
      await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password',
      });

      const res = await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'username taken');
    });
  });

  describe('[POST] /api/auth/login', () => {
    it('should login an existing user and return a token', async () => {
      await request(server).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password',
      });

      const res = await request(server).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password',
      });

      console.log('Login Response:', res.body); // Log the login response
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'welcome, testuser');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if username or password is missing', async () => {
      const res1 = await request(server).post('/api/auth/login').send({
        password: 'password',
      });

      expect(res1.status).toBe(400);
      expect(res1.body).toHaveProperty('message', 'username and password required');

      const res2 = await request(server).post('/api/auth/login').send({
        username: 'testuser',
      });

      expect(res2.status).toBe(400);
      expect(res2.body).toHaveProperty('message', 'username and password required');
    });

    it('should return 401 if credentials are invalid', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: 'wronguser',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'invalid credentials');
    });
  });
});

describe('Jokes endpoint', () => {
  it('should restrict access to the jokes endpoint without a token', async () => {
    const res = await request(server).get('/api/jokes');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'token required');
  });

  it('should allow access to the jokes endpoint with a valid token', async () => {
    const registerRes = await request(server).post('/api/auth/register').send({
      username: 'testuser',
      password: 'password',
    });

    const loginRes = await request(server).post('/api/auth/login').send({
      username: 'testuser',
      password: 'password',
    });

    console.log('Login Response:', loginRes.body); 

    const token = loginRes.body.token;
    console.log('Token:', token); 

    
    if (!token) {
      console.error('Token is undefined');
      throw new Error('Token is undefined');
    }

    const jokesRes = await request(server).get('/api/jokes').set('Authorization', `Bearer ${token}`);

    console.log('Jokes Response:', jokesRes.body); 

    expect(jokesRes.status).toBe(200);
    expect(jokesRes.body).toBeInstanceOf(Array);
  });
});
