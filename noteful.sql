-- DROP TABLE IF EXISTS notes;


-- CREATE TABLE notes (
--   id serial PRIMARY KEY,
--   title text NOT NULL,
--   content text,
--   created timestamp DEFAULT now(),
--   folder_id int REFERENCES folders(id) ON DELETE SET NULL
-- );



-- INSERT INTO notes (  title, content ) VALUES ('5 life lessons learned from cats ', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' ),
   
-- ('What the government doesnt want you to know about cats ',  'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit.'),
--  ('The most boring article about cats youll ever read ', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna'),
-- ('7 things lady gaga has in common with cats ',       'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit. Odio pellentesque' ),
-- (        '10 ways cats can help you live to 100 ',      'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit. Odio pellentesque diam'),
-- (       '9 reasons you can blame the recession on cats ',     'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim'),
--       ('10 ways marketers are making you addicted to cats ',      'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit. Odio pellentesque '),(
--                 '11 ways investing in cats can make you a millionaire ',     'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'),(
--        'Why you should forget everything you learned about cats ',      'Posuere sollicitudin aliquam ultrices sagittis orci a. Feugiat sed lectus vestibulum mattis ullamcorper velit.');

--       DROP TABLE IF EXISTS folders;


-- CREATE TABLE folders (
-- id serial PRIMARY KEY,
-- name text NOT NULL UNIQUE
-- );

-- INSERT INTO folders (name) VALUES
--   ('Archive'),
--   ('Drafts'),
--   ('Personal'),
--   ('Work');

SELECT * FROM notes
LEFT JOIN folders ON notes.folder_id = folders.id
WHERE notes.id = 11;