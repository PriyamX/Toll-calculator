import serverless from 'serverless-http';
import app from '../../comprehensive_toll_server.js';

export const handler = serverless(app);


