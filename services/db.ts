import Dexie, { type Table } from 'dexie';
import type { CarSaleCondition, User, LeadMessage } from '../types';
import type { UploadedIdentityDocument } from '../types/uploads';

const db = new Dexie('AutoLeadDB') as Dexie & {
    conditions: Table<CarSaleCondition, number>;
    users: Table<User, number>;
    leadMessages: Table<LeadMessage, number>;
    identityUploads: Table<UploadedIdentityDocument, string>;
};

db.version(1).stores({
    conditions: '++id, status, car_model, sale_type',
    users: '++id, FullName, Number, CarModel, RegisterTime',
    leadMessages: '++id, number, createdAt',
});

db.version(2).stores({
    conditions: '++id, status, car_model, sale_type',
    users: '++id, FullName, Number, CarModel, RegisterTime',
    leadMessages: '++id, number, createdAt',
    identityUploads: 'id, scopeKey, scopeType, scopeId, nationalCode, category, syncStatus, createdAt',
});

export { db };