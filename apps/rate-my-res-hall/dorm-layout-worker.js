import {arrangeFurniture} from './dorm-layout-arranger.js';
self.onmessage=({data:{room,items}})=>self.postMessage(arrangeFurniture(room,items));
