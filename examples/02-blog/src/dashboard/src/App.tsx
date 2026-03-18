import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { authProvider } from './providers/authProvider';
// AUTO-GENERATED IMPORTS START
import { UserList, UserEdit, UserCreate, UserShow, UserStudio } from './resources/users';
import { PostList, PostEdit, PostCreate, PostShow, PostStudio } from './resources/posts';
import { CategoryList, CategoryEdit, CategoryCreate, CategoryShow, CategoryStudio } from './resources/categories';
import { CustomRoutes } from 'react-admin';
import { Route } from 'react-router';
// AUTO-GENERATED IMPORTS END

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

const dataProvider = simpleRestProvider('http://localhost:3000/tg-api', httpClient);

export const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    {/* AUTO-GENERATED RESOURCES START */}
    <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} show={UserShow} />
    <Resource name="posts" list={PostList} edit={PostEdit} create={PostCreate} show={PostShow} />
    <Resource name="categories" list={CategoryList} edit={CategoryEdit} create={CategoryCreate} show={CategoryShow} />
    {/* AUTO-GENERATED RESOURCES END */}
    {/* AUTO-GENERATED CUSTOM ROUTES START */}
    <CustomRoutes>
      <Route path="/users/studio" element={<UserStudio />} />
      <Route path="/posts/studio" element={<PostStudio />} />
      <Route path="/categories/studio" element={<CategoryStudio />} />
    </CustomRoutes>
    {/* AUTO-GENERATED CUSTOM ROUTES END */}
  </Admin>
);

export default App;
