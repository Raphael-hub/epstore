const server = require('../src/server.js');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const agent = request.agent(server);
const secondAgent = request.agent(server);

const existingCart = {

};

const newCart = {

};



/*
register
login
add existing products
add existing products to cart
checkout

tests:
getUserCart;
createOrderFromCart





*/













