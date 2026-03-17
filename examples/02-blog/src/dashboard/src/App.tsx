import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { authProvider } from './providers/authProvider';

const dataProvider = simpleRestProvider('http://localhost:3000/tg-api');

// AUTO-GENERATED RESOURCE IMPORTS START
// AUTO-GENERATED RESOURCE IMPORTS END

export const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    {/* AUTO-GENERATED RESOURCES START */}
    {/* AUTO-GENERATED RESOURCES END */}
  </Admin>
);

export default App;
