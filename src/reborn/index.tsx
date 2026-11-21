import {createRoot} from 'react-dom/client';
import React from 'react';
import RebornApp from './RebornApp.tsx';
import './reborn.css';

const element=document.getElementById('root');
if(!element)throw new Error('Missing #root');
createRoot(element).render(<React.StrictMode><RebornApp/></React.StrictMode>);
