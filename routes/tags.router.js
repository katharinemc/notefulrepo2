'use strict';
const express = require('express');
const router = express.Router();

const knex = require('../knex');

//create GET all endpoint
router.get('/tags/', (req, res, next) =>{
  const { searchTerm } = req.query;

  knex.select()
    .from('tags')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('name', 'like', `%${searchTerm}%`);
      }
    })
    .returning('name', 'id')
    .then( (result => {
      res.location(`${req.originalUrl}/${result.id}`).status(200).json(result);
    }))
    .catch(err => next(err));

});

//create GET by ID endpoint
router.get('/tags/:id', (req, res, next) => {
  const id = req.params.id;
  console.log(id);

  knex('tags')
    .select()
    .where({'id': id})
    .returning('name', 'id')
    .then( (result => {
      res.location(`${req.originalUrl}/${result.id}`).status(200).json(result);
    }))
    .catch(err => next(err));
  
});

//create PUT endpoint
//tags PUT doesn't work
router.put('/tags/:id', (req, res, next) => {
  const updateId = req.params.id;
  
  
  const updateObj = {};
  const updateableFields = ['name'];



  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('tags')
    .update (updateObj)
    .where({'tags.id': updateId})
    .returning(['name', 'id'])
    .then( (result => {
      res.location(`${req.originalUrl}/${result.id}`).status(200).json(result);
    }))
    .catch(err => next(err));

});

router.delete('/tags/:id', (req, res, next) =>{
  const id= req.params.id;

  knex('tags')
    .del()
    .where({'id': id})
    .then( (result => {
      res.status(204).json(result);
    }))
    .catch(err => next(err));
});

// POST endpoint
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});




module.exports = router;