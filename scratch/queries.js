'use strict';

const knex = require('../knex');

let searchTerm = 'gaga';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

let id = 1003;

get by id

knex('notes')
  .select('notes.id', 'title', 'content')
  .where('notes.id', id)
  .then(results => console.log(results))
  .catch (err => console.log(err));

let newNote = {
  title: 'Katharines new note',
  content: 'it has content'
};

knex('notes')
.insert(newNote)
.returning(['notes.id', 'title', 'content'])
.then(results => console.log(results));

let id = 11;

knex('notes')
  .del()
  .where('notes.id', id)
  .then(results => console.log(results));