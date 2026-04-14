/*
 TODO: find a way to use StrictMode without breaking the app. Issues with state management and component rendering.
*/

//import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <App />
);
