'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// // TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
  const { searchTerm } = req.query;
  const { folderId } = req.query;
  const {tagId} = req.query;

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
      if (tagId) {
        console.log('searched by tag!');
        queryBuilder.where('tag_id', tagId);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        console.log('searched by folder!');
        queryBuilder.where('folder_id', folderId);
      }
    })
    .orderBy('notes.id')
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated).status(200);
      } else {
        next();
      }
    });
  // .catch(err => {
  //   next(err);
  // });
});

router.get('/notes/:id', (req, res, next) => {

  const id = req.params.id;
  knex('notes');
  knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'note_id', 'tag_id', 'tags.name as tagName', 'folders.name as folderName').from('notes')
    .leftJoin('folders','notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
    .leftJoin('tags','tags.id', 'notes_tags.tag_id' )
    .where('notes.id', id)
    .then(item => {
  
      if(item.length === 0){
        res.status(404);
        next();
      }
      console.log(res.body);
      const hydrated = hydrateNotes(item);
      res.json(hydrated[0]);})
    .catch(err => next(err));
});
// Put update an item
router.put('/notes/:id', (req, res, next) => {
  const id = req.params.id;
  const { tags } = req.body;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id', 'folderName'];

  // console.log(tags);

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }



  knex('notes')
    .update(updateObj)
    .where('notes.id', id)
    .returning('id')
    .then ( ([id]) => {
      //Delete current related tags
      return knex('notes_tags')
        .del()
        .where('note_id', id)
        .returning(id);
    })
    .then ( ()  => {

      const noteId = id;

      const tagsInsert = tags.map(tagId => {
        return {
          note_id : id,
          tag_id : tagId
        };
      });

      console.log(tagsInsert);
        
      return knex.insert(tagsInsert).into('notes_tags').returning('note_id');
    })
    .then ( () => {

      return knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'note_id', 'tag_id', 'tags.name as tagName', 'folders.name as folderName').from('notes')
        .leftJoin('folders','notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes_tags.note_id', 'notes.id')
        .leftJoin('tags','tags.id', 'notes_tags.tag_id' )
        .where('notes.id', id );       
    })
    .then(item=> {
      console.log(item);
      const hydrated = hydrateNotes(item);
      res.json(hydrated[0]);})
    .catch(err => next(err));
});
      

// Post (insert) an item
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags } = req.body; 

  const newItem = {
    title: title,
    content: content,
    folder_id: folder_id,  // Add `folder_id`
  };

  console.log(newItem);

  let noteId;
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  knex.insert(newItem).into('notes').returning('id')

    .then( ([id]) => {
      // Insert related tags into notes_tags table
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
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
