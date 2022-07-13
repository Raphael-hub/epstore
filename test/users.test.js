const server = require('../src/server.js');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const existingUser = {
  username: 'supertest-test',
  password: 'b1gl3g3nd',
  email: 'supertest-test@example.com',
  name: 'Supertest Test'
};

describe('User endpoints', () => {
  // create supertest-test user for user tests
  beforeAll(async () => {
    const res = await request(server)
      .post('/register')
      .set('Accept', 'application/json')
      .send(existingUser);
    expect(res.status).to.equal(302);
    expect(res.headers['location']).to.equal('/profile');
  });

  // delete supertest-test user after done
  afterAll((done) => {
    const agent = request.agent(server);

    agent
      .post('/login')
      .set('Accept', 'application/json')
      .send({ username: existingUser.username, password: existingUser.password })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        agent
          .delete('/profile')
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.info).to.be.equal('Deleted user');
            return done();
          });
      });
  });

  // register user
  describe('POST /register', () => {
    const newUser = {
      username: 'test',
      password: 'b1gl3g3nd',
      email: 'test@example.com',
      name: 'Test Account'
    };

    // delete test user after done testing registration
    afterAll((done) => {
      const agent = request.agent(server);

      agent
        .post('/login')
        .set('Accept', 'application/json')
        .send({ username: newUser.username, password: newUser.password })
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          agent
            .delete('/profile')
            .set('Accept', 'application/json')
            .send()
            .expect(200)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.body.info).to.be.equal('Deleted user');
              return done();
            });
        });
    });

    describe('failure', () => {
      it('return 403 when username already in use', async () => {
        const res = await request(server)
          .post('/register')
          .set('Accept', 'application/json')
          .send(existingUser);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.equal('Username already exists');
      });

      it('return 403 when email already in use', async () => {
        const res = await request(server)
          .post('/register')
          .set('Accept', 'application/json')
          .send({...existingUser, username: 'test-new'});
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(403);
        expect(res.body.error).to.equal('Email already in use');
      });

      it('return 500 when creating user with invalid body', async () => {
        const res = await request(server)
          .post('/register')
          .set('Accept', 'application/json')
          .send({ username: 'asd', email: 'sfqs', name: 's' });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(500);
        expect(res.body.error).to.be.not.null;
      });

      it('return 500 when creating user with an empty body', async () => {
        const res = await request(server)
          .post('/register')
          .set('Accept', 'application/json')
          .send({});
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(500);
        expect(res.body.error).to.be.not.null;
      });
    });

    describe('success', () => {
      it('redirect to /profile', async () => {
        const res = await request(server)
          .post('/register')
          .set('Accept', 'application/json')
          .send(newUser);
        expect(res.status).to.equal(302);
        expect(res.headers['location']).to.equal('/profile');
      });
    });
  });

  // login
  describe('GET /login', () => {
    it('return 200 saying to login with post', async () => {
      const res = await request(server)
        .get('/login')
        .set('Accept', 'application/json');
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.status).to.equal(200);
      expect(res.body.info).to.equal('Login with POST');
    });
  });

  describe('POST /login', () => {
    describe('failure', () => {
      it('return 400 and error message when giving no credentials', async () => {
        const res = await request(server)
          .post('/login')
          .set('Accept', 'application/json')
          .send({});
        expect(res.status).to.equal(302);
        // passport redirects to 'login' header is set to that not '/login'
        expect(res.headers['location']).to.equal('login');
        expect(res.body.error).to.not.be.null;
      });

      it('return 400 and error message when using invalid credentials', async () => {
        const res = await request(server)
          .post('/login')
          .set('Accept', 'application/json')
          .send({ username: 'doesnotexist', password: 'totallywrongpassword' });
        expect(res.status).to.equal(302);
        // passport redirects to 'login' header is set to that not '/login'
        expect(res.headers['location']).to.equal('login');
        expect(res.body.error).to.not.be.null;
      });

      it('return 401 if already logged in', (done) => {
        const agent = request.agent(server);

        agent
          .post('/login')
          .set('Accept', 'application/json')
          .send({ username: existingUser.username, password: existingUser.password })
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            agent
              .post('/login')
              .set('Accept', 'application/json')
              .send({ username: existingUser.username, password: existingUser.password })
              .expect(401)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.body.error).to.equal('Already logged in');
                return done()
              });
          });
      });
    });

    describe('success', () => {
      it('redirect to /profile', async () => {
        const res = await request(server)
          .post('/login')
          .set('Accept', 'application/json')
          .send({ username: existingUser.username, password: existingUser.password });
        expect(res.status).to.equal(302);
        expect(res.headers['location']).to.equal('/profile');
      });
    });
  });
});
