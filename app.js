const express = require('express');
const userRoutes = require('./routes/userRoutes');
const app = express();
const path = require('path');


app.use(express.json());  
app.use(express.static("public"));
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/', userRoutes); 
// session store
 
 

 


app.listen(3002, () => {
  console.log(`http://localhost:3002/`); 
});

module.exports = app;



