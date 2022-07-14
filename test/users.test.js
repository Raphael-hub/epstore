const server = require('../src/server.js');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const existingUser = {
  username: 'supertest-users',
  password: 'b1gl3g3nd',
  email: 'st-users@example.com',
  name: 'Supertest Test'
};

const newUser = {
  username: 'supertest-new',
  password: 'b1gl3g3nd',
  email: 'st-new@example.com',
  name: 'Supertest New'
};

const agent = request.agent(server);
const secondAgent = request.agent(server);

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
    // login and delete supertest-test user
    agent
      .post('/login')
      .set('Accept', 'application/json')
      .send({
        username: existingUser.username,
        password: existingUser.password
      })
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
    describe('failure', () => {
      it('return 401 when already logged in', (done) => {
        agent
          .post('/login')
          .set('Accept', 'application/json')
          .send({
            username: existingUser.username,
            password: existingUser.password
          })
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            agent
              .post('/register')
              .set('Accept', 'application/json')
              .send(newUser)
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
      it('return 400 and error message when giving no credentials',
      async () => {
        const res = await request(server)
          .post('/login')
          .set('Accept', 'application/json')
          .send({});
        expect(res.status).to.equal(302);
        // passport redirects to 'login' header is set to that not '/login'
        expect(res.headers['location']).to.equal('login');
        expect(res.body.error).to.not.be.null;
      });

      it('return 400 and error message when using invalid credentials',
      async () => {
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
        agent
          .post('/login')
          .set('Accept', 'application/json')
          .send({
            username: existingUser.username,
            password: existingUser.password
          })
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            agent
              .post('/login')
              .set('Accept', 'application/json')
              .send({
                username: existingUser.username,
                password: existingUser.password
              })
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
          .send({
            username: existingUser.username,
            password: existingUser.password
          });
        expect(res.status).to.equal(302);
        expect(res.headers['location']).to.equal('/profile');
      });
    });
  });

  // logout
  describe('POST /logout', () => {
    afterAll((done) => {
      agent
        .post('/login')
        .set('Accept', 'application/json')
        .send({
          username: existingUser.username,
          password: existingUser.password
        })
        .expect(302)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.headers['location']).to.equal('/profile');
          return done();
        });
    });

    describe('failure', () => {
      it('return 401 when not logged in', async () => {
        const res = await request(server)
          .post('/logout')
          .set('Accept', 'application/json')
          .send()
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      })
    });

    describe('success', () => {
      it('return 200 when logout succeeds', (done) => {
        agent
          .post('/logout')
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.info).to.equal('Successfully logged out');
            return done();
          });
      })
    });
  });

  //profile
  describe('PUT /profile', () => {
    describe('failure', () => {
      it('return 401 when not logged in', async () => {
        const res = await request(server)
          .put('/profile')
          .set('Accept', 'application/json')
          .send({ address: '123 Example Ave.' });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 400 when no changes given', (done) => {
        agent
          .put('/profile')
          .set('Accept', 'application/json')
          .send({ email: existingUser.email })
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.info).to.equal('No changes given');
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 200 when update successful', (done) => {
        // login to supertest-new user
        secondAgent
          .post('/login')
          .set('Accept', 'application/json')
          .send({
            username: newUser.username,
            password: newUser.password
          })
          .expect(302)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            secondAgent
              .put('/profile')
              .set('Accept', 'application/json')
              .send({ address: '123 Example Ave.' })
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.user).to.not.be.null;
                expect(res.body.user.address).to.equal('123 Example Ave.')
                return done();
              });
          });
      });
    });
  });

  describe('GET /profile', () => {
    describe('failure', () => {
      it('return 401 if not logged in', async () => {
        const res = await request(server)
          .get('/profile')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });
    });

    describe('success', () => {
      // create product and order for supertest-new user
      beforeAll((done) => {
        // create product
        secondAgent
          .post('/products')
          .set('Accept', 'application/json')
          .send({
            name: 'Test',
            description: 'Test Description',
            price: 9.99,
            currency: 'gbp',
            stock: 10
          })
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            // create order
            secondAgent
              .post(`/checkout/${res.body.product.id}`)
              .set('Accept', 'application/json')
              .send({ quantity: 1 })
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.order).to.not.be.null;
                expect(res.body.products).to.not.be.null;
                return done();
              });
          });
      });

      it('return 200 and user info when user has no orders for their products',
      (done) => {
        agent
          .get('/profile')
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.user).to.not.be.null;
            expect(res.body.user.username).to.equal(existingUser.username);
            return done();
          });
      });

      it('return 200 as well as user and info on orders made against users products',
      (done) => {
        secondAgent
          .get('/profile')
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.user).to.not.be.null;
            expect(res.body.orders).to.not.be.null;
            expect(res.body.user.username).to.equal(newUser.username);
            expect(res.body.orders[0].buyer_username).to.equal(newUser.username);
            return done();
          });
      });
    });
  });

  describe('GET /profile/:username', () => {
    describe('failure', () => {
      it('return 400 when username not found', async () => {
        const res = await request(server)
          .get('/profile/123DoesntExists321')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(400);
        expect(res.body.error).to.equal('Username not found');
      });
    });

    describe('success', () => {
      it('return 200 as well as username and empty array has no product listings',
      async () => {
        const res = await request(server)
          .get(`/profile/${existingUser.username}`)
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.user).to.not.be.null;
        expect(res.body.products).to.not.be.null;
        expect(res.body.user).to.equal(existingUser.username);
        expect(res.body.products).to.eql([]);
      });

      it('return 200 as well as username and listings for users with products',
      async () => {
        const res = await request(server)
          .get(`/profile/${newUser.username}`)
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.user).to.not.be.null;
        expect(res.body.products).to.not.be.null;
        expect(res.body.user).to.equal(newUser.username);
        expect(res.body.products[0].name).to.equal('Test');
      });
    });
  });

  // delete
  describe('DELETE /profile', () => {
    describe('failure', () => {
      it('return 401 when not logged in', async () => {
        const res = await request(server)
          .delete('/profile')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });
    });

    describe('success', () => {
      it('return 200 when deleted user', (done) => {
        secondAgent
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
  });
});
