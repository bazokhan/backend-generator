import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { authProvider } from './providers/authProvider';

const httpClient = (url: string, options: any = {}) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    options.headers = new Headers(options.headers);
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, options).then(async (response) => {
    const body = await response.json();
    return { status: response.status, headers: response.headers, body: JSON.stringify(body), json: body };
  });
};

const dataProvider = simpleRestProvider('http://localhost:3000/admin-api', httpClient);

// AUTO-GENERATED RESOURCE IMPORTS START
// AUTO-GENERATED RESOURCE IMPORTS END

export const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    {/* AUTO-GENERATED RESOURCES START */}
    {/* AUTO-GENERATED RESOURCES END */}
  </Admin>
);

export default App;
