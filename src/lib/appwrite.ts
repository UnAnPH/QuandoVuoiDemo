import { Client, Databases, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69bb0c610010c801f711');

export const databases = new Databases(client);
export const DB_ID = 'quandovuoi-db';
export const USERS_COL = 'users';
export const REQUESTS_COL = 'requests';
export const CONFIG_COL = 'company_config';
export { ID, Query };
