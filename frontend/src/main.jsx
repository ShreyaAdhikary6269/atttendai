import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './theme/theme.css';
import './theme/pages.css';
import './theme/dashboard.css';
import './theme/students.css';
import './theme/attendance.css';
import './theme/details.css';
import './theme/reports.css';
import './theme/prediction.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
