'use strict';

/**
 * DISCLAIMER:
 * The examples shown below are superficial tests which only check the API responses.
 * They do not verify the responses against the data in the database. We will learn
 * how to crosscheck the API responses against the database in a later exercise.
 */
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const seedData = require('../db/seedData');
const expect = chai.expect;

chai.use(chaiHttp);
describe('Reality check', function () {

  it('true should be true', function () {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', function () {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

  it('connection should be test database', () => {
    expect(knex.client.connectionSettings.database).to.equal('noteful-test');
  });

});

describe('Noteful App', function () {

  beforeEach(function () {
    return seedData('./db/noteful.sql', 'postgres');
  });

  after(function () {
    return knex.destroy(); // destroy the connection
  });

  describe('Static app', function () {

    it('GET request "/" should return the index page', function () {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });

  });

  describe('404 handler', function () {

    it('should respond with 404 when given a bad path', function () {
      return chai.request(app)
        .get('/bad/path')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('GET /api/notes', function () {

    it('should return the default of 10 Notes ', function () {
      let count;
      return knex.count()
        .from('notes')
        .then(([result]) => {
          count = Number(result.count);
          return chai.request(app).get('/api/notes');
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(count);
        });
    });

    it('should return a list with the correct right fields', function () {
      return chai.request(app)
        .get('/api/notes')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(10);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.include.keys('id', 'title', 'content');
          });
        });
    });

    it('should return correct search results for a valid query', function () {
      let res;
      return chai.request(app).get('/api/notes?searchTerm=gaga')
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.be.an('object');
          return knex.select().from('notes').where('title', 'like', '%gaga%');
        })
        .then(data => {
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    it('should return an empty array for an incorrect query', function () {
      return chai.request(app)
        .get('/api/notes?searchTerm=Not%20a%20Valid%20Search')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(0);
        });
    });

  });

  describe('GET /api/notes/:id', function () {

    it('should return correct notes', function () {

      const dataPromise = knex.first()
        .from('notes')
        .where('id', 1);

      const apiPromise = chai.request(app)
        .get('/api/notes/1');

      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content');
          expect(res.body.id).to.equal(1);
          expect(res.body.title).to.equal(data.title);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      return chai.request(app)
        .get('/DOES/NOT/EXIST')
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/notes', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'tags': []
      };
      let body;
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content');
          return knex.select().from('notes').where('id', body.id);
        })
        .then(([data]) => {
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  describe('PUT /api/notes/:id', function () {

    it('should update the note', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'tags': [1]
      };

      const updateDatabase = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
      };
      const dataPromise = knex.first()
        .from('notes')
        .update(updateDatabase)
        .where('id', 5)
        .returning(['title', 'content']);

      const apiPromise = chai.request(app)
        .put('/api/notes/5')
        .send(updateItem);

      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {
          console.log(data);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content');

          expect(res.body.id).to.equal(5);
          expect(res.body.title).to.equal(data[0].title);
          expect(res.body.content).to.equal(data[0].content);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof'
      };
      return chai.request(app)
        .put('/DOES/NOT/EXIST')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "title" field', function () {
      const updateItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .put('/api/notes/1005')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  // HOW CHECK DATABASE FOR DELETE?

  describe('DELETE  /api/notes/:id', function () {


    it('should delete an item by id', function () {

      const dataPromise = knex.first()
        .from('notes')
        .del()
        .where('id', 5)
        .returning('id');

      const apiPromise = chai.request(app)
        .delete('/api/notes/5');

      return Promise.all([dataPromise, apiPromise])
        .then(function ( [data, res]) {
          console.log(res.body);
          expect(res).to.have.status(204);


        });
    });

  });


  //FOLDERS TESTS

  describe ('GET /api/folders', function () {
    it('should return the default of 4 folders', function () {
      let count;
      return knex.count()
        .from('folders')
        .then(([result]) => {
          count =Number(result.count);
          return chai.request(app).get('/api/folders');
        })
        .then (function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(count);
        });
    });

  });

  describe('GET /api/folders/:id', function () {
    it('should return correct folder', function () {
      const dataPromise = knex.first()
        .from('folders')
        .where('id', 1);
        
      const apiPromise = chai.request(app)
        .get('/api/folders/1');
 

      return Promise.all([dataPromise, apiPromise])
        .then( function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body[0]).to.be.an('object');
          expect(res.body[0]).to.include.keys('id', 'name');
          expect(res.body[0].id).to.equal(1);
          expect(res.body[0].name).to.equal(data.name);
        });

  


    });

  });

  describe ('POST /api/folders', function () {
    it('should create and return a new folder when provided valid data', function () {
      const newFolder = {
        'name': 'testfolder'
      };

      let body;

      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body[0]).to.be.a('object');
          expect(body[0]).to.include.keys('id', 'name');
          return knex.select().from('folders').where('id', body[0].id);
        })
        .then(([data]) => {
          expect(body[0].name).to.equal(data.name);
        });
    });

  });

  describe ('DELETE /api/folders/:id', function () {
    it('should delete a folder by id', function () {
      const dataPromise = knex.first()
        .from('folders')
        .del()
        .where('id', 4)
        .returning('id');

      const apiPromise = chai.request(app)
        .delete('/api/folders/4');

      return Promise.all([dataPromise, apiPromise])
        .then(function ( [data, res]) {
          console.log(res.body);
          expect(res).to.have.status(204);
        });

    });
  });

  describe('PUT /api/folders:id', function() {
    it('should update the folder', function () {
      const updateFolder = {
        'name':'updatefolder'
      };

      const dataPromise = knex.first()
        .from('folders')
        .update(updateFolder)
        .where('id', 4)
        .returning(['name']);

      const apiPromise = chai.request(app)
        .put('/api/folders/4')
        .send(updateFolder);

      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {
          console.log(res.body);
          console.log(data);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0]).to.include.keys('id', 'name');

          expect(res.body[0].id).to.equal(4);
          expect(res.body[0].name).to.equal(data[0].name);
        });
    });
  });

  //TAG TESTING

  describe ('GET /api/tags', function () {
    it('should return the default of 4 tags', function () {
      let count;
      return knex.count()
        .from('tags')
        .then(([result]) => {
          count =Number(result.count);
          return chai.request(app).get('/api/tags');
        })
        .then (function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(count);
        });
    });

  });

  describe('GET /api/tags/:id', function () {
    it('should return correct tag', function () {
      const dataPromise = knex.first()
        .from('tags')
        .where('id', 1);
        
      const apiPromise = chai.request(app)
        .get('/api/tags/1');
 

      return Promise.all([dataPromise, apiPromise])
        .then( function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body[0]).to.be.an('object');
          expect(res.body[0]).to.include.keys('id', 'name');
          expect(res.body[0].id).to.equal(1);
          expect(res.body[0].name).to.equal(data.name);
        });

  


    });

  });

  describe ('POST /api/tags', function () {
    it('should create and return a new tag when provided valid data', function () {
      const newFolder = {
        'name': 'testtag'
      };

      let body;

      return chai.request(app)
        .post('/api/tags')
        .send(newFolder)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'name');
          return knex.select().from('tags').where('id', res.body.id);
        })
        .then(([data]) => {
          expect(body.name).to.equal(data.name);
        });
    });

  });

  describe ('DELETE /api/tags/:id', function () {
    it('should delete a tag by id', function () {
      const dataPromise = knex.first()
        .from('tags')
        .del()
        .where('id', 4)
        .returning('id');

      const apiPromise = chai.request(app)
        .delete('/api/tags/4');

      return Promise.all([dataPromise, apiPromise])
        .then(function ( [data, res]) {
      
          expect(res).to.have.status(204);
        });

    });
  });

  describe('PUT /api/tags:id', function() {
    it('should update the tag', function () {
      const updateTag = {
        'name':'updatetag'
      };

      const dataPromise = knex.first()
        .from('tags')
        .update(updateTag)
        .where('id', 4)
        .returning(['name']);

      const apiPromise = chai.request(app)
        .put('/api/tags/4')
        .send(updateTag);

      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {

          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0]).to.include.keys('id', 'name');

          expect(res.body[0].id).to.equal(4);
          expect(res.body[0].name).to.equal(data[0].name);
        });
    });
  });
});