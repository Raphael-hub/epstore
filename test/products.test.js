const server = require('../src/server.js');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const testUser = {
  username: 'supertest-products',
  password: 'b1gl3g3nd',
  email: 'st-products@example.com',
  name: 'Supertest Test'
};

const productOne = {
  name: "UK Power Adaptor",
  description: "A power adaptor for charging laptops with a UK wall plug",
  price: 11.99,
  currency: "gbp",
  stock: 50
};

const productTwo = {
  name: "USB-C Charging Cable",
  description: "A usb-c charging cable for Samsung phones",
  price: 7.99,
  currency: "gbp",
  stock: 35
};

const agent = request.agent(server);

describe('Product endpoints', () => {
  // create supertest-test user for product tests
  beforeAll(async () => {
    const res = await request(server)
      .post('/register')
      .set('Accept', 'application/json')
      .send(testUser);
    expect(res.status).to.equal(302);
    expect(res.headers['location']).to.equal('/profile');
  });

  // delete supertest-test user after done
  afterAll((done) => {
    // delete supertest-test user
    agent
      .post('/login')
      .set('Accept', 'application/json')
      .send({
        username: testUser.username,
        password: testUser.password
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

  // get products
  describe('GET /products', () => {
    describe('no products', () => {
      it('return 200 and empty array when there are no products',
      async () => {
        const res = await request(server)
          .get('/products')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.products).to.not.be.null;
        expect(res.body.products).to.eql([]);
      });
    });

    describe('existing products', () => {
      // login and create 2 product listings
      beforeAll((done) => {
        agent
          .post('/login')
          .set('Accept', 'application/json')
          .send({
            username: testUser.username,
            password: testUser.password
          })
          .expect(302)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            agent
              .post('/products')
              .set('Accept', 'application/json')
              .send(productOne)
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.product).to.not.be.null;
                expect(res.body.product.name).to.equal(productOne.name);
                agent
                  .post('/products')
                  .set('Accept', 'application/json')
                  .send(productTwo)
                  .expect(201)
                  .end((err, res) => {
                    if (err) {
                      return done(err);
                    }
                    expect(res.headers['content-type']).to.match(/json/);
                    expect(res.body.product).to.not.be.null;
                    expect(res.body.product.name).to.equal(productTwo.name);
                    return done();
                  });
              });
          });
      });

      it('return 200 and a list of all products', async () => {
        const res = await request(server)
          .get('/products')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.products).to.not.be.null;
        expect(res.body.products.length).to.be.at.least(2);
      });

      it('return 200 and a list of products searched by keyword using url query',
      async () => {
        const res = await request(server)
          .get('/products?keyword=cable')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.products).to.not.be.null;
        expect(res.body.products[0].name).to.equal(productTwo.name);
      });

      it('return 200 and a list of products ordered and sorted using url query',
      async () => {
        const res = await request(server)
          .get('/products?orderBy=price&sort=desc')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.products).to.not.be.null;
        expect(res.body.products[0].name).to.equal(productOne.name);
        expect(res.body.products[1].name).to.equal(productTwo.name);
      });

      it('return 200 and a list of products sorted by newest first with invalid queries',
      async () => {
        const res = await request(server)
          .get('/products?orderBy=fwenfbwuv&sort=fela')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(200);
        expect(res.body.products).to.not.be.null;
        expect(res.body.products[0].name).to.equal(productTwo.name);
        expect(res.body.products[1].name).to.equal(productOne.name);
      });
    });
  });

  // create product
  describe('POST /products', () => {
    describe('failure', () => {
      it('return 401 and error message when not logged in',
      async () => {
        const res = await request(server)
          .post('/products')
          .set('Accept', 'application/json')
          .send({});
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 500 and error message when creating empty product object',
      (done) => {
        agent
          .post('/products')
          .set('Accept', 'application/json')
          .send({})
          .expect(500)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.not.be.null;
            return done();
          });
      });

      it('return 500 and error message when creating product without all fields',
      (done) => {
        agent
          .post('/products')
          .set('Accept', 'application/json')
          .send({
            name: 'Test',
            description: 'Test Product',
            stock: 10
          })
          .expect(500)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.not.be.null;
            return done();
          });
      });

      it('return 500 and error message when creating product with stock < 0',
      (done) => {
        agent
          .post('/products')
          .set('Accept', 'application/json')
          .send({
            name: 'Test',
            description: 'Test Product',
            price: 9.99,
            stock: -1
          })
          .expect(500)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.not.be.null;
            return done();
          });
      });

      it('return 500 and error message when creating product with price < 0',
      (done) => {
        agent
          .post('/products')
          .set('Accept', 'application/json')
          .send({
            name: 'Test',
            description: 'Test Product',
            price: -1,
            stock: 10
          })
          .expect(500)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.not.be.null;
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 201 and product object', (done) => {
        agent
          .post('/products')
          .set('Accept', 'application/json')
          .send(productOne)
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.product).to.not.be.null;
            expect(res.body.product.name).to.equal(productOne.name)
            return done(err);
          });
      });
    });
  });
});
