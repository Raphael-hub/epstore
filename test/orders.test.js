const server = require('../src/server.js');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

const agent = request.agent(server);
const secondAgent = request.agent(server);

const testUser = {
  username: 'supertest-orders',
  password: 'b1gl3g3nd',
  email: 'st-orders@example.com',
  name: 'Supertest Test'
};

const newUser = {
  username: 'supertest-o-new',
  password: 'b1gl3g3nd',
  email: 'st-o-new@example.com',
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

const productThree = {
  name: "The Price of Tomorrow",
  description: "A book on inflationary and deflationary economies",
  price: 10.99,
  currency: "gbp",
  stock: 20
};

let product_ids = [];
let order_ids = [];

describe('Orders endpoints', () => {
  // create supertest-test user for orders tests
  // and create products for orders
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
            expect(res.body.product.id).to.be.at.least(1);
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
                expect(res.body.product.id).to.be.at.least(1);
                product_ids.push(res.body.product.id);
                return done();
              });
          });
      });
  });

  // delete supertest-test user after done
  afterAll((done) => {
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

  // create order from cart
  describe('POST /checkout', () => {
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
          secondAgent
            .post('/cart')
            .set('Accept', 'application/json')
            .send({ product_id: product_ids[0], quantity: 1 })
            .expect(201)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.headers['content-type']).to.match(/json/);
              expect(res.body.cart).to.not.be.null;
              expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
              return done();
            });
        });
    });

    describe('failure', () => {
      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .post('/checkout')
          .set('Accept', 'application/json')
          .send({ product_id: product_ids[0], quantity: 1 });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 400 when address not set',
      (done) => {
        secondAgent
          .post('/checkout')
          .set('Accept', 'application/json')
          .send()
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('User address not set');
            return done();
          });
      });

      it('return 400 when cart is empty',
      (done) => {
        agent
          .put('/profile')
          .set('Accept', 'application/json')
          .send({ address: '123 Example Ave.' })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.user.address).to.equal('123 Example Ave.');
            agent
              .post('/checkout')
              .set('Accept', 'application/json')
              .send()
              .expect(400)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.error).to.equal('Cart is empty');
                return done();
              });
          });
      });
    });

    describe('success', () => {
      beforeAll((done) => {
        agent
          .post('/cart')
          .set('Accept', 'application/json')
          .send({ product_id: product_ids[0], quantity: 1 })
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.cart).to.not.be.null;
            expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
            agent
              .post('/cart')
              .set('Accept', 'application/json')
              .send({ product_id: product_ids[1], quantity: 1 })
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.cart).to.not.be.null;
                expect(res.body.cart[1].product_id).to.equal(product_ids[1]);
                return done();
              });
          });
      });

      it('return 201 and order object detailing order',
      (done) => {
        agent
          .post('/checkout')
          .set('Accept', 'application/json')
          .send()
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.products).to.not.be.null;
            expect(res.body.order.id).to.be.at.least(1);
            order_ids.push(res.body.order.id);
            expect(res.body.products[0].product_id).to.equal(product_ids[0]);
            return done();
          });
      });
    });
  });

  // create order from product
  describe('POST /checkout/:product_id', () => {
    describe('failure', () => {
      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .post(`/checkout/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ quantity: 1 });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 400 when address not set',
      (done) => {
        secondAgent
          .post(`/checkout/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ quantity: 1 })
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('User address not set');
            return done();
          });
      });

      it('return 400 when product_id is not valid',
      (done) => {
        agent
          .post('/checkout/0')
          .set('Accept', 'application/json')
          .send({ quantity: 1 })
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

      it('return 400 when quantity is greater than stock level',
      (done) => {
        agent
          .post(`/checkout/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ quantity: 9999 })
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Product does not have enough stock');
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 201 and order object detailing order',
      (done) => {
        agent
          .post(`/checkout/${product_ids[0]}`)
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
            expect(res.body.order.id).to.be.at.least(1);
            expect(res.body.products[0].product_id).to.equal(product_ids[0]);
            order_ids.push(res.body.order.id);
            return done();
          });
      });
    });
  });

  // get user's orders
  describe('GET /orders', () => {
    describe('failure', () => {
      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .get('/orders')
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });
    });

    describe('success', () => {
      it('return 200 and an empty list when user has no orders',
      (done) => {
        secondAgent
          .get('/orders')
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.orders).to.eql([]);
            return done();
          });
      });

      it('return 200 and list of orders made by user',
      (done) => {
        agent
          .get('/orders')
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.orders).to.not.be.null;
            // check order ids are equal
            const orderIds = res.body.orders.map(o => o.id);
            const isEmpty = _.isEmpty(_.xor(orderIds, order_ids))
            expect(isEmpty).to.equal(true);
            return done();
          });
      });
    });
  });

  // get user order info
  describe('GET /orders/:order_id', () => {
    describe('failure', () => {
      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .get('/orders/1')
          .set('Accept', 'application/json')
          .send({ quantity: 1 });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it("return 400 when order_id wasn't made by user",
      (done) => {
        secondAgent
          .get(`/orders/${order_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ quantity: 1 })
          .expect(400)
          .end((err, res) => {
            if (err) {
             return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Unable to find order');
            return done();
          });
      });

      it("return 400 when order_id is invalid",
      (done) => {
        agent
          .get('/orders/0')
          .set('Accept', 'application/json')
          .send({ quantity: 1 })
          .expect(400)
          .end((err, res) => {
            if (err) {
             return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Unable to find order');
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 200 and object detailing order',
      (done) => {
        agent
          .get(`/orders/${order_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ quantity: 1 })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.products).to.not.be.null;
            expect(res.body.order.id).to.be.at.least(1);
            expect(res.body.products[0].product_id).to.equal(product_ids[0]);
            return done();
          });
      });
    });
  });

  // ship order
  describe('PUT /orders/:order_id', () => {
    // create new product and order containing products from 2 vendors
    beforeAll((done) => {
      secondAgent
        .post('/products')
        .set('Accept', 'application/json')
        .send(productThree)
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body.product).to.not.be.null;
          expect(res.body.product.id).to.be.at.least(1);
          product_ids.push(res.body.product.id);
          agent
            .post('/cart')
            .set('Accept', 'application/json')
            .send({ product_id: product_ids[0], quantity: 1 })
            .expect(201)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.headers['content-type']).to.match(/json/);
              expect(res.body.cart).to.not.be.null;
              expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
              agent
                .post('/cart')
                .set('Accept', 'application/json')
                .send({ product_id: product_ids[2], quantity: 1 })
                .expect(201)
                .end((err, res) => {
                  if (err) {
                    return done(err);
                  }
                  expect(res.headers['content-type']).to.match(/json/);
                  expect(res.body.cart).to.not.be.null;
                  expect(res.body.cart[1].product_id).to.equal(product_ids[2]);
                  agent
                    .post('/checkout')
                    .set('Accept', 'application/json')
                    .send()
                    .expect(201)
                    .end((err, res) => {
                      if (err) {
                        return done(err);
                      }
                      expect(res.headers['content-type']).to.match(/json/);
                      expect(res.body.order).to.not.be.null;
                      expect(res.body.products).to.not.be.null;
                      expect(res.body.order.id).to.be.at.least(1);
                      order_ids.push(res.body.order.id);
                      // check cart contains products
                      const orderProducts = res.body.products.map(p => p.product_id);
                      const isEmpty = _.isEmpty(
                        _.xor(orderProducts, [product_ids[0], product_ids[2]])
                      );
                      expect(isEmpty).to.equal(true);
                      return done();
                    });
                });
            });
        });
    });

    describe('failure', () => {
      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .put(`/orders/${order_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it("return 403 when vendor doesn't own all the products in order",
      (done) => {
        secondAgent
          .put(`/orders/${order_ids[2]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal("User doesn't own all products in order");
            return done();
          });
      });
    });

    describe('success', () => {
      it('return 200 and object detailing order and mark all products as shipped',
      (done) => {
        agent
          .put(`/orders/${order_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.status).to.equal('shipped');
            agent
              .get(`/orders/${order_ids[0]}`)
              .set('Accept', 'application/json')
              .send({ quantity: 1 })
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.order).to.not.be.null;
                expect(res.body.products).to.not.be.null;
                expect(res.body.order.id).to.equal(order_ids[0]);
                const products_shipped = res.body.products.map(p => p.status);
                const not_shipped = products_shipped.filter(s => s !== 'shipped');
                expect(not_shipped).to.eql([]);
                return done();
              });
          });
      });
    });
  });

  // ship product in order
  describe('PUT /orders/:order_id/:product_id', () => {
    // create order with 2 products from different vendors
    beforeAll((done) => {
      agent
        .post('/cart')
        .set('Accept', 'application/json')
        .send({ product_id: product_ids[0], quantity: 1 })
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body.cart).to.not.be.null;
          expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
          agent
            .post('/cart')
            .set('Accept', 'application/json')
            .send({ product_id: product_ids[2], quantity: 1 })
            .expect(201)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.headers['content-type']).to.match(/json/);
              expect(res.body.cart).to.not.be.null;
              expect(res.body.cart[1].product_id).to.equal(product_ids[2]);
              agent
                .post('/checkout')
                .set('Accept', 'application/json')
                .send()
                .expect(201)
                .end((err, res) => {
                  if (err) {
                    return done(err);
                  }
                  expect(res.headers['content-type']).to.match(/json/);
                  expect(res.body.order).to.not.be.null;
                  expect(res.body.products).to.not.be.null;
                  expect(res.body.order.id).to.be.at.least(1);
                  order_ids.push(res.body.order.id);
                  // check cart contains products
                  const orderProducts = res.body.products.map(p => p.product_id);
                  const isEmpty = _.isEmpty(
                    _.xor(orderProducts, [product_ids[0], product_ids[2]])
                  );
                  expect(isEmpty).to.equal(true);
                  return done();
                });
            });
        });
    });

    describe('failure', () => {
      // cancel secondAgents product in order
      beforeAll((done) => {
        agent
          .delete(`/orders/${order_ids[3]}/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.product_id).to.equal(product_ids[2]);
            expect(res.body.order.status).to.equal('cancelled');
            return done();
          });
      });

      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .put(`/orders/${order_ids[3]}/${product_ids[0]}}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' });
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 400 when product id is invalid',
      (done) => {
        agent
          .put(`/orders/${order_ids[3]}/0`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
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

      it('return 400 when product id is not found in order',
      (done) => {
        agent
          .put(`/orders/${order_ids[3]}/${product_ids[1]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Product not found in order');
            return done();
          });
      });

      it('return 403 when product is not owned by user',
      (done) => {
        secondAgent
          .put(`/orders/${order_ids[3]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
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

      it('return 403 when product has been cancelled',
      (done) => {
        secondAgent
          .put(`/orders/${order_ids[3]}/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Cannot ship a cancelled product');
            return done();
          });
      });
    });

    describe('success', () => {
      // create order with 2 products from same vendor
      beforeAll((done) => {
        agent
          .post('/cart')
          .set('Accept', 'application/json')
          .send({ product_id: product_ids[0], quantity: 1 })
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.cart).to.not.be.null;
            expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
            agent
              .post('/cart')
              .set('Accept', 'application/json')
              .send({ product_id: product_ids[1], quantity: 1 })
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.cart).to.not.be.null;
                expect(res.body.cart[1].product_id).to.equal(product_ids[1]);
                agent
                  .post('/checkout')
                  .set('Accept', 'application/json')
                  .send()
                  .expect(201)
                  .end((err, res) => {
                    if (err) {
                      return done(err);
                    }
                    expect(res.headers['content-type']).to.match(/json/);
                    expect(res.body.order).to.not.be.null;
                    expect(res.body.products).to.not.be.null;
                    expect(res.body.order.id).to.be.at.least(1);
                    order_ids.push(res.body.order.id);
                    // check cart contains products
                    const orderProducts = res.body.products.map(p => p.product_id);
                    const isEmpty = _.isEmpty(
                      _.xor(orderProducts, [product_ids[0], product_ids[1]])
                    );
                    expect(isEmpty).to.equal(true);
                    return done();
                  });
              });
          });
      });

      it('return 200 and object detailing order',
      (done) => {
        agent
          .put(`/orders/${order_ids[2]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.product_id).to.equal(product_ids[0]);
            expect(res.body.order.product_status).to.equal('shipped');
            return done();
          });
      });

      it('return 200 and order object and mark order shipped if other products are cancelled',
      (done) => {
        agent
          .put(`/orders/${order_ids[3]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.product_id).to.equal(product_ids[0]);
            expect(res.body.order.product_status).to.equal('shipped');
            expect(res.body.order.order_status).to.equal('shipped');
            return done();
          });
      });

      it('return 200 and order object and mark entire order shipped if all other products are shipped',
      (done) => {
        agent
          .put(`/orders/${order_ids[4]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.product_id).to.equal(product_ids[0]);
            expect(res.body.order.product_status).to.equal('shipped');
            agent
              .put(`/orders/${order_ids[4]}/${product_ids[1]}`)
              .set('Accept', 'application/json')
              .send({ status: 'shipped' })
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.order).to.not.be.null;
                expect(res.body.order.product_id).to.equal(product_ids[1]);
                expect(res.body.order.product_status).to.equal('shipped');
                expect(res.body.order.order_status).to.equal('shipped');
                return done();
              });
          });
      });
    });
  });

  // cancel order
  describe('DELETE /orders/:order_id', () => {
    // create order with 2 products from different vendors
    beforeAll((done) => {
      agent
        .post('/cart')
        .set('Accept', 'application/json')
        .send({ product_id: product_ids[0], quantity: 1 })
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body.cart).to.not.be.null;
          expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
          agent
            .post('/cart')
            .set('Accept', 'application/json')
            .send({ product_id: product_ids[2], quantity: 1 })
            .expect(201)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.headers['content-type']).to.match(/json/);
              expect(res.body.cart).to.not.be.null;
              expect(res.body.cart[1].product_id).to.equal(product_ids[2]);
              agent
                .post('/checkout')
                .set('Accept', 'application/json')
                .send()
                .expect(201)
                .end((err, res) => {
                  if (err) {
                    return done(err);
                  }
                  expect(res.headers['content-type']).to.match(/json/);
                  expect(res.body.order).to.not.be.null;
                  expect(res.body.products).to.not.be.null;
                  expect(res.body.order.id).to.be.at.least(1);
                  order_ids.push(res.body.order.id);
                  // check cart contains products
                  const orderProducts = res.body.products.map(p => p.product_id);
                  const isEmpty = _.isEmpty(
                    _.xor(orderProducts, [product_ids[0], product_ids[2]])
                  );
                  expect(isEmpty).to.equal(true);
                  return done();
                });
            });
        });
    });

    describe('failure', () => {
      // create order with 2 products and mark 1 as shipped
      beforeAll((done) => {
        agent
          .post('/cart')
          .set('Accept', 'application/json')
          .send({ product_id: product_ids[0], quantity: 1 })
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.cart).to.not.be.null;
            expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
            agent
              .post('/cart')
              .set('Accept', 'application/json')
              .send({ product_id: product_ids[1], quantity: 1 })
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.cart).to.not.be.null;
                expect(res.body.cart[1].product_id).to.equal(product_ids[1]);
                agent
                  .post('/checkout')
                  .set('Accept', 'application/json')
                  .send()
                  .expect(201)
                  .end((err, res) => {
                    if (err) {
                      return done(err);
                    }
                    expect(res.headers['content-type']).to.match(/json/);
                    expect(res.body.order).to.not.be.null;
                    expect(res.body.products).to.not.be.null;
                    expect(res.body.order.id).to.be.at.least(1);
                    order_ids.push(res.body.order.id);
                    // check cart contains products
                    const orderProducts = res.body.products.map(p => p.product_id);
                    const isEmpty = _.isEmpty(
                      _.xor(orderProducts, [product_ids[0], product_ids[1]])
                    );
                    expect(isEmpty).to.equal(true);
                    agent
                      .put(`/orders/${order_ids[6]}/${product_ids[1]}`)
                      .set('Accept', 'application/json')
                      .send({ status: 'shipped' })
                      .expect(200)
                      .end((err, res) => {
                        if (err) {
                          return done(err);
                        }
                        expect(res.headers['content-type']).to.match(/json/);
                        expect(res.body.order).to.not.be.null;
                        expect(res.body.order.product_status).to.equal('shipped');
                        return done();
                      });
                  });
              });
          });
      });

      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .delete(`/orders/${order_ids[5]}`)
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 400 when order id not found',
      (done) => {
        agent
          .delete('/orders/9999')
          .set('Accept', 'application/json')
          .send()
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Unable to find order');
            return done();
          });
      });

      it('return 403 when order already cancelled',
      (done) => {
        agent
          .delete(`/orders/${order_ids[1]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.status).to.equal('cancelled');
            agent
              .delete(`/orders/${order_ids[1]}`)
              .set('Accept', 'application/json')
              .send()
              .expect(403)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.error).to.equal('Order already cancelled');
                return done();
              });
          });
      });

      it('return 403 when order is already shipped',
      (done) => {
        agent
          .delete(`/orders/${order_ids[4]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal("Can't cancel an order being processed");
            return done();
          });
      });

      it('return 403 when product in order is already shipped',
      (done) => {
        agent
          .delete(`/orders/${order_ids[6]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal("Can't cancel an order being processed");
            return done();
          });
      });
    });

    describe('success', () => {
      // create order with 2 products
      beforeAll((done) => {
        agent
          .post('/cart')
          .set('Accept', 'application/json')
          .send({ product_id: product_ids[0], quantity: 1 })
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.cart).to.not.be.null;
            expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
            agent
              .post('/cart')
              .set('Accept', 'application/json')
              .send({ product_id: product_ids[1], quantity: 1 })
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.cart).to.not.be.null;
                expect(res.body.cart[1].product_id).to.equal(product_ids[1]);
                agent
                  .post('/checkout')
                  .set('Accept', 'application/json')
                  .send()
                  .expect(201)
                  .end((err, res) => {
                    if (err) {
                      return done(err);
                    }
                    expect(res.headers['content-type']).to.match(/json/);
                    expect(res.body.order).to.not.be.null;
                    expect(res.body.products).to.not.be.null;
                    expect(res.body.order.id).to.be.at.least(1);
                    order_ids.push(res.body.order.id);
                    // check cart contains products
                    const orderProducts = res.body.products.map(p => p.product_id);
                    const isEmpty = _.isEmpty(
                      _.xor(orderProducts, [product_ids[0], product_ids[1]])
                    );
                    expect(isEmpty).to.equal(true);
                    return done();
                  });
              });
          });
      });

      it('return 200 and object detailing order and mark all products as cancelled',
      (done) => {
        agent
          .delete(`/orders/${order_ids[7]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.status).to.equal('cancelled');
            agent
              .get(`/orders/${order_ids[7]}`)
              .set('Accept', 'application/json')
              .send()
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.order).to.not.be.null;
                expect(res.body.order.id).to.equal(order_ids[7]);
                const products_cancelled = res.body.products.map(p => p.status);
                const not_cancelled = products_cancelled.filter(s => s !== 'cancelled');
                expect(not_cancelled).to.eql([]);
                return done();
              });
          });
      });
    });
  });

  // cancel product in order
  describe('DELETE /orders/:order_id/:product_id', () => {
    // create order with 2 products from different vendors
    beforeAll((done) => {
      agent
        .post('/cart')
        .set('Accept', 'application/json')
        .send({ product_id: product_ids[0], quantity: 1 })
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body.cart).to.not.be.null;
          expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
          agent
            .post('/cart')
            .set('Accept', 'application/json')
            .send({ product_id: product_ids[2], quantity: 1 })
            .expect(201)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.headers['content-type']).to.match(/json/);
              expect(res.body.cart).to.not.be.null;
              expect(res.body.cart[1].product_id).to.equal(product_ids[2]);
              agent
                .post('/checkout')
                .set('Accept', 'application/json')
                .send()
                .expect(201)
                .end((err, res) => {
                  if (err) {
                    return done(err);
                  }
                  expect(res.headers['content-type']).to.match(/json/);
                  expect(res.body.order).to.not.be.null;
                  expect(res.body.products).to.not.be.null;
                  expect(res.body.order.id).to.be.at.least(1);
                  order_ids.push(res.body.order.id);
                  // check cart contains products
                  const orderProducts = res.body.products.map(p => p.product_id);
                  const isEmpty = _.isEmpty(
                    _.xor(orderProducts, [product_ids[0], product_ids[2]])
                  );
                  expect(isEmpty).to.equal(true);
                  return done();
                });
            });
        });
    });

    // delete secondAgent user
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
      // cancel one item and ship another
      beforeAll((done) => {
        secondAgent
          .put(`/orders/${order_ids[8]}/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send({ status: 'shipped' })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.order_id).to.equal(order_ids[8]);
            expect(res.body.order.product_id).to.equal(product_ids[2]);
            expect(res.body.order.product_status).to.equal('shipped');
            agent
              .delete(`/orders/${order_ids[8]}/${product_ids[0]}`)
              .set('Accept', 'application/json')
              .send()
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.order).to.not.be.null;
                expect(res.body.order.order_id).to.equal(order_ids[8]);
                expect(res.body.order.product_id).to.equal(product_ids[0]);
                expect(res.body.order.status).to.equal('cancelled');
                return done();
              });
          });
      });

      it('return 401 when not logged in',
      async () => {
        const res = await request(server)
          .delete(`/orders/${order_ids[8]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send();
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.status).to.equal(401);
        expect(res.body.error).to.equal('Not logged in');
      });

      it('return 400 when order id is invalid',
      (done) => {
        agent
          .delete(`/orders/9999/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Unable to find order');
            return done();
          });
      });

      it('return 400 when product id not found in order',
      (done) => {
        agent
          .delete(`/orders/${order_ids[8]}/${product_ids[1]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(400)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Unable to find product in order');
            return done();
          });
      });

      it('return 403 when product already cancelled',
      (done) => {
        agent
          .delete(`/orders/${order_ids[8]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal('Product already cancelled');
            return done();
          });
      });

      it('return 403 when product already being processed',
      (done) => {
        agent
          .delete(`/orders/${order_ids[8]}/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.error).to.equal("Can't cancel a product being processed");
            return done();
          });
      });
    });

    describe('success', () => {
      beforeAll((done) => {
        agent
          .post('/cart')
          .set('Accept', 'application/json')
          .send({ product_id: product_ids[0], quantity: 1 })
          .expect(201)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.cart).to.not.be.null;
            expect(res.body.cart[0].product_id).to.equal(product_ids[0]);
            agent
              .post('/cart')
              .set('Accept', 'application/json')
              .send({ product_id: product_ids[2], quantity: 1 })
              .expect(201)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.cart).to.not.be.null;
                expect(res.body.cart[1].product_id).to.equal(product_ids[2]);
                agent
                  .post('/checkout')
                  .set('Accept', 'application/json')
                  .send()
                  .expect(201)
                  .end((err, res) => {
                    if (err) {
                      return done(err);
                    }
                    expect(res.headers['content-type']).to.match(/json/);
                    expect(res.body.order).to.not.be.null;
                    expect(res.body.products).to.not.be.null;
                    expect(res.body.order.id).to.be.at.least(1);
                    order_ids.push(res.body.order.id);
                    // check cart contains products
                    const orderProducts = res.body.products.map(p => p.product_id);
                    const isEmpty = _.isEmpty(
                      _.xor(orderProducts, [product_ids[0], product_ids[2]])
                    );
                    expect(isEmpty).to.equal(true);
                    return done();
                  });
              });
          });
      });

      it('return 200 and object detailing order product',
      (done) => {
        agent
          .delete(`/orders/${order_ids[9]}/${product_ids[0]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.order_id).to.equal(order_ids[9]);
            expect(res.body.order.product_id).to.equal(product_ids[0]);
            expect(res.body.order.status).to.equal('cancelled');
            return done();
          });
      });

      it('return 200 and order product object and set order to cancelled when all products are cancelled',
      (done) => {
        agent
          .delete(`/orders/${order_ids[9]}/${product_ids[2]}`)
          .set('Accept', 'application/json')
          .send()
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.headers['content-type']).to.match(/json/);
            expect(res.body.order).to.not.be.null;
            expect(res.body.order.order_id).to.equal(order_ids[9]);
            expect(res.body.order.product_id).to.equal(product_ids[2]);
            expect(res.body.order.status).to.equal('cancelled');
            agent
              .get(`/orders/${order_ids[9]}`)
              .set('Accept', 'application/json')
              .send()
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.headers['content-type']).to.match(/json/);
                expect(res.body.order).to.not.be.null;
                expect(res.body.order.status).to.equal('cancelled');
                return done();
              });
          });
      });
    });
  });
});
