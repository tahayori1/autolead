import Dexie, { type Table } from 'dexie';
import type { CarSaleCondition, User, LeadMessage } from '../types';

const db = new Dexie('AutoLeadDB') as Dexie & {
    conditions: Table<CarSaleCondition, number>;
    users: Table<User, number>;
    leadMessages: Table<LeadMessage, number>;
};

db.version(1).stores({
    conditions: '++id, status, car_model, sale_type',
    users: '++id, FullName, Number, CarModel, RegisterTime',
    leadMessages: '++id, number, createdAt',
});

export { db };