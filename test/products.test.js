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

const newUser = {
  username: 'supertest-p-new',
  password: 'b1gl3g3nd',
  email: 'st-p-new@example.com',
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

let product_ids = [];

const agent = request.agent(server);
const secondAgent = request.agent(server);

describe('Product endpoints', () => {
  // create supertest-test user for product tests
  beforeAll((done) => {
    agent
      .post('/register')
      .set('Accept', 'application/json')
      .send(testUser)
      .expect(302)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.headers['location']).to.equal('/profile');
        return done();
      });
  });

  // delete supertest-test user after done
  afterAll((done) => {
    // delete supertest-test user
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
            product_ids.push(res.body.product.id);
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
                product_ids.push(res.body.product.id);
                return done();
              });
          });
      });

      it('return 200 and a list of all products',
      async () => {
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
        const products = res.body.products.filter(p => p.id === product_ids[1]);
        expect(products).to.not.be.null;
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
        const products = res.body.products.filter(p => {
          if (product_ids.includes(p.id)) {
            return true;
          }
        });
        expect(products.length).to.equal(2);
        expect(Number(products[0].price)).to.be.above(Number(products[1].price));
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
        const products = res.body.products.filter(p => {
          if (product_ids.includes(p.id)) {
            return true;
          }
        });
        expect(products.length).to.equal(2);
        let isNewest = false;
        if (products[0].listed_at >= products[1].listed_at) {
          isNewest = true;
        }
        expect(isNewest).to.equal(true);
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
      it('return 201 and product object',
      (done) => {
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
            product_ids.push(res.body.product.id)
            return done();
          });
      });
    });
  });

  describe('PUT /products/:product_id', () => {
    beforeAll((done) => {
      secondAgent
        .post('/register')
        .set('Accept', 'application/json')
        .send(newUser)
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
      it('return 401 and error message when not logged in',
      async () => {
        const res = await request(server)
          .put(`/products/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send({ stock: 100 });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it("return 403 and error message when user doesn't own product",
      (done) => {
        secondAgent
          .put(`/products/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send({ stock: 100 })
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('User cannot alter this product');
            return done();
          });
      });

      it('return 400 and error message when product_id not found',
      (done) => {
        agent
          .put('/products/999999')
          .set('Accept', 'application/json')
          .send({ stock: 100 })
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Product not found');
            return done();
          });
      });

      it('return 400 and error message when product_id is invalid',
      (done) => {
        agent
          .put('/products/0')
          .set('Accept', 'application/json')
          .send({ stock: 100 })
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Invalid product id');
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 200 and updated product object',
      (done) => {
        agent
          .put(`/products/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send({ stock: 100 })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.product).to.not.be.null;
            expect(res.body.product.stock).to.equal(100);
            return done();
        });
      });
    });
  });

  // delete
  describe('DELETE /products/:product_id', () => {
    afterAll((done) => {
      secondAgent
        .delete('/profile')
        .set('Accept', 'application/json')
        .send()
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body.info).to.equal('Deleted user');
          return done();
        });
    });

    describe('failure', () => {
      it('return 401 if not logged in',
      async () => {
        const res = await request(server)
          .delete(`/products/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 403 if user does not own product',
      (done) => {
        secondAgent
          .delete(`/products/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('User cannot alter this product');
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 200 and message saying which product has been deleted',
      (done) => {
        agent
          .delete(`/products/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.info).to.equal(`Removed product id: ${product_ids[2]}`);
            return done();
          });
      });
    });
  });
});
