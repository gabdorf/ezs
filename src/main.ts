import './style.css';
import { preloadTileSvgs } from './renderer';
import { initUI } from './ui';

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  preloadTileSvgs().then(() => initUI(app));
}
