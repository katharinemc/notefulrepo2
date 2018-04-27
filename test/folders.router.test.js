// 'use strict';

// const app = require('../routes/folders.router');
// const chai = require('chai');
// const chaiHttp = require('chai-http');

// const expect = chai.expect;

// chai.use(chaiHttp);


 

// describe ('GET/api/folders', function () {
//   const expectedKeys = ['id', 'name'] ;
//   it('should have keys id and name', function () {
//     return chai.request(app)
//       .get('/api/folders')
//       .then( res => {

//         expect(res).to.have.status(200);
//         expect(res.body).to.be.a('array');
//         res.body.forEach(item => { 
//           expect(item).to.be.a('object');
//           expect(item).to.include.keys(expectedKeys); });
//       });
//   }); 
// });