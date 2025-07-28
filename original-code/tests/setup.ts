import express from 'express';

const app = express();

app.use((req, res, next) => {
  req.log = { 
    info: () => {}, 
    error: () => {}, 
    debug: () => {}, 
    warn: () => {},
    child: () => req.log 
  };
  next();
});

export default app;