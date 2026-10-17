import { db } from './db';
import { RouterAdapter } from './ai';
import { SidangService } from './service';
export const service = new SidangService(db, new RouterAdapter());
