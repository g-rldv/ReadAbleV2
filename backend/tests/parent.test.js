const request = require('supertest');
const express = require('express');

// Mock the DB pool used by routes
jest.mock('../db', () => ({
  query: jest.fn(),
}));

const pool = require('../db');

// Import the router under test
const parentRouter = require('../routes/parent');
const bodyParser = require('body-parser');

function makeApp() {
  const app = express();
  app.use(bodyParser.json());
  // Mock middleware to inject a user
  app.use((req, res, next) => {
    req.user = { id: 123, role: 'parent' };
    next();
  });
  app.use('/parent', parentRouter);
  return app;
}

describe('POST /parent/children', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 if first_name missing', async () => {
    const app = makeApp();
    const res = await request(app).post('/parent/children').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/first name/i);
  });

  test('rejects classroom_id when parent not approved', async () => {
    const app = makeApp();
    // First DB call: validate approved membership
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).post('/parent/children').send({ first_name: 'Tom', classroom_id: 99 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not an approved member/i);
    expect(pool.query).toHaveBeenCalled();
  });

  test('creates child when approved', async () => {
    const app = makeApp();
    // validate approved membership returns teacher_id
    pool.query
      .mockResolvedValueOnce({ rows: [{ teacher_id: 77 }], rowCount: 1 }) // allowed
      .mockResolvedValueOnce({ rows: [{ id: 555 }], rowCount: 1 }) // insert returning id
      .mockResolvedValueOnce({ rows: [{ id: 555, parent_id: 123, teacher_id: 77, first_name: 'Tom' }], rowCount: 1 }); // select child

    const res = await request(app).post('/parent/children').send({ first_name: 'Tom', classroom_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body.child).toBeTruthy();
    expect(res.body.child.teacher_id).toBe(77);
  });
});
