'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// // TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
  const { searchTerm } = req.query;
  const { folderId } = req.query;

  console.log(req.query);

  knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'note_id', 'tag_id', 'tags.name as tagName', 'folders.name as folderName').from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
    .leftJoin('tags','tags.id', 'notes_tags.tag_id' )
    .modify(function (queryBuilder) {
      if (searchTerm) {
        console.log('searched by term!');
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        console.log('searched by folder!');
        queryBuilder.where('folder_id', folderId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/notes/:id', (req, res, next) => {
  const id = req.params.id;
  knex('notes')
    .select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
    .leftJoin('folders','notes.folder_id', 'folders.id')
    .where('notes.id', id)
    .then(item=> {
      if(item.length === 0){
        res.status(404);
        next();
      }
      res.json(item[0]);})
    .catch(err => next(err));
});
// Put update an item
router.put('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id', 'folderName'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });
console.log(updateObj);

  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }


  knex('notes')
    .update(updateObj)
    .where('notes.id', id)
    .returning('id', 'title','content','folder_id', 'folderName')
    .then ( results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

// Post (insert) an item
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id } = req.body; 

  const newItem = {
    title: title,
    content: content,
    folder_id: folder_id  // Add `folder_id`
  };

  let noteId;
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex.insert(newItem)
    .into('notes')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      // Using the new id, select the new note and the folder
      return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});


// Delete an item
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .del()
    .where('notes.id', id)
    .then(res.sendStatus(204))
    .catch(err => {
      next(err);
    });
});

module.exports = router;
