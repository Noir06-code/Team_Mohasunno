import './style.css';
import { refreshIcons } from './utils/Icons.js';
import './game.js';

window.addEventListener('DOMContentLoaded', () => {
  refreshIcons();
});

// Run once immediately
refreshIcons();
