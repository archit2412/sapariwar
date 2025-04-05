// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Native CSS
const styles = `
  .app {
    text-align: center;
    margin: 2rem;
  }
  h1 {
    color: #2d3748;
  }
`;

const styleTag = document.createElement('style');
styleTag.innerHTML = styles;
document.head.appendChild(styleTag);

ReactDOM.render(<App />, document.getElementById('root')); 