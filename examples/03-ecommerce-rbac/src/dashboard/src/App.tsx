import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { authProvider } from './providers/authProvider';
// AUTO-GENERATED IMPORTS START
import { UserList, UserEdit, UserCreate, UserShow, UserStudio } from './resources/users';
import { CategoryList, CategoryEdit, CategoryCreate, CategoryShow, CategoryStudio } from './resources/categories';
import { ProductList, ProductEdit, ProductCreate, ProductShow, ProductStudio } from './resources/products';
import { OrderList, OrderEdit, OrderCreate, OrderShow, OrderStudio } from './resources/orders';
import { OrderItemList, OrderItemEdit, OrderItemCreate, OrderItemShow, OrderItemStudio } from './resources/order-items';
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

const dataProvider = simpleRestProvider('http://localhost:3000/admin-api', httpClient);

// AUTO-GENERATED RESOURCE IMPORTS START
// AUTO-GENERATED RESOURCE IMPORTS END

export const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    {/* AUTO-GENERATED RESOURCES START */}
    <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} show={UserShow} />
    <Resource name="categories" list={CategoryList} edit={CategoryEdit} create={CategoryCreate} show={CategoryShow} />
    <Resource name="products" list={ProductList} edit={ProductEdit} create={ProductCreate} show={ProductShow} />
    <Resource name="orders" list={OrderList} edit={OrderEdit} create={OrderCreate} show={OrderShow} />
    <Resource
      name="order-items"
      list={OrderItemList}
      edit={OrderItemEdit}
      create={OrderItemCreate}
      show={OrderItemShow}
    />
    {/* AUTO-GENERATED RESOURCES END */}
    {/* AUTO-GENERATED CUSTOM ROUTES START */}
    <CustomRoutes>
      <Route path="/users/studio" element={<UserStudio />} />
      <Route path="/categories/studio" element={<CategoryStudio />} />
      <Route path="/products/studio" element={<ProductStudio />} />
      <Route path="/orders/studio" element={<OrderStudio />} />
      <Route path="/order-items/studio" element={<OrderItemStudio />} />
    </CustomRoutes>
    {/* AUTO-GENERATED CUSTOM ROUTES END */}
  </Admin>
);

export default App;
