'use strict';
const express = require('express');
const router = express.Router();

const knex = require('../knex');



router.get('/folders', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get('/folders/:id', (req, res, next) => {
  const reqID = req.params.id;

  knex.select('id', 'name')
    .from('folders')
    .where({'id': reqID})
    .returning(['id','name'])
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.put('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['id', 'name'];

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
  
  knex ('folders')
    .where({'id': id})
    .update(updateObj)
    .returning(['name', 'id'])
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.post('/folders', (req, res,next) => {
  const { name }= req.body;
  const newFolder = {name};

  /***** Never trust users - validate input *****/
  if(!newFolder.name) {
    const err = new Error('missing `name` in requestbody');
    err.status = 400;
    return next(err);
  }


  knex  ('folders')
    .insert(newFolder)
    .returning(['id', 'name',])
    .then(results => {

      res.location(`http://${req.header.host}/folders/${results.id}`).status(201).json(results);

    })
    .catch(err => next(err));
});

router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  knex ('folders')
    .where({'folders.id':id})
    .del()
    .returning (['id', 'name'])
    .then(res.sendStatus(204));

});

module.exports = router;